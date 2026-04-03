# Employee Scheduling — Frontend

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Starts Vite on `http://localhost:5173` with hot module replacement.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
- `npm run lint:fix` — auto-fix lint issues

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui components

## Project Structure

```
src/
├── main.tsx              # Entry point — renders App
├── App.tsx               # Root component
├── index.css             # Tailwind + shadcn theme
├── components/
│   └── ui/               # shadcn/ui components (auto-generated)
└── lib/
    └── utils.ts          # cn() helper for class merging
```

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/`. See the [shadcn/ui docs](https://ui.shadcn.com/docs/components) for available components.

## Import Alias

`@/` maps to `src/`. Use it for all imports:

```tsx
import { Button } from '@/components/ui/button';
```
