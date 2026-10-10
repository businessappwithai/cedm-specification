# AppWithAI

**AI-Powered Entity Relationship Design & Code Generation Platform**

Describe a business in natural language, review the model the AI proposes, and
generate a complete application from it: a Loco.rs (Rust) backend crate and a
TanStack Start + Astryx frontend, with its Application Dictionary, access
rules, workflows, reports, tests and manual.

> This is experimental software and is not fully tested. Read the generated
> code before running it anywhere that matters.

---

## ✨ Features

### AI-Assisted Design
- 🤖 **Natural Language Analysis** - Describe your domain in plain English
- 👥 **Human-in-the-Loop** - Review and approve AI suggestions
- 🎯 **Entity Extraction** - Entities and relationships proposed from the description
- 💬 **Interactive UI** - Conversational interface for design approval
- 🎨 **Visual ERD Designer** - Browser-based model editor, saved as YAML

### The Model
- 📄 **One YAML document** (`*.eml.yaml`) holds the ERD, enums, categories,
  access rules, hooks, business rules, workflows and reports
- 🧱 **CEDM** (`*.cedm.yaml`) application models built from a common entity
  library, lowered to the same document
- ✅ **Checked in three layers** - YAML parse, JSON Schema, semantic checker

### Code Generation
- 🦀 **Backend** - Loco.rs 1.2 (Axum + SeaORM/sqlx) on PostgreSQL or Neon
- ⚡ **Frontend** - TanStack Start + Astryx (seven themes)
- 📘 **API description** - `/openapi.json`, `/redoc`, `/scalar`
- 🧪 **Generated tests** - Rust request suites and bun:test suites, from the model

### Dictionary-Driven Architecture
- 📚 **Application Dictionary** - Compiere-inspired `sys_*` metadata
- 🔐 **Authorization** - window/table grants, per-operation and per-transition role rules
- 🧾 **Audit trail** - hash-chained `audit_log`
- 📊 **Runtime UI Configuration** - reorder and hide fields without a redeploy

---

## 🚀 Quick Start

### Prerequisites

```bash
# Bun.js (required runtime)
curl -fsSL https://bun.sh/install | bash
bun --version  # >= 1.4.0

# Rust toolchain (the generated backend is a cargo crate)
rustup default stable
```

### Developer Tools (gstack)

```bash
bun run setup:gstack
```

See [CLAUDE.md](CLAUDE.md) for the skills it provides.

### Installation

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL and LOCAL_AI_BASE_URL / LOCAL_AI_MODEL

# 3. Run migrations and promote an administrator
bun run seed:admin -- --email you@example.com

# 4. Start the development server
bun run dev
```

### Access the Application

- **Web App**: http://localhost:3000
- **Visual Designer**: http://localhost:3000/designer
- **Dashboard**: http://localhost:3000/dashboard

---

## 💡 Usage Examples

### Example 1: A model

```yaml
eml: "1.0"
name: Shop
entities:
  - name: Customer
    help: Someone who places orders.
    attributes:
      - { name: id, type: string, pk: true }
      - { name: name, type: string, help: Full name as it appears on invoices. }
      - { name: email, type: email, unique: true, help: Where order confirmations go. }
  - name: Order
    help: One purchase by one customer.
    attributes:
      - { name: id, type: string, pk: true }
      - { name: customer_id, type: string, fk: true, help: Who placed the order. }
      - { name: order_date, type: datetime, help: When the order was placed. }
      - { name: total_amount, type: decimal, help: Order total including tax. }
relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
```

The full reference is `language/yaml/README.md`.

### Example 2: CLI Converter

```bash
# A new model from a description
appwithai-convert "E-commerce with products, categories, orders" -n Shop -o shop.eml.yaml

# A change to an existing model
appwithai-convert "Add a Category entity" -m shop.eml.yaml -o shop.eml.yaml

# Analysis only
appwithai-convert "CRM system" --analyze-only --json > analysis.json
```

### Example 3: Generate an Application

```bash
bun run generate:tanstack -- -i shop.eml.yaml -o ./generated/shop -n shop
createdb shop_development
cd generated/shop/backend
cargo loco db migrate && cargo loco db seed
cargo loco start --server-and-worker          # :3000
cd ../frontend && bun install && bun run dev  # :3001
```

Sign in as `admin@admin.com` / `admin`.

---

## 📦 Package Structure

```
appwithai/
├── packages/
│   ├── core/        # Types, hooks, services, auth, rules, workflow, config
│   ├── generator/   # Model reading, generation pipeline, Handlebars templates
│   ├── ai/          # Mastra.ai agents, workflows, converter, CLI
│   ├── yamltecture/ # Deterministic YAML projection and model context
│   └── web/         # TanStack Start modelling tool
├── crates/
│   └── appwithai-gen/   # The Rust generator (backend), held to parity
├── language/        # The model language: definition, YAML schema, CEDM, CLI
├── docs/            # Documentation
├── examples/        # Example models
└── tests/           # Playwright suites
```

---

## 🏗️ Architecture

### AI-Assisted Workflow

```
Natural Language Input
    ↓
