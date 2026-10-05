#!/usr/bin/env bash
#
# Generate an application from a model (*.eml.yaml) and bring it up alongside
# the reporting platform, on one origin. Both server sides are Rust: the
# application is a Loco backend written by this repository's generator, and the
# platform's API, workers and seeder are its Loco backend in
# ../enterprise-reporting-rust, checked out beside this repository.
#
#   ./start.sh                                   the reference CRM model
#   ./start.sh common/examples/my-app.eml.yaml   any other model
#   ./start.sh my-app.eml.yaml --profile prod    two database servers
#   ./start.sh --port 8080                       somewhere other than :80
#
# When it finishes:
#
#   http://localhost/app      the generated application
#   http://localhost/report   the reporting platform, already holding that
#                             application's schema as a data source and its
#                             reports, charts and dashboard
#
# Everything this script writes goes under common/.runtime/, which is not
# checked in. Neither the generator nor the platform is touched.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

readonly COMMON="common"
readonly RUNTIME="${COMMON}/.runtime"
readonly APP_DIR="${RUNTIME}/app"
readonly PACK_DIR="${RUNTIME}/pack"
readonly LANDING_DIR="${RUNTIME}/landing"
readonly ENV_FILE="${RUNTIME}/.env"
readonly DEFAULT_MODEL="${COMMON}/examples/crm.eml.yaml"
# The generator, the language and both CLIs are app-with-ai-rust, and the
# reporting platform is enterprise-reporting-rust: both checked out beside
# this repository.
readonly REPO_ROOT="../app-with-ai-rust"
readonly PLATFORM="../enterprise-reporting-rust"

MODEL=""
PROFILE="demo"
PORT="80"
REBUILD=""
KEEP_APP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:-}"; shift 2 ;;
    --port)    PORT="${2:-}"; shift 2 ;;
    --rebuild) REBUILD="--no-cache"; shift ;;
    --keep-app) KEEP_APP="1"; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *)  MODEL="$1"; shift ;;
  esac
done

MODEL="${MODEL:-$DEFAULT_MODEL}"

case "$PROFILE" in
  demo|prod) ;;
  *) echo "Unknown profile \"$PROFILE\". Use demo or prod." >&2; exit 2 ;;
esac

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

command -v bun >/dev/null 2>&1 || die "bun is not installed. The model is checked, generated and turned into a reporting pack on this machine, before anything is built."
# No cargo check: both Rust binaries are compiled inside their images, and the
# generator is run with its `loco new` scaffold step skipped, so this machine
# needs no Rust toolchain.
command -v docker >/dev/null 2>&1 || die "docker is not installed."
docker compose version >/dev/null 2>&1 || die "docker compose (v2) is not available."
[[ -f "$MODEL" ]] || die "Model not found: $MODEL"

case "$MODEL" in
  *.eml.yaml|*.cedm.yaml) ;;
  *) die "$MODEL is not a model. A model is a YAML document (*.eml.yaml or *.cedm.yaml)." ;;
esac

# Generation drives the pipeline in app-with-ai-rust, which resolves its
# dependencies from that checkout's node_modules; compose builds the platform
# from its directory beside this one.
[[ -d "${REPO_ROOT}/node_modules" ]] || die "${REPO_ROOT} has no node_modules. Run ./deps.sh --install — generation drives its pipeline, which fails on 'Cannot find package' without it."
[[ -d "$PLATFORM/rust" ]] || die "The reporting platform is not at ${PLATFORM}."
[[ -d "${COMMON}/node_modules" ]] || die "common/ has no node_modules. Run \`cd common && bun install\`."

APP_NAME="$(basename "$MODEL" | sed -E 's/\.(eml|cedm)\.yaml$//')"
# A Postgres database name, from a model file name.
APP_DB_NAME="$(printf '%s' "$APP_NAME" | tr '[:upper:]-' '[:lower:]_' | tr -cd 'a-z0-9_')"
[[ -n "$APP_DB_NAME" ]] || APP_DB_NAME="appdb"

# Resolved here rather than beside the closing message, because the front door
# is generated in step 5 and has to print the same origin the reader will use.
ORIGIN="http://localhost"
[[ "$PORT" == "80" ]] || ORIGIN="http://localhost:${PORT}"

