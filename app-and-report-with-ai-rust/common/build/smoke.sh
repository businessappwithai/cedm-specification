#!/usr/bin/env bash
#
# Prove both applications are actually serving on port 80, and that both
# APIs are answered by their Rust backends.
#
# Deliberately checks content types, not just status codes. The failure this
# exists to catch does not produce a 404: an application served under a URL
# prefix it was not built for answers a stylesheet request with its own HTML
# fallback, 200 and all, and a browser reports nothing while the page renders
# unstyled and inert. `%{content_type}` is the assertion that catches it.
#
#   ORIGIN=http://localhost bash common/build/smoke.sh
set -uo pipefail

ORIGIN="${ORIGIN:-http://localhost}"
FAILED=0

probe() { # url, expected-status, expected-content-type-substring, label
  local url="$1" want_status="$2" want_type="$3" label="$4"
  local out status type size
  out=$(curl -sL -o /dev/null -w '%{http_code} %{content_type} %{size_download}' --max-time 30 "$url" 2>/dev/null) || out="000 - 0"
  read -r status type size <<<"$out"
  if [[ "$status" == "$want_status" && "$type" == *"$want_type"* ]]; then
    printf '  ok    %-46s %s  %s  %sb\n' "$label" "$status" "$type" "$size"
  else
    printf '  FAIL  %-46s %s  %s  %sb  (wanted %s / %s)\n' \
      "$label" "$status" "$type" "$size" "$want_status" "$want_type"
    FAILED=$((FAILED + 1))
  fi
}

echo "Front door"
probe "$ORIGIN/healthz" 200 text/plain "/healthz"

# The root opens the running application, not a page about it: a redirect to
# /app/ (relative, so it keeps whatever port the origin was reached on), and
# following it lands on the application's own HTML.
root_location=$(curl -s -o /dev/null -w '%{redirect_url}' --max-time 30 "$ORIGIN/" 2>/dev/null)
if [[ "$root_location" == "$ORIGIN/app/" ]]; then
  printf '  ok    %-46s %s\n' "/ redirects to the application" "$root_location"
else
  printf '  FAIL  %-46s %s  (wanted %s)\n' "/ redirects to the application" "${root_location:-none}" "$ORIGIN/app/"
  FAILED=$((FAILED + 1))
fi
probe "$ORIGIN/" 200 text/html "/ (redirect followed)"
probe "$ORIGIN/accounts" 200 text/html "/accounts (both applications' accounts)"

echo
echo "The generated application"
probe "$ORIGIN/app/"               200 text/html        "/app/ (its own redirect followed)"
# Its Loco backend, reached the way its client reaches it: nginx takes /app off
# and hands /api/… to Rust.
probe "$ORIGIN/app/api/me/health"  200 application/json "/app/api/me/health (Loco)"

# Everything it asks for is under /app/ — Vite's base, set by the overlay.
mapfile -t APP_ASSETS < <(curl -sL --max-time 30 "$ORIGIN/app/" 2>/dev/null \
  | grep -aoE '(src|href)="/app/assets/[^"]*"' | sed 's/.*="//;s/"//' | sort -u | head -4)
if [[ ${#APP_ASSETS[@]} -eq 0 ]]; then
  echo "  FAIL  /app/ referenced no /app/assets/ asset — the page is not the application"
  FAILED=$((FAILED + 1))
else
  for a in "${APP_ASSETS[@]}"; do
    case "$a" in
      *.css) probe "$ORIGIN$a" 200 text/css "$a" ;;
      *)     probe "$ORIGIN$a" 200 javascript "$a" ;;
    esac
  done
fi

echo
echo "The reporting platform"
probe "$ORIGIN/report/"           200 text/html        "/report/"
probe "$ORIGIN/report/api/health" 200 application/json "/report/api/health"

# And that it was Rust that answered. Every response from the reporting
# backend carries `x-ers-backend: loco-rs`; a 200 without it means the
# TanStack server answered the request itself — the disabled Node handlers —
# which is exactly what a prefix the proxy failed to take off looks like.
backend=$(curl -s -D - -o /dev/null --max-time 30 "$ORIGIN/report/api/health" 2>/dev/null \
  | tr -d '\r' | awk -F': ' 'tolower($1) == "x-ers-backend" { print $2 }')
if [[ "$backend" == "loco-rs" ]]; then
  printf '  ok    %-46s %s\n' "/report/api/health served by" "$backend"
else
  printf '  FAIL  %-46s %s  (wanted loco-rs)\n' "/report/api/health served by" "${backend:-nothing}"
  FAILED=$((FAILED + 1))
fi

# Everything it asks for is under its own prefix, which is what keeps the two
# from contending for a path.
mapfile -t REPORT_ASSETS < <(curl -sL --max-time 30 "$ORIGIN/report/" 2>/dev/null \
  | grep -aoE 'href="/report/assets/[^"]*"' | sed 's/.*="//;s/"//' | sort -u | head -3)
if [[ ${#REPORT_ASSETS[@]} -eq 0 ]]; then
  echo "  FAIL  /report/ referenced no /report/assets/ asset — the prefix did not apply"
  FAILED=$((FAILED + 1))
else
  for a in "${REPORT_ASSETS[@]}"; do
    case "$a" in
      *.css) probe "$ORIGIN$a" 200 text/css "$a" ;;
      *)     probe "$ORIGIN$a" 200 javascript "$a" ;;
    esac
  done
fi

echo
if [[ $FAILED -gt 0 ]]; then
  echo "${FAILED} check(s) failed."
  exit 1
fi
echo "Both applications are serving on ${ORIGIN}."
