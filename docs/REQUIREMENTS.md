# Assignment requirements and verification checklist

Source: `C:/Users/Aman Singh/Downloads/Full_Stack_Developer_Assignment_Task_Management_System.docx`, extracted from `word/document.xml` on 2026-10-08. The document supplies project requirements; it does not authorize external publication or communication.

The user asks for a planned, independently reviewed, visually polished implementation, tests, and a working local preview. Deployment, GitHub publication, and employer submission remain deferred until the user manually verifies the application and explicitly requests those actions.

## Required requirements

| ID  | Source            | Requirement                                                                           | Acceptance evidence                                                                         | Status                          |
| --- | ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| R01 | 1                 | React or Next.js frontend                                                             | React application builds and opens locally                                                  | Verified                        |
| R02 | 1                 | Node.js + Express preferred, or Python + FastAPI                                      | Express HTTP API starts from documented command                                             | Verified                        |
| R03 | 1, 6, constraints | Task data in backend memory only; no database or Firebase                             | Store is an array/object/Map; restart resets task data; no task browser persistence         | Verified                        |
| R04 | 1                 | REST API and Git + GitHub                                                             | Endpoint contracts below; local Git review; GitHub publication deferred                     | Local verified; remote deferred |
| R05 | 2A                | Dashboard displays task list                                                          | Dashboard renders tasks returned by API                                                     | Verified                        |
| R06 | 2A                | List shows title, description, status, priority, created date                         | Desktop and mobile browser assertions/screenshots                                           | Verified                        |
| R07 | 2A                | Create, edit, view, delete actions                                                    | Complete CRUD through UI with API-backed state refresh                                      | Verified                        |
| R08 | 2A, 8             | Loading, success, empty, error states                                                 | Browser tests for delayed response, mutation success, no data, failed response/retry        | Verified                        |
| R09 | 2A                | Responsive desktop/mobile                                                             | Browser checks at desktop and mobile widths; no horizontal overflow or inaccessible actions | Verified                        |
| R10 | 2B                | Create form includes title, description, status, priority, due date                   | All five inputs visible and usable                                                          | Verified                        |
| R11 | 2B, 8             | Title and description required; client validation before submission                   | Empty and whitespace-only inputs rejected; inline accessible errors                         | Verified                        |
| R12 | 2C                | Edit all five user-editable fields                                                    | Persist changes via PUT; list/details reflect updated values                                | Verified                        |
| R13 | 2D                | Individual complete details in page/modal/drawer                                      | Fetch selected task; display every task field with understandable dates                     | Verified                        |
| R14 | 3                 | Task contains id, title, description, status, priority, dueDate, createdAt, updatedAt | API shape assertions; server-generated identity/timestamps                                  | Verified                        |
| R15 | 3                 | Exact status enum: pending, in_progress, completed                                    | Invalid status rejected; UI labels map to enum                                              | Verified                        |
| R16 | 3                 | Exact priority enum: low, medium, high                                                | Invalid priority rejected                                                                   | Verified                        |
| R17 | 4                 | GET /api/tasks returns 200                                                            | Supertest list assertions                                                                   | Verified                        |
| R18 | 4                 | GET /api/tasks/:id returns 200 or 404                                                 | Existing and missing task tests                                                             | Verified                        |
| R19 | 4                 | POST /api/tasks returns 201 or 400                                                    | Valid creation and invalid body tests                                                       | Verified                        |
| R20 | 4                 | PUT /api/tasks/:id returns 200 or 404                                                 | Existing and missing task tests; invalid body additionally returns 400                      | Verified                        |
| R21 | 4                 | DELETE /api/tasks/:id returns 200 or 404                                              | Existing delete returns 200, repeated delete returns 404                                    | Verified                        |
| R22 | 6                 | Clean routes/controllers/services separation                                          | Review dedicated modules and responsibilities                                               | Verified                        |
| R23 | 6                 | Validate incoming data                                                                | Server validation tests for fields, enums, dates, types and malformed JSON                  | Verified                        |
| R24 | 6                 | Appropriate status codes and centralized error handling                               | One JSON error envelope; predictable 400/404/500; unexpected errors hide stack traces       | Verified                        |
| R25 | 6                 | Enable CORS for frontend                                                              | Allowed-origin and preflight tests                                                          | Verified                        |
| R26 | 6                 | Configurable values through environment variables                                     | API port, allowed origin and frontend API base are documented/configurable                  | Verified                        |
| R27 | 8                 | Reusable frontend components; dedicated API layer                                     | Review components, feature state and typed API module                                       | Verified                        |
| R28 | 8                 | UI refreshes after create/update/delete                                               | CRUD E2E assertions including filtered/paginated lists                                      | Verified                        |
| R29 | 8                 | Application logic not concentrated in one component                                   | Feature components/hooks separate form/list/details/API responsibilities                    | Verified                        |

## Bonus requirements

| ID  | Source | Requirement                              | Acceptance evidence                                                                      | Status   |
| --- | ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| B01 | 9      | Search title or description              | Case-insensitive matching; clearing search restores results                              | Verified |
| B02 | 9      | Filter status and priority               | Each filter and combined search/status/priority behavior                                 | Verified |
| B03 | 9      | Sort by created date, priority, due date | Deterministic directions/tie break; missing due dates placed consistently                | Verified |
| B04 | 9      | List pagination                          | Boundaries, count, empty results, reset after filters, recovery after last-item deletion | Verified |
| B05 | 9      | Dark mode                                | Toggle works; contrast and inputs remain legible; theme preference may persist           | Verified |
| B06 | 9      | Debounced search                         | Rapid typing triggers settled query; obsolete results cannot overwrite latest results    | Verified |
| B07 | 9      | Clean Postman or Swagger API docs        | Swagger UI and machine-readable OpenAPI document cover implemented schemas/endpoints     | Verified |