say "1/7  Checking the model"
# The language's one reader: YAML syntax, the JSON Schema, the full checker,
# every finding at its YAML line.
if ! bun "${REPO_ROOT}/language/cli/eml.ts" validate -i "$MODEL"; then
  die "The model has errors. Nothing downstream can be trusted until they are fixed."
fi

say "2/7  Generating the application"
mkdir -p "$RUNTIME"
if [[ -n "$KEEP_APP" && -d "$APP_DIR" ]]; then
  echo "  --keep-app: reusing the application already in ${APP_DIR}"
else
  rm -rf "$APP_DIR"
  (cd "$COMMON" && bun build/generate-app.ts \
      -i "../${MODEL}" -o "../${APP_DIR}" -n "$APP_NAME" --force)
fi

# The Loco backend's CLI binary, which is the image's entrypoint and what
# docker-compose.yml runs migrate, seed and start through. Read from the crate
# rather than derived from the name here: the generator decides how a project
# name becomes a crate name, and a second derivation is one that can disagree.
APP_CLI="$(awk '/^\[\[bin\]\]/{bin=1; next} bin && /^name *= */{gsub(/"/, "", $3); print $3; exit}' "${APP_DIR}/backend/Cargo.toml")"
[[ -n "$APP_CLI" ]] || die "Could not read the backend's binary name from ${APP_DIR}/backend/Cargo.toml."

say "3/7  Putting the application on /app"
(cd "$COMMON" && bun build/subpath-overlay.ts --dir "../${APP_DIR}/frontend" --base /app)

say "4/7  Deriving the reporting pack"
mkdir -p "$PACK_DIR"
# --app-name is the same value the generate above was given. The reporting
# accounts and the application's are derived from it, so passing a different one
# here puts addresses on the front door that belong to no account.
(cd "$COMMON" && bun build/reporting-pack.ts \
    -i "../${MODEL}" -o "../${PACK_DIR}/reporting-pack.json" \
    --database "$APP_DB_NAME" --app-name "$APP_NAME")

say "5/7  Writing the front door"
# The page nginx serves at /accounts. Generated rather than static because
# every account on it comes from this model's access rules.
mkdir -p "$LANDING_DIR"
(cd "$COMMON" && bun build/landing.ts \
    -i "../${PACK_DIR}/reporting-pack.json" -o "../${LANDING_DIR}" --origin "$ORIGIN")

