# The Loco (Rust) backend. Build context is this directory:
#
#   docker build -t ers-backend rust/
#
# Every file the binary embeds (routes.json, the baseline DDL, the report and
# alert templates) is under rust/, so nothing outside it is needed.

FROM rust:1.94-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migration ./migration
COPY routes.json ./
COPY parity/fixtures ./parity/fixtures
RUN cargo build --release --locked --bin ers-backend-cli

FROM debian:bookworm-slim
# ffmpeg: CopilotKit's /transcribe converts the browser's audio to WAV.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl ffmpeg \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /src/target/release/ers-backend-cli /usr/local/bin/ers-backend-cli
COPY config ./config
ENV LOCO_ENV=production \
    PORT=5150 \
    JOB_OUTPUT_PATH=/app/job-outputs
RUN mkdir -p /app/job-outputs
EXPOSE 5150
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
    CMD curl -f http://127.0.0.1:5150/api/health || exit 1
# API, queue workers and the cron scheduler in one process. Run exactly one
# such container per installation: the scheduler is what fires monitoring
# rules and scheduled reports (MIGRATION_PLAN.md §6.3).
CMD ["ers-backend-cli", "start", "--all"]
