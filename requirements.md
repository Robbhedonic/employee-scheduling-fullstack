# Employee Scheduling API — Requirements

**Deadline:** April 20th
**Tech stack:** Node.js, TypeScript, Express, Prisma (SQL), Zod
**Wireframes:** https://balsamiq.cloud/smlazg9/pglsfyl

---

## What the System Does

### Employer capabilities

- Log in
- View all employees
- Register new employees (employer sets an initial password)
- View and manage the **Job Schedule** — assign employees to shifts (weekly grid: days × shifts)
- View **Work Schedule** per employee

### Employee capabilities

- Log in
- **Book Availability** — toggle availability per shift, per day via a weekly grid view
- View their personal work schedule

### Shifts

Three shifts per day:

- Morning shift
- Afternoon shift
- Night shift

---

## Core Flow

```
Employee sets availability  →  Availability
                                    ↓  (employer reads as reference)
Employer assigns shifts     →  ScheduleEntry
                                    ↓  (employee reads their assignments)
Employee views schedule     ←  ScheduleEntry
```

1. **Employee books availability** — opens a weekly grid and toggles which shifts they can work on each day. This is a *preference* — it doesn't mean they're scheduled, just that they're available. Stored as Availability records.

2. **Employer builds the schedule** — opens the Job Schedule grid for a given week. They can see which employees are available for each slot (from Availability data) and assign employees to shifts. Each assignment is stored as a ScheduleEntry.

3. **Employee views their schedule** — opens My Schedule and sees only the shifts they've been assigned to. This reads from ScheduleEntry, not Availability.

Availability is the **input** (employee preference).
ScheduleEntry is the **output** (employer decision).

---

## Technical Requirements

- REST API with Express and TypeScript
- Database with Prisma (SQL)
- Zod schemas as the single source of truth for input validation — define schemas once, derive TypeScript types with `z.infer`, and validate all incoming request bodies against them
- Role-based access: employers and employees have different permissions
- Proper HTTP status codes and error responses
- At least basic logging (console or Winston)

---

## Data Models (minimum)

- **User** — with role: `employer` | `employee`
- **Employee** — linked to User; fields: firstName, lastName, email, phone, avatar, position
- **ShiftType** — enum: `MORNING` / `AFTERNOON` / `NIGHT` (not a separate table)
- **Availability** — boolean per day/shift (is the employee available for a given shift on a given day)
- **ScheduleEntry** — who works which shift on which day

---

## API Endpoints (minimum)

- **POST /auth/login** — All users
- **GET /employees** — Employer only
- **POST /employees** — Employer only
- **GET /employees/:id** — Employer only
- **GET /availability/:employeeId** — Both roles
- **PUT /availability/:employeeId** — Employee only
- **GET /schedule** — Both roles
- **PUT /schedule** — Employer only

Schedule and availability endpoints should support filtering by week/date range.

Additional endpoints may be added as needed.

---

## Frontend

A frontend must connect to the API. It lives in a separate folder in the repo.

### Requirements

- Must reflect the wireframes provided
- Must communicate with the actual API (no mock data)
- Both the employer view and the employee view must be implemented
- Login must work and control what the user sees
- Top navigation bar for both roles:
  - **Employer nav:** Employees, Job Schedule
  - **Employee nav:** Availability, Schedule

### Approach

- React + TypeScript
- Tailwind CSS + shadcn/ui for components
- Keep it functional over fancy — focus is the backend

---

## Suggested GitHub Issues

### Backend

- **[Setup] Configure Prisma and define schema**
  Install Prisma, configure database connection, create all models (User, Employee, Availability, ScheduleEntry) with correct relations, run migration, generate client. Add a seed script with test data (employer + a few employees).

- **[Auth] Login endpoint + role-based access middleware**
  POST /auth/login — accepts credentials, returns JWT. Auth middleware that verifies token and attaches user info. Role middleware that restricts endpoints by role (employer/employee).

- **[Feature] Employee management endpoints**
  GET /employees (list all, employer only), POST /employees (create user + profile, employer sets initial password), GET /employees/:id (single profile, employer only).

- **[Feature] Availability endpoints**
  GET /availability/:employeeId (view availability, both roles — employee can only view own). PUT /availability/:employeeId (set own availability, employee only). Supports filtering by week/date range.

- **[Feature] Schedule endpoints**
  GET /schedule (view schedule, both roles — employee sees own shifts only). PUT /schedule (assign employees to shifts, employer only). Supports filtering by week/date range.

- **[Polish] Add Zod validation to all POST/PUT endpoints**
  Define Zod schemas as the single source of truth for every request body. Derive TypeScript types from them with `z.infer`. Return clear 400 errors on invalid input.

- **[Polish] Add error handling middleware**
  Global error handler that catches unhandled errors, returns consistent JSON error responses with proper status codes.

- **[Polish] Add logging (Winston or similar)**
  Structured request logging (method, path, status, duration). Error logging with stack traces.

- **[Polish] Final testing and cleanup**
  Test all endpoints manually or with a tool like Insomnia/Postman. Fix edge cases, clean up dead code.

### Frontend

- **[Frontend] Login page**
  Single login form for both roles. Authenticates against API, stores token, redirects based on role (employer → employee list, employee → availability view).

- **[Frontend] Employer — Employee list page**
  Card grid showing all employees (name, photo, position). Links to individual schedule views.

- **[Frontend] Employer — Register new employee form**
  Form with fields: name, email, password, phone, position. Calls POST /employees.

- **[Frontend] Employer — Job schedule view + assign shifts**
  Weekly grid (days × shifts). Employer can assign employees to shift slots. Calls PUT /schedule.

- **[Frontend] Employee — Set availability view**
  Weekly grid where employee toggles available shifts. Modal for per-day shift selection. Calls PUT /availability.

- **[Frontend] Employee — My schedule view**
  Read-only weekly view showing the employee's assigned shifts.

- **[Frontend] Connect frontend to API (fetch/axios setup)**
  Shared API client with base URL config, auth token headers, error handling.
