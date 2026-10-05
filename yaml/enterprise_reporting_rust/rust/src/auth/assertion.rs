//! Sign-in by assertion: the chat gateway vouches for a person it has just
//! signed in to the generated application, and this platform opens a session
//! for them without a second password.
//!
//! The assertion is `base64url(payload) "." base64url(signature)`, an Ed25519
//! signature over the encoded payload, made with the gateway's
//! `SSO_SIGNING_KEY`. This platform holds only the public half
//! (`SSO_PUBLIC_KEY`, a PEM SubjectPublicKeyInfo), so it can verify an
//! assertion and never mint one.
//!
//! What makes one acceptable, every check refusing on its own:
//! - the signature verifies against the configured key;
//! - `iss` is the chat and `aud` is this platform — an assertion minted for
//!   anything else is not one for us;
//! - it has not expired, was not issued in the future, and lives at most
//!   `MAX_LIFETIME_SECONDS` — a gateway bug issuing a day-long assertion is
//!   refused rather than honoured;
//! - `sub` is an email address and `jti` is a short identifier. Single use is
//!   the caller's half (`auth_assertions`), because it needs the database.
use base64::Engine;
use ring::signature::{UnparsedPublicKey, ED25519};
use serde::Deserialize;

/// Who issues assertions and who they are for. Fixed on both sides.
pub const ISSUER: &str = "appwithai-chat";
pub const AUDIENCE: &str = "report";

/// The longest an assertion may be valid for. The gateway issues 60 seconds.
pub const MAX_LIFETIME_SECONDS: i64 = 120;
/// How far ahead of this clock an issue time may be.
pub const CLOCK_SKEW_SECONDS: i64 = 30;

/// The DER prefix of an Ed25519 SubjectPublicKeyInfo (RFC 8410): the algorithm
/// identifier `1.3.101.112` and the bit string header. The 32-byte key follows.
const ED25519_SPKI_PREFIX: [u8; 12] = [
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
];

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct Assertion {
    pub iss: String,
    pub aud: String,
    /// The person's email address, lower-cased by the gateway.
    pub sub: String,
    #[serde(default)]
    pub name: String,
    /// The person's role names in the generated application.
    #[serde(default)]
    pub roles: Vec<String>,
    /// True when that application gives the person its master role.
    #[serde(default)]
    pub master: bool,
    pub jti: String,
    pub iat: i64,
    pub exp: i64,
}

/// Why an assertion was refused. The message is for the log, never the caller.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal(pub &'static str);

/// The 32-byte Ed25519 key in a PEM `PUBLIC KEY` block.
///
/// Environment files often carry a PEM on one line with `\n` escapes, so those
/// are accepted as line breaks.
///
/// # Errors
/// When the text is not an Ed25519 SubjectPublicKeyInfo.
pub fn public_key_from_pem(pem: &str) -> Result<[u8; 32], String> {
    let pem = pem.replace("\\n", "\n");
    let body: String = pem
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with("-----"))
        .collect();
    if !pem.contains("-----BEGIN PUBLIC KEY-----") {
        return Err("SSO_PUBLIC_KEY is not a PEM PUBLIC KEY block".into());
    }
    let der = base64::engine::general_purpose::STANDARD
        .decode(body.as_bytes())
        .map_err(|_| "SSO_PUBLIC_KEY is not valid base64".to_string())?;
    if der.len() != ED25519_SPKI_PREFIX.len() + 32 || der[..12] != ED25519_SPKI_PREFIX {
        return Err("SSO_PUBLIC_KEY is not an Ed25519 public key".into());
    }
    let mut key = [0u8; 32];
    key.copy_from_slice(&der[12..]);
    Ok(key)
}

fn is_email(s: &str) -> bool {
    let Some((local, domain)) = s.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && s.len() <= 255
        && !s.chars().any(|c| c.is_whitespace() || c.is_control())
}

/// Verify an assertion against `key` at `now` (seconds since the epoch).
///
/// # Errors
/// The first check that fails.
pub fn verify(token: &str, key: &[u8; 32], now: i64) -> Result<Assertion, Refusal> {
    if token.len() > 4096 {
        return Err(Refusal("assertion too long"));
    }
    let (encoded, signature) = token
        .split_once('.')
        .ok_or(Refusal("assertion is not payload.signature"))?;
    if signature.contains('.') {
        return Err(Refusal("assertion has more than two parts"));
    }
    let b64 = base64::engine::general_purpose::URL_SAFE_NO_PAD;
    let signature = b64
        .decode(signature.as_bytes())
        .map_err(|_| Refusal("signature is not base64url"))?;
    UnparsedPublicKey::new(&ED25519, key)
        .verify(encoded.as_bytes(), &signature)
        .map_err(|_| Refusal("signature does not verify"))?;

    // Only a signed payload is parsed.
    let payload = b64
        .decode(encoded.as_bytes())
        .map_err(|_| Refusal("payload is not base64url"))?;
    let assertion: Assertion =
        serde_json::from_slice(&payload).map_err(|_| Refusal("payload is not an assertion"))?;

    if assertion.iss != ISSUER {
        return Err(Refusal("wrong issuer"));
    }
    if assertion.aud != AUDIENCE {
        return Err(Refusal("wrong audience"));
    }
    if assertion.exp <= now {
        return Err(Refusal("expired"));
    }
    if assertion.iat > now + CLOCK_SKEW_SECONDS {
        return Err(Refusal("issued in the future"));
    }
    if assertion.exp - assertion.iat > MAX_LIFETIME_SECONDS || assertion.exp < assertion.iat {
        return Err(Refusal("lifetime out of bounds"));
    }
    if !is_email(&assertion.sub) || assertion.sub != assertion.sub.to_lowercase() {
        return Err(Refusal("subject is not a lower-case email address"));
    }
    if assertion.jti.is_empty()
        || assertion.jti.len() > 64
        || !assertion
            .jti
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-')
    {
        return Err(Refusal("malformed jti"));
    }
    if assertion.roles.len() > 64 || assertion.roles.iter().any(|r| r.len() > 255) {
        return Err(Refusal("too many roles"));
    }
    Ok(assertion)
}

