//! Phase 1 of backend generation: `loco new`.
//!
//! The scaffold is not decoration. It is where the framework's own current
//! defaults come from — the CI workflow, `.rustfmt.toml`, `AGENTS.md`, the
//! `.gitignore` — none of which this repository should be keeping a copy of and
//! re-syncing by hand every time Loco changes them. The templates then overlay
//! the parts that carry real logic.
//!
//! Everything the starter contributes that this architecture replaces is pruned
//! immediately afterwards, so the overlay never lands next to a stale file that
//! would compile alongside it.

use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{anyhow, bail, Context, Result};

/// Paths `loco new` writes that this architecture replaces outright.
///
/// Files the templates overwrite by name a moment later are deliberately absent
/// from this list — deleting them first would be busywork. What is here is what
/// the overlay does *not* write, and which would otherwise be compiled into the
/// generated app: the starter's own users migration (superseded by
/// `m0000_auth_users`, which carries the `sys_user_id` bridge column), its
/// mailers and Tera templates (this backend sends no mail), and its request and
/// model tests, which exercise the starter's `users` model and refer to the
/// crate by the name `loco new` chose before `Cargo.toml.hbs` renames it.
const PRUNE: &[&str] = &[
    "migration/src/m20220101_000001_users.rs",
    "src/mailers",
    "src/dtos",
    "src/fixtures",
    "src/data",
    "examples",
    "tests",
];

pub fn is_available(command: &str) -> bool {
    // A WASI guest cannot start a process at all, so nothing on the host PATH
    // is available to it — and `which` would not say so: it splits `PATH` with
    // `env::split_paths`, which panics on WASI rather than returning an error.
    // The CLI-WASM host (`scripts/appwithai-wasm.mjs`) runs `cargo fmt` itself.
    if cfg!(target_os = "wasi") {
        let _ = command;
        return false;
    }
    which::which(command).is_ok()
}

/// The Loco CLI the scaffold runs: the release line `Cargo.toml.hbs` pins for
/// `loco-rs` (`1.2`). The two move together, and the TypeScript generator's
/// `LOCO_CLI_*` constants say the same.
const LOCO_CLI_MINOR: u64 = 2;
const LOCO_CLI_REQUIREMENT: &str = "^1.2";

/// Run `loco new`, installing the CLI first if it is not on PATH or is an
/// older release line — the scaffold is where the framework's own defaults
/// come from, and they have to be the release the templates pin.
pub fn scaffold(output_dir: &Path, quiet: bool) -> Result<()> {
    if !has_current_loco_cli() {
        install_loco_cli(quiet)?;
    }

    let name = output_dir
        .file_name()
        .ok_or_else(|| anyhow!("output directory {} has no name", output_dir.display()))?
        .to_string_lossy()
        .to_string();

    // `loco new` refuses to write into a path that already exists, so it cannot
    // be pointed at the output directory on a regeneration — and regenerating
    // over an existing project is the normal case, not the exotic one. It runs
    // in a scratch directory instead and its output is copied across, which
    // makes this phase idempotent: every run picks up whatever the framework
    // currently considers a default, first time and every time after.
    let staging = tempdir()?;

    if !quiet {
        println!("  🔧 loco new -n {name} --db postgres --bg async --assets none");
    }

    // All three of --db, --bg and --assets are required together: with any one
    // missing `loco new` prompts for a starter template and blocks forever in a
    // non-interactive run.
    let status = Command::new("loco")
        .args([
            "new",
            "-n",
            &name,
            "--db",
            "postgres",
            "--bg",
            "async",
            "--assets",
            "none",
            "--allow-in-git-repo",
        ])
        .current_dir(staging.path())
        .status()
        .context("running `loco new`")?;

    if !status.success() {
        bail!(
            "`loco new` exited with {status}.\n  \
             The scaffold is where the framework's own current defaults come from — its CI\n  \
             workflow, .rustfmt.toml, AGENTS.md, .gitignore — so a backend built without it\n  \
             is missing files this repository deliberately does not keep copies of.\n  \
             Pass --skip-cli-scaffold to generate from templates alone (offline builds)."
        );
    }

    std::fs::create_dir_all(output_dir)
        .with_context(|| format!("creating {}", output_dir.display()))?;
    copy_dir(&staging.path().join(&name), output_dir)?;

    prune(output_dir, quiet)
}

