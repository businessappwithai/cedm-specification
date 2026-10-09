//! Rate limiting, keyed by the caller rather than by the address they arrive at.
//!
//! This application had none. A generated backend accepted an unbounded number
//! of password guesses against `/api/auth/login`, and an unbounded number of
//! anything else, from anyone who could reach it.
//!
//! Two decisions here are the whole design, and both are the ones the NestJS
//! sibling got wrong first and had to measure its way out of.
//!
//! **The key is the caller, not the address.** A budget per IP is right for a
//! public service and wrong for this one: its users arrive through a reverse
//! proxy — the compose one, a corporate gateway, an ingress — and to the server
//! every one of them has the same peer address. A per-IP limit stops meaning
//! "how fast may a person go" and starts meaning "how many people may there
//! be", and a department of thirty sharing one gateway hits it while the server
//! is idle. So an authenticated request is counted against the subject of its
//! own token, and only an anonymous one falls back to the address — which is
//! the right key for the routes an anonymous caller can reach, because there is
//! nothing else to count.
//!
//! **The token is read here, not taken from an extractor.** This is a layer
//! around the whole router, so it runs *before* the JWT extractor that
//! populates a handler's `auth::JWT`. Asking for that here would find nothing
//! on every request and silently revert to counting addresses — the limit would
//! look installed and behave as though it were not. The token is therefore
//! pulled from the `Authorization` header or the session cookie and
//! **verified**, not merely parsed: an unverified subject is a bucket a caller
//! can pick, which is not a limit at all.
//!
//! Two budgets, because the two failures are different sizes. The general one
//! bounds a runaway client; a single screen of this application costs several
//! requests, so it is generous. The credential routes get a much tighter one,
//! because the thing being bounded there is guessing, and a rate that is
//! comfortable for a person is already slow for an attacker.
//!
//! The sign-in budget is a floor and not a substitute for per-account lockout,
//! which this application does not have. Counting is per address for an
//! anonymous caller, so without a trusted proxy everyone behind one gateway
//! shares it: a limit tuned for one person locks out a shift change.
//!
//! `/api/me/health` is exempt. It is the readiness probe, it is open by design,
//! and an orchestrator polling it every second must not consume the budget of
//! whoever shares its address.
//!
//! Generated: 2026-10-09T06:43:43.208Z
//! Project: container-logistics

