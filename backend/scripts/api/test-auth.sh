#!/usr/bin/env bash
# Integration tests for POST /auth/login and the auth/role middleware.

set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=./_common.sh
source ./_common.sh

check_server

section "Login — happy path"

request POST /auth/login --data "{\"email\":\"$EMPLOYER_EMAIL\",\"password\":\"$PASSWORD\"}"
assert_status 200 "employer can log in"
assert_json_field '.user.role' 'EMPLOYER' "response carries EMPLOYER role"
assert_json_field '.user.email' "$EMPLOYER_EMAIL" "response carries employer email"

request POST /auth/login --data "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"$PASSWORD\"}"
assert_status 200 "employee can log in"
assert_json_field '.user.role' 'EMPLOYEE' "response carries EMPLOYEE role"

section "Login — invalid credentials"

request POST /auth/login --data "{\"email\":\"$EMPLOYER_EMAIL\",\"password\":\"wrong-password\"}"
assert_status 401 "wrong password is rejected"

request POST /auth/login --data "{\"email\":\"nobody@example.com\",\"password\":\"$PASSWORD\"}"
assert_status 401 "unknown email is rejected"

section "Login — malformed input"

request POST /auth/login --data '{}'
assert_status 400 "missing body is rejected"

request POST /auth/login --data "{\"email\":\"$EMPLOYER_EMAIL\"}"
assert_status 400 "missing password is rejected"

request POST /auth/login --data '{"email":"not-an-email","password":"x"}'
assert_status 400 "invalid email format is rejected"

section "Protected endpoint — authentication"

request GET /employees
assert_status 401 "request with no token is rejected"

request GET /employees --auth "not.a.valid.token"
assert_status 401 "request with malformed token is rejected"

request GET /employees --auth "eyJhbGciOiJIUzI1NiJ9.invalid.signature"
assert_status 401 "request with invalid-signature token is rejected"

section "Protected endpoint — authorization (role)"

employer_token=$(login "$EMPLOYER_EMAIL" "$PASSWORD")
employee_token=$(login "$EMPLOYEE_EMAIL" "$PASSWORD")

if [ -z "$employer_token" ] || [ -z "$employee_token" ]; then
  fail "could not obtain tokens for role tests"
  summary
fi

request GET /employees --auth "$employer_token"
assert_status 200 "employer can hit EMPLOYER-only endpoint"

request GET /employees --auth "$employee_token"
assert_status 403 "employee cannot hit EMPLOYER-only endpoint"

summary
