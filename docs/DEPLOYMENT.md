# Deployment and hosted review

The user has authorized GitHub publication and hosting. The public repository has been created at [aman-singh27/cleanomatics-task-workspace](https://github.com/aman-singh27/cleanomatics-task-workspace); source push and hosted acceptance are pending. The employer requested the repository link by **9 October 2026, end of day**. No email address or correspondence is included here.

| Deliverable         | Status                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| GitHub repository   | Created; source publication pending                                        |
| Frontend URL        | Pending Vercel deployment and verification                                 |
| API base URL        | Pending Render deployment and verification                                 |
| Swagger URL         | Pending; will be the verified API origin plus `/api/docs/`                 |
| OpenAPI URL         | Pending; will be the verified API origin plus `/api/openapi.json`          |
| Hosted smoke checks | Pending; local checks are documented in [VERIFICATION.md](VERIFICATION.md) |

Replace pending entries only with actual accessible URLs. A successful build alone does not establish that hosted CRUD, routing or Swagger works.

## Backend on Render

Use a Node web service connected to this repository. [render.yaml](../render.yaml) defines the intended single-instance deployment:

| Setting                | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| Repository root        | Repository root; both npm workspaces remain available                 |
| Runtime / Node version | Node / `22.17.0`                                                      |
| Plan / instances       | Free / one                                                            |
| Region                 | Singapore                                                             |
| Branch                 | `main`                                                                |
| Build command          | `npm ci --omit=dev`                                                   |
| Start command          | `npm run start --workspace backend`                                   |
| Health check           | `/api/health`                                                         |
| `NODE_ENV`             | `production`                                                          |
| `HOST`                 | `0.0.0.0`                                                             |
| `PORT`                 | Render-provided value; do not replace with a fixed development port   |
| `SEED_DEMO_DATA`       | `true` for the review examples; `false` starts empty                  |
| `REQUEST_LOGGING`      | `true`; set `false` to disable request logs                           |
| `CORS_ORIGINS`         | Exact verified frontend origin; configure in Render before acceptance |

The API must run as a persistent Node process with one instance. Each independent process owns a separate memory store. No database, Firebase, persistent disk or task persistence is added. Deploying the API as independent stateless functions would not preserve the assignment's coherent shared in-memory collection.

Render free services sleep after 15 idle minutes; waking can take about a minute. They can also restart, and free services cannot scale beyond one instance. See [Render's official free-service documentation](https://render.com/docs/free). Because this application's store is process memory, a stop/restart discards task changes. With seeding enabled, a new process restores examples. The first hosted request may take longer or fail during startup; retry after the service wakes.

## Frontend on Vercel

Use the repository root, with settings from [vercel.json](../vercel.json):

| Setting          | Value                                   |
| ---------------- | --------------------------------------- |
| Framework        | Vite                                    |
| Install command  | `npm ci --include=dev`                  |
| Build command    | `npm run build`                         |
| Output directory | `frontend/dist`                         |
| `VITE_API_URL`   | `/api`, or leave unset for that default |

`API_PROXY_TARGET` only configures Vite's development proxy; it does not route the deployed frontend. Before deploying, add the external API rewrite **ahead of** the SPA fallback, using the actual Render origin:

```text
/api/:path*  ->  VERIFIED_RENDER_ORIGIN/api/:path*
/(.*)       ->  /index.html
```

`VERIFIED_RENDER_ORIGIN` is a placeholder, not a deployment URL. Preserve `/api` in the destination because the Express routes include it. The current configuration contains the SPA fallback; the external API destination remains pending until Render is created. Static assets must continue to load normally, while direct visits to `/privacy`, `/terms`, and unknown frontend paths reach the application. API paths must reach Express rather than return `index.html`.

An external rewrite forwards requests to the backend while retaining the frontend URL in the browser. Vercel honors upstream cache headers for external rewrites; preserve the API's `Cache-Control: no-store` and do not add a caching override to task responses. See [Vercel's official rewrite documentation](https://vercel.com/docs/routing/rewrites).

## Operational behavior

- Each API response carries a server-generated UUID in `X-Request-Id`, exposed through CORS for direct API clients.
- Production request logs are JSON with event, request ID, HTTP method, redacted route, response status and elapsed milliseconds. They omit task text, raw IDs in routes, query values, request bodies and raw headers. Logger failures cannot interrupt requests.
- Task and health responses, including task errors, use `no-store`; Express ETags are disabled. Browser security headers cover content sniffing, frames, referrers and unnecessary camera/microphone/location access.
- SIGINT/SIGTERM stops accepting new work and allows up to ten seconds for accepted requests before closing remaining connections. Shutdown does not persist tasks.
- The Overdue metric derives unfinished past-due tasks from their existing fields. API statuses remain `pending`, `in_progress`, and `completed`.

These additions help evaluation and debugging. The public application remains an unauthenticated shared demo; use sample data rather than real customer information. No external laundry booking, payment or customer-account system is included.

## Hosted acceptance checklist

- [ ] Source is pushed, and the public repository contains both workspaces, lockfile, README, API/OpenAPI documents, environment examples, tests and current screenshots. Live environment files and credentials remain excluded.
- [ ] Render health responds with `{ "status": "ok", "storage": "memory" }`; the service respects its assigned port and has one instance.
- [ ] Vercel external `/api` routing returns JSON rather than the SPA HTML. No frontend request targets a localhost address.
- [ ] Browser GET collection/detail, POST, PUT and DELETE work through the hosted frontend; create returns 201 and delete returns 200. Invalid inputs return 400; missing records return 404.
- [ ] Search, combined filters, all sorting categories, pagination, dark mode, 300ms debouncing and interactive Swagger work on the deployed version. The Overdue shortcut and inline status change update summary/filter/page state correctly.
- [ ] Loading, empty, no-match, errors/retry and mutation feedback remain usable, including a backend waking from idle. A failed mutation retains the user's input/current saved value.
- [ ] Desktop/mobile layouts, navigation/dialog keyboard handling, unknown-page recovery, privacy/terms refresh and production assets work.
- [ ] Swagger loads and Execute calls the hosted API; OpenAPI has no localhost server override. Request IDs, `no-store`, and security headers survive the frontend proxy.
- [ ] README pending entries are replaced with real frontend/API/Swagger links. Any deployed restart is described accurately as resetting task data.
- [ ] Local checks are rerun after operational changes; hosted smoke evidence is recorded separately. No pending hosted result is reported as passed.

The [submission checklist](SUBMISSION-CHECKLIST.md) maps all assignment deliverables and bonuses. Root assembles the final reply using the employer's actual requested format; this guide does not send a message.
