//! Command-line surface.
//!
//! Deliberately argument-compatible with the TypeScript CLI it replaces: the
//! same long flags, the same defaults, the same subcommand names. Scripts and
//! documentation that drove the old binary drive this one unchanged.

use std::path::PathBuf;

use clap::{Args, Parser, Subcommand, ValueEnum};

#[derive(Debug, Parser)]
#[command(
    name = "appwithai",
    version,
    about = "Generate full-stack applications from EML / Mermaid ERD diagrams",
    propagate_version = true
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Generate a full-stack application from a Mermaid ERD or EML file
    Generate(Box<GenerateArgs>),
    /// Print a summary of a model without generating anything
    Info(InfoArgs),
    /// List the stacks and themes this generator can emit
    List,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum Stack {
    /// TanStack Start + Astryx on a Loco.rs backend — the only stack
    #[value(name = "tanstack-astryx-loco")]
    TanstackAstryxLoco,
}

/// The database targets this stack can emit for. Both are Postgres: Neon
/// speaks the same wire protocol and uses the same driver, so only the
/// connection defaults differ. SQLite was offered here and by the TypeScript
/// CLI and never did anything — the whole backend is built against Postgres —
/// so it is gone rather than silently ignored.
#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum Database {
    /// Self-hosted or managed PostgreSQL
    Postgres,
    /// Neon serverless Postgres — same driver, TLS required, no localhost default
    Neon,
}

/// The seven themes published by Astryx. A typo has to fail here rather than
/// produce a project whose `bun install` cannot resolve a dependency.
#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum Theme {
    Neutral,
    Butter,
    Chocolate,
    Matcha,
    Stone,
    Gothic,
    Y2k,
}

impl Theme {
    pub fn as_str(self) -> &'static str {
        match self {
            Theme::Neutral => "neutral",
            Theme::Butter => "butter",
            Theme::Chocolate => "chocolate",
            Theme::Matcha => "matcha",
            Theme::Stone => "stone",
            Theme::Gothic => "gothic",
            Theme::Y2k => "y2k",
        }
    }
}

#[derive(Debug, Args)]
pub struct GenerateArgs {
    // ── Input sources ─────────────────────────────────────────────────────
    /// Input Mermaid ERD / EML file (single-file mode)
    #[arg(short, long)]
    pub input: Option<PathBuf>,
    /// System entities file (sys_ tables, multi-file mode)
    #[arg(long)]
    pub sys_file: Option<PathBuf>,
    /// Business entities file (bus_ tables, multi-file mode)
    #[arg(long)]
    pub bus_file: Option<PathBuf>,
    /// Reference entities file (REF_ tables, multi-file mode)
    #[arg(long)]
    pub ref_file: Option<PathBuf>,

    // ── Output ────────────────────────────────────────────────────────────
    /// Output directory
    #[arg(short, long)]
    pub output: PathBuf,
    /// Overwrite an existing output directory without prompting
    #[arg(long)]
    pub force: bool,
    /// Preview the files that would be generated without writing them
    #[arg(long)]
    pub dry_run: bool,

    // ── Project metadata ──────────────────────────────────────────────────
    /// Project name (default: the output directory name)
    ///
    /// No fixed default on purpose: the crate, its binary and the `cargo loco`
    /// alias are all built from this, so a default would silently rename a
    /// project on every regeneration and leave its documented commands broken.
    #[arg(short, long)]
    pub name: Option<String>,
    /// Project version
    #[arg(short = 'v', long, default_value = "1.0.0")]
    pub project_version: String,
    /// Project description
    #[arg(short, long, default_value = "Generated application")]
    pub description: String,

    // ── Stack & database ──────────────────────────────────────────────────
    #[arg(short, long, value_enum, default_value = "tanstack-astryx-loco")]
    pub stack: Stack,
    #[arg(long = "db", value_enum, default_value = "postgres")]
    pub database: Database,
    #[arg(long, value_enum, default_value = "neutral")]
    pub theme: Theme,

