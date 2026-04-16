#!/usr/bin/env bash
# Integration tests for the /employees endpoints.

set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=./_common.sh
source ./_common.sh

check_server

employer_token=$(login "$EMPLOYER_EMAIL" "$PASSWORD")
employee_token=$(login "$EMPLOYEE_EMAIL" "$PASSWORD")

if [ -z "$employer_token" ] || [ -z "$employee_token" ]; then
  fail "could not obtain login tokens — is the DB seeded?"
  summary
fi

section "GET /employees — happy path"

request GET /employees --auth "$employer_token"
assert_status 200 "employer can list employees"
count=$(printf '%s' "$RESPONSE_BODY" | jq '.employees | length')
if [ "$count" -ge 3 ]; then
  pass "response contains at least the 3 seeded employees (got $count)"
else
  fail "expected >= 3 employees, got $count"
fi

# Capture a known employee id for subsequent tests.
known_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.employees[0].id')

section "GET /employees — authorization"

request GET /employees --auth "$employee_token"
assert_status 403 "employee cannot list employees"

section "GET /employees/:id — happy path"

request GET "/employees/$known_id" --auth "$employer_token"
assert_status 200 "employer can fetch an employee by id"
assert_json_field '.employee.id' "$known_id" "response carries the requested id"

section "GET /employees/:id — authorization"

request GET "/employees/$known_id" --auth "$employee_token"
assert_status 403 "employee cannot fetch an employee by id"

section "GET /employees/:id — not found"

request GET "/employees/00000000-0000-0000-0000-000000000000" --auth "$employer_token"
assert_status 404 "unknown but valid uuid returns 404"

request GET "/employees/not-a-uuid" --auth "$employer_token"
# Either 404 or 400 is defensible; 500 is a bug.
if [ "$RESPONSE_STATUS" = "404" ] || [ "$RESPONSE_STATUS" = "400" ]; then
  pass "malformed id is rejected (status $RESPONSE_STATUS)"
else
  fail "malformed id should return 404 or 400, got $RESPONSE_STATUS. Body: $RESPONSE_BODY"
fi

section "POST /employees — happy path"

# Unique email per run so re-runs don't collide.
new_email="test-$(date +%s)@example.com"
request POST /employees --auth "$employer_token" --data \
  "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"$new_email\",\"password\":\"secret123\",\"phone\":\"070-000\",\"position\":\"Tester\"}"
assert_status 201 "employer can create an employee"
assert_json_field '.employee.email' "$new_email" "response echoes the email"
assert_json_field '.employee.firstName' 'Test' "response carries firstName"
assert_json_field '.employee.avatar' 'null' "omitted avatar returns null"

section "POST /employees — authorization"

request POST /employees --auth "$employee_token" --data \
  "{\"firstName\":\"X\",\"lastName\":\"Y\",\"email\":\"denied@example.com\",\"password\":\"p\"}"
assert_status 403 "employee cannot create an employee"

section "POST /employees — validation"

request POST /employees --auth "$employer_token" --data '{}'
assert_status 400 "empty body is rejected"

request POST /employees --auth "$employer_token" --data \
  '{"lastName":"User","email":"x@example.com","password":"secret"}'
assert_status 400 "missing firstName is rejected"

request POST /employees --auth "$employer_token" --data \
  '{"firstName":"Test","lastName":"User","password":"secret"}'
assert_status 400 "missing email is rejected"

request POST /employees --auth "$employer_token" --data \
  '{"firstName":"Test","lastName":"User","email":"not-an-email","password":"secret"}'
assert_status 400 "invalid email format is rejected"

request POST /employees --auth "$employer_token" --data \
  '{"firstName":"Test","lastName":"User","email":"x@example.com"}'
assert_status 400 "missing password is rejected"

section "POST /employees — duplicate email"

request POST /employees --auth "$employer_token" --data \
  "{\"firstName\":\"Dup\",\"lastName\":\"User\",\"email\":\"$EMPLOYER_EMAIL\",\"password\":\"secret\"}"
assert_status 409 "duplicate email is rejected with 409"

summary
