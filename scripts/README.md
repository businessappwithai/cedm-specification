# Scripts

Every script runs from the repository root with Bun (`bun scripts/…`) or bash.
The ones wired into `package.json` are named by their `bun run` script.

## Gates

| Script | `bun run` | What it holds |
|---|---|---|
| `parity-check.sh` | `parity` | The TypeScript generator, the Rust generator and its `wasm32-wasip1` build write the same backend, byte for byte, over every model in `PARITY_MODELS`; then `cedm-lowering-parity.ts` |
| `cedm-lowering-parity.ts` | — | The TypeScript and Rust CEDM lowerings produce the same model document, native and WebAssembly |
| `check-language-bundle.ts` | `check:language-bundle` | The browser bundle of the model language agrees with the CLI over every YAML model, in headless Chromium |
| `check-yaml-only.sh` | — | No file in the repository, or under a directory you name, reads, writes or documents the earlier diagram notation. Runs in `validate.yml`, and over a generated tree in the generator's tests |
| `test-generated-apps.sh` | — | Generates an application from every YAML model and runs its lint and request suites |

## Building

| Script | What it writes |
|---|---|
| `build-language-tools.ts` | The standalone browser bundle of the model language |
| `build-domain-applications.ts` | `applications/*.cedm.yaml`, one per domain in `domains/application-catalog.yaml` (`--check` holds them in sync) |
| `generate-domain-applications.sh` | `generated-applications/<domain>/` from each application model — source only, never `target/` or `node_modules/` |
| `appwithai-wasm.mjs` | Runs the Rust generator built for `wasm32-wasip1` on Node's WASI (`bun run wasm`) |

## Running generated applications

| Script | What it does |
|---|---|
| `serve-application.sh` | Runs one generated application from a scratch copy and leaves it running |
| `run-and-screenshot.sh`, `screenshot-application.mjs` | Runs each domain application and captures its screens |
| `qa/qa-loop.sh` | Serial QA: regenerate, build, start, smoke-test every screen, run `cargo test`, record a summary |
| `qa/smoke-application.mjs` | Browser smoke test of one running application |
| `qa/rules-matrix.ts`, `qa/workflow-matrix.ts`, `qa/workflow-ui.ts`, `qa/saga-view-check.ts` | Business-rule and workflow QA against a running application |

## Setup and administration

| Script | What it does |
|---|---|
| `setup/setup.sh` | Checks prerequisites and builds every package |
| `setup-gstack.sh` | Installs the gstack skills (`bun run setup:gstack`) |
| `seed-admin.ts`, `seed-admin-account.ts` | Runs the modelling tool's migrations and promotes a user to administrator (`bun run seed:admin`) |
| `tests/run-e2e-with-server.sh` | Starts the dev server, runs the Playwright suite, stops it (`bun run test:e2e:server`) |
| `validate-e2e-fixes.sh`, `validate-e2e-fixes-simple.sh` | Structural checks of a generated backend |
| `create-github-issues.sh` | Bulk-creates GitHub issues from the business-rules tickets |
