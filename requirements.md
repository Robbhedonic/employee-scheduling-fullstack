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

## Related Docs

- [data-models.md](data-models.md) — field definitions, relations, DBML for dbdiagram.io
- [api-spec.md](api-spec.md) — endpoint contract with request/response examples
- [Wireframes](https://balsamiq.cloud/smlazg9/pglsfyl) — UI reference for both roles
