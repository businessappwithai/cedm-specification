use loco_rs::cli;
use migration::Migrator;
use mining::app::App;

#[tokio::main]
async fn main() -> loco_rs::Result<()> {
    cli::main::<App, Migrator>().await
}
