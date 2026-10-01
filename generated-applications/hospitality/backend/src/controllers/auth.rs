//! Authentication routes.
//!
//! The one place the API contract deliberately changes (§9, decision D1).
//! Better Auth's `/api/auth/*` catch-all is replaced by explicit handlers over
//! Loco's native JWT.
//!
//! The token is issued **both** as a `Bearer` value in the response body and as
//! an HTTP-only cookie, because the frontend's existing flow is "the session
//! cookie is set, now call `/api/auth/me`". Keeping the cookie means that flow
//! survives with minimal change; the bearer token is there for API clients.

use axum::{
    extract::State,
    http::{header::SET_COOKIE, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde::Serialize;
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;
use crate::models::users::{LoginParams, RegisterParams, UserResponse};

#[derive(Debug, Serialize)]
struct LoginResponse {
    token: String,
    user: UserResponse,
}

#[utoipa::path(
    post, path = "/api/auth/register", tag = "auth",
    request_body(content = serde_json::Value, description = "`{ email, password, name }`"),
    responses(
        (status = 200, description = "`{ user }`"),
        (status = 400, description = "Invalid payload"),
        (status = 409, description = "That email is already registered"),
    ),
)]
pub async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> AppResult<Response> {
    validate_registration(&params)?;

    let user = users::Model::create_with_password(&ctx.db, &params)
        .await
        .map_err(|err| match err {
            ModelError::EntityAlreadyExists => {
                // Same message and status the TypeScript stack returned.
                AppError::Conflict("A user with that email already exists".to_string())
            }
            other => AppError::Internal(anyhow::anyhow!(other)),
        })?;

    let role = user.role_name(&ctx.db).await;
    Ok((
        StatusCode::CREATED,
        Json(json!({ "user": UserResponse::new(&user, role) })),
    )
        .into_response())
}

#[utoipa::path(
    post, path = "/api/auth/login", tag = "auth",
    request_body(content = serde_json::Value, description = "`{ email, password }`"),
    responses(
        (status = 200, description = "`{ token, user }`; the token is also set as an httpOnly cookie"),
        (status = 401, description = "Wrong email or password"),
    ),
)]
pub async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> AppResult<Response> {
    let user = users::Model::find_by_email(&ctx.db, &params.email)
        .await
        .map_err(|_| invalid_credentials())?;

    if !user.verify_password(&params.password) {
        return Err(invalid_credentials());
    }

    let token = issue_token(&ctx, &user.pid.to_string())?;
    let role = user.role_name(&ctx.db).await;

    let body = LoginResponse {
        token: token.clone(),
        user: UserResponse::new(&user, role),
    };

    let mut response = Json(body).into_response();
    response
        .headers_mut()
        .insert(SET_COOKIE, session_cookie(&ctx, &token)?);
    Ok(response)
}

/// `GET /api/auth/me` — the endpoint the frontend polls after login.
#[utoipa::path(
    get, path = "/api/auth/me", tag = "auth",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "`{ user }`"),
        (status = 401, description = "No or invalid token"),
    ),
)]
pub async fn current(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let role = auth.user.role_name(&ctx.db).await;
    Ok(Json(json!({ "user": UserResponse::new(&auth.user, role) })).into_response())
}

/// Clearing the cookie is the whole of logout: JWTs are stateless, so there is
/// no server-side session to destroy. An expired-in-the-past cookie is what
/// makes the browser drop it immediately.
#[utoipa::path(
    post, path = "/api/auth/logout", tag = "auth",
    responses((status = 200, description = "Session cookie cleared")),
)]
pub async fn logout() -> AppResult<Response> {
    let mut response = Json(json!({ "success": true })).into_response();
    let cookie = "token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
    response.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(cookie).map_err(|err| AppError::Internal(err.into()))?,
    );
    Ok(response)
}

