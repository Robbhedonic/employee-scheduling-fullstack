# API Specification

Base URL: `http://localhost:3000` (or configured via env)

All endpoints except `/auth/login` require an `Authorization: Bearer <token>` header.

Error responses follow a consistent shape:

```json
{ "error": "Human-readable message" }
```

---

## Auth

### POST /auth/login

Authenticate a user (employer or employee).

**Request body:**

```json
{
  "email": "anna@example.com",
  "password": "secret123"
}
```

**Response 200:**

```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "anna@example.com",
    "role": "EMPLOYER"
  }
}
```

For users with role `EMPLOYEE`, the response also includes their `Employee.id` so the frontend can call `/availability/:employeeId` and `/schedule?employeeId=...` without an extra round trip:

```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "juan.garcia@company.com",
    "role": "EMPLOYEE",
    "employeeId": "uuid"
  }
}
```

**Errors:**

- `401` — Invalid credentials

---

## Employees

### GET /employees

List all employees. Employer only.

**Response 200:**

```json
{
  "employees": [
    {
      "id": "uuid",
      "firstName": "Erik",
      "lastName": "Svensson",
      "email": "erik@example.com",
      "phone": "070-1234567",
      "position": "Chef",
      "avatar": "https://..."
    }
  ]
}
```

**Errors:**

- `401` — Not authenticated
- `403` — Not an employer

---

### POST /employees

Register a new employee. Employer only.
Creates both a User (with `EMPLOYEE` role and the provided password) and an Employee profile.
The employer sets an initial password and shares it with the employee.

**Request body:**

```json
{
  "firstName": "Erik",
  "lastName": "Svensson",
  "email": "erik@example.com",
  "password": "initial-password",
  "phone": "070-1234567",
  "position": "Chef",
  "avatar": "https://..."
}
```

`phone`, `position`, and `avatar` are optional.

**Response 201:**

```json
{
  "employee": {
    "id": "uuid",
    "firstName": "Erik",
    "lastName": "Svensson",
    "email": "erik@example.com",
    "phone": "070-1234567",
    "position": "Chef",
    "avatar": "https://..."
  }
}
```

**Errors:**

- `400` — Validation error (missing fields, invalid email, etc.)
- `409` — Email already exists

---

### PUT /employees/:id

Update an existing employee. Employer only.
Send any subset of the updatable fields (must include at least one).
Send `null` on `phone`, `position`, or `avatar` to clear them.

**Updatable fields:** `firstName`, `lastName`, `email`, `password`, `phone`, `position`, `avatar`.

`email` updates the underlying User and must remain unique.
`password` is hashed and replaces the current credential (employer-driven reset, no current-password challenge).

**Request body (partial):**

```json
{
  "firstName": "Erik",
  "email": "erik.new@example.com",
  "password": "new-secret",
  "phone": null
}
```

**Response 200:**

```json
{
  "employee": {
    "id": "uuid",
    "firstName": "Erik",
    "lastName": "Svensson",
    "email": "erik.new@example.com",
    "phone": null,
    "position": "Chef",
    "avatar": "https://..."
  }
}
```

**Errors:**

- `400` — Validation error (no fields, invalid value, etc.)
- `401` — Not authenticated
- `403` — Not an employer
- `404` — Employee not found
- `409` — Email already exists

---

### GET /employees/:id

Get a single employee's profile. Employer only.

**Response 200:**

```json
{
  "employee": {
    "id": "uuid",
    "firstName": "Erik",
    "lastName": "Svensson",
    "email": "erik@example.com",
    "phone": "070-1234567",
    "position": "Chef",
    "avatar": "https://..."
  }
}
```

**Errors:**

- `401` — Not authenticated
- `403` — Not an employer
- `404` — Employee not found

---

## Availability

### GET /availability

List availability entries for **all employees** in a date range. Employer only.
Used to render the per-employee availability overview without N+1 requests.

**Query params:**

- `weekOf` — ISO date for the Monday of a week (returns 7 days)
- `startDate` / `endDate` — alternative explicit range
- All filters are optional; omit them to fetch every entry (use sparingly)

