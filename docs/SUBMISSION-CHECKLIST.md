# Submission and hosted-review checklist

Source checked again on 8 October 2026: `Full_Stack_Developer_Assignment_Task_Management_System.docx`, extracted directly from its ZIP/XML. The user has now authorized GitHub publication and hosting the frontend/API. This supersedes the earlier local-review-only gate. This checklist does not itself send mail or perform external actions.

## Exact document deliverables

| Required deliverable                              | Prepared evidence                                                                                               | Remaining submission action                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| GitHub repository containing frontend and backend | npm-workspace repository with `frontend/` and `backend/`, lockfile, tests and CI workflow                       | Publish repository; verify evaluator can access it; fill repository URL below                |
| README with setup/run instructions                | README has prerequisites, install/dev/build/test commands, architecture/configuration and memory-reset behavior | Add verified hosted URLs and update earlier publication-deferred wording                     |
| API endpoint documentation                        | README endpoint table, `docs/API.md`, `backend/API.md`                                                          | Link accessible repository document and live API base                                        |
| Postman collection **or** Swagger documentation   | `backend/openapi.json`, runtime `/api/openapi.json`, interactive `/api/docs/`                                   | Verify hosted Swagger loads and Execute works; a separate Postman collection is not required |
| `.env.example` if variables used                  | Backend and frontend examples; live env files ignored                                                           | Keep examples in repository; configure actual hosted origin/API values in platform settings  |
| Screenshots **or** short demo video               | Six PNGs in `output/playwright/`; capture script                                                                | Ensure current hosted UI matches artifacts; link screenshot folder or selected images        |

The document does **not** specify an email recipient, subject line, reply template, upload form, repository naming convention or firm submission deadline. Its “2–3 days” is a suggested completion period. Exact reply formatting and deadline must come from the employer email reviewed by the root agent. Do not invent those details.

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

## Links — fill only after verified publication

| Link              | Actual value                                |
| ----------------- | ------------------------------------------- |
| GitHub repository | `GITHUB_REPOSITORY_URL` — pending           |
| Hosted frontend   | `FRONTEND_URL` — pending                    |
| Hosted API base   | `BACKEND_ORIGIN/api` — pending              |
| Hosted Swagger    | `BACKEND_ORIGIN/api/docs/` — pending        |
| OpenAPI JSON      | `BACKEND_ORIGIN/api/openapi.json` — pending |
| README            | `REPOSITORY_README_URL` — pending           |
| Screenshots       | `REPOSITORY_SCREENSHOTS_URL` — pending      |

These are explicit placeholders, not claimed deployments. Root replaces them with real accessible links before preparing the final employer submission.

## Required hosted acceptance checks

- [ ] Repository contains both workspaces, README/API/OpenAPI/environment examples, screenshots, tests and lockfile; no live environment files or credentials.
- [ ] Frontend production bundle reaches the deployed API. `VITE_API_URL` includes `/api` when it is a separate origin; development-only proxy settings are not mistaken for hosted routing.
- [ ] Backend `CORS_ORIGINS` contains the exact hosted frontend origin. Platform-injected `PORT` is respected; health route responds with memory storage and status ok.
- [ ] Backend runs as one persistent Node/Express process with one in-memory task store. No database, disk persistence or Firebase added; multiple independent API instances are avoided.
- [ ] Frontend unknown-page routing returns the application's useful recovery page; refresh on privacy/terms works.
- [ ] Browser CRUD uses actual hosted REST requests. GET collection 200; GET individual 200/404; POST 201/400; PUT 200/404 plus validation 400; DELETE 200/404.
- [ ] Required fields and enums remain exact. Stored status is only `pending | in_progress | completed`; priority is only `low | medium | high`.
- [ ] All seven bonus workflows work on the hosted bundle. Desktop/mobile layout, navigation/dialog keyboard cycles, inline pending/error/retry and task dates remain usable.
- [ ] Swagger UI and Execute remain functional after security headers. Hosted OpenAPI reflects the deployed code; no localhost server URL prevents execution.
- [ ] README, privacy/terms and final reply explain backend-memory reset behavior accurately. Restart restores seed examples when enabled; it does not preserve user changes.
- [ ] Final checks run after any operational additions; hosted smoke evidence and URLs recorded. Do not describe unexecuted hosted checks as passed.

## Small operational additions: allowed scope and review gates

| Addition under construction | Purpose                                                   | Review gate                                                                                                                                          |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request ID                  | Correlate a failed API action with its response/log       | Source verified: server-generated UUID response header exposed by CORS; no task-model change                                                         |
| Safe structured JSON logs   | Diagnose status/latency/errors                            | Source verified: event/id/method/redacted route/status/duration only; no task data/query/raw headers; logger failure cannot interrupt API            |
| Security headers            | Reduce unnecessary browser exposure                       | Source verified: no-sniff/frame/referrer/permissions/cross-domain headers without a new CSP that blocks Swagger; hosted browser check still required |
| API cache control           | Avoid stale in-memory task snapshots                      | Source verified: task/health responses use no-store; ETags disabled; verify hosted update visibility                                                 |
| Bounded graceful shutdown   | Drain accepted work during deploy/restart                 | Source verified: once-only shutdown, up to 10 seconds drain then close connections; no persistence added                                             |
| Optional Overdue filter     | Help laundry dispatch staff find unfinished past-due work | Source verified: separate TaskView and derived dueDate/noncompleted predicate; stored/API status enums unchanged                                     |

These additions support the assignment's architecture/error-handling goals without expanding into bookings, payments, customer accounts or laundry integrations. Independent source review passed for `backend/src/middleware/operations.js`, `shutdown.js`, updated app/config/server and the derived Overdue filter. No assignment constraint violation found. Updated tests and hosted checks remain the root/implementation owners' responsibility; this reviewer has not executed or claimed them.

## Employer reply assembly

Root first reads the actual email and follows its stated formatting. At minimum, the requested deliverables can be represented by repository, frontend and Swagger links; README and screenshots can remain in the repository unless the email asks for attachments or a different format. State the complete bonus set and memory-only storage accurately. Avoid claims of endorsement or features outside this task-management application. Do not invent recipients, subject lines, deadlines, hosted URLs or test outcomes.
