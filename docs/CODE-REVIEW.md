# Independent code review

Reviewed on 2026-10-08 using the code-reviewer skill and its AGENTS.md. This is a read-only review; fixes belong to the implementation agents. Scope: backend routes/controllers/services/validation/error/config/OpenAPI, frontend API/state/helpers/components/styles, README/API documentation, and saved desktop/mobile screenshots. This report includes a follow-up after frontend fixes.

**Final source-review verdict: PASS.** All five actionable findings are resolved in source. The final async fix reloads the authoritative list when a mutation completes during a pending list request. Desktop-only controls, hidden mobile navigation, and tablet created-date metadata have also been corrected. The root agent owns executed-test and live-browser evidence.

## Findings

### CR01 — P2: Pending list response can overwrite successful mutations

**Location:** `frontend/src/hooks/useTasks.ts:6`, mutation handlers at lines 8–9.

The list request sequence only guards competing GET calls. Creating, updating, or deleting a task does not change that sequence. The New task action is available while an initial load/retry is pending. If the pending GET captured an older task snapshot, a successful POST first inserts the new task, then the delayed GET replaces the entire list with the older result. A successful edit or delete can similarly be overwritten/revived. The UI then contradicts the backend until another reload, violating the required mutation refresh behavior.

**Fix:** Coordinate fetch and mutation revisions. A mutation should invalidate an older snapshot and either reload the authoritative list or merge/replay successful mutations into the fetch result. Preserve loading/error state correctly when invalidating an in-flight load. Verify with deferred GET and mutation promises in both response orders.

**Follow-up: still open.** `save` and `remove` now increment the request id and clear loading/error, so stale responses are ignored. However, initial loading starts from `tasks=[]`. If the user creates a task before that first list response returns, `save` leaves only the newly created task in local state, then permanently ignores the list containing all pre-existing tasks. The UI says one task although the backend includes demo/prior records. Reload an authoritative snapshot after the mutation, or retain/reconcile the pending list result with mutation deltas; test against a nonempty initial dataset, not only an empty list.

**Final follow-up: fixed.** `pendingLoad` tracks a current list request; successful mutations invalidate obsolete fetches and await a new authoritative load when necessary. Regression tests in `frontend/src/hooks/useTasks.test.ts` cover creation during a slow nonempty initial load and deletion during a slow refresh.

### CR02 — P2: Dialog cannot contain Tab focus during pending deletion

**Location:** `frontend/src/components/Dialog.tsx:6`; pending state in `frontend/src/components/ConfirmDelete.tsx:5`.

While DELETE is pending, close/cancel/delete buttons all become disabled. The focusable list is empty, but the Tab handler only handles first/last elements and does not prevent default in that case. Pressing Tab therefore advances into the page behind the dialog while `aria-modal` still advertises a contained modal.

**Fix:** Give the dialog container `tabIndex={-1}` and focus it as a fallback. Always prevent Tab when there are zero usable focusables, including when busy state disables the currently focused control. Verify with a deferred DELETE, repeated Tab/Shift+Tab, and blocked Escape while pending.

**Follow-up: fixed in source.** Empty-focusable Tab now prevents default and focuses the dialog container, which has `tabIndex={-1}`.

### CR03 — P2: Focus restoration targets removed controls after detail actions/deletion

**Location:** `frontend/src/components/Dialog.tsx:6`; modal transitions in `frontend/src/App.tsx:22`.

Opening Edit/Delete from Task details unmounts the details drawer. The new dialog records a details button (or body) as its previous focus, but that drawer is already removed. Closing/canceling the next dialog attempts to focus a disconnected element, leaving keyboard users at the document body instead of the task trigger. Successful row deletion likewise removes the original trigger before restoration.

**Fix:** Track a stable workspace return target across modal transitions. Restore an existing originating task action when available, otherwise use a meaningful surviving control such as New task or the task-list heading. Check `previous.isConnected` before focusing. Verify details→edit→cancel, details→delete→cancel, and successful deletion.

**Follow-up: fixed in source.** Cleanup checks `previous.isConnected` and uses the surviving `.create-button` as fallback.

### CR04 — P2: Closed mobile sidebar remains keyboard-focusable offscreen

**Location:** `frontend/src/styles.css:7`; `frontend/src/components/Sidebar.tsx:4`.

