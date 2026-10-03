# ==========================================
# Enterprise Reporting System
# Production Dockerfile - Bun + TanStack Start + PostgreSQL
# ==========================================

# Build stage - Pure Bun
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and source
COPY package.json bun.lock ./
COPY . .

# Install dependencies with Bun (frozen lockfile)
RUN bun install --frozen-lockfile && bun pm cache rm

# Build application with TanStack Start
RUN bun run build

# Production stage - Runtime only
FROM oven/bun:1.3-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    postgresql-client \
    redis-tools \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -g 1001 bunuser && \
    useradd -r -u 1001 -g bunuser bunuser

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Copy built application (Vite output structure)
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/public ./public
COPY --from=builder --chown=bunuser:bunuser /app/node_modules ./node_modules

# Copy database scripts (needed for runtime initialization)
COPY --chown=bunuser:bunuser scripts ./scripts
COPY --chown=bunuser:bunuser src/lib/db ./src/lib/db
COPY --chown=bunuser:bunuser src/lib/security ./src/lib/security
# Enough of src/ for `scripts/seed-reporting-pack.ts` to run in this image.
#
# `src/lib/db` and `src/lib/security` are what *serving* needs, and they are one
# directory short of registering a data source: the seeder introspects the
# attached database's schema and caches it, which is `src/lib/mastra` over
# `src/lib/sql`, and it types its result from `src/types`. Without these the
# image starts and answers perfectly, and the one script that populates it
# fails on an import — which reads as a broken seeder rather than a pruned
# image. `tsconfig.json` travels for the same reason: `@/` resolves through it.
COPY --chown=bunuser:bunuser src/lib/sql ./src/lib/sql
COPY --chown=bunuser:bunuser src/lib/mastra ./src/lib/mastra
COPY --chown=bunuser:bunuser src/types ./src/types
COPY --chown=bunuser:bunuser tsconfig.json ./tsconfig.json

# Copy server wrapper for static file serving
COPY --chown=bunuser:bunuser server-static-wrapper.mjs ./server-static-wrapper.mjs

# Create required directories with correct permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R bunuser:bunuser /app/data /app/logs && \
    chmod -R 755 /app/dist/client && \
    chmod -R 755 /app/public

# Expose application port
EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_DIR=/app/dist/client

# Switch to non-root user
USER bunuser

# `127.0.0.1`, never `localhost`.
#
# Inside the container `localhost` resolves to `::1` as well, curl tries the
# IPv6 address first, and the server listens on IPv4 only — so this probe
# reports a connection refused against a server answering 200 to everyone else.
# The container then never goes healthy, and anything waiting on it (a compose
# `depends_on: service_healthy`, a one-shot seeder) never starts.
HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=10 \
    CMD curl -f http://127.0.0.1:3000/api/health || exit 1

CMD ["bun", "server-static-wrapper.mjs"]