/// A role name folded for comparison: the application title-cases a role for
/// display (`Sales Manager`) where a model writes `sales_manager`, and the
/// reporting pack names its mirrored roles by the former.
#[must_use]
pub fn fold_role(name: &str) -> String {
    name.chars()
        .filter(char::is_ascii_alphanumeric)
        .map(|c| c.to_ascii_lowercase())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use ring::rand::SystemRandom;
    use ring::signature::{Ed25519KeyPair, KeyPair};
    use serde_json::json;

    fn keypair() -> Ed25519KeyPair {
        let pkcs8 = Ed25519KeyPair::generate_pkcs8(&SystemRandom::new()).expect("keygen");
        Ed25519KeyPair::from_pkcs8(pkcs8.as_ref()).expect("parse")
    }

    fn public(pair: &Ed25519KeyPair) -> [u8; 32] {
        let mut key = [0u8; 32];
        key.copy_from_slice(pair.public_key().as_ref());
        key
    }

    fn sign(pair: &Ed25519KeyPair, payload: &serde_json::Value) -> String {
        let b64 = base64::engine::general_purpose::URL_SAFE_NO_PAD;
        let encoded = b64.encode(payload.to_string());
        let sig = pair.sign(encoded.as_bytes());
        format!("{encoded}.{}", b64.encode(sig.as_ref()))
    }

    fn payload(now: i64) -> serde_json::Value {
        json!({
            "iss": ISSUER, "aud": AUDIENCE, "sub": "sales.rep@crm.example.com",
            "name": "Sales Rep", "roles": ["Sales Rep"], "master": false,
            "jti": "0b0e4b8e-6a7f-4b1c-9d2e-3f4a5b6c7d8e", "iat": now, "exp": now + 60
        })
    }

    const NOW: i64 = 1_790_000_000;

    #[test]
    fn a_valid_assertion_verifies() {
        let pair = keypair();
        let a = verify(&sign(&pair, &payload(NOW)), &public(&pair), NOW).expect("valid");
        assert_eq!(a.sub, "sales.rep@crm.example.com");
        assert_eq!(a.roles, vec!["Sales Rep".to_string()]);
    }

    #[test]
    fn another_key_is_refused() {
        let token = sign(&keypair(), &payload(NOW));
        assert_eq!(
            verify(&token, &public(&keypair()), NOW),
            Err(Refusal("signature does not verify"))
        );
    }

    #[test]
    fn an_edited_payload_is_refused() {
        let pair = keypair();
        let token = sign(&pair, &payload(NOW));
        let (_, sig) = token.split_once('.').unwrap();
        let mut forged = payload(NOW);
        forged["master"] = json!(true);
        let encoded = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(forged.to_string());
        assert!(verify(&format!("{encoded}.{sig}"), &public(&pair), NOW).is_err());
    }

    #[test]
    fn each_claim_is_checked() {
        let pair = keypair();
        let key = public(&pair);
        let cases: [(&str, serde_json::Value, &str); 6] = [
            ("iss", json!("someone-else"), "wrong issuer"),
            ("aud", json!("app"), "wrong audience"),
            ("exp", json!(NOW), "expired"),
            (
                "sub",
                json!("Sales.Rep@crm.example.com"),
                "subject is not a lower-case email address",
            ),
            ("jti", json!("../../x"), "malformed jti"),
            ("iat", json!(NOW + 600), "issued in the future"),
        ];
        for (claim, value, why) in cases {
            let mut p = payload(NOW);
            p[claim] = value;
            if claim == "iat" {
                p["exp"] = json!(NOW + 660);
            }
            assert_eq!(verify(&sign(&pair, &p), &key, NOW), Err(Refusal(why)), "{claim}");
        }
        let mut long = payload(NOW);
        long["exp"] = json!(NOW + 3600);
        assert_eq!(
            verify(&sign(&pair, &long), &key, NOW),
            Err(Refusal("lifetime out of bounds"))
        );
    }

    #[test]
    fn the_pem_the_gateway_writes_parses() {
        let pair = keypair();
        let mut der = ED25519_SPKI_PREFIX.to_vec();
        der.extend_from_slice(pair.public_key().as_ref());
        let body = base64::engine::general_purpose::STANDARD.encode(&der);
        let pem = format!("-----BEGIN PUBLIC KEY-----\n{body}\n-----END PUBLIC KEY-----\n");
        assert_eq!(public_key_from_pem(&pem).unwrap(), public(&pair));
        // One line with escapes, as a .env file carries it.
        assert_eq!(
            public_key_from_pem(&pem.replace('\n', "\\n")).unwrap(),
            public(&pair)
        );
        assert!(public_key_from_pem("-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----").is_err());
    }

    #[test]
    fn role_names_fold_together() {
        assert_eq!(fold_role("Sales Manager"), fold_role("sales_manager"));
        assert_ne!(fold_role("Sales Manager"), fold_role("Sales Rep"));
    }
}