/// `POST /api/auth/change-password` — rotate your own password.
///
/// The current password is required even though the caller is already
/// authenticated: a token left behind on a shared machine must not be enough to
/// lock its owner out.
#[utoipa::path(
    post, path = "/api/auth/change-password", tag = "auth",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ currentPassword, newPassword }` — the current one is required even though you are already authenticated, so a token left on a shared machine cannot lock its owner out"),
    responses(
        (status = 200, description = "Password changed"),
        (status = 400, description = "The current password did not match"),
        (status = 401, description = "No token"),
    ),
)]
pub async fn change_password(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Json(payload): Json<ChangePasswordParams>,
) -> AppResult<Response> {
    if !auth.user.verify_password(&payload.current_password) {
        return Err(AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec!["Current password is incorrect".to_string()],
        });
    }
    if payload.new_password.len() < 8 {
        return Err(AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec!["New password must be at least 8 characters".to_string()],
        });
    }

    auth.user
        .set_password(&ctx.db, &payload.new_password)
        .await
        .map_err(|err| AppError::Internal(anyhow::anyhow!(err)))?;

    Ok(Json(json!({ "success": true })).into_response())
}

#[derive(Debug, serde::Deserialize)]
pub struct ChangePasswordParams {
    #[serde(alias = "currentPassword")]
    pub current_password: String,
    #[serde(alias = "newPassword")]
    pub new_password: String,
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("auth")
        .add("/register", post(register))
        .add("/login", post(login))
        .add("/me", get(current))
        .add("/logout", post(logout))
        .add("/change-password", post(change_password))
}

// ---------------------------------------------------------------------------

/// Login failures are deliberately indistinguishable: revealing "no such user"
/// versus "wrong password" turns the endpoint into an account enumerator.
fn invalid_credentials() -> AppError {
    AppError::Unauthorized
}

fn validate_registration(params: &RegisterParams) -> AppResult<()> {
    let mut errors = Vec::new();
    if !params.email.contains('@') {
        errors.push("email must be a valid address".to_string());
    }
    if params.password.len() < 8 {
        errors.push("password must be at least 8 characters".to_string());
    }
    if params.name.trim().is_empty() {
        errors.push("name is required".to_string());
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(AppError::Validation {
            message: "Validation failed".to_string(),
            errors,
        })
    }
}

fn jwt_config(ctx: &AppContext) -> AppResult<&loco_rs::config::JWT> {
    ctx.config
        .auth
        .as_ref()
        .and_then(|auth| auth.jwt.as_ref())
        .ok_or_else(|| {
            AppError::Internal(anyhow::anyhow!(
                "auth.jwt is not configured — set JWT_SECRET and the auth block in config/*.yaml"
            ))
        })
}

fn issue_token(ctx: &AppContext, pid: &str) -> AppResult<String> {
    let jwt = jwt_config(ctx)?;
    // NOTE: `auth` from the prelude is the *extractor* module
    // (`controller::extractor::auth`); the JWT type lives at the crate root.
    loco_rs::auth::jwt::JWT::new(&jwt.secret)
        .generate_token(
            jwt.expiration,
            pid.to_string(),
            serde_json::Map::<String, serde_json::Value>::new(),
        )
        .map_err(|err| AppError::Internal(err.into()))
}

/// HTTP-only so script cannot read it; `SameSite=Lax` so ordinary top-level
/// navigations still carry it while cross-site POSTs do not.
fn session_cookie(ctx: &AppContext, token: &str) -> AppResult<HeaderValue> {
    let max_age = jwt_config(ctx)?.expiration;
    let secure = if ctx.environment == loco_rs::environment::Environment::Production {
        "; Secure"
    } else {
        ""
    };
    let cookie =
        format!("token={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}{secure}");
    HeaderValue::from_str(&cookie).map_err(|err| AppError::Internal(err.into()))
}

/// Unused today, but the shape every future guarded handler needs: pull the
/// role out of the dictionary and compare. Kept next to the auth code so the
/// RBAC story stays in one place.
#[allow(dead_code)]
pub async fn require_role(
    ctx: &AppContext,
    user: &users::Model,
    allowed: &[&str],
) -> AppResult<()> {
    match user.role_name(&ctx.db).await {
        Some(role) if allowed.contains(&role.as_str()) => Ok(()),
        _ => Err(AppError::Forbidden("forbidden".to_string())),
    }
}