/// Recursively copy `from` over `to`, overwriting files that collide.
///
/// Overwriting is correct here: the template overlay runs immediately after and
/// rewrites every file it owns, so the scaffold's copy of those is transient.
fn copy_dir(from: &Path, to: &Path) -> Result<()> {
    for entry in std::fs::read_dir(from).with_context(|| format!("reading {}", from.display()))? {
        let entry = entry?;
        let target = to.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            std::fs::create_dir_all(&target)
                .with_context(|| format!("creating {}", target.display()))?;
            copy_dir(&entry.path(), &target)?;
        } else {
            std::fs::copy(entry.path(), &target)
                .with_context(|| format!("copying to {}", target.display()))?;
        }
    }
    Ok(())
}

/// A scratch directory that removes itself when dropped.
fn tempdir() -> Result<TempDir> {
    TempDir::new()
}

/// Minimal owned temporary directory — `tempfile` is a dev-dependency only, and
/// this needs no more than create-on-new, remove-on-drop.
pub struct TempDir(PathBuf);

impl TempDir {
    fn new() -> Result<Self> {
        let unique = format!(
            "appwithai-loco-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0)
        );
        let path = std::env::temp_dir().join(unique);
        std::fs::create_dir_all(&path)
            .with_context(|| format!("creating scratch directory {}", path.display()))?;
        Ok(Self(path))
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        // Best effort: a scratch directory left behind is untidy, not broken.
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

/// Whether the `loco` on PATH is the release line the templates pin.
///
/// `loco --version` prints `loco <semver>`; anything else — an older line, a
/// 2.x, or output naming no version — counts as not current.
fn has_current_loco_cli() -> bool {
    if !is_available("loco") {
        return false;
    }
    let Ok(output) = Command::new("loco").arg("--version").output() else {
        return false;
    };
    let reported = String::from_utf8_lossy(&output.stdout);
    let Some(version) = reported.split_whitespace().find(|word| word.contains('.')) else {
        return false;
    };
    let mut parts = version.split('.').map(|part| part.parse::<u64>().ok());
    matches!(
        (parts.next(), parts.next()),
        (Some(Some(1)), Some(Some(minor))) if minor >= LOCO_CLI_MINOR
    )
}

/// Install the Loco CLI on demand, at the release line the templates pin,
/// replacing an older `loco` already on PATH.
///
/// It is a compile, so it is announced rather than done silently, and a failure
/// names the command to run by hand.
fn install_loco_cli(quiet: bool) -> Result<()> {
    if !is_available("cargo") {
        bail!(
            "Neither `loco` nor `cargo` is on PATH. Install a Rust toolchain \
             (https://rustup.rs) — the generated backend is a cargo crate and needs one anyway."
        );
    }

    let install = format!("cargo install loco --version {LOCO_CLI_REQUIREMENT} --locked");
    if !quiet {
        println!(
            "  📥 Loco CLI {LOCO_CLI_REQUIREMENT} not found — installing it with `{install}`…"
        );
    }
    let status = Command::new("cargo")
        .args([
            "install",
            "loco",
            "--version",
            LOCO_CLI_REQUIREMENT,
            "--locked",
        ])
        .status()
        .with_context(|| format!("running `{install}`"))?;

    if !status.success() {
        bail!(
            "`{install}` exited with {status}.\n  \
             Install it by hand, or pass --skip-cli-scaffold to generate from templates alone."
        );
    }
    Ok(())
}

/// Remove what the starter writes that this architecture replaces.
pub fn prune(output_dir: &Path, quiet: bool) -> Result<()> {
    let mut removed = 0;
    for entry in PRUNE {
        let path = output_dir.join(entry);
        if !path.exists() {
            continue;
        }
        if path.is_dir() {
            std::fs::remove_dir_all(&path)
                .with_context(|| format!("removing {}", path.display()))?;
        } else {
            std::fs::remove_file(&path).with_context(|| format!("removing {}", path.display()))?;
        }
        removed += 1;
    }
    if !quiet {
        println!("  ✓ Pruned {removed} scaffold paths this architecture replaces");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prune_removes_only_what_is_listed() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();

        std::fs::create_dir_all(root.join("src/mailers")).unwrap();
        std::fs::create_dir_all(root.join("src/controllers")).unwrap();
        std::fs::create_dir_all(root.join("migration/src")).unwrap();
        std::fs::write(root.join("migration/src/m20220101_000001_users.rs"), "").unwrap();
        std::fs::write(root.join("src/controllers/bus.rs"), "keep me").unwrap();

        prune(root, true).unwrap();

        assert!(!root.join("src/mailers").exists());
        assert!(!root
            .join("migration/src/m20220101_000001_users.rs")
            .exists());
        // Anything the overlay owns must survive the prune untouched.
        assert!(root.join("src/controllers/bus.rs").exists());
    }

    #[test]
    fn prune_is_idempotent_on_a_bare_directory() {
        let dir = tempfile::tempdir().unwrap();
        prune(dir.path(), true).unwrap();
        prune(dir.path(), true).unwrap();
    }
}
