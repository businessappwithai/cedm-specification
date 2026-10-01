# inventory — Loco.rs backend
#
# Multi-stage: a full Rust toolchain to compile, a slim Debian to run. The
# runtime image carries the binary and `config/`, nothing else.
#
# `seed/*.sql` is deliberately absent from the runtime stage: `src/tasks/
# seed_dictionary.rs` and `seed_workflows.rs` pull it in with `include_str!`, so
# it is compiled into the binary and a copy on disk would only go stale.
#
# `config/` *is* copied, because Loco reads it at run time relative to the
# working directory — a binary without it exits before it opens a socket.

# ─── builder ────────────────────────────────────────────────────────────────
FROM rust:1-slim-bookworm AS builder

# libssl + pkg-config for the TLS stack, and the Postgres client headers sqlx
# links against.
RUN apt-get update \
 && apt-get install -y --no-install-recommends pkg-config libssl-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Dependencies first, in their own layer: they change far less often than the
# generated sources, and this is the difference between a 20-second rebuild and
# a five-minute one.
COPY Cargo.toml Cargo.lock ./
COPY migration/Cargo.toml ./migration/
RUN mkdir -p src/bin migration/src \
 && echo 'fn main() {}' > src/bin/main.rs \
 && echo '' > src/lib.rs \
 && echo '' > migration/src/lib.rs \
 && cargo build --release --bin inventory-cli 2>/dev/null || true \
 && rm -rf src migration/src

COPY . .
# `include_str!` on the seed files means touching them must invalidate the
# build; copying the whole tree after the dependency layer is what guarantees it.
#
# The `touch` is not optional. COPY keeps each file's mtime from the build
# context, which is older than the stub build above, so cargo judged the
# crate fresh and shipped the stub: a `inventory-cli` that was
# `fn main() {}`, exiting 0 and printing nothing for `db migrate`, `db seed`
# and `start` alike. Under compose that is a container restarting every few
# milliseconds with an empty log.
RUN find src migration/src -name '*.rs' -exec touch {} + \
 && cargo build --release --bin inventory-cli

# ─── runtime ────────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates libssl3 curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=builder /build/target/release/inventory-cli /usr/local/bin/inventory-cli
COPY --from=builder /build/config ./config

USER app

# Loco selects `config/<LOCO_ENV>.yaml`. It is not NODE_ENV, and defaulting it
# wrong is how a container ends up serving development settings in production.
ENV LOCO_ENV=production

EXPOSE 3000

# The health route is `/api/me/health`. `/api/health` does not exist, so a
# healthcheck pointed there never turns healthy and anything gated on
# `service_healthy` waits forever.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/me/health || exit 1

ENTRYPOINT ["inventory-cli"]
CMD ["start", "--server-and-worker"]
