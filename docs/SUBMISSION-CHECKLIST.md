# Submission and hosted-review checklist

Source checked again on 8 October 2026: `Full_Stack_Developer_Assignment_Task_Management_System.docx`, extracted directly from its ZIP/XML. Manual approval and subsequent publication authorization have been received, superseding the earlier local-review-only gate. GitHub source, Vercel frontend and Render API are public. The hosted verifier confirmed all 14 hosted groups on `74b5f3e`, including frontend-proxied Swagger rendering and Execute GET 200. Employer email has not been sent. This checklist does not itself send mail or perform external actions.

## Exact document deliverables

| Required deliverable                              | Prepared evidence                                                                                                 | Completion status                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| GitHub repository containing frontend and backend | Public repository with both npm workspaces, lockfile, tests and successful CI                                     | Complete; repository link included below                                                                   |
| README with setup/run instructions                | Prerequisites, install/dev/build/test commands, architecture/configuration, actual URLs and memory-reset behavior | Complete; setup and live links included                                                                    |
| API endpoint documentation                        | README endpoint table, `docs/API.md`, `backend/API.md`                                                            | Complete; documentation and API links included                                                             |
| Postman collection **or** Swagger documentation   | `backend/openapi.json`, runtime `/api/openapi.json`, interactive `/api/docs/`                                     | Complete; hosted verifier confirmed hosted rendering/Execute GET; separate Postman collection not required |
| `.env.example` if variables used                  | Backend and frontend examples published; live env files ignored; actual hosted routing/origin configured          | Complete                                                                                                   |
| Screenshots **or** short demo video               | Six PNGs in `output/playwright/`; capture script                                                                  | Complete; six hosted screenshots refreshed after verifier cleanup                                          |

The document does **not** specify an email recipient, subject line, reply template, upload form, repository naming convention or firm submission deadline. Its “2–3 days” is suggested. The employer email asks for the GitHub link by **9 October 2026, end of day**. Reply formatting comes from that email; no private address or transcript is included here.

## All seven bonus items

| #   | Exact bonus                                | Implemented evidence                                                                                                | Hosted reviewer check                                          |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Search title or description                | `frontend/src/lib/tasks.ts` searches both fields case-insensitively                                                 | Search a phrase present only in description                    |
| 2   | Filter status and priority                 | Combined selector, native dropdowns and status metric shortcuts                                                     | Combine status and priority, then reset via a metric           |
| 3   | Sort created date, priority or due date    | Created ascending/descending, priority high-first, due ascending/descending; deterministic ties and null dates last | Exercise all three sort categories                             |
| 4   | Pagination                                 | Six tasks/page, previous/next, reset/clamp on filter/delete                                                         | Browse pages and delete final record on last page              |
| 5   | Dark mode                                  | CSS theme and theme-only localStorage preference                                                                    | Toggle and reload; theme persists without browser task storage |
| 6   | Debounced search                           | 300ms `useDebounce` with timer cleanup                                                                              | Type continuously, verify settled matching results             |
| 7   | Clean Postman or Swagger API documentation | OpenAPI specification and Swagger UI                                                                                | Open hosted docs, Try it out and Execute GET/POST/PUT/DELETE   |

All seven bonus capabilities were present before hosting work began. The optional Overdue shortcut is additional operational convenience, not a missing assignment bonus.

## Actual publication links

