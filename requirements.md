# Employee Scheduling API — Requirements

**Deadline:** April 20th
**Tech stack:** Node.js, TypeScript, Express, Prisma (SQL), Zod
**Wireframes:** https://balsamiq.cloud/smlazg9/pglsfyl

---

## What the System Does

### Employer capabilities

- Log in
- View all employees
- Register new employees (with a login code)
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
- **Employee** — linked to User; fields: name, email, phone, photo/avatar, position
- **Shift** — morning / afternoon / night
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

- **[Setup] Initialize TypeScript + Express project**
  Scaffold project with `package.json`, `tsconfig.json`, Express server entry point, dev scripts.

- **[Setup] Configure Prisma and connect to database**
  Install Prisma, initialize schema file, configure database connection, verify `prisma db push` works.

- **[Setup] Define Prisma schema (User, Employee, Shift, Availability, Schedule)**
  Create all models with correct relations, run migration, generate Prisma client.

- **[Auth] POST /auth/login — JWT or session-based login**
  Accepts credentials, returns a token/session. Works for both employer and employee roles.

- **[Auth] Middleware for role-based access control**
  Auth middleware that verifies token and checks user role. Rejects unauthorized requests with proper status codes.

- **[Feature] GET /employees — list all employees (employer only)**
  Returns all employee profiles. Employer-only access.

- **[Feature] POST /employees — register new employee (employer only)**
  Creates a new User (employee role) + Employee profile. Employer sets an initial password for the employee.

- **[Feature] GET /availability/:id — get employee availability**
  Returns availability entries for a given employee. Supports filtering by week/date range.

- **[Feature] PUT /availability/:id — employee sets own availability**
  Employee toggles their available shifts for specific days. Only the employee themselves can update.

- **[Feature] GET /schedule — view full job schedule**
  Returns schedule entries (who works which shift on which day). Supports filtering by week/date range.

- **[Feature] PUT /schedule — employer assigns employees to shifts**
  Employer creates or updates schedule entries, assigning employees to specific day/shift slots.

- **[Polish] Add Zod validation to all POST/PUT endpoints**
  Define Zod schemas as the single source of truth for every request body. Derive TypeScript types from them with `z.infer`. Return clear 400 errors on invalid input.

- **[Polish] Add error handling middleware**
  Global error handler that catches unhandled errors, returns consistent JSON error responses with proper status codes.

- **[Polish] Add logging (Winston or similar)**
  Structured request logging (method, path, status, duration). Error logging with stack traces.

- **[Polish] Final testing and cleanup**
  Test all endpoints manually or with a tool like Insomnia/Postman. Fix edge cases, clean up dead code.

### Frontend

- **[Frontend] Employer — Login page**
  Login form, authenticates against API, stores token, redirects to employee list.

- **[Frontend] Employer — Employee list page**
  Card grid showing all employees (name, photo, position). Links to individual schedule views.

- **[Frontend] Employer — Register new employee form**
  Form with fields: name, email, phone, position. Calls POST /employees and shows the generated login code.

- **[Frontend] Employer — Job schedule view + assign shifts**
  Weekly grid (days × shifts). Employer can assign employees to shift slots. Calls PUT /schedule.

- **[Frontend] Employee — Login page**
  Login form using employee credentials/login code, redirects to availability view.

- **[Frontend] Employee — Set availability view**
  Weekly grid where employee toggles available shifts. Modal for per-day shift selection. Calls PUT /availability.

- **[Frontend] Employee — My schedule view**
  Read-only weekly view showing the employee's assigned shifts.

- **[Frontend] Connect frontend to API (fetch/axios setup)**
  Shared API client with base URL config, auth token headers, error handling.
