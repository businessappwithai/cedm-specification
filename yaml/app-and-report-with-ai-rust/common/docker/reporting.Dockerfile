# The reporting platform's front end, built to live under /report.
#
# Its own Dockerfile is checked in next door and is left exactly as it is: this
# one builds the same source with one difference that only matters when the app
# shares an origin with another — `common/build/subpath-overlay.ts` is run over
# the source before the build, setting the bundler's `base`, the router's
# `basepath` and the static wrapper's file lookup to /report. See that file for
# why all three are needed and why the proxy in front does not strip the prefix.
#
# This image serves pages. The platform's API, workers, scheduler and seeder are
# the Rust backend (`enterprise_reporting_rust/rust`, the `report-backend` and
# `seeder` services), which this server forwards to through ERS_RUST_API_URL.
# It used to carry the whole of `src/` into the runtime stage so a Bun seeder
# could import through `@/`; the seeder is a Rust task now, so it does not.
#
# The overlay writes into the build container's copy. Nothing under
# enterprise_reporting_rust/ is modified.

# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3 AS builder

WORKDIR /app

COPY . .
# Frozen: the lockfile at the pinned enterprise_reporting_rust commit agrees
# with its manifest. (The TanStack repository's did not — it still carried
# `falkordb` — and this line was a plain `bun install` for that reason.)
RUN bun install --frozen-lockfile && bun pm cache rm

# The overlay, from the `common` build context declared in docker-compose.yml.
COPY --from=common build/subpath-overlay.ts /overlay/subpath-overlay.ts
ARG BASE_PATH=/report
RUN bun /overlay/subpath-overlay.ts --dir /app --base "${BASE_PATH}"

RUN bun run build

# ─── runtime ────────────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# The patched wrapper, not the original: it is the copy that knows the prefix.
COPY --from=builder /app/server-static-wrapper.mjs ./server-static-wrapper.mjs

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_DIR=/app/dist/client

# The probe is bun rather than curl, and that is the reason there is no
# apt-get in this file at all. `oven/bun:1.3-slim` ships no curl, no
# ca-certificates and no psql, and the three lines that used to install them
# bought one healthcheck: nothing here shells out to psql — the `pg_isready`
# probes in docker-compose.yml run inside the postgres images, which have it —
# and bun carries its own root certificates, so the system store is unused.
# An apt layer is also the first thing to fail on a network that does not allow
# deb.debian.org, which is a poor way to lose a build that needs no packages.
#
# 127.0.0.1, never localhost: inside the container localhost also resolves to
# ::1, and the server listens on IPv4 only — the probe then reports "connection
# refused" against a server answering 200 to everyone else.
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
    CMD ["bun", "-e", "const r = await fetch('http://127.0.0.1:3000/api/health').catch(() => null); process.exit(r?.ok ? 0 : 1)"]

CMD ["bun", "server-static-wrapper.mjs"]
