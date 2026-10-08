# Local verification report

Verified on 8 October 2026 on Windows using Node.js 22.17.0 and npm 10.9.2. The user has completed manual review and authorized GitHub publication and hosting. Employer email has not been sent. Hosted verification is recorded separately below when executed.

## Publication revision checks

`npm run check` passed after the operational middleware, graceful shutdown, and overdue queue additions: 73 frontend tests, 57 API tests, and 19 Chromium scenarios (149 total). Frontend coverage: statements 90.06%, branches 84.67%, functions 93.42%, lines 91.21%. Backend coverage: 100% across all four measures and 11 covered source files; process bootstrap is excluded. `npm audit --omit=dev` reported zero vulnerabilities. Updated six screenshots captured successfully with no page errors or mobile overflow.

The new real API scenario covers overdue inclusion/exclusion, clearing search/priority through the metric, resetting pagination, inline completion removing the task, focus recovery, preserving editable fields, and rejecting `overdue` as an API status. Overdue is a derived view; stored status enums remain unchanged. Privacy copy now describes application metadata logging and hosting providers.

The results below describe the earlier local review revision and are retained as the review history.

## Hosted acceptance

Public source: [GitHub repository](https://github.com/aman-singh27/cleanomatics-task-workspace). Frontend: [live workspace](https://cleanomatics-task-workspace.vercel.app). API: [health](https://cleanomatics-task-api.onrender.com/api/health). Documentation: [Swagger through the frontend](https://cleanomatics-task-workspace.vercel.app/api/docs/) and [direct API Swagger](https://cleanomatics-task-api.onrender.com/api/docs/).

All 14 hosted smoke checks passed on runtime revision `74b5f3e` on 8 October 2026. The verifier used actual public services and Chromium without intercepting successful responses. It confirmed request-ID/security/no-store/CORS headers, invalid-input 400 and missing-record GET/PUT/DELETE 404, required-form validation, POST 201, individual GET/details, PUT form and inline status changes, DELETE 200, search/combined filters/all sorting modes/pagination, metric counts, theme-only persistence, mobile controls, unknown-page/privacy/terms routing, published OpenAPI, and Swagger Execute GET returning 200. No unhandled browser errors occurred. The verifier deleted only its own generated task, leaving the seeded collection intact. Full evidence: [hosted-verification.json](hosted-verification.json).

The first hosted checks found that Swagger's redirected `/api/docs/` URL fell through the generic API wildcard to the SPA fallback. An explicit directory rewrite fixes this and the browser execution test passed after redeployment. An earlier ambiguous Swagger test selector was also corrected. Screenshots were refreshed from the public frontend after verifier cleanup.

[GitHub Actions for `74b5f3e`](https://github.com/aman-singh27/cleanomatics-task-workspace/actions/runs/37806687947) passed the complete 149-test suite on Ubuntu. Vercel's Git integration automatically deploys main to the public project alias; Render auto-deploys the same branch to one free Node instance in Singapore. Render's actual service uses TCP platform health checking; `/api/health` was verified over HTTP. The reproducible blueprint specifies HTTP health checking for a future blueprint-created service.

Limitations: Chromium automation only; no Safari, Firefox, physical-device testing, sustained load test, or deliberately induced 15-minute free-tier sleep. Tasks reset on backend restart and are shared without authentication, as required for this evaluation demo. Employer reply is prepared locally and has not been sent.

## Earlier local review: executed checks

| Check                              | Result                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check`                    | Passed: TypeScript, production build, coverage suites and browser tests                      |
| Frontend Vitest                    | 71 tests passed across seven suites                                                          |
| Backend Vitest/Supertest           | 47 integration tests passed                                                                  |
| Playwright Chromium                | 18 end-to-end scenarios passed against real isolated Express/Vite servers                    |
| Frontend reported coverage         | Statements 87.85%, branches 83.41%, functions 91.44%, lines 89.02%                           |
| Backend reported coverage          | 100% statements, branches, functions and lines across nine files; startup bootstrap excluded |
| Coverage thresholds                | All configured 80% gates passed                                                              |
| `npm run format:check`             | Passed                                                                                       |
| `npm audit`                        | Zero reported dependency vulnerabilities                                                     |
| Screenshot capture                 | Six artifacts saved; no page errors; no mobile horizontal overflow                           |
| Independent plan/source/UX reviews | PASS; actionable review findings fixed and regression-tested                                 |

The production build completed successfully. The GitHub Actions workflow is prepared to run the same checks after publication; no remote CI run has been claimed. Browser automation covers Chromium only; Firefox, Safari and physical devices have not been tested.

## Browser coverage

The 18 scenarios cover:

1. Required fields and complete real API create, details, edit and delete.
2. Debounced title/description search, combined filters, sorting and pagination.
3. Failed initial load with Retry, delayed loading state and empty workspace.
4. Failed form save retains values and supports retry.
5. Mobile forms/details and theme-only browser persistence.
6. Keyboard dialog containment and reduced-motion layout.
7. Delete pending/failure focus and last-page recovery.
8. Details fetch failure/retry and details-to-edit focus restoration.
9. Creation during delayed initial loading preserves existing records.
10. Required metadata and controls at 320, 390, 768, 1024 and 1440px; hidden navigation cannot intercept keyboard focus; no horizontal overflow.
11. Unknown-page recovery and real privacy/terms pages.
12. Flat computed surfaces, no panel shadows/gradients, restrained radii and real completion progress.
13. Inline status saves preserve other fields, block duplicate/conflicting actions, expose failures/retry, update metrics/filter membership and work on mobile.
14. Selecting the current status metric resets pagination and status shortcuts are absent from the sidebar.
15. Mobile navigation focus entry, Tab containment, Escape, close button/backdrop, focus return and desktop-resize cleanup.
16. Remaining controls: form Cancel/X/backdrop, clear filters, search shortcut, additional sort options, documentation popup and real Swagger Execute, details-delete cancel/confirm, toast dismissal, empty-state New task and Skip to tasks.
17. Invalid successful HTTP responses produce recoverable list, form and details errors; retry succeeds without losing form values.
18. Controlled rendering failure keeps diagnostics private; Try again remains safe and Reload page restores the healthy workspace.

E2E runs its own empty store at ports 4001/5174, then stops those test servers. It does not mutate the manual preview's port-4000 data. Controlled delays and failure interception exercise recovery; successful CRUD uses the actual Express backend.

## API and state verification

Integration tests verify exact task fields/enums, defaults, real calendar dates, null due dates, required trimming/length/type validation, malformed JSON, oversized payloads, unknown fields, generated UUID/timestamps, immutable identity/creation timestamp, correct 200/201/400/404/413/500 responses, centralized safe JSON errors, CORS/preflight, isolated memory stores and OpenAPI parity.

Frontend tests exercise selection/date logic, REST calls/errors, task loading/mutation races, validation, modal focus, status-save state, unknown-page recovery and error-boundary retry. The final independent review found and closed pagination reset, stale edit during status save and focus-stealing issues. See [source review](CODE-REVIEW.md) and [daily-use review](FINAL-UX-REVIEW.md).

The user's fresh completeness request triggered a second extraction of the original DOCX and an independent [exact-document/control audit](FINAL-COMPLETENESS-AUDIT.md). That audit confirmed every locally implementable required and bonus item, and found two additional robustness/accessibility gaps. Both are fixed: successful API bodies are validated before entering state (including matching GET/PUT identities and real dates), and mobile navigation now manages keyboard focus and background interaction. Row Edit/Delete also expose their task title as an accessible description.

The final revision passed **136 tests total: 71 frontend, 47 backend and 18 browser scenarios**. All five assignment API operations were exercised; every application control is mapped in the independent audit. The live port-5175 preview was additionally inspected in the Codex browser: empty-form validation, close/focus return, navigation opening focus and Escape/focus return were observed directly. User preview task records were preserved. Refreshed screenshots again reported no page errors or mobile overflow.

## Screenshots inspected

- [Desktop light](../output/playwright/desktop-light.png)
- [Desktop dark](../output/playwright/desktop-dark.png)
- [Mobile light](../output/playwright/mobile-light.png)
- [Mobile dark](../output/playwright/mobile-dark.png)
- [Task details](../output/playwright/task-details.png)
- [Mobile form](../output/playwright/mobile-form.png)

Earlier screenshots showed the user's live preview records; the current artifacts are refreshed from the hosted demo. Labels, descriptions, created/due dates, inline status controls and all required actions fit the reviewed layouts. No decorative gradients, blanket shadows, glass surfaces, oversized radii or promotional feature grids were added. The sidebar scrollbar uses a navy track and muted navy thumb.

## Earlier local review handoff

Current frontend: **http://127.0.0.1:5175/**. API: **http://127.0.0.1:4000/api**. Swagger: **http://127.0.0.1:4000/api/docs/**. Follow [manual review steps](MANUAL-REVIEW.md).

Tasks remain in backend memory as required. Restarting the API resets them; only theme preference persists in the browser. The frontend 404 screen is client-side SPA route recovery, while backend missing routes return HTTP 404. No authentication or persistent database is included in this assignment. This earlier handoff preceded the user's hosting authorization; the hosted acceptance section records completed publication.
