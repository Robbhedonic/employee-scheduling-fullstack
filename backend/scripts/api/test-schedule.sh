#!/usr/bin/env bash
# Integration tests for the /schedule endpoints.

set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=./_common.sh
source ./_common.sh

check_server

# Monday/Thursday of the current week — matches the seed's weekDates.
dow=$(date +%u)
monday=$(date -v-$((dow - 1))d +%Y-%m-%d)
thu_offset=$((4 - dow))
if [ "$thu_offset" -ge 0 ]; then
  thursday=$(date -v+${thu_offset}d +%Y-%m-%d)
else
  thursday=$(date -v${thu_offset}d +%Y-%m-%d)
fi

employer_token=$(login "$EMPLOYER_EMAIL" "$PASSWORD")
juan_token=$(login "juan.garcia@company.com" "$PASSWORD")

if [ -z "$employer_token" ] || [ -z "$juan_token" ]; then
  fail "could not obtain login tokens — is the DB seeded?"
  summary
fi

# Pick Juan's and Maria's ids out of the employer's GET /employees list.
request GET /employees --auth "$employer_token"
juan_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.employees[] | select(.email=="juan.garcia@company.com") | .id')
maria_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.employees[] | select(.email=="maria.fernandez@company.com") | .id')

if [ -z "$juan_id" ] || [ -z "$maria_id" ]; then
  fail "could not find seeded employee ids"
  summary
fi

info "Monday=$monday  Thursday=$thursday  juan=$juan_id  maria=$maria_id"

section "GET /schedule — happy path"

request GET /schedule --auth "$employer_token"
assert_status 200 "employer can list the full schedule"
count=$(printf '%s' "$RESPONSE_BODY" | jq '.schedule | length')
if [ "$count" -ge 7 ]; then
  pass "response contains at least the 7 seeded entries (got $count)"
else
  fail "expected >= 7 schedule entries, got $count"
fi
assert_json_field '.schedule[0].employee.firstName' 'Pedro' "entries include nested employee object"

request GET /schedule --auth "$juan_token"
assert_status 200 "employee can list own schedule"
only_juan=$(printf '%s' "$RESPONSE_BODY" | jq "[.schedule[] | select(.employee.id != \"$juan_id\")] | length")
if [ "$only_juan" -eq 0 ]; then
  pass "employee sees only own entries"
else
  fail "employee saw $only_juan entries belonging to others"
fi

section "GET /schedule — filters"

request GET "/schedule?weekOf=$monday" --auth "$employer_token"
assert_status 200 "weekOf filter returns 200"

request GET "/schedule?employeeId=$juan_id" --auth "$employer_token"
assert_status 200 "employer can filter by employeeId"
non_juan=$(printf '%s' "$RESPONSE_BODY" | jq "[.schedule[] | select(.employee.id != \"$juan_id\")] | length")
if [ "$non_juan" -eq 0 ]; then
  pass "employeeId filter scopes result"
else
  fail "employeeId filter leaked $non_juan non-matching entries"
fi

section "GET /schedule — scoping overrides query"

request GET "/schedule?employeeId=$maria_id" --auth "$juan_token"
assert_status 200 "employee querying another's schedule still succeeds"
leaked=$(printf '%s' "$RESPONSE_BODY" | jq "[.schedule[] | select(.employee.id != \"$juan_id\")] | length")
if [ "$leaked" -eq 0 ]; then
  pass "employee scoping overrides the employeeId query param"
else
  fail "employee saw $leaked of another employee's entries"
fi

section "GET /schedule — validation"

request GET "/schedule?weekOf=$monday&startDate=$monday" --auth "$employer_token"
assert_status 400 "weekOf + startDate together is rejected"

request GET "/schedule?startDate=2026-01-10&endDate=2026-01-01" --auth "$employer_token"
assert_status 400 "startDate after endDate is rejected"

request GET "/schedule?employeeId=not-a-uuid" --auth "$employer_token"
assert_status 400 "invalid employeeId format is rejected"

section "GET /schedule — not found"

request GET "/schedule?employeeId=00000000-0000-0000-0000-000000000000" --auth "$employer_token"
assert_status 404 "unknown employeeId returns 404"

section "PUT /schedule — happy path"

request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"MORNING\",\"employeeId\":\"$juan_id\"}]}"
assert_status 200 "employer can assign a new shift"
assert_json_field '.schedule[0].employee.id' "$juan_id" "response carries the assigned employee"
assert_json_field '.schedule[0].shiftType' 'MORNING' "response carries the shiftType"

# Re-PUT the same tuple — should be a noop (upsert update: {}).
request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"MORNING\",\"employeeId\":\"$juan_id\"}]}"
assert_status 200 "re-put of the same tuple is idempotent"

section "PUT /schedule — authorization"

request PUT /schedule --auth "$juan_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"MORNING\",\"employeeId\":\"$juan_id\"}]}"
assert_status 403 "employee cannot put the schedule"

section "PUT /schedule — validation"

request PUT /schedule --auth "$employer_token" --data '{}'
assert_status 400 "missing entries is rejected"

request PUT /schedule --auth "$employer_token" --data '{"entries":[]}'
assert_status 400 "empty entries array is rejected"

request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"LUNCH\",\"employeeId\":\"$juan_id\"}]}"
assert_status 400 "invalid shiftType is rejected"

request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"not-a-date\",\"shiftType\":\"MORNING\",\"employeeId\":\"$juan_id\"}]}"
assert_status 400 "invalid date is rejected"

request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"MORNING\",\"employeeId\":\"not-a-uuid\"}]}"
assert_status 400 "invalid employeeId format is rejected"

section "PUT /schedule — not found"

request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"MORNING\",\"employeeId\":\"00000000-0000-0000-0000-000000000000\"}]}"
assert_status 404 "unknown employeeId returns 404"

section "DELETE /schedule/:id — happy path"

# Create something deletable.
request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"NIGHT\",\"employeeId\":\"$juan_id\"}]}"
delete_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.schedule[0].id')

request DELETE "/schedule/$delete_id" --auth "$employer_token"
assert_status 204 "employer can delete a schedule entry"

# Second delete should 404 since it's already gone.
request DELETE "/schedule/$delete_id" --auth "$employer_token"
assert_status 404 "deleting an already-deleted entry returns 404"

section "DELETE /schedule/:id — authorization"

# Create a fresh entry to attempt as employee.
request PUT /schedule --auth "$employer_token" --data \
  "{\"entries\":[{\"date\":\"$thursday\",\"shiftType\":\"NIGHT\",\"employeeId\":\"$juan_id\"}]}"
auth_test_id=$(printf '%s' "$RESPONSE_BODY" | jq -r '.schedule[0].id')

request DELETE "/schedule/$auth_test_id" --auth "$juan_token"
assert_status 403 "employee cannot delete a schedule entry"

# Cleanup.
request DELETE "/schedule/$auth_test_id" --auth "$employer_token"

section "DELETE /schedule/:id — not found"

request DELETE "/schedule/00000000-0000-0000-0000-000000000000" --auth "$employer_token"
assert_status 404 "unknown uuid returns 404"

request DELETE "/schedule/not-a-uuid" --auth "$employer_token"
# Either 404 or 400 is defensible; 500 is a bug.
if [ "$RESPONSE_STATUS" = "404" ] || [ "$RESPONSE_STATUS" = "400" ]; then
  pass "malformed id is rejected (status $RESPONSE_STATUS)"
else
  fail "malformed id should return 404 or 400, got $RESPONSE_STATUS. Body: $RESPONSE_BODY"
fi

summary
