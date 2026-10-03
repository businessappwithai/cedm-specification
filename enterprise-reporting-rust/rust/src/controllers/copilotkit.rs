//! The plain-HTTP parts of `src/routes/api/copilotkit/$.ts`: speech-to-text
//! and text-to-speech for the CopilotKit sidebar, proxied to the Mastra
//! server's OpenAI-compatible audio endpoints, and the thread stubs.
//!
//! The CopilotKit **runtime** itself (`/api/copilotkit` and every other path
//! under it) stays in the TanStack server: it is the server half of a
//! JavaScript UI library, speaking that library's own protocol, with no data
//! access of its own (MIGRATION_PLAN.md §7.1).
use axum::{
    body::{Body, Bytes},
    extract::{multipart::MultipartRejection, Multipart, State},
    http::{header, StatusCode},
    response::Response,
    routing::post,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use crate::{auth::CurrentSession, common::response};

fn not_authenticated() -> Response {
    response::raw(StatusCode::UNAUTHORIZED, &json!({ "error": "Not authenticated" }))
}

fn empty_text() -> Response {
    response::raw(StatusCode::OK, &json!({ "text": "" }))
}

fn mastra() -> String {
    crate::nlquery::agents::mastra_url()
}

/// `convertToWav`: ffmpeg to 16 kHz mono WAV, through temporary files.
async fn to_wav(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let id = uuid::Uuid::new_v4();
    let dir = std::env::temp_dir();
    let input = dir.join(format!("stt-in-{id}"));
    let output = dir.join(format!("stt-out-{id}.wav"));
    tokio::fs::write(&input, bytes).await.map_err(|e| e.to_string())?;
    let status = tokio::process::Command::new("ffmpeg")
        .args(["-y", "-i"])
        .arg(&input)
        .args(["-ar", "16000", "-ac", "1", "-f", "wav"])
        .arg(&output)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .await;
    let result = match status {
        Ok(s) if s.success() => tokio::fs::read(&output).await.map_err(|e| e.to_string()),
        Ok(s) => Err(format!("ffmpeg exited with code {}", s.code().unwrap_or(-1))),
        Err(e) => Err(e.to_string()),
    };
    let _ = tokio::fs::remove_file(&input).await;
    let _ = tokio::fs::remove_file(&output).await;
    result
}

/// `POST /api/copilotkit/transcribe`: every failure answers `{ text: "" }`.
async fn transcribe(
    CurrentSession(session): CurrentSession,
    form: Result<Multipart, MultipartRejection>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(not_authenticated());
    }
    let Ok(mut form) = form else {
        return Ok(empty_text());
    };
    let mut audio: Option<(String, String, Vec<u8>)> = None;
    let mut file_field: Option<(String, String, Vec<u8>)> = None;
    while let Ok(Some(field)) = form.next_field().await {
        let name = field.name().unwrap_or_default().to_string();
        let file_name = field.file_name().map(str::to_string);
        let ctype = field.content_type().unwrap_or_default().to_string();
        let Ok(data) = field.bytes().await else {
            return Ok(empty_text());
        };
        // `formData.get(name)` is a Blob only for a file part.
        let Some(file_name) = file_name else { continue };
        let entry = (file_name, ctype, data.to_vec());
        if name == "file" && file_field.is_none() {
            file_field = Some(entry);
        } else if name == "audio" && audio.is_none() {
            audio = Some(entry);
        }
    }
    let Some((file_name, ctype, bytes)) = file_field.or(audio) else {
        return Ok(empty_text());
    };
    let wav = if file_name.ends_with(".wav") || ctype == "audio/wav" {
        bytes
    } else {
        match to_wav(&bytes).await {
            Ok(w) => w,
            Err(e) => {
                tracing::error!(error = %e, "[CopilotKit Transcribe] Audio conversion failed");
                return Ok(empty_text());
            }
        }
    };
    let Ok(part) = reqwest::multipart::Part::bytes(wav)
        .file_name("audio.wav")
        .mime_str("audio/wav")
    else {
        return Ok(empty_text());
    };
    let form = reqwest::multipart::Form::new()
        .part("file", part)
        .text("response_format", "json");
    let res = crate::nlquery::ai::client(std::time::Duration::from_secs(30))
        .post(format!("{}/v1/audio/transcriptions", mastra()))
        .multipart(form)
        .send()
        .await;
    let Ok(res) = res else {
        return Ok(empty_text());
    };
    if !res.status().is_success() {
        return Ok(empty_text());
    }
    let text = res
        .json::<Value>()
        .await
        .ok()
        .and_then(|v| {
            v.get("text")
                .and_then(Value::as_str)
                .map(|t| t.trim().to_string())
        })
        .unwrap_or_default();
    Ok(response::raw(StatusCode::OK, &json!({ "text": text })))
}

/// `POST /api/copilotkit/tts`: the JSON body passed through; the audio back.
async fn tts(CurrentSession(session): CurrentSession, body: Bytes) -> Result<Response> {
    if session.is_none() {
        return Ok(not_authenticated());
    }
    let unavailable = || {
        response::raw(
            StatusCode::SERVICE_UNAVAILABLE,
            &json!({ "error": "TTS service unavailable" }),
        )
    };
    let Ok(payload) = serde_json::from_slice::<Value>(&body) else {
        return Ok(unavailable());
    };
    let Ok(res) = reqwest::Client::new()
        .post(format!("{}/v1/audio/speech", mastra()))
        .json(&payload)
        .send()
        .await
    else {
        return Ok(unavailable());
    };
    let status = res.status();
    let ctype = res
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("audio/mpeg")
        .to_string();
    let Ok(bytes) = res.bytes().await else {
        return Ok(unavailable());
    };
    if !status.is_success() {
        return Ok(response::raw(
            StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::BAD_GATEWAY),
            &json!({ "error": format!("TTS failed: {}", String::from_utf8_lossy(&bytes)) }),
        ));
    }
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, ctype)
        .body(Body::from(bytes))
        .unwrap_or_else(|_| Response::new(Body::empty())))
}

async fn threads_list(CurrentSession(session): CurrentSession) -> Result<Response> {
    if session.is_none() {
        return Ok(not_authenticated());
    }
    Ok(response::raw(StatusCode::OK, &json!({ "threads": [] })))
}

async fn threads_create(
    CurrentSession(session): CurrentSession,
    State(_ctx): State<AppContext>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(not_authenticated());
    }
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "threadId": uuid::Uuid::new_v4().to_string() }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/copilotkit")
        .add("/transcribe", post(transcribe))
        .add("/tts", post(tts))
        .add("/threads", get(threads_list).post(threads_create))
        .add("/threads/{id}", get(threads_list).post(threads_create))
}
