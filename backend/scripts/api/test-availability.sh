#!/usr/bin/env bash
# Integration tests for the /availability endpoints.

set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=./_common.sh
source ./_common.sh

check_server

# Monday of the current week — matches the seed's weekDates[0].
dow=$(date +%u)
monday=$(date -v-$((dow - 1))d +%Y-%m-%d)
sunday=$(date -v+$((7 - dow))d +%Y-%m-%d)

employer_token=$(login "$EMPLOYER_EMAIL" "$PASSWORD")
juan_token=$(login "juan.garcia@company.com" "$PASSWORD")

if [ -z "$employer_token" ] || [ -z "$juan_token" ]; then
  fail "could not obtain login tokens — is the DB seeded?"
  summary
fi

# Pick Juan's and Maria's employee ids out of the employer's GET /employees list.
request GET /employees --auth "$employer_token"
juan_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.employees[] | select(.email=="juan.garcia@company.com") | .id')
maria_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.employees[] | select(.email=="maria.fernandez@company.com") | .id')

if [ -z "$juan_id" ] || [ -z "$maria_id" ]; then
  fail "could not find seeded employee ids"
  summary
fi

info "Monday=$monday  Sunday=$sunday  juan=$juan_id  maria=$maria_id"

section "GET /availability — bulk (employer)"

request GET /availability --auth "$employer_token"
assert_status 200 "employer can list all availability"
total=$(printf '%s' "$RESPONSE_BODY" | jq '.availability | length')
if [ "$total" -ge 21 ]; then
  pass "response contains many entries (got $total)"
else
  fail "expected >= 21 bulk entries, got $total"
fi
distinct_employees=$(printf '%s' "$RESPONSE_BODY" | jq '[.availability[].employee.id] | unique | length')
if [ "$distinct_employees" -ge 2 ]; then
  pass "spans multiple employees ($distinct_employees distinct)"
else
  fail "expected >= 2 distinct employees, got $distinct_employees"
fi
first_name=$(printf '%s' "$RESPONSE_BODY" | jq -r '.availability[0].employee.firstName')
if [ -n "$first_name" ] && [ "$first_name" != "null" ]; then
  pass "first row carries nested employee (firstName=$first_name)"
else
  fail "first row lacks nested employee firstName"
fi

request GET "/availability?weekOf=$monday" --auth "$employer_token"
assert_status 200 "weekOf filter returns 200"
week_count=$(printf '%s' "$RESPONSE_BODY" | jq '.availability | length')
if [ "$week_count" -le "$total" ] && [ "$week_count" -ge 21 ]; then
  pass "weekOf bounds the result (got $week_count)"
else
  fail "weekOf produced unexpected count: $week_count (total was $total)"
fi

section "GET /availability — bulk authorization"

request GET /availability --auth "$juan_token"
assert_status 403 "employee cannot list all availability"

section "GET /availability — bulk validation"

request GET "/availability?weekOf=not-a-date" --auth "$employer_token"
assert_status 400 "invalid date format is rejected"

request GET "/availability?weekOf=$monday&startDate=$monday" --auth "$employer_token"
assert_status 400 "weekOf + startDate together is rejected"

section "GET /availability/:employeeId — happy path"

request GET "/availability/$juan_id" --auth "$juan_token"
assert_status 200 "employee can view own availability"
count=$(printf '%s' "$RESPONSE_BODY" | jq '.availability | length')
if [ "$count" -ge 21 ]; then
  pass "response contains a week of seeded entries (got $count)"
else
  fail "expected >= 21 entries for Juan's week, got $count"
fi

request GET "/availability/$juan_id" --auth "$employer_token"
assert_status 200 "employer can view any employee's availability"

section "GET /availability/:employeeId — filters"

request GET "/availability/$juan_id?weekOf=$monday" --auth "$juan_token"
assert_status 200 "weekOf filter returns 200"
count=$(printf '%s' "$RESPONSE_BODY" | jq '.availability | length')
if [ "$count" -eq 21 ]; then
  pass "weekOf returns exactly one week (21 = 7 days * 3 shifts)"
else
  fail "expected 21 entries for weekOf=$monday, got $count"
fi

request GET "/availability/$juan_id?startDate=$monday&endDate=$monday" --auth "$juan_token"
assert_status 200 "startDate=endDate filter returns 200"
count=$(printf '%s' "$RESPONSE_BODY" | jq '.availability | length')
if [ "$count" -eq 3 ]; then
  pass "single-day range returns 3 entries (one per shift)"
else
  fail "expected 3 entries for single day, got $count"
fi

section "GET /availability/:employeeId — authorization"

request GET "/availability/$maria_id" --auth "$juan_token"
assert_status 403 "employee cannot view another employee's availability"

section "GET /availability/:employeeId — validation"

request GET "/availability/$juan_id?weekOf=$monday&startDate=$monday" --auth "$juan_token"
assert_status 400 "weekOf + startDate together is rejected"

request GET "/availability/$juan_id?startDate=2026-01-10&endDate=2026-01-01" --auth "$juan_token"
assert_status 400 "startDate after endDate is rejected"

request GET "/availability/$juan_id?weekOf=not-a-date" --auth "$juan_token"
assert_status 400 "invalid date format is rejected"

section "GET /availability/:employeeId — not found"

request GET "/availability/00000000-0000-0000-0000-000000000000" --auth "$employer_token"
assert_status 404 "unknown but valid uuid returns 404"

section "PUT /availability/:employeeId — happy path"

# Toggle Juan's Monday morning to false, then back to true, asserting each write.
request PUT "/availability/$juan_id" --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"$monday\",\"shiftType\":\"MORNING\",\"isAvailable\":false}]}"
assert_status 200 "employee can update own availability"
assert_json_field '.availability[0].isAvailable' 'false' "isAvailable reflects the write"

request PUT "/availability/$juan_id" --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"$monday\",\"shiftType\":\"MORNING\",\"isAvailable\":true}]}"
assert_status 200 "re-put toggles the value back"
assert_json_field '.availability[0].isAvailable' 'true' "isAvailable reflects the new value"

section "PUT /availability/:employeeId — authorization"

request PUT "/availability/$maria_id" --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"$monday\",\"shiftType\":\"MORNING\",\"isAvailable\":true}]}"
assert_status 403 "employee cannot update another employee's availability"

request PUT "/availability/$juan_id" --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$monday\",\"shiftType\":\"MORNING\",\"isAvailable\":true}]}"
assert_status 403 "employer cannot update availability"

section "PUT /availability/:employeeId — validation"

request PUT "/availability/$juan_id" --auth "$juan_token" --data '{}'
assert_status 400 "missing entries is rejected"

request PUT "/availability/$juan_id" --auth "$juan_token" --data '{"entries":[]}'
assert_status 400 "empty entries array is rejected"

request PUT "/availability/$juan_id" --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"$monday\",\"shiftType\":\"LUNCH\",\"isAvailable\":true}]}"
assert_status 400 "invalid shiftType is rejected"

request PUT "/availability/$juan_id" --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"not-a-date\",\"shiftType\":\"MORNING\",\"isAvailable\":true}]}"
assert_status 400 "invalid date is rejected"

summary
