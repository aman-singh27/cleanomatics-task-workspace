# Cleanomatics task workspace implementation plan

Build a polished local task-management application for the Cleanomatics full-stack assignment. The provided assignment controls feature requirements. The user's instruction controls publication: prepare locally, test completely, then wait for their manual review before hosting or sharing links.

## Architecture and ownership

- Root owns workspace tooling, integration, browser verification, E2E tests, documentation, and final review.
- Backend agent owns backend/**, including API tests and OpenAPI specification.
- Frontend agent owns frontend/**, including reusable React components and component tests.
- Research agents own their assigned docs only; their slots become implementation slots after reports finish.
- npm workspaces: React + TypeScript + Vite frontend; Node.js + Express ESM backend. Independent frontend/backend build and run scripts; root runs both.
- Backend data is a Map in service memory only. No database, filesystem task persistence, Firebase, or authentication. SEED_DEMO_DATA controls realistic demo tasks; tests use isolated empty stores.
- Dedicated frontend API client reads VITE_API_URL (default /api); Vite proxies /api to local backend. Backend accepts exact frontend CORS origins via environment configuration.

## REST contract

Task fields: id (UUID), title, description, status (pending/in_progress/completed), priority (low/medium/high), dueDate (YYYY-MM-DD or null), createdAt and updatedAt (ISO timestamps).

- GET /api/tasks -> 200 array of tasks. Search/filter/sort/pagination run client-side for this small in-memory assignment. GET /api/tasks/:id -> 200 task or 404.
- POST /api/tasks -> 201 task. Title and description required and trimmed. Defaults: pending, medium, null dueDate.
- PUT /api/tasks/:id -> 200 updated task or 404. Form submits all editable fields; backend requires title/description and validates enum/date values. Preserve id/createdAt; update updatedAt.
- DELETE /api/tasks/:id -> 200 { message, id } or 404.
- Validation returns 400 { message, errors?: Record<string,string> }. Unknown routes return JSON 404. Malformed JSON -> 400, payload too large -> 413, unexpected errors -> safe 500.
- Disallow unknown fields and non-object payloads. Enforce title <=120 chars, description <=2000 chars, real calendar dates. Due date optional; past dates allowed for overdue tasks.
- Separate routes, controllers, service, validation, centralized error middleware. App factory accepts seed/config for isolated tests. /api/health supports local checks. Swagger UI at /api/docs and JSON at /api/openapi.json.

## UI and product behavior

- Use observed company palette and typography, adapted into a distinctive editorial workspace. Accessible contrast, consistent spacing, generous whitespace, restrained motion.
- Brand research verified primary #0DA2E7, deeper blue #0673BC, ink #0F1729, muted #65758B, border #E1E7EF, wash #F0FAFF, accent #D7F2FE, canvas #F4F7FA. Website uses Inter; use bundled Manrope for subtly distinctive headings and DM Sans for highly readable product UI. Navy identity/navigation and ice-blue canvas anchor white task surfaces.
- Responsive shell with navigation, date/context, summary metrics, focused task list, status chips, priority, created and due dates. List and board views may be added only after core coverage.
- New/edit modal or drawer: labeled required title/description, status/priority selects, due date; inline validation and submit progress. Dialog keyboard focus containment, Escape, focus restoration.
- Details drawer fetches single-task endpoint; shows every field including timestamps and exposes edit/delete.
- Delete confirmation names task and shows pending/error states. Never optimistic-delete before API succeeds.
- Loading skeleton, empty workspace, no search matches, recoverable fetch error with Retry, mutation failure, success announcement/toast.
- Debounced title/description search, status and priority filters, created/priority/due sort, stable pagination. Reset or clamp page after filters/deletion. Null due dates last.
- Dark theme persists theme preference only in localStorage; all tasks remain backend-memory-only.

## Verified execution sequence

1. Extract document checklist and inspect company website; independently review this plan before implementation.
2. Establish package scripts and shared API contract. Agents write meaningful failing API/component tests, then implement their owned modules.
3. Integrate real frontend/backend CRUD, fix contract mismatches, verify no local task storage.
4. Run type checking, production build, API/component tests with >=80% coverage targets, and E2E browser flows.
5. E2E cover create/validation/view/edit/delete, search/filter/sort/pagination, loading/empty/error/retry, dark mode, mobile layout and dialog keyboard behavior. Review desktop/mobile screenshots.
6. Produce README, API documentation, Swagger specification, .env.example, screenshot artifacts, GitHub Actions verification, manual review guide, and requirements evidence matrix.
7. Leave local servers running and open frontend for user's manual review. Explicitly document memory reset behavior. Commit locally after checks. No external repository publication, deployment, or email in this phase.

## Completion gates

Every required and bonus item has evidence. All automated checks pass. Browser uses real REST requests for CRUD. Desktop/mobile UI is visually inspected, no horizontal overflow. Documentation reproduces clean install. Any remaining limitation is stated precisely; do not claim unperformed checks.

## User refinements applied during implementation

The final design uses an off-white canvas, solid surfaces, navy navigation, square 4px controls and operational copy. Decorative gradients, shadows, sparkle illustrations and generic promotional layouts were removed. Loading skeletons remain functional. Privacy/terms routes, unknown-page recovery and render-error recovery complete the local demo.

The three status destinations moved from navigation to dashboard metrics. Each task row/card now has a native status select that submits the entire editable task record. Saving disables competing actions on that row; failures retain the persisted status and allow retry. Filter membership, dashboard counts and pagination reconcile after success. Keyboard focus returns to a surviving control when its row disappears, while deliberate focus movement remains respected. An independent final UX review covers these changes.