**Response 200:**

```json
{
  "availability": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2026-04-06",
      "shiftType": "MORNING",
      "isAvailable": true,
      "createdAt": "...",
      "updatedAt": "...",
      "employee": {
        "id": "uuid",
        "firstName": "Erik",
        "lastName": "Svensson"
      }
    }
  ]
}
```

**Errors:**

- `400` — Validation error (invalid date, conflicting filters)
- `401` — Not authenticated
- `403` — Not an employer

---

### GET /availability/:employeeId

Get an employee's availability. Both roles.
Employees can only view their own. Employers can view any.

**Query params:**

- `weekOf` — ISO date string for the Monday of the week (e.g. `2026-04-06`)

**Response 200:**

```json
{
  "availability": [
    {
      "id": "uuid",
      "date": "2026-04-06",
      "shiftType": "MORNING",
      "isAvailable": true
    },
    {
      "id": "uuid",
      "date": "2026-04-06",
      "shiftType": "AFTERNOON",
      "isAvailable": false
    }
  ]
}
```

**Errors:**

- `403` — Employee trying to view another employee's availability
- `404` — Employee not found

---

### PUT /availability/:employeeId

Set availability for specific day/shift slots. Employee only (own data).
Upserts entries — creates if not existing, updates if already set.

**Request body:**

```json
{
  "entries": [
    { "date": "2026-04-06", "shiftType": "MORNING", "isAvailable": true },
    { "date": "2026-04-06", "shiftType": "AFTERNOON", "isAvailable": false },
    { "date": "2026-04-06", "shiftType": "NIGHT", "isAvailable": true }
  ]
}
```

**Response 200:**

```json
{
  "availability": [
    { "id": "uuid", "date": "2026-04-06", "shiftType": "MORNING", "isAvailable": true },
    { "id": "uuid", "date": "2026-04-06", "shiftType": "AFTERNOON", "isAvailable": false },
    { "id": "uuid", "date": "2026-04-06", "shiftType": "NIGHT", "isAvailable": true }
  ]
}
```

**Errors:**

- `400` — Validation error
- `403` — Not the employee's own data

---

## Schedule

### GET /schedule

Get the full job schedule. Both roles.
Employees see only their own entries. Employers see all.

**Query params:**

- `weekOf` — ISO date string for the Monday of the week (e.g. `2026-04-06`)
- `employeeId` — optional, filter by employee (employer use)

**Response 200:**

```json
{
  "schedule": [
    {
      "id": "uuid",
      "date": "2026-04-06",
      "shiftType": "MORNING",
      "employee": {
        "id": "uuid",
        "firstName": "Erik",
        "lastName": "Svensson"
      }
    },
    {
      "id": "uuid",
      "date": "2026-04-06",
      "shiftType": "MORNING",
      "employee": {
        "id": "uuid",
        "firstName": "Anna",
        "lastName": "Johansson"
      }
    }
  ]
}
```

**Errors:**

- `401` — Not authenticated

---

### PUT /schedule

Assign employees to shifts. Employer only.
Accepts a list of entries to create or update.

**Request body:**

```json
{
  "entries": [
    { "date": "2026-04-06", "shiftType": "MORNING", "employeeId": "uuid" },
    { "date": "2026-04-06", "shiftType": "AFTERNOON", "employeeId": "uuid" }
  ]
}
```

**Response 200:**

```json
{
  "schedule": [
    {
      "id": "uuid",
      "date": "2026-04-06",
      "shiftType": "MORNING",
      "employee": {
        "id": "uuid",
        "firstName": "Erik",
        "lastName": "Svensson"
      }
    }
  ]
}
```

**Errors:**

- `400` — Validation error
- `403` — Not an employer
- `404` — Employee not found

---

### DELETE /schedule/:id

Remove a single schedule entry. Employer only.
Used to unassign an employee from a shift.

**Response 204:** No body.

**Errors:**

- `401` — Not authenticated
- `403` — Not an employer
- `404` — Schedule entry not found
