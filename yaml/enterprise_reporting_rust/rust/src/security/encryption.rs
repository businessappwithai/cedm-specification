//! AES-256-GCM for `data_sources.connection_config`, byte-compatible with
//! `src/lib/security/encryption.ts` (MIGRATION_PLAN.md §4.3).
//!
//! Format: `hex(iv[16]) ‖ hex(tag[16]) ‖ hex(ciphertext)`. Node uses a
//! **16-byte** IV with GCM; the `aes-gcm` crate defaults to 12, so the cipher
//! type fixes the nonce size explicitly.
//!
//! Nothing in this module logs the key, a property of the key, or a decrypted
//! value. That rule came from an incident in the Node service (a full
//! connection config, password included, in every `docker compose logs`) and
//! applies here unchanged.
use aes_gcm::{
    aead::{consts::U16, Aead, KeyInit, Payload},
    aes::Aes256,
    AesGcm, Nonce,
};
use rand::RngCore;
use sha2::{Digest, Sha256};

type Cipher = AesGcm<Aes256, U16>;

const IV_LENGTH: usize = 16;
const TAG_LENGTH: usize = 16;
const KEY_LENGTH: usize = 32;

#[derive(Debug, thiserror::Error)]
pub enum EncryptionError {
    #[error(
        "[FATAL] ENCRYPTION_KEY is not set. Data-source connection configs cannot be \
         encrypted or decrypted without it. It must be the same value the Node service uses. \
         For local development only, set ALLOW_INSECURE_ENCRYPTION=1."
    )]
    MissingKey,
    #[error("Invalid ciphertext length: {0}. Expected at least 64 characters (IV + auth tag).")]
    InvalidLength(usize),
    #[error("ciphertext is not valid hex")]
    InvalidHex,
    #[error("decryption failed (wrong ENCRYPTION_KEY or corrupt row)")]
    DecryptFailed,
    #[error("key derivation failed")]
    Kdf,
}

fn scrypt_32(password: &[u8], salt: &[u8]) -> Result<[u8; KEY_LENGTH], EncryptionError> {
    // Node's crypto.scryptSync defaults: N=16384 (log2 14), r=8, p=1.
    let params = scrypt::Params::new(14, 8, 1, KEY_LENGTH).map_err(|_| EncryptionError::Kdf)?;
    let mut out = [0u8; KEY_LENGTH];
    scrypt::scrypt(password, salt, &params, &mut out).map_err(|_| EncryptionError::Kdf)?;
    Ok(out)
}

fn is_hex_key(key: &str) -> bool {
    key.len() == KEY_LENGTH * 2 && key.bytes().all(|b| b.is_ascii_hexdigit())
}

fn dev_fallback_permitted() -> bool {
    !crate::common::settings::is_production()
        && std::env::var("ALLOW_INSECURE_ENCRYPTION").is_ok_and(|v| v == "1")
}

/// The key a value in the environment derives to. Exposed for tests; callers
/// use [`encrypt`] / [`decrypt`].
///
/// # Errors
/// When no key is configured and the development fallback is not permitted.
pub fn derive_key(env_key: Option<&str>) -> Result<[u8; KEY_LENGTH], EncryptionError> {
    let Some(key) = env_key.filter(|k| !k.is_empty()) else {
        if dev_fallback_permitted() {
            tracing::warn!(
                "[encryption] ENCRYPTION_KEY is not set and ALLOW_INSECURE_ENCRYPTION=1 — using a \
                 hard-coded development key. Stored data-source passwords are NOT protected."
            );
            return scrypt_32(b"default-dev-key-change-in-production", b"salt");
        }
        return Err(EncryptionError::MissingKey);
    };
    if is_hex_key(key) {
        let mut out = [0u8; KEY_LENGTH];
        hex::decode_to_slice(key, &mut out).map_err(|_| EncryptionError::InvalidHex)?;
        return Ok(out);
    }
    // A passphrase: installation-specific salt derived from the key itself.
    let salt = Sha256::digest(format!("ers:{key}").as_bytes());
    scrypt_32(key.as_bytes(), &salt)
}

/// The derivation used before the salt became installation-specific, tried
/// on decrypt only. `None` for hex keys, which never changed.
fn legacy_key(env_key: Option<&str>) -> Option<[u8; KEY_LENGTH]> {
    let key = env_key.filter(|k| !k.is_empty())?;
    if is_hex_key(key) {
        return None;
    }
    scrypt_32(key.as_bytes(), b"salt").ok()
}

fn env_key() -> Option<String> {
    std::env::var("ENCRYPTION_KEY").ok()
}

/// # Errors
/// When no key is configured.
pub fn encrypt_with(env_key: Option<&str>, plaintext: &str) -> Result<String, EncryptionError> {
    let key = derive_key(env_key)?;
    let cipher = Cipher::new_from_slice(&key).map_err(|_| EncryptionError::Kdf)?;
    let mut iv = [0u8; IV_LENGTH];
    rand::thread_rng().fill_bytes(&mut iv);
    let sealed = cipher
        .encrypt(&Nonce::<U16>::from(iv), plaintext.as_bytes())
        .map_err(|_| EncryptionError::DecryptFailed)?;
    // aes-gcm appends the tag; Node stores it before the ciphertext.
    let (ct, tag) = sealed.split_at(sealed.len() - TAG_LENGTH);
    Ok(format!(
        "{}{}{}",
        hex::encode(iv),
        hex::encode(tag),
        hex::encode(ct)
    ))
}

