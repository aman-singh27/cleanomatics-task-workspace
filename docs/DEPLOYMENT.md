# Deployment and hosted review

Manual approval and subsequent publication authorization have been received. Source is pushed to the public [aman-singh27/cleanomatics-task-workspace](https://github.com/aman-singh27/cleanomatics-task-workspace) repository. The employer requested its link by **9 October 2026, end of day**. Employer email has not been sent; no address or correspondence is included here.

| Deliverable         | Status                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub repository   | [Published main](https://github.com/aman-singh27/cleanomatics-task-workspace); CI passed for `74b5f3e`                                            |
| Frontend URL        | [Live workspace](https://cleanomatics-task-workspace.vercel.app)                                                                                  |
| API base URL        | [Render API](https://cleanomatics-task-api.onrender.com/api/tasks); API base is `/api`                                                            |
| Swagger URL         | [Frontend-proxied docs](https://cleanomatics-task-workspace.vercel.app/api/docs/) — rendering and Execute GET 200 verified by the hosted verifier |
| OpenAPI URL         | [OpenAPI JSON](https://cleanomatics-task-api.onrender.com/api/openapi.json)                                                                       |
| Hosted smoke checks | Verification records all 14 groups passed on `74b5f3e`. See [VERIFICATION.md](VERIFICATION.md)                                                    |

The URLs are actual deployments. [CI run 37806687947](https://github.com/aman-singh27/cleanomatics-task-workspace/actions/runs/37806687947) passed all 149 local checks for `74b5f3e`. The hosted verifier executed all 14 hosted groups successfully on that revision, including Swagger proxy Execute GET 200, with no unhandled browser errors and cleanup of only the verifier's own task.

## Backend on Render

Use a Node web service connected to this repository. [render.yaml](../render.yaml) defines the intended single-instance deployment:

| Setting                | Value                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Repository root        | Repository root; both npm workspaces remain available                                                         |
| Runtime / Node version | Node / `22.17.0`                                                                                              |
| Plan / instances       | Free / one                                                                                                    |
| Region                 | Singapore                                                                                                     |
| Branch                 | `main`                                                                                                        |
| Build command          | `npm ci --omit=dev`                                                                                           |
| Start command          | `npm run start --workspace backend`                                                                           |
| Blueprint health check | `/api/health` in render.yaml; actual connector-created service uses TCP                                       |
| `NODE_ENV`             | `production`                                                                                                  |
| `HOST`                 | `0.0.0.0`                                                                                                     |
| `PORT`                 | Render-provided value; do not replace with a fixed development port                                           |
| `SEED_DEMO_DATA`       | `true` for the review examples; `false` starts empty                                                          |
| `REQUEST_LOGGING`      | `true`; set `false` to disable request logs                                                                   |
| `CORS_ORIGINS`         | Includes `https://cleanomatics-task-workspace.vercel.app`; hosted verifier confirmed allowed-origin responses |

The live service was created through the Render connector, whose available fields did not support configuring `healthCheckPath`. Its configured check is TCP, not the blueprint's HTTP `/api/health` check. The hosted verifier separately confirmed the application health endpoint returns status `ok` and storage `memory`. The blueprint describes reproducible desired settings; it does not prove the connector applied every field.

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

`API_PROXY_TARGET` only configures Vite's development proxy; it does not route the deployed frontend. Current source puts an explicit trailing-slash Swagger rewrite and the API wildcard **ahead of** the SPA fallback:

```text
/api/docs/  ->  https://cleanomatics-task-api.onrender.com/api/docs/
/api/:path* ->  https://cleanomatics-task-api.onrender.com/api/:path*
/(.*)       ->  /index.html
```

The first hosted verification found `/api/docs/` returning the application's HTML while ordinary API paths and Swagger assets worked. Commit `74b5f3e` adds the explicit docs rewrite; the final hosted run confirmed Swagger rendering and Execute GET 200. Preserve `/api` in destinations because Express routes include it. Static assets, `/privacy`, `/terms` and unknown frontend route recovery were exercised by the hosted verifier. API paths must reach Express rather than return `index.html`.

An external rewrite forwards requests to the backend while retaining the frontend URL in the browser. Vercel honors upstream cache headers for external rewrites; preserve the API's `Cache-Control: no-store` and do not add a caching override to task responses. See [Vercel's official rewrite documentation](https://vercel.com/docs/routing/rewrites).

## Operational behavior

- Each API response carries a server-generated UUID in `X-Request-Id`, exposed through CORS for direct API clients.
- Production request logs are JSON with event, request ID, HTTP method, redacted route, response status and elapsed milliseconds. They omit task text, raw IDs in routes, query values, request bodies and raw headers. Logger failures cannot interrupt requests.
- Task and health responses, including task errors, use `no-store`; Express ETags are disabled. Browser security headers cover content sniffing, frames, referrers and unnecessary camera/microphone/location access.
- SIGINT/SIGTERM stops accepting new work and allows up to ten seconds for accepted requests before closing remaining connections. Shutdown does not persist tasks.
- The Overdue metric derives unfinished past-due tasks from their existing fields. API statuses remain `pending`, `in_progress`, and `completed`.

These additions help evaluation and debugging. The public application remains an unauthenticated shared demo; use sample data rather than real customer information. No external laundry booking, payment or customer-account system is included.

## Hosted acceptance checklist

- [x] Source is pushed, and the public repository contains both workspaces, lockfile, README, API/OpenAPI documents, environment examples, tests and screenshots. Live environment files and credentials remain excluded.
- [x] The hosted verifier confirmed Render health returns `{ "status": "ok", "storage": "memory" }`; one API instance listens on the assigned port. Actual platform health is TCP.
- [x] The hosted verifier confirmed Vercel external task API routing returns JSON rather than SPA HTML. Browser requests use the frontend `/api` origin.
- [x] The hosted verifier confirmed hosted browser GET/detail, POST, PUT and DELETE, invalid inputs 400 and missing records 404; create 201 and delete 200.
- [x] The hosted verifier exercised hosted search, combined filters, all sorting categories, pagination boundaries, dark mode and inline status. Overdue and timing/error regressions are covered by local checks.
- [x] The hosted verifier exercised desktop/mobile layouts and frontend unknown/privacy/terms route recovery; local checks cover keyboard/error lifecycle details.
- [ ] Cold-start/error behavior is documented and locally covered; a separate hosted cold-start test has not been claimed.
- [x] The hosted verifier confirmed Swagger rendering and Execute GET 200 through the frontend proxy; OpenAPI uses the current host. Header/health checks passed.
- [x] Actual frontend/API/Swagger links are recorded; memory reset behavior is explicit.
- [x] Verification ran 149 local checks after operational changes; successful `74b5f3e` CI is linked. All 14 hosted groups passed; evidence remains separate from local results.

Browser verification is Chromium only. No Firefox/Safari run, real 15-minute-idle cold-start test or paid-production durability claim is made.

The [submission checklist](SUBMISSION-CHECKLIST.md) maps all assignment deliverables and bonuses. The final reply follows the employer's actual requested format; this guide does not send a message.
