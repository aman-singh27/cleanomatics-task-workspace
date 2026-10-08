# Cleanomatics Task Workspace

A full-stack task manager built for the Cleanomatics developer assignment. Create, inspect, edit, and delete tasks in a responsive workspace using blue, navy, and off-white surfaces inspired by the company palette. Every task operation uses the Express REST API.

## Run locally

Use Node.js **22.12 or newer** and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs at **http://127.0.0.1:4000/api**. Interactive Swagger documentation is at **http://127.0.0.1:4000/api/docs**.

Environment files are optional for the default local setup. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` when overriding configuration. Restart development servers after changing environment values.

## Features

- Dashboard with task descriptions, dates, status, priority, and live summary metrics.
- Change status directly in each task row or mobile card; summary counts and filtered results update after saving.
- Select All tasks, In progress, or Completed through the dashboard metrics.
- Five-field create/edit forms with accessible validation, complete task details drawer, and named delete confirmation.
- Debounced search across title and description, combined status/priority filters, created-date/priority/due-date sorting, and pagination.
- Desktop table and mobile task cards, light/dark themes, keyboard-accessible dialogs, and reduced-motion support.
- Loading, empty, no-match, error/retry, save-progress, mutation-failure, and success states.
- Unknown-page recovery, a render-error fallback, and privacy/terms pages describing this evaluation demo.
- Centralized REST error handling, request validation, configured CORS, and OpenAPI documentation.

## Storage behavior

**Tasks live only in backend memory.** There is no database, Firebase, browser task persistence, or disk task persistence. All changes disappear when the backend restarts. By default, the server starts with example operations tasks. Set `SEED_DEMO_DATA=false` for an empty workspace. A restart with demo seeding enabled restores the examples, not previously created tasks. Only the theme preference is saved in browser localStorage.

No authentication is included because the assignment does not require it. This small demo is designed for local evaluation; a later public deployment will retain the same reset-on-restart constraint.

## Verify

```sh
npx playwright install chromium
npm run check
```

`check` runs TypeScript checks, production build, frontend/backend tests with coverage, and Chromium end-to-end tests. E2E uses separate ports **4001/5174** and an empty API so it does not touch the local preview's tasks. Ensure those ports are free.

Individual commands:

```sh
npm test
npm run test:coverage
npm run test:e2e
npm run typecheck
npm run build
```

GitHub Actions runs the same checks on pushes and pull requests. Coverage HTML lives in each workspace's `coverage/` folder; Playwright writes `playwright-report/` and retains failure traces/screenshots.

## Architecture

```text
frontend/src/
  api/           Typed REST client
  hooks/         Task loading and mutation state
  lib/           Task selection, validation and date helpers
  components/    Reusable shell, list, form, drawer and dialog
backend/src/
  routes/        Endpoint registration
  controllers/   HTTP request/response handling
  services/      In-memory task store and demo seeds
  validation/    Input shape, enums, length and calendar-date checks
  middleware/    Central JSON error handling
e2e/             Browser tests against real Express API
docs/            Plan, independent review, requirements, brand and API notes
```

The frontend obtains the task array from `GET /api/tasks` and performs search, filtering, sorting, and pagination locally. This keeps the assignment's REST contract straightforward and suits its small in-memory dataset. The list is reconciled after every successful mutation. Single-task details use `GET /api/tasks/:id`.

In development Vite proxies `/api` to Express. `API_PROXY_TARGET` changes that proxy target. `VITE_API_URL` can specify a separate backend API base, including `/api`, for a later hosted frontend. For separate origins, set backend `CORS_ORIGINS` to the exact frontend origins.

## API

| Method | Endpoint         | Success          | Other expected responses |
| ------ | ---------------- | ---------------- | ------------------------ |
| GET    | `/api/tasks`     | 200 task array   | 500                      |
| GET    | `/api/tasks/:id` | 200 task         | 404                      |
| POST   | `/api/tasks`     | 201 task         | 400                      |
| PUT    | `/api/tasks/:id` | 200 task         | 400, 404                 |
| DELETE | `/api/tasks/:id` | 200 confirmation | 404                      |

See [API documentation](docs/API.md), Swagger at `/api/docs`, and the machine-readable specification at `/api/openapi.json`.

## Review and deliverables

Start with the [manual review guide](docs/MANUAL-REVIEW.md). The [requirements matrix](docs/REQUIREMENTS.md) traces assignment requirements; the [verification report](docs/VERIFICATION.md) records executed checks and screenshots. [Brand research](docs/BRAND-RESEARCH.md) records observed company design cues. The app uses an original identity illustration and interface; no company assets are copied.

This repository is prepared locally for evaluation. Publishing to GitHub, hosting on Vercel/Render, and employer submission are intentionally deferred until the owner's manual review.
