//! HTTP error envelope.
//!
//! The frontend parses specific error shapes, so this reproduces the NestJS
//! `HttpExceptionFilter` body byte for byte rather than adopting Loco's own
//! `ErrorDetail` envelope (`{error, description}`), which is a different
//! shape. See docs/MIGRATION-LOCO-ASTRYX.md §6.11.
//!
//! Success responses are *not* wrapped: the TypeScript `TransformInterceptor`
//! passes the payload through unchanged for these routes, and the list
//! envelope (`{data, meta}`) is built explicitly by the handler.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// The JSON body every error response carries.
///
/// `errors` is omitted entirely (not `null`) when empty, matching
/// `BadRequestException`'s behaviour for non-validation errors.
#[derive(Debug, Serialize)]
pub struct ErrorBody {
    #[serde(rename = "statusCode")]
    pub status_code: u16,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<String>>,
    pub error: String,
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    NotFound(String),

    /// 400 — same body as NestJS `BadRequestException` with a validation array.
    #[error("{message}")]
    Validation {
        message: String,
        errors: Vec<String>,
    },

    #[error("{0}")]
    BadRequest(String),

    /// 409 — ETag version mismatch or a Postgres unique violation.
    #[error("{0}")]
    Conflict(String),

    #[error("unauthorized")]
    Unauthorized,

    /// 403 — authenticated, but the role does not grant this. Carries a
    /// reason: "forbidden" alone leaves a caller guessing whether they need a
    /// different role, a different record, or a different endpoint.
    #[error("{0}")]
    Forbidden(String),