use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use axum::{
    extract::{ConnectInfo, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::app::AppContext;

use crate::errors::ErrorBody;

/// The window every budget is measured over.
const WINDOW: Duration = Duration::from_secs(60);

/// Requests per window for everything that is not a credential route.
///
/// A single screen costs several requests — the dictionary lists, the rows, the
/// record — so this is deliberately well above what a person produces and still
/// far below what a runaway client does.
const DEFAULT_MAX_PER_MINUTE: u32 = 300;

/// Requests per window for the routes that verify or create a credential.
const DEFAULT_AUTH_MAX_PER_MINUTE: u32 = 30;

/// Buckets held before a sweep is worth the cost.
///
/// An anonymous caller's key is their address, so the map is bounded only by
/// how many addresses reach the server — which is to say, not bounded. The
/// sweep happens under the lock already held, and only when the map has grown
/// past a size no real deployment reaches by legitimate means.
const SWEEP_THRESHOLD: usize = 10_000;

/// What a caller has spent in the current window.
#[derive(Clone, Copy)]
struct Bucket {
    started: Instant,
    count: u32,
}

/// How many requests a key may make per window. `max == 0` disables the limit.
#[derive(Clone, Copy)]
pub struct Budget {
    pub max: u32,
}

impl Budget {
    fn disabled(self) -> bool {
        self.max == 0
    }
}

/// The answer for one request: whether to serve it, and what to tell the caller
/// about their remaining budget either way.
pub struct Decision {
    pub allowed: bool,
    pub limit: u32,
    pub remaining: u32,
    /// Seconds until the current window ends.
    pub reset: u64,
}

/// The two budgets, the buckets, and what is needed to name a caller.
pub struct Limiter {
    buckets: Mutex<HashMap<String, Bucket>>,
    general: Budget,
    auth: Budget,
    /// Whether `X-Forwarded-For` may be believed.
    trust_proxy: bool,
    /// The secret a session token is verified against. Absent means no token
    /// can be verified, so every caller is counted by address.
    jwt_secret: Option<String>,
}

impl Limiter {
    /// Build from the application's configuration.
    ///
    /// The budgets come from the `settings` block, which is where a deployment
    /// can change them without a rebuild, and both fall back to the constants
    /// above. `config/test.yaml` sets them to 0: the generated suites drive
    /// volumes in seconds that no human session produces in an hour, so a
    /// budget there would be testing the limiter rather than the application.
    /// What covers the limiter is `tests/requests/rate_limit.rs`, which layers
    /// this middleware over a router of its own with a budget it sets itself.
    #[must_use]
    pub fn from_context(ctx: &AppContext) -> Self {
        let settings = ctx.config.settings.as_ref();
        let number = |key: &str, fallback: u32| -> u32 {
            settings
                .and_then(|block| block.get(key))
                .and_then(|value| {
                    value
                        .as_u64()
                        .or_else(|| value.as_str().and_then(|text| text.trim().parse().ok()))
                })
                .and_then(|value| u32::try_from(value).ok())
                .unwrap_or(fallback)
        };

        let trust_proxy = settings
            .and_then(|block| block.get("trust_proxy"))
            .is_some_and(|value| match value {
                serde_json::Value::Bool(flag) => *flag,
                serde_json::Value::String(text) => {
                    matches!(text.trim(), "1" | "true" | "yes" | "on")
                }
                serde_json::Value::Number(number) => number.as_u64().is_some_and(|n| n > 0),
                _ => false,
            });

        Self {
            buckets: Mutex::new(HashMap::new()),
            general: Budget {
                max: number("rate_limit_max_per_minute", DEFAULT_MAX_PER_MINUTE),
            },
            auth: Budget {
                max: number(
                    "rate_limit_auth_max_per_minute",
                    DEFAULT_AUTH_MAX_PER_MINUTE,
                ),
            },
            trust_proxy,
            jwt_secret: ctx
                .config
                .auth
                .as_ref()
                .and_then(|auth| auth.jwt.as_ref())
                .map(|jwt| jwt.secret.clone()),
        }
    }

    /// The budgets and the proxy switch, stated directly. For tests, which need
    /// a budget small enough to cross inside one.
    #[must_use]
    pub fn with_budgets(general: u32, auth: u32) -> Self {
        Self {
            buckets: Mutex::new(HashMap::new()),
            general: Budget { max: general },
            auth: Budget { max: auth },
            trust_proxy: false,
            jwt_secret: None,
        }
    }

    /// Count one request against `key` and say whether it may proceed.
    ///
    /// Pure apart from the map it owns: `now` is a parameter so a test can roll
    /// the window over without sleeping through it.
    fn spend(&self, key: String, budget: Budget, now: Instant) -> Decision {
        if budget.disabled() {
            return Decision {
                allowed: true,
                limit: 0,
                remaining: 0,
                reset: 0,
            };
        }

        let Ok(mut buckets) = self.buckets.lock() else {
            // A poisoned lock means a previous holder panicked while counting.
            // Refusing every request afterwards would turn one panic into an
            // outage; the limit is a bound on abuse, not a correctness
            // guarantee, so the request is served and the bound is lost until
            // the process restarts.
            return Decision {
                allowed: true,
                limit: budget.max,
                remaining: budget.max,
                reset: 0,
            };
        };

        if buckets.len() > SWEEP_THRESHOLD {
            buckets.retain(|_, bucket| now.duration_since(bucket.started) < WINDOW);
        }

        let bucket = buckets.entry(key).or_insert(Bucket {
            started: now,
            count: 0,
        });
        if now.duration_since(bucket.started) >= WINDOW {
            *bucket = Bucket {
                started: now,
                count: 0,
            };
        }

        let elapsed = now.duration_since(bucket.started);
        let reset = WINDOW.saturating_sub(elapsed).as_secs().max(1);

        if bucket.count >= budget.max {
            return Decision {
                allowed: false,
                limit: budget.max,
                remaining: 0,
                reset,
            };
        }

        bucket.count += 1;
        Decision {
            allowed: true,
            limit: budget.max,
            remaining: budget.max - bucket.count,
            reset,
        }
    }

    /// The key this request is counted against.
    ///
    /// A verified token's subject when there is one, the caller's address
    /// otherwise, prefixed apart so a subject that happens to read like an
    /// address cannot land in an address's bucket — and prefixed by the scope,
    /// because two budgets sharing one counter is one budget: exhausting the
    /// credential allowance would close the rest of the application to the same
    /// caller, and thirty ordinary requests would use up the sign-in allowance.
    fn caller(&self, request: &Request, scope: Scope) -> String {
        let prefix = match scope {
            Scope::General => "api",
            Scope::Auth => "auth",
        };
        if let Some(pid) = self.verified_subject(request) {
            return format!("{prefix}:user:{pid}");
        }
        format!("{prefix}:addr:{}", self.address(request))
    }

    /// The subject of the request's session token, if it carries one that this
    /// application signed.
    fn verified_subject(&self, request: &Request) -> Option<String> {
        let secret = self.jwt_secret.as_ref()?;
        let token = bearer_token(request).or_else(|| cookie_token(request))?;
        loco_rs::auth::jwt::JWT::new(secret)
            .validate(&token)
            .ok()
            .map(|data| data.claims.pid)
    }

    /// Where the request came from.
    ///
    /// `X-Forwarded-For` is read only when the deployment has said it sits
    /// behind a proxy it controls. Believing it unconditionally would let a
    /// client hand itself a fresh bucket per request by setting the header,
    /// which turns a sign-in limit into decoration. The **rightmost** value is
    /// taken, because a well-behaved proxy appends the address it saw: anything
    /// to the left of that was supplied by the client.
    fn address(&self, request: &Request) -> String {
        if self.trust_proxy {
            if let Some(forwarded) = request
                .headers()
                .get("x-forwarded-for")
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.rsplit(',').next())
                .map(str::trim)
                .filter(|value| !value.is_empty())
            {
                return forwarded.to_string();
            }
        }

        request
            .extensions()
            .get::<ConnectInfo<SocketAddr>>()
            .map_or_else(
                || "unknown".to_string(),
                |ConnectInfo(addr)| addr.ip().to_string(),
            )
    }
}

/// Which budget a path is counted against, or none when it is exempt.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Scope {
    General,
    /// The routes that verify or create a credential.
    Auth,
}