say "6/7  Configuration"
# Secrets are generated once and then left alone: regenerating ENCRYPTION_KEY
# would leave every stored data-source password undecryptable, and the failure
# would look like a broken data source rather than a rotated key.
#
# Each is added only when absent, so an .env written by an earlier version of
# this script gains what it lacks without losing what it has.
#
#   AUTH_SECRET            the reporting platform's Better Auth sessions
#   ENCRYPTION_KEY         the reporting platform's stored connection configs
#   JWT_SECRET             the generated application's Loco sessions
#   REPORT_ADMIN_PASSWORD  the reporting platform's bootstrap administrator.
#                          Its bootstrap refuses anything under eight
#                          characters and would otherwise generate one and
#                          print it once, into a log nobody reads.
#   CHAT_AUTH_SECRET       the chat's Better Auth sessions
#   SSO_SIGNING_KEY        the chat's Ed25519 key for signing people in to the
#   SSO_PUBLIC_KEY         reporting platform, and its public half, which the
#                          platform verifies with. Written as a pair, one PEM
#                          per line with \n escapes, because .env holds lines.
gen() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
genpw() { head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
if [[ ! -f "$ENV_FILE" ]]; then
  {
    echo "# Written by ./start.sh. Delete it to regenerate the secrets —"
    echo "# which invalidates every connection config already stored."
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "  wrote ${ENV_FILE}"
else
  echo "  keeping the secrets already in ${ENV_FILE}"
fi
# Everything below the derived marker is rewritten; secrets go above it.
sed -i.bak '/^# --- derived/,$d' "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
for key in AUTH_SECRET ENCRYPTION_KEY JWT_SECRET REPORT_ADMIN_PASSWORD CHAT_AUTH_SECRET; do
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    if [[ "$key" == "REPORT_ADMIN_PASSWORD" ]]; then
      echo "${key}=$(genpw)" >> "$ENV_FILE"
    else
      echo "${key}=$(gen)" >> "$ENV_FILE"
    fi
    echo "  added ${key}"
  fi
done

# The pair is generated together or not at all: a new private key beside an old
# public one makes every reporting sign-in fail as a bad signature.
if ! grep -q "^SSO_SIGNING_KEY=" "$ENV_FILE" || ! grep -q "^SSO_PUBLIC_KEY=" "$ENV_FILE"; then
  sed -i.bak '/^SSO_SIGNING_KEY=/d; /^SSO_PUBLIC_KEY=/d' "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  bun -e '
    const { generateKeyPairSync } = require("node:crypto");
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const line = (pem) => pem.trim().replaceAll("\n", "\\n");
    console.log(`SSO_SIGNING_KEY="${line(privateKey.export({ type: "pkcs8", format: "pem" }))}"`);
    console.log(`SSO_PUBLIC_KEY="${line(publicKey.export({ type: "spki", format: "pem" }))}"`);
  ' >> "$ENV_FILE"
  echo "  added SSO_SIGNING_KEY and SSO_PUBLIC_KEY"
fi

# Everything derived from this run is rewritten every time.
{
  echo "# --- derived from this run; rewritten on every ./start.sh"
  echo "APP_NAME=${APP_NAME}"
  echo "APP_CLI=${APP_CLI}"
  echo "APP_DB_NAME=${APP_DB_NAME}"
  echo "PUBLIC_PORT=${PORT}"
  if [[ "$PORT" == "80" ]]; then
    echo "PUBLIC_ORIGIN=http://localhost"
  else
    echo "PUBLIC_ORIGIN=http://localhost:${PORT}"
  fi
  if [[ "$PROFILE" == "prod" ]]; then
    # Two servers, each the image its application asks for.
    echo "APP_DB_HOST=postgres-app"
    echo "REPORT_DB_HOST=postgres-report"
    echo "REPORT_DB_USER=enterprise"
    echo "REPORT_DB_PASSWORD=enterprise_pass"
  else
    # One server, three databases.
    echo "APP_DB_HOST=postgres"
    echo "REPORT_DB_HOST=postgres"
    echo "REPORT_DB_USER=app"
    echo "REPORT_DB_PASSWORD=app"
  fi
} >> "$ENV_FILE"

say "7/7  Building and starting (profile: ${PROFILE})"
docker compose --env-file "$ENV_FILE" --profile "$PROFILE" up -d --build ${REBUILD:+--no-cache}

cat <<EOF

  ${APP_NAME} is starting.

    ${ORIGIN}/           opens the application
    ${ORIGIN}/app        the application
    ${ORIGIN}/report     the reports and charts derived from its model
    ${ORIGIN}/accounts   the accounts for both, one pair per role
    ${ORIGIN}/chat       the chat: sign in once with an application account,
                         and it opens both applications inside the conversation

  These are two systems: separate databases, separate user tables, separate
  sign-ins. A role name means "what you may do to a record" in the application
  and "which tables your queries may read" in the reporting platform, so the
  accounts are listed side by side at ${ORIGIN}/accounts rather than here. Both
  administrators are admin@admin.com — the same address, two different
  accounts, in two different databases:

    /app      admin@admin.com / admin
    /report   admin@admin.com / $(sed -n 's/^REPORT_ADMIN_PASSWORD=//p' "$ENV_FILE")
              (REPORT_ADMIN_PASSWORD in ${ENV_FILE})

  The first start compiles both Rust backends inside their images, migrates and
  seeds the application, then loads its schema and reporting pack into the
  platform. The compile takes several minutes the first time and seconds after
  that; until the seeder finishes, /report is up but empty.

    docker compose --env-file ${ENV_FILE} logs -f seeder
    docker compose --env-file ${ENV_FILE} ps

  Stop with ./stop.sh, or ./stop.sh --volumes to discard the databases too.
EOF
if [[ -z "${DEEPSEEK_API_KEY:-}" ]]; then
  cat <<EOF

  DEEPSEEK_API_KEY is not set, so the chat signs people in and opens screens
  but cannot answer. Export it and run ./start.sh again to give it a model;
  nothing else here uses it.
EOF
fi