    /// 503 — a configured upstream (Electric) is absent or unreachable. The
    /// frontend treats this as "fall back to the plain HTTP API", so it must
    /// not be collapsed into a 500.
    #[error("{0}")]
    ServiceUnavailable(String),

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl AppError {
    /// The exact message the TypeScript stack returns when `If-Match` loses a
    /// race. The frontend matches on it to decide whether to offer a reload.
    #[must_use]
    pub fn version_mismatch() -> Self {
        Self::Conflict("Record was modified by another user. Please reload and try again.".into())
    }

    /// The exact message the TypeScript stack returns for Postgres `23505`.
    #[must_use]
    pub fn unique_violation() -> Self {
        Self::Conflict("A record with the same unique field value already exists".into())
    }

    fn status(&self) -> StatusCode {
        match self {
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Validation { .. } | Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Forbidden(_) => StatusCode::FORBIDDEN,
            Self::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        // Class 23 is "integrity constraint violation" — the caller sent
        // something the schema rejects. That is a 4xx, not a 500: a 500 says
        // the server is broken, and a client that omitted a required field has
        // no reason to retry against a server that is working fine.
        //
        // 23505 keeps the fixed 409 message the TypeScript stack returned
        // (bus.service.ts.hbs:180-191); the rest become 400s naming the column
        // Postgres objected to. Anything outside class 23 is genuinely internal
        // and must not leak driver detail.
        if let sqlx::Error::Database(ref db_err) = err {
            match db_err.code().as_deref() {
                Some("23505") => return Self::unique_violation(),
                Some("23502") => {
                    // sqlx's `DatabaseError` exposes `constraint` and `table`
                    // but not `column`, and a NOT NULL violation has no named
                    // constraint — so the column is read out of the message
                    // Postgres writes: `null value in column "smiles" of
                    // relation "bus_compound" violates not-null constraint`.
                    let field = quoted_column(db_err.message())
                        .map_or_else(|| "a required field".to_string(), |c| format!("'{c}'"));
                    return Self::Validation {
                        message: "Validation failed".to_string(),
                        errors: vec![format!("{field} is required")],
                    };
                }
                Some("23503") => {
                    return Self::Validation {
                        message: "Validation failed".to_string(),
                        errors: vec![
                            "A referenced record does not exist".to_string(),
                        ],
                    };
                }
                Some("23514") => {
                    return Self::Validation {
                        message: "Validation failed".to_string(),
                        errors: vec!["A value is outside its allowed range".to_string()],
                    };
                }
                // 22P02 is `invalid_text_representation` — a malformed UUID or
                // number in the payload. 42804 is `datatype_mismatch`: a value
                // bound as text against a typed column. Both are the caller's
                // input, not a server fault.
                Some("22P02" | "22007" | "22008" | "42804") => {
                    return Self::BadRequest("A value has the wrong type or format".to_string());
                }
                _ => {}
            }
        }
        Self::Internal(err.into())
    }
}

/// The column name out of `… in column "name" of relation …`.
///
/// Returns `None` for any message that does not have that shape, so a Postgres
/// wording change degrades to the generic "a required field" rather than
/// showing the user a fragment of a driver message.
fn quoted_column(message: &str) -> Option<&str> {
    let after = message.split_once("column \"")?.1;
    after.split_once('"').map(|(name, _)| name)
}

impl From<sea_orm::DbErr> for AppError {
    fn from(err: sea_orm::DbErr) -> Self {
        Self::Internal(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status();

        // Internal errors are logged in full and reported generically — the
        // same split the NestJS filter makes.
        if let Self::Internal(ref err) = self {
            // `request_unhandled`, not `request_failed`: the middleware emits one line
            // per request and already reports the 5xx this turns into. This one is
            // the detail the middleware cannot see — what the error actually was.
            crate::log_event!(request_unhandled, error = ?err);
        }

        let (message, errors) = match self {
            Self::Validation { message, errors } => (message, Some(errors)),
            Self::Internal(_) => ("Internal server error".to_string(), None),
            other => (other.to_string(), None),
        };

        let body = ErrorBody {
            status_code: status.as_u16(),
            message,
            errors,
            error: status
                .canonical_reason()
                .unwrap_or("Internal Server Error")
                .to_string(),
        };

        (status, Json(body)).into_response()
    }
}

pub type AppResult<T> = std::result::Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_null_messages_yield_the_column_name() {
        assert_eq!(
            quoted_column(
                r#"null value in column "smiles" of relation "bus_compound" violates not-null constraint"#
            ),
            Some("smiles")
        );
        // A message with no column clause degrades rather than guessing.
        assert_eq!(quoted_column("some other database error"), None);
        assert_eq!(quoted_column(r#"unterminated column "smiles"#), None);
    }

    /// Class 23 is the caller's mistake, not the server's. Every one of these
    /// used to surface as a 500, which told a client to retry a request that
    /// could never succeed.
    #[test]
    fn integrity_violations_are_client_errors() {
        for (code, expected) in [
            ("23502", StatusCode::BAD_REQUEST),
            ("23503", StatusCode::BAD_REQUEST),
            ("23514", StatusCode::BAD_REQUEST),
            ("22P02", StatusCode::BAD_REQUEST),
            ("42804", StatusCode::BAD_REQUEST),
            ("23505", StatusCode::CONFLICT),
        ] {
            let error = AppError::from(sqlx::Error::Database(Box::new(TestDbError {
                code: code.to_string(),
            })));
            assert_eq!(error.status(), expected, "wrong status for {code}");
        }
    }

    /// A failure with no SQLSTATE really is internal and must stay a 500.
    #[test]
    fn unclassified_database_errors_stay_internal() {
        let error = AppError::from(sqlx::Error::PoolClosed);
        assert_eq!(error.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[derive(Debug)]
    struct TestDbError {
        code: String,
    }

    impl std::fmt::Display for TestDbError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            f.write_str("test database error")
        }
    }

    impl std::error::Error for TestDbError {}

    impl sqlx::error::DatabaseError for TestDbError {
        fn message(&self) -> &str {
            "test database error"
        }

        fn code(&self) -> Option<std::borrow::Cow<'_, str>> {
            Some(std::borrow::Cow::Borrowed(&self.code))
        }

        fn as_error(&self) -> &(dyn std::error::Error + Send + Sync + 'static) {
            self
        }

        fn as_error_mut(&mut self) -> &mut (dyn std::error::Error + Send + Sync + 'static) {
            self
        }

        fn into_error(self: Box<Self>) -> Box<dyn std::error::Error + Send + Sync + 'static> {
            self
        }

        fn kind(&self) -> sqlx::error::ErrorKind {
            sqlx::error::ErrorKind::Other
        }
    }
}
