use ers_backend::{app::App, bootstrap, migration::Migrator};
use loco_rs::cli;

// `loco_rs::Error` is the framework's error type and `cli::main` returns it;
// its size is not ours to change.
#[allow(clippy::result_large_err)]
#[tokio::main]
async fn main() -> loco_rs::Result<()> {
    // Before Loco connects: `start`, `task` and `db` all open the config
    // database while building their context, and a database a stale volume
    // never got fails every one of them at that point. Not in `Hooks::boot`,
    // which only `start` goes through — the seeder is a task.
    let command = std::env::args().nth(1).unwrap_or_default();
    if matches!(command.as_str(), "start" | "task" | "db") {
        if let Ok(uri) = std::env::var("DATABASE_URL") {
            bootstrap::ensure_database(&uri, std::time::Duration::from_secs(180)).await;
        }
    }
    cli::main::<App, Migrator>().await
}