    // ── Ports & URLs ──────────────────────────────────────────────────────
    #[arg(long, default_value_t = 3000)]
    pub port: u16,
    /// Frontend dev-server port (default: backend port + 1)
    #[arg(long)]
    pub frontend_port: Option<u16>,
    /// Backend API URL used by the frontend (overrides the --port default)
    #[arg(long)]
    pub api_url: Option<String>,
    /// CORS allowed origin (default: http://localhost:<frontend-port>)
    #[arg(long)]
    pub cors_origin: Option<String>,

    // ── Frontend ──────────────────────────────────────────────────────────
    #[arg(long)]
    pub dark_mode: bool,

    // ── Scope ─────────────────────────────────────────────────────────────
    #[arg(long)]
    pub skip_frontend: bool,
    #[arg(long)]
    pub skip_backend: bool,
    /// Generate the backend from templates alone, without running `loco new`
    #[arg(long)]
    pub skip_cli_scaffold: bool,
    /// Skip generation of the E2E suite in tests/
    #[arg(long)]
    pub no_tests: bool,

    // ── Verbosity ─────────────────────────────────────────────────────────
    #[arg(long)]
    pub verbose: bool,
    #[arg(long)]
    pub quiet: bool,

    // ── Post-generation ───────────────────────────────────────────────────
    /// Skip the automatic install, migrate and seed after generation
    #[arg(long)]
    pub no_setup: bool,
    /// Run the generated E2E suite after setup completes
    #[arg(long)]
    pub run_tests: bool,
    /// Run the E2E suite but skip the bulk-seed volume suite
    #[arg(long)]
    pub run_tests_fast: bool,
    /// Records the bulk-seed E2E suite creates per entity
    #[arg(long, default_value_t = 1000)]
    pub records_per_entity: u32,
}

impl GenerateArgs {
    /// Every model file this run reads, in precedence order.
    pub fn model_files(&self) -> Vec<PathBuf> {
        [
            self.input.as_ref(),
            self.sys_file.as_ref(),
            self.bus_file.as_ref(),
            self.ref_file.as_ref(),
        ]
        .into_iter()
        .flatten()
        .cloned()
        .collect()
    }

    pub fn is_multi_file(&self) -> bool {
        self.sys_file.is_some() || self.bus_file.is_some() || self.ref_file.is_some()
    }

    pub fn resolved_frontend_port(&self) -> u16 {
        self.frontend_port.unwrap_or(self.port + 1)
    }

    pub fn resolved_api_url(&self) -> String {
        self.api_url
            .clone()
            .unwrap_or_else(|| format!("http://localhost:{}", self.port))
    }

    pub fn resolved_cors_origin(&self) -> String {
        self.cors_origin
            .clone()
            .unwrap_or_else(|| format!("http://localhost:{}", self.resolved_frontend_port()))
    }

    /// The project name, defaulting to the output directory's own name.
    pub fn resolved_name(&self) -> String {
        self.name.clone().unwrap_or_else(|| {
            self.output
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "app".to_string())
        })
    }
}

#[derive(Debug, Args)]
pub struct InfoArgs {
    /// Model file to summarise
    #[arg(short, long)]
    pub input: PathBuf,
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn cli_definition_is_valid() {
        Cli::command().debug_assert();
    }

    #[test]
    fn name_defaults_to_the_output_directory() {
        let cli = Cli::parse_from([
            "appwithai",
            "generate",
            "-i",
            "model.mmd",
            "-o",
            "generated-projects/drug-discovery",
        ]);
        let Command::Generate(args) = cli.command else {
            panic!("expected generate");
        };
        assert_eq!(args.resolved_name(), "drug-discovery");
        assert_eq!(args.resolved_frontend_port(), 3001);
        assert_eq!(args.resolved_cors_origin(), "http://localhost:3001");
    }

    #[test]
    fn an_unknown_theme_is_rejected() {
        assert!(Cli::try_parse_from([
            "appwithai",
            "generate",
            "-i",
            "m.mmd",
            "-o",
            "out",
            "--theme",
            "puce",
        ])
        .is_err());
    }
}
