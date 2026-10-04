# Tests

The repository's tests live with the code they test. This directory holds the
Playwright suites for the modelling tool and the inputs they use.

| What | Where | Run |
|---|---|---|
| Unit tests (web, core, generator) | `packages/*/src/**/__tests__/` | `bun run test`, `bun run test:generator` |
| The end-to-end suite over a generated application | `packages/generator/test/e2e/` | `bun run test:e2e:generated` |
| A generated application's own suites | `<output>/backend/tests/`, `<output>/tests/` | `LOCO_ENV=test cargo test --test app`; `bun run test` |
| The modelling tool in a browser | `tests/e2e/` | `bun run test:playwright`, `bun run test:e2e:server` |

## This directory

```
tests/
├── config/playwright.config.ts   # Playwright configuration
├── docs/E2E-TEST-README.md       # Notes on the Playwright suites
├── e2e/
│   ├── generator-tests/          # The modelling tool: describe, design, generate
│   └── complete-tests/           # Historical: suites for stacks the generator no longer emits
└── test-data/
    └── hospital-erd/hospital.erd.eml.yaml   # A model the suites load
```

`playwright.config.ts` targets `http://localhost:5000` while `bun run dev` serves
on 3000; `bun run test:e2e:server` starts the server on the port the suites
expect.

The suites under `e2e/complete-tests/` exercise the NestJS and OData stacks that
were removed from the generator. They are kept as a record and are not expected
to pass.
