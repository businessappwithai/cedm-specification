# quality

Generated application

## Tech Stack

- **Backend**: Loco.rs (Rust) + Axum + SeaORM/sqlx + PostgreSQL
- **Frontend**: TanStack Start + Astryx design system + TanStack Query/Table/Form

### This project is bilingual, on purpose

`cargo` owns the backend; `bun` owns the frontend. The backend has no
`package.json` — Loco's CLI is itself a clap application, so `cargo loco`
provides start/migrate/seed/test/task subcommands directly. That is a
deliberate simplification, not an oversight.

## Prerequisites

- **Rust** (stable) with `cargo`
- **Bun.js 1.1.0+**
- PostgreSQL 14+

## Getting Started

```bash
# Frontend dependencies
bun install

# Configure the backend
cp backend/.env.example backend/.env

# Create the schema (migrations live in backend/migration/)
bun run db:migrate
bun run db:seed
```

## Development

```bash
bun run dev              # backend + frontend together

# or separately
bun run dev:backend      # cargo loco start --server-and-worker (:3000)
bun run dev:frontend     # :3001
```

The HTTP tier and the job worker can also run as separate processes:

```bash
cd backend
cargo loco start --server-and-worker   # both
cargo loco start --worker              # workers only
```

> The first `cargo build` compiles the whole dependency tree and takes
> minutes. Subsequent builds are incremental.

## Project Structure

```
quality/
├── backend/           # Loco.rs API
│   ├── src/
│   │   ├── app.rs         # Hooks impl — routes, workers, tasks
│   │   ├── controllers/   # bus (generic CRUD), sys, rules, ...
│   │   ├── services/      # dictionary cache, dynamic_repo, row_json
│   │   └── models/
│   ├── migration/     # SeaORM migration crate
│   └── config/        # development/test/production YAML
├── frontend/          # TanStack Start + Astryx
├── tests/             # bun:test E2E suites (HTTP-level)
└── package.json
```

## Runtime UI Configuration

The UI layout is driven by the `sys_*` Application Dictionary and can be
changed at runtime through /admin — no redeploy:

- `seq_no`: field order in detail forms
- `seq_no_grid`: field order in list/table views

## License

MIT
