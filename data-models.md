# Data Models

## Enums

### Role

`EMPLOYER` | `EMPLOYEE`

### ShiftType

`MORNING` | `AFTERNOON` | `NIGHT`

---

## User

Authentication record. One per person in the system.

- **id** — UUID, primary key
- **email** — unique, used for login
- **passwordHash** — bcrypt hash
- **role** — `EMPLOYER` | `EMPLOYEE`
- **createdAt** — timestamp
- **updatedAt** — timestamp

---

## Employee

Profile info for users with the `EMPLOYEE` role. One-to-one with User.

- **id** — UUID, primary key
- **userId** — FK → User (unique, 1:1)
- **firstName** — string, required
- **lastName** — string, required
- **phone** — string, optional
- **position** — string, optional
- **avatar** — URL string, optional
- **createdAt** — timestamp
- **updatedAt** — timestamp

---

## Availability

Employee **input** — "when can I work?"
The employee toggles which shifts they're available for on each day.
This is a preference, not an assignment. The employer reads this when building the schedule.
Unique constraint on `(employeeId, date, shiftType)`.

- **id** — UUID, primary key
- **employeeId** — FK → Employee
- **date** — date (no time)
- **shiftType** — `MORNING` | `AFTERNOON` | `NIGHT`
- **isAvailable** — boolean (default `true`)
- **createdAt** — timestamp
- **updatedAt** — timestamp

---

## ScheduleEntry

Employer **output** — "when will you work?"
The employer assigns employees to specific shifts on specific days.
This is the actual schedule. Employees read this to see their assigned shifts.
Unique constraint on `(employeeId, date, shiftType)`.

- **id** — UUID, primary key
- **employeeId** — FK → Employee
- **date** — date (no time)
- **shiftType** — `MORNING` | `AFTERNOON` | `NIGHT`
- **createdAt** — timestamp
- **updatedAt** — timestamp

---

## DBML (for dbdiagram.io)

Paste the block below into [dbdiagram.io](https://dbdiagram.io) to generate a visual diagram.

```dbml
Enum Role {
  EMPLOYER
  EMPLOYEE
}

Enum ShiftType {
  MORNING
  AFTERNOON
  NIGHT
}

Table User {
  id uuid [pk]
  email varchar [unique, not null]
  passwordHash varchar [not null]
  role Role [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
}

Table Employee {
  id uuid [pk]
  userId uuid [unique, not null, ref: - User.id]
  firstName varchar [not null]
  lastName varchar [not null]
  phone varchar
  position varchar
  avatar varchar
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
}

Table Availability {
  id uuid [pk]
  employeeId uuid [not null, ref: > Employee.id]
  date date [not null]
  shiftType ShiftType [not null]
  isAvailable boolean [not null, default: true]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]

  indexes {
    (employeeId, date, shiftType) [unique]
  }
}

Table ScheduleEntry {
  id uuid [pk]
  employeeId uuid [not null, ref: > Employee.id]
  date date [not null]
  shiftType ShiftType [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]

  indexes {
    (employeeId, date, shiftType) [unique]
  }
}
```
