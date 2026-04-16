#!/usr/bin/env bash
# Shared helpers for API test scripts.
# Do not run this file directly — source it from test-*.sh scripts.

set -euo pipefail

# --- Config ----------------------------------------------------------------

BASE_URL="${BASE_URL:-http://localhost:3000}"

# Seeded credentials (see prisma/seed.ts). Override via env if needed.
EMPLOYER_EMAIL="${EMPLOYER_EMAIL:-owner@company.com}"
EMPLOYEE_EMAIL="${EMPLOYEE_EMAIL:-juan.garcia@company.com}"
PASSWORD="${PASSWORD:-password123}"

# --- Dependency check -------------------------------------------------------

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed." >&2
  echo "  Install with: brew install jq" >&2
  exit 1
fi

# --- Output helpers ---------------------------------------------------------

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
RESET=$'\033[0m'

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

info() {
  printf "%b\n" "${CYAN}[info]${RESET} $*"
}

section() {
  printf "\n%b\n" "${YELLOW}=== $* ===${RESET}"
}

pass() {
  TESTS_RUN=$((TESTS_RUN + 1))
  TESTS_PASSED=$((TESTS_PASSED + 1))
  printf "%b\n" "  ${GREEN}✓${RESET} $*"
}

fail() {
  TESTS_RUN=$((TESTS_RUN + 1))
  TESTS_FAILED=$((TESTS_FAILED + 1))
  printf "%b\n" "  ${RED}✗${RESET} $*"
}

summary() {
  printf "\n"
  if [ "$TESTS_FAILED" -eq 0 ]; then
    printf "%b\n" "${GREEN}All $TESTS_RUN tests passed.${RESET}"
  else
    printf "%b\n" "${RED}$TESTS_FAILED of $TESTS_RUN tests failed.${RESET}"
    exit 1
  fi
}

# --- Request helpers --------------------------------------------------------

# Perform a request, capture body and status. Populates globals:
#   RESPONSE_BODY, RESPONSE_STATUS
# Usage:
#   request METHOD PATH [--data JSON] [--auth TOKEN]
request() {
  local method="$1"
  local path="$2"
  shift 2

  local data=""
  local token=""

  while [ $# -gt 0 ]; do
    case "$1" in
      --data) data="$2"; shift 2 ;;
      --auth) token="$2"; shift 2 ;;
      *) echo "Unknown arg: $1" >&2; return 1 ;;
    esac
  done

  local args=(-s -w "\n%{http_code}" -X "$method" "$BASE_URL$path"
              -H "Content-Type: application/json")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [ -n "$data" ]; then
    args+=(-d "$data")
  fi

  local raw
  raw=$(curl "${args[@]}")
  RESPONSE_STATUS=$(printf '%s' "$raw" | tail -n1)
  RESPONSE_BODY=$(printf '%s' "$raw" | sed '$d')
}

# assert_status <expected> <test_name>
# Checks RESPONSE_STATUS against expected.
assert_status() {
  local expected="$1"
  local name="$2"

  if [ "$RESPONSE_STATUS" = "$expected" ]; then
    pass "$name (status $expected)"
  else
    fail "$name — expected $expected, got $RESPONSE_STATUS. Body: $RESPONSE_BODY"
  fi
}

# assert_json_field <jq_path> <expected> <test_name>
# Checks a field in RESPONSE_BODY against an expected value.
assert_json_field() {
  local path="$1"
  local expected="$2"
  local name="$3"

  local actual
  actual=$(printf '%s' "$RESPONSE_BODY" | jq -r "$path" 2>/dev/null || echo "<invalid-json>")
  if [ "$actual" = "$expected" ]; then
    pass "$name ($path = $expected)"
  else
    fail "$name — expected $path = $expected, got $actual"
  fi
}

# login <email> <password>
# On success, echoes the token to stdout (empty string on failure).
# Does not touch TESTS_RUN counters — it's a helper, not an assertion.
login() {
  local email="$1"
  local password="$2"

  local raw
  raw=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  printf '%s' "$raw" | jq -r '.token // empty'
}

# check_server — abort early if the server isn't reachable.
check_server() {
  if ! curl -sf "$BASE_URL/health" >/dev/null 2>&1; then
    echo "Error: server not reachable at $BASE_URL/health" >&2
    echo "  Start it with: npm run dev" >&2
    exit 1
  fi
}
