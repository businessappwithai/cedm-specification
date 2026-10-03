//! The OpenAI-compatible endpoints the Node service reaches through the
//! `openai` SDK (`src/lib/voice/llama-client.ts`): speech-to-text,
//! text-to-speech and embeddings. Base URLs follow the same rule — an
//! `AI_*_BASE_URL` is the full base (with `/v1`), else `LLAMA_*_URL` + `/v1`.
use std::time::Duration;

use serde_json::{json, Value};

pub(crate) fn base(ai: &str, llama: &str, llama_fallback: Option<&str>, default: &str) -> String {
    if let Some(v) = std::env::var(ai).ok().filter(|v| !v.is_empty()) {
        return v;
    }
    let root = std::env::var(llama)
        .ok()
        .or_else(|| llama_fallback.and_then(|f| std::env::var(f).ok()))
        .unwrap_or_else(|| default.to_string());
    format!("{root}/v1")
}

pub(crate) fn key(ai: &str, llama: &str) -> String {
    std::env::var(ai)
        .or_else(|_| std::env::var(llama))
        .unwrap_or_else(|_| "none".into())
}

fn stt_base() -> String {
    base("AI_STT_BASE_URL", "LLAMA_STT_URL", None, "http://localhost:8081")
}

fn tts_base() -> String {
    base("AI_TTS_BASE_URL", "LLAMA_TTS_URL", None, "http://localhost:8083")
}

/// `rag-store.ts`'s embedding base: `AI_EMBEDDING_BASE_URL`, else
/// `LLAMA_EMBEDDING_URL ?? LLAMA_REASONING_URL` + `/v1`.
pub fn embedding_base() -> String {
    base(
        "AI_EMBEDDING_BASE_URL",
        "LLAMA_EMBEDDING_URL",
        Some("LLAMA_REASONING_URL"),
        "http://localhost:8080",
    )
}

pub fn embedding_model() -> String {
    std::env::var("AI_EMBEDDING_MODEL")
        .or_else(|_| std::env::var("LLAMA_EMBEDDING_MODEL"))
        .unwrap_or_else(|_| "embedding".into())
}

pub(crate) fn client(timeout: Duration) -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(timeout)
        .build()
        .unwrap_or_default()
}

/// The `openai` SDK's `APIError` message: `"<status> <detail>"`, or
/// `"Connection error."` when the server could not be reached.
async fn api_error(r: reqwest::Response) -> String {
    let status = r.status().as_u16();
    let body: Option<Value> = r.json().await.ok();
    let detail = body.as_ref().and_then(|b| {
        b.pointer("/error/message")
            .or_else(|| b.get("message"))
            .and_then(Value::as_str)
            .map(str::to_string)
            .or_else(|| Some(b.to_string()))
    });
    match detail {
        Some(d) => format!("{status} {d}"),
        None => format!("{status} status code (no body)"),
    }
}

/// Send with the SDK's retry policy: two retries on a connection failure,
/// a 408/409/429 or a 5xx, backing off 0.5 s then 1 s.
pub(crate) async fn send(build: impl Fn() -> reqwest::RequestBuilder) -> Result<reqwest::Response, String> {
    let mut delay = Duration::from_millis(500);
    for attempt in 0..3 {
        match build().send().await {
            Ok(r) if r.status().is_success() => return Ok(r),
            Ok(r) => {
                let s = r.status().as_u16();
                if attempt == 2 || !(s == 408 || s == 409 || s == 429 || s >= 500) {
                    return Err(api_error(r).await);
                }
            }
            Err(e) => {
                if attempt == 2 {
                    return Err(if e.is_timeout() {
                        "Request timed out.".into()
                    } else {
                        "Connection error.".into()
                    });
                }
            }
        }
        tokio::time::sleep(delay).await;
        delay *= 2;
    }
    Err("Connection error.".into())
}

/// `transcribeAudio(blob)`: the audio as `audio.wav`, `response_format: json`.
///
/// # Errors
/// The SDK-style error message.
pub async fn transcribe(audio: Vec<u8>) -> Result<String, String> {
    let url = format!("{}/audio/transcriptions", stt_base());
    let model = std::env::var("AI_STT_MODEL")
        .or_else(|_| std::env::var("LLAMA_STT_MODEL"))
        .unwrap_or_else(|_| "Qwen3-ASR".into());
    let k = key("AI_STT_API_KEY", "LLAMA_STT_API_KEY");
    let c = client(Duration::from_secs(600));
    let r = send(|| {
        let part = reqwest::multipart::Part::bytes(audio.clone())
            .file_name("audio.wav")
            .mime_str("audio/wav")
            .unwrap_or_else(|_| reqwest::multipart::Part::bytes(audio.clone()));
        let form = reqwest::multipart::Form::new()
            .part("file", part)
            .text("model", model.clone())
            .text("response_format", "json");
        c.post(&url).bearer_auth(&k).multipart(form)
    })
    .await?;
    let body: Value = r.json().await.map_err(|e| e.to_string())?;
    Ok(body
        .get("text")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string())
}

/// `synthesizeSpeech(text)`: MP3 from the TTS server.
///
/// # Errors
/// The SDK-style error message.
pub async fn synthesize(text: &str) -> Result<Vec<u8>, String> {
    let url = format!("{}/audio/speech", tts_base());
    let model = std::env::var("LLAMA_TTS_MODEL").unwrap_or_else(|_| "Qwen3-TTS".into());
    let k = key("AI_TTS_API_KEY", "LLAMA_TTS_API_KEY");
    let c = client(Duration::from_secs(600));
    let body = json!({ "model": model, "voice": "alloy", "input": text, "response_format": "mp3" });
    let r = send(|| c.post(&url).bearer_auth(&k).json(&body)).await?;
    r.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
}

/// One embedding from the embedding server (10 s timeout, no retries, as
/// `llamaEmbed` uses plain `fetch`). `None` on any failure.
pub async fn embed(text: &str) -> Option<Vec<f64>> {
    let c = client(Duration::from_secs(10));
    let r = c
        .post(format!("{}/embeddings", embedding_base()))
        .json(&json!({ "input": text, "model": embedding_model() }))
        .send()
        .await
        .ok()?;
    if !r.status().is_success() {
        return None;
    }
    let body: Value = r.json().await.ok()?;
    let v: Vec<f64> = body
        .pointer("/data/0/embedding")?
        .as_array()?
        .iter()
        .filter_map(Value::as_f64)
        .collect();
    (!v.is_empty()).then_some(v)
}
