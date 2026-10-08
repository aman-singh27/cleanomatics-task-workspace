# Independent plan review

Reviewed `docs/PLAN.md` against the extracted assignment and `docs/REQUIREMENTS.md` on 2026-10-08, before feature implementation. Review uses the code-reviewer skill's priority order: security, performance, correctness, maintainability, and testing.

**Verdict: PASS. No blocking requirement gaps.** The planned architecture satisfies the assignment, includes every bonus, and honors the user's manual-review gate. Implementation should pin the clarifications below in API docs/tests.

## Coverage assessment

| Area                                  | Verdict                          | Evidence in plan                                                                                                                  |
| ------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Required frontend screens/actions     | Covered                          | Dashboard, five-field create/edit form, API-fetched details, named delete confirmation                                            |
| Task data and exact REST status codes | Covered                          | All eight task fields, exact enums, 201 POST, 200 DELETE, 400 validation, 404 missing records                                     |
| Backend structure/storage             | Covered                          | Express ESM, in-memory Map, routes/controllers/services, validation/error middleware, isolated app factory                        |
| Frontend structure/states             | Covered                          | Dedicated typed API layer, reusable components, loading/empty/error/retry/mutation success states                                 |
| Bonus features                        | Covered                          | Search title/description, both filters, all three sorts, pagination, dark mode, debounce, Swagger                                 |
| Configuration/security                | Covered                          | Environment examples, exact-origin CORS, bounded fields/payloads, unknown-key rejection, safe JSON errors                         |
| Tests and verification                | Covered                          | API/component tests, coverage, typecheck/build, real backend CRUD E2E, controlled loading/error scenarios, keyboard/mobile checks |
| Deliverables                          | Covered                          | README, API docs, Swagger spec, environment examples, screenshots, local Git, publication deferred                                |
| User's visual direction               | Covered with research dependency | Employer website observations must precede finalized theme; original workspace uses observed palette/style                        |
| Publication boundary                  | Covered                          | Local preview and review guide first; no deployment, push, or employer communication                                              |

## Clarifications before implementation

These points are contract decisions, not gaps in assignment coverage:

1. **PUT optional fields.** The plan requires title/description and submits all five editable values, but should document server behavior when an external client omits status, priority, or dueDate. Recommended replacement semantics: use the same defaults as POST (`pending`, `medium`, `null`). Reject null status/priority and nonstring values. Do not permit caller-controlled id/timestamps.
2. **Date correctness.** Accept only actual `YYYY-MM-DD` calendar dates or null; test leap days, month/day overflow, malformed strings, optional blank/null conversion, and overdue dates. Date-only values must display without UTC conversion shifting the selected date.
3. **Stable sorting/pagination.** Define direction labels and priority order. Resolve equal sort keys deterministically, for example by id. All combinations of search/status/priority must apply before sorting/pagination. Clamp page after deletion; reset page when search/filter/sort changes. Keep null due dates last in both directions.
4. **HTTP-body edge cases.** Test arrays, null, primitives, wrong field types, whitespace required fields, malformed JSON, unknown fields, and oversized payloads. Requests without a usable JSON body should receive a JSON 400 rather than an uncaught 500. Unknown IDs should remain predictable 404.
5. **Async UI correctness.** A slow detail request for task A must not overwrite selected task B. Double submission/deletion must be prevented while pending. Mutation success refreshes list/details without losing meaningful failure feedback; network failure retains entered form values.
6. **Accessibility acceptance.** Desktop/mobile tests should cover visible focus, accessible input error associations, live success/error feedback, focus trapping/restoration, Escape, labeled icon buttons, and reduced-motion preference. The required task description must remain visible in mobile list presentation.

## Architecture rationale and limits

Client-side search/filter/sort/pagination is appropriate for this small, memory-only assignment and preserves the required simple GET array contract. It should be stated in README; avoid implying a scalable server-query interface that does not exist.

Demo seeding is acceptable if the seed flag is explicit, seeded tasks live only in memory, tests start from empty isolated stores, and README explains that restarting the server restores seed records rather than durable user changes. Only theme preference may persist in the browser.

No auth is required. A polished demo should not introduce fake login, invitations, integrations, or navigation that suggests unfinished functionality. Keep scope on working task management.

Coverage targets supplement meaningful tests. Passing a numerical threshold alone does not prove loading/error UX, responsive layout, dialog behavior, date handling, or actual API integration; the plan appropriately includes browser verification.

## Review completion gate

Feature implementation can proceed. Before the user receives the manual preview, replace planned requirements statuses with concrete file/test/screenshot evidence, run the documented install/build/test path, and report any unperformed checks or remaining limits precisely. GitHub delivery remains a later, explicitly authorized step.