fn open(key: &[u8; KEY_LENGTH], iv: &[u8], tag: &[u8], ct: &[u8]) -> Result<String, EncryptionError> {
    let cipher = Cipher::new_from_slice(key).map_err(|_| EncryptionError::Kdf)?;
    let iv: [u8; IV_LENGTH] = iv.try_into().map_err(|_| EncryptionError::InvalidHex)?;
    let mut sealed = Vec::with_capacity(ct.len() + tag.len());
    sealed.extend_from_slice(ct);
    sealed.extend_from_slice(tag);
    let plain = cipher
        .decrypt(
            &Nonce::<U16>::from(iv),
            Payload {
                msg: &sealed,
                aad: &[],
            },
        )
        .map_err(|_| EncryptionError::DecryptFailed)?;
    String::from_utf8(plain).map_err(|_| EncryptionError::DecryptFailed)
}

/// # Errors
/// On a missing key, a malformed ciphertext, or a failed authentication.
pub fn decrypt_with(env_key: Option<&str>, ciphertext: &str) -> Result<String, EncryptionError> {
    let key = derive_key(env_key)?;
    let min = (IV_LENGTH + TAG_LENGTH) * 2;
    if ciphertext.len() < min {
        return Err(EncryptionError::InvalidLength(ciphertext.len()));
    }
    let iv = hex::decode(&ciphertext[..IV_LENGTH * 2]).map_err(|_| EncryptionError::InvalidHex)?;
    let tag = hex::decode(&ciphertext[IV_LENGTH * 2..min]).map_err(|_| EncryptionError::InvalidHex)?;
    let ct = hex::decode(&ciphertext[min..]).map_err(|_| EncryptionError::InvalidHex)?;

    let result = open(&key, &iv, &tag, &ct).or_else(|current| match legacy_key(env_key) {
        Some(legacy) => open(&legacy, &iv, &tag, &ct),
        None => Err(current),
    });
    if let Err(e) = &result {
        // The kind is the diagnosis; neither input goes in.
        tracing::error!("[encryption] decryption failed: {e}");
    }
    result
}

/// Encrypt with `ENCRYPTION_KEY` from the environment.
///
/// # Errors
/// See [`encrypt_with`].
pub fn encrypt(plaintext: &str) -> Result<String, EncryptionError> {
    encrypt_with(env_key().as_deref(), plaintext)
}

/// Decrypt with `ENCRYPTION_KEY` from the environment.
///
/// # Errors
/// See [`decrypt_with`].
pub fn decrypt(ciphertext: &str) -> Result<String, EncryptionError> {
    decrypt_with(env_key().as_deref(), ciphertext)
}

#[cfg(test)]
mod tests {
    use super::*;

    const HEX_KEY: &str = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

    #[test]
    fn round_trip_hex_key() {
        let c = encrypt_with(Some(HEX_KEY), r#"{"host":"db","password":"p"}"#).unwrap();
        assert!(c.len() > 64);
        assert_eq!(
            decrypt_with(Some(HEX_KEY), &c).unwrap(),
            r#"{"host":"db","password":"p"}"#
        );
    }

    #[test]
    fn round_trip_passphrase() {
        let c = encrypt_with(Some("a passphrase that is not hex"), "secret").unwrap();
        assert_eq!(
            decrypt_with(Some("a passphrase that is not hex"), &c).unwrap(),
            "secret"
        );
        assert!(decrypt_with(Some("another passphrase"), &c).is_err());
    }

    /// Produced by Node: `encrypt('{"host":"localhost"}')` with ENCRYPTION_KEY=HEX_KEY.
    /// Regenerate with rust/parity/crypto-roundtrip.ts.
    #[test]
    fn decrypts_node_ciphertext() {
        let from_node = include_str!("../../parity/fixtures/node-ciphertext.txt").trim();
        assert_eq!(
            decrypt_with(Some(HEX_KEY), from_node).unwrap(),
            r#"{"host":"localhost"}"#
        );
    }

    #[test]
    fn missing_key_is_error() {
        assert!(matches!(
            derive_key(None),
            Err(EncryptionError::MissingKey) | Ok(_)
        ));
        // With the dev fallback not requested, it must be an error.
        if std::env::var("ALLOW_INSECURE_ENCRYPTION").is_err() {
            assert!(matches!(derive_key(None), Err(EncryptionError::MissingKey)));
        }
    }

    #[test]
    fn short_ciphertext_is_rejected() {
        assert!(matches!(
            decrypt_with(Some(HEX_KEY), "abcd"),
            Err(EncryptionError::InvalidLength(4))
        ));
    }
}