| Link              | Actual value                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| GitHub repository | [Public source](https://github.com/aman-singh27/cleanomatics-task-workspace)                                               |
| Hosted frontend   | [Live workspace](https://cleanomatics-task-workspace.vercel.app)                                                           |
| Hosted API base   | `https://cleanomatics-task-api.onrender.com/api` — [task collection](https://cleanomatics-task-api.onrender.com/api/tasks) |
| Hosted Swagger    | [Swagger](https://cleanomatics-task-workspace.vercel.app/api/docs/) — rendering and Execute GET 200 verified               |
| OpenAPI JSON      | [Specification](https://cleanomatics-task-api.onrender.com/api/openapi.json)                                               |
| README            | [Setup and architecture](https://github.com/aman-singh27/cleanomatics-task-workspace/blob/main/README.md)                  |
| Screenshots       | [Six screenshots](https://github.com/aman-singh27/cleanomatics-task-workspace/tree/main/output/playwright)                 |

These are real published links. The first hosted run exposed `/api/docs/` returning SPA HTML. Commit `74b5f3e` adds an exact trailing-slash rewrite before the API wildcard; the final hosted run passed all 14 groups, including Swagger rendering and Execute GET 200. Verification records 149 passing local checks and [successful CI for 74b5f3e](https://github.com/aman-singh27/cleanomatics-task-workspace/actions/runs/37806687947). See [DEPLOYMENT.md](DEPLOYMENT.md) for actual Render TCP health versus blueprint HTTP health.

## Required hosted acceptance checks

- [x] Repository contains both workspaces, README/API/OpenAPI/environment examples, screenshots, tests and lockfile; no live environment files or credentials.
- [x] The hosted verifier confirmed production task requests reach the deployed API through Vercel's `/api` rewrite.
- [x] The hosted verifier confirmed allowed frontend origin, platform port and application health response. Actual Render health check is TCP; blueprint HTTP check is separate.
- [x] Backend runs as one Node/Express process and instance with one in-memory collection; no persistence added.
- [x] The hosted verifier confirmed hosted unknown-page recovery and privacy/terms navigation.
- [x] The hosted verifier confirmed real hosted CRUD and invalid/missing-record contracts: GET/detail 200/404, POST 201/400, PUT 200/404 plus 400, DELETE 200/404.
- [x] Required fields and exact status/priority enums are source-verified and covered by passing local checks.
- [x] All seven bonuses are implemented and pass local checks; the hosted verifier exercised hosted search/filter/sort/page/theme and inline status/mobile flows. Local regressions additionally cover debounce timing and pending/error/retry/focus details.
- [x] The hosted verifier confirmed Swagger through the frontend proxy, Execute GET 200, and OpenAPI endpoint definitions/current-host routing.
- [x] README and privacy/terms describe backend-memory resets; final reply must retain that limitation.
- [x] Verification records 149 local/CI checks and all 14 hosted groups passed. No Firefox/Safari or real 15-minute-idle cold-start test is claimed.

## Small operational additions: allowed scope and review gates

| Implemented addition      | Purpose                                                   | Review evidence                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request ID                | Correlate a failed API action with its response/log       | Source verified: server-generated UUID response header exposed by CORS; no task-model change                                                                                            |
| Safe structured JSON logs | Diagnose status/latency/errors                            | Source verified: event/id/method/redacted route/status/duration only; no task data/query/raw headers; logger failure cannot interrupt API                                               |
| Security headers          | Reduce unnecessary browser exposure                       | Source verified: no-sniff/frame/referrer/permissions/cross-domain headers without a new CSP that blocks Swagger; hosted verifier confirmed hosted headers and Swagger rendering/Execute |
| API cache control         | Avoid stale in-memory task snapshots                      | Source verified: task/health responses use no-store; ETags disabled; hosted verifier confirmed hosted CRUD update visibility                                                            |
| Bounded graceful shutdown | Drain accepted work during deploy/restart                 | Source verified: once-only shutdown, up to 10 seconds drain then close connections; no persistence added                                                                                |
| Optional Overdue filter   | Help laundry dispatch staff find unfinished past-due work | Source verified: separate TaskView and derived dueDate/noncompleted predicate; stored/API status enums unchanged                                                                        |

These additions support the assignment's architecture/error-handling goals without expanding into bookings, payments, customer accounts or laundry integrations. Independent source review passed for operations middleware, shutdown, app/config/server and the derived Overdue filter. No assignment constraint violation found. Verification records the updated local checks and hosted groups identified above; this reviewer did not execute those suites. Browser evidence is Chromium only, and a real 15-minute-idle cold-start test is not claimed.

## Employer reply assembly

The final reply follows the employer email format. At minimum, the requested deliverables can be represented by repository, frontend and Swagger links; README and screenshots can remain in the repository unless the email asks for attachments or a different format. State the complete bonus set and memory-only storage accurately. Avoid claims of endorsement or features outside this task-management application. Do not invent recipients, subject lines, deadlines, hosted URLs or test outcomes.