/// The readiness probe, which no budget applies to.
const EXEMPT_PATH: &str = "/api/me/health";

/// Paths whose budget is the tight one.
const AUTH_PATHS: [&str; 3] = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/change-password",
];

fn scope_for(path: &str) -> Option<Scope> {
    if path == EXEMPT_PATH {
        return None;
    }
    if AUTH_PATHS.contains(&path) {
        return Some(Scope::Auth);
    }
    Some(Scope::General)
}

fn bearer_token(request: &Request) -> Option<String> {
    request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .map(ToString::to_string)
}

fn cookie_token(request: &Request) -> Option<String> {
    request
        .headers()
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())?
        .split(';')
        .filter_map(|pair| pair.trim().split_once('='))
        .find(|(name, _)| *name == "token")
        .map(|(_, value)| value.trim().to_string())
        .filter(|token| !token.is_empty())
}

/// Count this request, and either serve it or refuse it with a 429.
///
/// The budget headers go on **both** answers. A client that can see how much it
/// has left can slow down before it is refused; one that only learns at the
/// wall has to discover the limit by hitting it.
pub async fn enforce(
    State(limiter): State<Arc<Limiter>>,
    request: Request,
    next: Next,
) -> Response {
    let Some(scope) = scope_for(request.uri().path()) else {
        return next.run(request).await;
    };

    let budget = match scope {
        Scope::General => limiter.general,
        Scope::Auth => limiter.auth,
    };
    if budget.disabled() {
        return next.run(request).await;
    }

    let decision = limiter.spend(limiter.caller(&request, scope), budget, Instant::now());

    if decision.allowed {
        let mut response = next.run(request).await;
        write_budget_headers(&mut response, &decision, false);
        return response;
    }

    let body = ErrorBody {
        status_code: StatusCode::TOO_MANY_REQUESTS.as_u16(),
        message: "Too many requests. Slow down and try again shortly.".to_string(),
        errors: None,
        error: "Too Many Requests".to_string(),
        conflict: None,
    };
    let mut response = (StatusCode::TOO_MANY_REQUESTS, Json(body)).into_response();
    write_budget_headers(&mut response, &decision, true);
    response
}