## Deliverables and user additions

| ID  | Source | Deliverable                                                | Acceptance evidence                                                                           | Status                  |
| --- | ------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| D01 | 10     | GitHub repository with frontend/backend                    | Local repository ready; remote publication only after manual approval                         | Deferred publication    |
| D02 | 10     | README setup/run instructions                              | Reproducible install, dev, test, build commands; architecture and memory-reset behavior       | Verified                |
| D03 | 10     | API endpoint documentation                                 | README/API doc links and curl examples match implementation                                   | Verified                |
| D04 | 10     | Postman collection or Swagger docs                         | OpenAPI JSON/YAML committed; local Swagger route opens                                        | Verified                |
| D05 | 10     | .env.example                                               | Both applications' configuration represented without secrets                                  | Verified                |
| D06 | 10     | Screenshots or short demo video                            | Saved desktop/mobile light/dark screenshots of working application                            | Verified                |
| U01 | User   | Inspect employer website; adapt palette/style thoughtfully | Document verified site URL and design observations; implement original matching theme         | Verified                |
| U02 | User   | Plan and verify entire plan before implementation          | PLAN.md and independent PLAN-REVIEW.md                                                        | Verified                |
| U03 | User   | Use appropriate skills and multiple agents                 | Agent responsibilities and chosen skills recorded by orchestrator                             | Verified                |
| U04 | User   | Tests and full working verification                        | Backend integration tests, frontend logic/component tests, real browser CRUD and state checks | Verified                |
| U05 | User   | Manual preview before hosting/submission                   | User receives local frontend/API/docs URLs and verification notes                             | Ready for manual review |

## Evidence locations

All locally implementable required and bonus items passed the final check on 8 October 2026. R04/D01 retain the GitHub publication step for after the user's manual review. U05 records availability of the local preview, not approval by the user.

- R01, R05-R13, R27-R29, B01-B06: `frontend/src/`, its seven test suites, and the real API browser flows in `e2e/tasks.spec.ts`.
- R02-R04, R14-R26: `backend/src/` and the 47 integration tests in `backend/tests/tasks.test.js`; server startup and real REST requests also exercised by E2E.
- B07, D03-D04: `backend/openapi.json`, `backend/src/openapi.js`, `docs/API.md`, and the OpenAPI parity test. Swagger runs at `/api/docs`.
- D02, D05: root README, both `.env.example` files, and the documented environment configuration.
- D06: six captures in `output/playwright/`; desktop/mobile light/dark, details, and a mobile form.
- U01-U04: `BRAND-RESEARCH.md`, `PLAN.md`, `PLAN-REVIEW.md`, `CODE-REVIEW.md`, `FINAL-UX-REVIEW.md`, and `VERIFICATION.md` in this directory.

## Subsequent user requests

| ID  | Request                                                                     | Evidence                                                                                                      | Status            |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------- |
| U06 | Restrained design without the specified decorative patterns or generic copy | Flat surfaces, solid colors, 4px controls; screenshot review and computed-style browser assertions            | Verified          |
| U07 | Loading/error completeness, unknown-page recovery, privacy and terms        | Skeleton loading, retry states, RouteBoundary, AppErrorBoundary; component/browser tests                      | Verified          |
| U08 | Move status navigation from sidebar into main dashboard                     | Overview metric buttons with selected state and explicit page reset; browser assertions                       | Verified          |
| U09 | Sidebar scrollbar matching the site                                         | Scoped navy track and muted navy thumb in styles.css                                                          | Visually reviewed |
| U10 | Change status directly without opening Edit                                 | InlineTaskStatus in rows/cards; actual PUT, full-field preservation, failure/retry and mobile E2E             | Verified          |
| U11 | Independent review for small daily-use UX issues                            | Reviewer identified and verified pagination reset, competing row actions during saves, and focus preservation | Verified          |

### Agreed contract behavior

- `dueDate` is `YYYY-MM-DD` or `null`; only title and description are required. Past dates are accepted. Real calendar dates are validated and displayed without timezone shifts.
- Generate `id`, `createdAt`, and `updatedAt` on the server. Preserve `createdAt` and id during updates; do not accept overwriting server-owned fields.
- PUT accepts the complete editable record; omitted optional values reset to pending, medium and null. The frontend always submits all editable fields, including during quick status changes.
- GET collection returns a plain array; frontend pagination counts the filtered records. Errors use the documented JSON message/errors envelope.
- Created-date and due-date sorts support both directions; priority puts high first. Id resolves ties deterministically; null due dates remain last in either direction.
- Search/filter/sort changes reset pagination. Deleting the last item on the last page recovers to a valid page.
- Loading/error state tests should use controlled HTTP delays/failures; real E2E CRUD should also exercise the actual backend.
- Theme preference is presentation data and may use localStorage. Task records must stay in backend memory and must never be saved there.
- Submission branding should not imply affiliation, ownership of employer assets, or unsupported product integrations.

## Evaluation weights

| Area                                  | Weight |
| ------------------------------------- | ------ |
| UI/UX and responsiveness              | 20%    |
| React/frontend implementation         | 20%    |
| REST API design and integration       | 20%    |
| Backend architecture and code quality | 20%    |
| Validation and error handling         | 10%    |
| Documentation and Git practices       | 10%    |

The assignment suggests 2–3 days and emphasizes code quality, architecture, integration, and a functional experience. Visual polish must support those requirements.
