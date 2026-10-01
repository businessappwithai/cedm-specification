# Baseline before the CEDM language migration

Branch `claude/cedm-spec-language-migration-ejg2yj` at `83a28ee` plus the plan
(`docs/plans/cedm-language-migration.md`). Every phase of the migration is
compared against these numbers.

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run type-check:language` | clean |
| `bun run test:generator` | 805 / 805 (37 files) |
| `bun run test` (web) | 1214 passed, 12 skipped (1226) |
| `bun run parity` | 6 models, byte-identical across TypeScript, Rust and WebAssembly |
| `cargo clippy -p appwithai-gen --all-targets -- -D warnings` | clean (cargo 1.97.0) |
| `cargo test -p appwithai-gen` | 148 / 148 |
| `python3 tools/validate.py` | 0 errors, 15 warnings |

Environment notes: the container needed `rustup target add wasm32-wasip1`
before `bun run parity` could build its WebAssembly leg (it failed with
`can't find crate for std`, an installation gap rather than a code fault), and
Postgres 16 had to be started (`pg_ctlcluster 16 main start`).

One finding that shapes the design: the order of `relationships` is visible in
the generated application. Reversing drug-discovery's relationship list changes
five generated files (`m0002_bus_tables.rs`, `tests/harness/entities.ts`,
`manual.html`, `.appwithai.json` and the shipped model), so a CEDM model, which
declares relationships on their entities, fixes the order as entity order and
the equivalence gates compare against that order.