/// `RateLimit-*` on every limited response, `Retry-After` only on a refusal —
/// the header means "you were refused, wait this long", and putting it on a
/// served response says the opposite of what happened.
fn write_budget_headers(response: &mut Response, decision: &Decision, refused: bool) {
    let headers = response.headers_mut();
    insert_number(headers, "ratelimit-limit", u64::from(decision.limit));
    insert_number(
        headers,
        "ratelimit-remaining",
        u64::from(decision.remaining),
    );
    insert_number(headers, "ratelimit-reset", decision.reset);
    if refused {
        insert_number(headers, "retry-after", decision.reset);
    }
}

fn insert_number(headers: &mut axum::http::HeaderMap, name: &'static str, value: u64) {
    if let Ok(header_value) = HeaderValue::from_str(&value.to_string()) {
        headers.insert(name, header_value);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(base: Instant, seconds: u64) -> Instant {
        base + Duration::from_secs(seconds)
    }

    #[test]
    fn a_caller_is_served_up_to_its_budget_and_refused_after_it() {
        let limiter = Limiter::with_budgets(3, 3);
        let budget = Budget { max: 3 };
        let now = Instant::now();

        for expected_remaining in [2, 1, 0] {
            let decision = limiter.spend("user:a".to_string(), budget, now);
            assert!(decision.allowed);
            assert_eq!(decision.remaining, expected_remaining);
        }

        let refused = limiter.spend("user:a".to_string(), budget, now);
        assert!(!refused.allowed);
        assert_eq!(refused.remaining, 0);
        assert_eq!(refused.limit, 3);
        assert!(refused.reset >= 1);
    }

    #[test]
    fn two_callers_do_not_share_a_bucket() {
        let limiter = Limiter::with_budgets(1, 1);
        let budget = Budget { max: 1 };
        let now = Instant::now();

        assert!(limiter.spend("user:a".to_string(), budget, now).allowed);
        assert!(!limiter.spend("user:a".to_string(), budget, now).allowed);
        // The whole point of keying on the caller: b arrives through the same
        // proxy as a and is unaffected by a's spending.
        assert!(limiter.spend("user:b".to_string(), budget, now).allowed);
    }

    #[test]
    fn the_window_rolls_over() {
        let limiter = Limiter::with_budgets(1, 1);
        let budget = Budget { max: 1 };
        let now = Instant::now();

        assert!(
            limiter
                .spend("addr:10.0.0.1".to_string(), budget, now)
                .allowed
        );
        assert!(
            !limiter
                .spend("addr:10.0.0.1".to_string(), budget, at(now, 59))
                .allowed
        );
        assert!(
            limiter
                .spend("addr:10.0.0.1".to_string(), budget, at(now, 60))
                .allowed
        );
    }

    #[test]
    fn a_budget_of_zero_is_off_rather_than_refusing_everything() {
        let limiter = Limiter::with_budgets(0, 0);
        let budget = Budget { max: 0 };
        let now = Instant::now();

        for _ in 0..1_000 {
            assert!(limiter.spend("user:a".to_string(), budget, now).allowed);
        }
    }

    #[test]
    fn the_credential_routes_are_scoped_apart_from_everything_else() {
        assert_eq!(scope_for("/api/auth/login"), Some(Scope::Auth));
        assert_eq!(scope_for("/api/auth/register"), Some(Scope::Auth));
        assert_eq!(scope_for("/api/auth/change-password"), Some(Scope::Auth));
        // `/api/auth/me` verifies no credential — it reads the session that a
        // verified one already produced — so it belongs to the general budget.
        assert_eq!(scope_for("/api/auth/me"), Some(Scope::General));
        assert_eq!(scope_for("/api/bus/compound"), Some(Scope::General));
        // The readiness probe is exempt, so an orchestrator polling it cannot
        // exhaust the budget of whoever shares its address.
        assert_eq!(scope_for("/api/me/health"), None);
    }

    #[test]
    fn a_general_and_an_auth_budget_are_counted_separately() {
        let limiter = Limiter::with_budgets(10, 1);
        let now = Instant::now();

        assert!(
            limiter
                .spend("auth:user:a".to_string(), limiter.auth, now)
                .allowed
        );
        assert!(
            !limiter
                .spend("auth:user:a".to_string(), limiter.auth, now)
                .allowed
        );
        // Exhausting the credential budget must not close the rest of the
        // application to the same caller — which is what the scope prefix in
        // `caller` is for.
        assert!(
            limiter
                .spend("api:user:a".to_string(), limiter.general, now)
                .allowed
        );
    }
}