Domain Agent (Extract entities & relationships)
    ↓
Entity Agent (Refine structure & types)
    ↓
Human Approval (Review each entity)
    ↓
Relationship Agent (Determine cardinality)
    ↓
Human Approval (Review relationships)
    ↓
Model writer (the YAML model document, checked)
    ↓
Generation pipeline (generateApplication)
    ↓
Generated Application (Loco.rs backend + TanStack Start/Astryx frontend)
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Runtime** | Bun.js 1.4.0+, Rust stable |
| **AI Framework** | Mastra.ai, CopilotKit |
| **AI Model** | Any local OpenAI-compatible endpoint (`packages/ai/src/config.ts`) |
| **Modelling tool** | TanStack Start, Vite 8, React 19, Tailwind CSS v4 |
| **Generated backend** | Loco.rs 1.2 (Axum, SeaORM/sqlx), utoipa |
| **Generated frontend** | TanStack Start + Astryx |
| **Database** | PostgreSQL (Kysely in the tool; sqlx in generated apps) |
| **Rules** | GoRules JDM / zen-engine |
| **Templates** | Handlebars 4.7+ |
| **Testing** | Vitest, Playwright, cargo test, bun:test |

---

## 🛠️ Development

### Commands

```bash
bun run dev                 # Web app (http://localhost:3000)
bun run dev:mastra          # Mastra AI server (http://localhost:4111)
bun run build               # Build all packages
bun run type-check          # TypeScript checking
bun run type-check:language # language/** type-check
bun run test                # Unit tests
bun run test:generator      # Generator unit tests
bun run parity              # TypeScript = Rust = WebAssembly generators
bun run test:e2e:generated  # Generate, compile, run, test over HTTP
bun run generate:tanstack   # Generate an application
bun run convert             # Natural language → model document
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](CLAUDE.md)** | The working guide to the repository |
| **[language/yaml/README.md](language/yaml/README.md)** | The model language reference |
| **[language/cedm/README.md](language/cedm/README.md)** | CEDM application models |
| **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** | Build system and commands |
| **[docs/TESTING.md](docs/TESTING.md)** | Test generation and execution |
| **[docs/ROADMAP.md](docs/ROADMAP.md)** | Plans and history |
| **`docs/qa/`** | QA passes, newest first |

---

## 🧪 Testing

Every generated application ships two suites generated from its model:

- Rust request suites (`cargo test --test app`) — the primary gate
- bun:test suites over HTTP, including a 100k-record browser volume suite

```bash
cd generated/shop/backend && LOCO_ENV=test cargo test --test app
cd generated/shop/tests && bun run test
```

---

## 🚢 Deployment

Generated applications ship a `docker-compose.yml` and both Dockerfiles;
`docker compose up` runs PostgreSQL, the backend and the frontend.

### Environment Variables (modelling tool)

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `LOCAL_AI_BASE_URL`, `LOCAL_AI_MODEL` - the OpenAI-compatible model endpoint

**Optional:**
- `MASTRA_DATABASE_URL` - Mastra state database
- `VITE_APP_URL` - Application URL (default: http://localhost:3000)
- `CORS_ORIGIN` - CORS allowed origins

See `.env.example` for the complete list.

---

## 🔒 Security

- **API Keys**: Store in environment variables, never commit
- **Authorization**: generated APIs pass three gates — `sys_access`, the model's
  `rbac` operation rules, and workflow transitions
- **SQL**: parameterised queries; stored report SQL is refused unless it is a
  single `SELECT`/`WITH`, three times over
- **XSS**: React's escaping
- **CORS**: Configurable via environment variable

---

## 🤝 Contributing

1. Create a feature branch from `main`
2. Commit your changes with descriptive messages
3. Run `bun run type-check`, `bun run test` and `bun run parity`
4. Open a Pull Request against `main`

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI model
- **Mastra.ai** - Agent orchestration framework
- **CopilotKit** - Conversational UI components
- **Compiere/iDempiere** - Dictionary architecture inspiration
- **Shadcn** - Beautiful UI components
- **TanStack** - Modern web framework

---

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Development**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

**Version**: 5.1.0
**Status**: Production Ready ✅
**Last Updated**: February 2026
**Runtime**: Bun.js 1.4+
**Node**: v20+ compatible
