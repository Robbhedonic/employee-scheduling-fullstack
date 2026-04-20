# Employee Scheduling - Frontend

React + Vite UI for the scheduling app. Talks to the backend API in `../backend/`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. (Optional) Configure the API base URL

The client defaults to `http://localhost:3000`. Override by creating `.env.local`:

```bash
VITE_API_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

Vite serves on `http://localhost:5173` (the backend's CORS allows any `http://localhost:*` in dev).

### 4. Log in

The backend's `db:seed` populates these accounts (password `password123` for all):

- `owner@company.com` - employer (manager UI)
- `juan.garcia@company.com`, `maria.fernandez@company.com`, `pedro.martinez@company.com` - employees (staff UI)

## Scripts

- `npm run dev` - start Vite dev server (HMR)
- `npm run build` - typecheck (`tsc -b`) + production build to `dist/`
- `npm run preview` - serve the production build locally
- `npm run lint` - ESLint (includes Prettier as a lint rule)
- `npm run lint:fix` - auto-fix lint + formatting

## Tech Stack

- **React 19 + TypeScript**
- **Vite** - dev server + build
- **Tailwind CSS v4** - utility classes; design tokens defined in `src/index.css` via `@theme`
- **shadcn/ui + Base UI** - accessible primitives (Button, Dialog)
- **TanStack Query** - server state, caching, mutation invalidation
- **react-router-dom v7** - routing with role-based guards
- **Lucide React** - icons
- Custom font stack via `@fontsource` (Inter, Instrument Serif, JetBrains Mono)

## Project Structure

```
src/
├── main.tsx                          # Entry - mounts <App> inside <AuthProvider> + <QueryClientProvider>
├── App.tsx                           # Router - routes split between /manager (EMPLOYER) and /staff (EMPLOYEE)
├── index.css                         # Tailwind v4 theme + global styles
│
├── components/                       # Cross-page primitives
│   ├── ui/                           # shadcn-generated (Button)
│   ├── Avatar.tsx                    # Initial-bubble avatar
│   ├── Logo.tsx                      # App mark
│   ├── PositionBadge.tsx             # Color-coded role pill (Chef / Waiter / Barista)
│   ├── ShiftChip.tsx                 # MORNING/AFTERNOON/NIGHT pill
│   ├── TopChrome.tsx                 # Logged-in app shell header (tabs + user pill)
│   ├── WeekNavigator.tsx             # < Week of Apr 20 > picker (desktop)
│   └── WeekStrip.tsx                 # 7-day picker (mobile)
│
├── lib/
│   ├── api.ts                        # Typed fetch wrapper - injects auth header, handles 401, throws ApiError
│   ├── auth.tsx                      # AuthProvider + useAuth hook (token in localStorage, decoded user state)
│   ├── colors.ts                     # Position color mapping
│   ├── dates.ts                      # Week math (Monday-of, addDays, formatting) - all UTC to avoid TZ drift
│   ├── queryClient.ts                # TanStack Query client config
│   ├── useWeekParam.ts               # Reads/writes ?week=YYYY-MM-DD from the URL
│   └── utils.ts                      # cn() class merger
│
└── pages/
    ├── Login.tsx                     # Email/password form, redirects by role on success
    ├── RequireAuth.tsx               # Route guard - kicks unauthenticated/unauthorized users to /login
    │
    ├── manager/                      # EMPLOYER-only
    │   ├── ManagerLayout.tsx         # /manager shell with tabs: Employees / Availability / Schedule
    │   ├── EmployeesPage.tsx         # List + delete
    │   ├── EmployeeFormPage.tsx      # Create + edit (single form, /new and /:id share it)
    │   ├── WorkSchedulePage.tsx      # Read-only weekly availability matrix (everyone × 7 days)
    │   └── JobSchedulePage.tsx       # Assign/unassign shifts; picker filters by availability
    │
    └── staff/                        # EMPLOYEE-only
        ├── StaffLayout.tsx           # /staff shell with tabs: Schedule / Availability
        ├── StaffSchedulePage.tsx     # Read-only weekly grid of own assigned shifts
        └── StaffAvailabilityPage.tsx # Set own availability (3 shifts × 7 days + per-day quick picker)
```

## Routing

```
/login                          -> Login

/manager  (EMPLOYER)            -> ManagerLayout
  /employees                    -> EmployeesPage
  /employees/new                -> EmployeeFormPage (create)
  /employees/:id                -> EmployeeFormPage (edit)
  /availability                 -> WorkSchedulePage
  /schedule                     -> JobSchedulePage

/staff    (EMPLOYEE)            -> StaffLayout
  /availability                 -> StaffAvailabilityPage
  /schedule                     -> StaffSchedulePage

/                               -> redirects by role (employer -> /manager, employee -> /staff)
```

`RequireAuth` enforces both authentication and role. Bare `/` and any unknown path land on `RootRedirect`, which sends you to `/login` or your role's home depending on session state.

## Auth Flow

- `Login.tsx` calls `POST /auth/login` and hands the result to `AuthProvider`.
- `AuthProvider` stores the JWT in `localStorage` and exposes `{ token, user, login, logout }` via `useAuth()`.
- `api.ts` injects `Authorization: Bearer <token>` on every request.
- If the server returns `401` on a request that did include a token (token expired/revoked), `api.ts` dispatches a `window` `auth:expired` event. `AuthProvider` listens and calls `logout()`, after which `RequireAuth` redirects to `/login`.
- Login response includes `employeeId` for `EMPLOYEE` users so the staff pages can call `/availability/:employeeId` and `/schedule?employeeId=...` without an extra fetch.

## Server State

TanStack Query owns all server data. Patterns used throughout:

- `useQuery({ queryKey: ['employees'], queryFn })` - cached fetch
- `useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: [...] }) })` - write + refetch the affected list

Cache keys mirror the URL/state they depend on (`['schedule', weekOf]`, `['availability', weekOf]`, `['employee', id]`) so changing the week scope produces a new fetch.

## Week State (URL-Persisted)

`useWeekParam()` reads `?week=YYYY-MM-DD` from the URL and falls back to the current Monday. Changing the week updates the URL with `replace: true`, so deep links and reloads land on the same week. The current week is encoded as no param to keep URLs clean.

## Mobile Layout

Each schedule/availability page renders both layouts side-by-side and toggles via Tailwind breakpoints:

- `hidden md:block` - desktop grid (employees × days, or shifts × days)
- `md:hidden` - mobile day-stack: pick one day with `<WeekStrip>`, see that day's rows beneath

This avoids horizontal scroll on phones and lets each form factor have its own information density.

## Design System

Colors, spacing, fonts, and shadcn theme tokens are centralized in `src/index.css` (Tailwind v4's `@theme` block + CSS custom properties). Page typography uses three families:

- **Inter** - body / UI
- **Instrument Serif** - hero headings (italic for emphasis)
- **JetBrains Mono** - times, dates, eyebrows

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components are emitted to `src/components/ui/`. See the [shadcn/ui docs](https://ui.shadcn.com/docs/components).

## Import Alias

`@/` maps to `src/`. Use it for all imports:

```tsx
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
```
