# analytics — TanStack Start + Astryx frontend.
#
# Built from the repository root (`context: .`), because the frontend is a
# workspace member of the root `package.json`.
#
# Three things this file used to get wrong, all of which made the build fail on
# a freshly generated project:
#
#   * it copied `backend/package.json`, which does not exist — the backend is a
#     cargo crate with no package.json at all;
#   * it copied `bun.lock` unconditionally and installed with
#     `--frozen-lockfile`, but a project that has never had `bun install` run in
#     it has no lockfile yet; and
#   * it exposed a hardcoded 3000, which is the *backend* port.

FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# `bun.lock*` is a glob so the file is optional: present in a checked-in
# project, absent in a freshly generated one. `--frozen-lockfile` is therefore
# not used — it fails outright when there is no lockfile to freeze.
COPY package.json bun.lock* ./
COPY frontend/package.json ./frontend/
# The root manifest names `tests` as a workspace too, and `bun install` fails
# with `Workspace not found "tests"` when a declared workspace has no manifest.
# Only its package.json is needed: nothing here builds or runs the suites.
COPY tests/package.json ./tests/
RUN bun install

COPY frontend/ ./frontend/
WORKDIR /app/frontend

ARG VITE_API_URL
ARG VITE_APP_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_URL=${VITE_APP_URL}

RUN bun run build

# ─── runtime ───────────────────────────────────────────────────────────────
#
# `vite preview`, which is the package's own `start` script: `tanstackStart()`
# builds to `dist/client` + `dist/server` and preview serves both, SSR included,
# under whatever `base` the build was given. This stage used to install
# production dependencies and run `frontend/.output/server/index.mjs` — the
# Nitro layout of the Vinxi-era framework, which this Vite build never writes,
# so the image built and then exited on a module that did not exist. Preview
# needs Vite itself, so the builder's `node_modules` come across whole.
FROM oven/bun:1.3-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend ./frontend

WORKDIR /app/frontend

EXPOSE 3001

# `--host`: preview binds to localhost by default, which nothing outside the
# container can reach.
CMD ["bun", "run", "start", "--host", "0.0.0.0"]