At widths up to 850px, closed navigation is moved left with `transform:translateX(-100%)`. Its nav buttons, documentation link, and theme toggle retain normal keyboard focusability. Keyboard users can Tab into invisible controls before reaching the visible dashboard. The backdrop's negative tab index does not affect the sidebar controls.

**Fix:** Make the closed mobile sidebar `visibility:hidden` and open sidebar visible (preserving desktop visibility), or apply responsive `inert` semantics. Verify repeated Tab at 390px skips hidden controls and opened menu remains operable.

**Final follow-up: fixed.** An 850px media override uses `visibility:hidden` for the closed sidebar and `visibility:visible` when open, removing closed navigation descendants from normal keyboard focus.

### CR05 — P2: Tablet task lists omit required created date

**Location:** `frontend/src/styles.css:6`, 1080px breakpoint.

The breakpoint hides `.created-date` and its table heading. The 600px breakpoint restores dates on mobile cards, so all widths from 601px to 1080px display task lists without a required created date. A date in the details drawer does not fulfill the assignment's dashboard requirement.

**Fix:** Preserve created date in tablet rows, for example as compact metadata below the description, or switch to the complete card layout earlier. Verify list metadata at 768px and 1024px in addition to narrow mobile/desktop.

**Final follow-up: fixed.** `TaskList` includes `.task-created-inline` metadata beneath each description; CSS displays it specifically from 601px to 1080px. Desktop column and mobile-card date remain intact.

## Nonblocking observations

**Fresh completeness follow-up:** Both observations below are resolved. Source is formatted with Prettier. The dedicated API client now validates successful collection/task/deletion contracts before state changes, safely normalizes null/malformed errors, and rejects mismatched GET/PUT identities and invalid calendar values. See `FINAL-COMPLETENESS-AUDIT.md` and the refreshed `VERIFICATION.md` for source review and executed regressions.

- Frontend files compress whole components/hooks into very long lines. Normal formatting would make state, event flow, accessibility attributes, and future reviews easier to maintain. This does not change runtime behavior.
- API success responses are cast without runtime shape checks; invalid JSON is converted to `{}` at `frontend/src/api/tasks.ts:8`. A malformed successful response can consequently fail rendering rather than enter the existing recoverable error state. Consider rejecting invalid JSON and validating minimal successful shapes, particularly the task-array response.

## Areas verified without findings

- Exact required task fields, enums, and CRUD endpoints/status codes are implemented. DELETE returns 200. Single-task details invoke the required GET endpoint.
- Backend data lives only in isolated service memory; callers receive detached records. No database, Firebase, or browser task persistence is present.
- Incoming bodies reject nonobjects, required-field whitespace/type errors, unknown fields, invalid enums, oversized payloads, malformed JSON, and unreal calendar dates. Server identity/timestamps cannot be overwritten.
- PUT replacement defaults match README, both API docs, and OpenAPI. Unknown IDs return 404 for valid requests; invalid PUT bodies are documented as validation-first.
- Error middleware returns JSON and hides unexpected internals. CORS uses configured exact origins; environment configuration is explicit.
- Frontend filters combine correctly, search includes description, debounce is present, sorts use deterministic id tie-breaks, null due dates stay last, and pagination clamps after deletion.
- Date-only display uses local calendar parsing rather than UTC midnight; backend calendar checks reject year zero and day overflow.
- Details requests ignore stale responses after changing selection/unmount. Form failure retains entered values. Mutations update local task records only after API success.
- Required forms/details/dashboard actions and bonus capabilities have concrete implementations. Theme preference alone uses localStorage.
- OpenAPI runtime date pattern was executed against `2026-10-09` and correctly matched. Committed-spec parity is covered by backend tests.

## Remaining verification

Mobile card styles show descriptions and created dates at <=600px. Desktop screenshot shows both. The initial saved mobile-light screenshot captured the sidebar partway through its responsive transition, covering roughly 136px of content; the root agent is recapturing after fixes. The desktop mobile-menu/close specificity issue is corrected by `.mobile-menu.icon-button,.mobile-nav-close.icon-button` overrides. Dialog regression tests now cover forward/backward wrapping and all-controls-disabled fallback. Actual dialog behavior, responsive overflow, contrast, and executed check results remain the root agent's browser verification responsibility.

No required feature or blocking source-review finding remains. Backend/API/README contracts remain consistent. The malformed-success API response and formatting observations are nonblocking improvement suggestions. Publication and employer submission remain deferred for the user's manual review.
