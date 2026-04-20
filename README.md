# Employee Scheduling

A scheduling system where employers manage shifts and employees set their availability.

## Project Structure

```
employee-scheduling/
├── backend/              # Express + TypeScript API
├── frontend/             # React + Vite + Tailwind + shadcn/ui
├── requirements.md       # Project requirements and scope
├── data-models.md        # Database models + DBML for dbdiagram.io
└── api-spec.md           # API contract — request/response shapes
```

See each project's README for details:

- [Backend README](backend/README.md) — setup, architecture, request flow
- [Frontend README](frontend/README.md) — setup, tech stack, component usage

## Quickstart

### Backend

```bash
cd backend
npm install
cp .env-example .env     # defaults work; edit if needed
npm run db:up            # PostgreSQL on :5433, pgAdmin on :8080
npm run db:migrate       # apply schema
npm run db:seed          # load test users and schedule
npm run dev              # http://localhost:3000
```

With the server running, `npm test` (in another terminal) runs the full integration suite against it.

See the [backend README](backend/README.md) for the full script reference and seeded credentials.

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## Workflow

### GitHub Issues

Every feature gets a GitHub issue before work begins. Use labels: `setup`, `feature`, `bug`, `polish`, `frontend`.

### Branches

- `main` — working code only
- Create a branch per issue: `feature/availability-endpoint`, `fix/login-error`, etc.

### Commits

Reference the issue in the commit title:

```
feat(backend): implement login endpoint (#4)
```

Use conventional commit types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.

### Pull Requests

- One PR per feature/issue
- Another team member reviews before merging
- Reference the issue in the PR description

### Checks

Both projects use TypeScript + ESLint + Prettier.

**Backend** (from `backend/`):

```bash
npm run check       # typecheck + lint + format, all read-only
npm run lint:fix    # auto-fix ESLint issues
npm run format      # auto-fix Prettier issues
```

**Frontend** (from `frontend/`):

```bash
npm run lint        # ESLint check (Prettier runs as an ESLint rule)
npm run lint:fix    # auto-fix lint + formatting
npm run build       # tsc -b + vite build (typecheck happens here)
```

## Publish To GitHub

Use this if you want to publish this project to a fresh GitHub repository:

```bash
git init
git checkout -b main
git add .
git commit -m "chore: initial project publish"
git remote add origin <your-repo-url>
git push -u origin main
```

This repository also includes CI in `.github/workflows/ci.yml`.
On every push and pull request to `main`, GitHub Actions runs:

- Backend: install, typecheck, lint, build
- Frontend: install, lint, build
