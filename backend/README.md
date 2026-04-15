# Employee Scheduling API — Backend

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env-example .env
```

The `.env` file is gitignored - never commit it. Defaults work out of the box; adjust if you need different ports or credentials.

#### App variables

- **PORT** - port the Express server runs on (default `3000`)
- **DATABASE_URL** - PostgreSQL connection string that Prisma uses. Format: `postgresql://USER:PASSWORD@HOST:PORT/DB_NAME`
- **JWT_SECRET** - secret key for signing/verifying JWT auth tokens. Keep it private.

#### Docker Compose variables (used by `compose.yml`)

- **POSTGRES_USER** - database user (default `root`)
- **POSTGRES_PASSWORD** - database password (default `root`)
- **POSTGRES_DB** - database name (default `employee_scheduling`)
- **POSTGRES_PORT** - host port mapped to PostgreSQL (default `5433`)
- **PGADMIN_EMAIL** - pgAdmin login email
- **PGADMIN_PASSWORD** - pgAdmin login password
- **PGADMIN_PORT** - host port mapped to pgAdmin (default `8080`)

### 3. Start the database

```bash
npm run db:up
```

This starts PostgreSQL on port 5433 and pgAdmin on port 8080.

- **pgAdmin UI** - http://localhost:8080 (login: `admin@admin.com` / `admin`)
- **PostgreSQL** - `localhost:5433` (user: `root`, password: `root`, db: `employee_scheduling`)

### 4. Apply schema and seed data

```bash
npm run db:migrate   # applies pending migrations, generates Prisma Client
npm run db:seed      # populates test users, availability, and schedule
```

Seeded accounts (password `password123` for all):

- `owner@company.com` - employer
- `juan.garcia@company.com`, `maria.fernandez@company.com`, `pedro.martinez@company.com` - employees

### 5. Run the dev server

```bash
npm run dev
```

Starts the server with `tsx watch` - auto-restarts on file changes.

## Scripts

### Dev

- `npm run dev` - start dev server with hot reload
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled output (production)

### Database

- `npm run db:up` / `db:down` - start/stop Postgres + pgAdmin containers
- `npm run db:migrate` - apply pending migrations and regenerate Prisma Client (prompts for a name if schema changed)
- `npm run db:generate` - regenerate Prisma Client only (rare; use after dep bumps if types look stale)
- `npm run db:reset` - drop DB, reapply all migrations, re-run seed (destructive)
- `npm run db:seed` - run `prisma/seed.ts`
- `npm run db:studio` - open Prisma Studio on http://localhost:51212

### Tests

Integration tests hit a running server via curl. Start the server in another terminal first (`npm run dev`), then:

- `npm run test:auth` - login and role-based auth
- `npm run test:employees` - `/employees` list, create, get by id
- `npm run test:availability` - `/availability/:id` get (with filters) + put
- `npm run test:schedule` - `/schedule` get (with filters, role scoping) + put

### Quality checks

- `npm run check` - runs typecheck + lint + format check; use before committing
- `npm run typecheck` - TypeScript compile without emitting
- `npm run lint` / `lint:fix` - ESLint check / auto-fix
- `npm run format` / `format:check` - Prettier write / check-only

## Project Structure

```
prisma/
├── schema.prisma         # Database models - source of truth for table structure
├── migrations/           # Ordered SQL migrations generated from schema changes
└── seed.ts               # Populates test data (users, availability, schedule)

scripts/
└── api/                  # Integration test scripts (bash + curl) per endpoint group
    ├── _common.sh        # Shared helpers (sourced, not run directly)
    ├── test-auth.sh
    ├── test-employees.sh
    ├── test-availability.sh
    └── test-schedule.sh

src/
├── index.ts              # Entry point - Express app, boot-time config check, mounts routes
├── schema.ts             # Zod schemas - single source of truth for input validation
├── lib/
│   ├── prisma.ts         # Prisma Client singleton (shared across services)
│   └── logger.ts         # Winston logger
├── types/
│   └── express.d.ts      # Augments Express Request with req.user
├── routes/               # Route definitions - HTTP method + path + middleware chain
│   ├── auth.ts
│   ├── employees.ts
│   ├── availability.ts
│   └── schedule.ts
├── controllers/          # Request handlers - parse request, call service, send response
│   ├── auth.ts
│   ├── employees.ts
│   ├── availability.ts
│   └── schedule.ts
├── services/             # Business logic - Prisma queries, data processing
│   ├── auth.ts
│   ├── employees.ts
│   ├── availability.ts
│   └── schedule.ts
└── middleware/           # Reusable middleware - runs before controllers
    ├── auth.ts           # JWT verification + role-based access
    ├── validate.ts       # Zod schema validation (generic)
    ├── requestLogger.ts  # Logs every request with status + duration
    └── errorHandler.ts   # Global error handler
```

## Request Flow

Every request follows the same path through the layers:

```
Request → Route → Middleware (auth, validate) → Controller → Service → Prisma → Response
```

- **Route** — wiring only: maps a path to middleware + a controller function
- **Middleware** — cross-cutting concerns reused across routes (auth, validation, errors)
- **Controller** — HTTP layer: reads params/body, calls the service, picks the status code
- **Service** — business logic: no knowledge of HTTP, works with plain data and Prisma
- **Schema** — Zod schemas define valid input shapes, also export TypeScript types via `z.infer`
