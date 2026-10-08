# Independent daily-use UX review

Reviewed on 8 October 2026 with the code-reviewer skill. Scope: the user's latest usability/design changes, not new product scope. Read-only source review and visual inspection of saved desktop/mobile screenshots; implementation and executed browser checks belong to the root agent.

## Reviewed behavior

| Workflow                                 | Evidence                                                      | Assessment                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Change status directly in task list      | `InlineTaskStatus.tsx`, `TaskList.tsx`, `App.tsx`             | Real API mutation; every desktop row and mobile card has a named native status select                                             |
| Preserve task fields during quick change | `App.tsx` quick-change callback                               | PUT includes current title, description, next status, priority, due date and task id; server preserves identity/created timestamp |
| Avoid duplicate status submissions       | `InlineTaskStatus.tsx`                                        | Immediate pending ref plus disabled select while saving                                                                           |
| Failed status save                       | `InlineTaskStatus.tsx` and regression test                    | Previous persisted status remains selected; inline alert linked to control; selecting desired value again retries                 |
| Update dashboard/filter results          | Shared `useTasks` state and `selectTasks`                     | Server-returned task updates summary counts, status filters, overdue/completion values, list membership and clamped pagination    |
| Metric shortcuts                         | `Overview.tsx` / `App.tsx`                                    | All tasks, In progress and Completed buttons replace previous sidebar destinations; accessible count labels and selected state    |
| Clear conflicting search/priority        | Metric callback                                               | Clears search and priority while selecting requested status; explicitly resets page even if current status is selected            |
| Recover focus when row disappears        | Inline focus effect/cleanup and browser regression assertions | Fallback targets Status filter when successful change removes selected row; surviving controls restore focus after pending state  |
| Desktop/mobile task metadata             | Updated screenshot artifacts                                  | Description, status, priority, due and created dates visible; action controls fit within cards                                    |
| Design direction                         | Styles and screenshots                                        | Flat colors, restrained square controls, no decorative sparkles/gradients/shadows; operational copy; navy sidebar scrollbar       |
| Other navigation                         | RouteBoundary and sidebar                                     | Privacy/terms pages, 404 and render-error recovery exist; meaningful return links; no fake destinations                           |

The Overdue value remains informational; the three former status destinations are the clickable metric controls. Status/priority dropdowns remain available for precise combined filtering.

## Small usability findings

### UX01 — Fixed: selecting current metric did not reset pagination

Clicking All tasks while already viewing all statuses on page 2 originally left page 2 selected because the filter-reset effect depended on changed state. The metric callback now explicitly calls `setPage(1)`. A browser regression test covers clicking the already-selected metric from page 2.

### UX02 — P2: editing while quick status save is pending can restore old status

At the initial review, `TaskList.tsx` row Edit/Delete/View controls stayed enabled while the inline dropdown saved. Selecting Completed and immediately opening Edit captured the old Pending task object. After status PUT succeeded, saving a description change from that stale form could silently set status back to Pending.

**Fixed in final source.** App tracks `pendingStatusIds`, adds the id before saving, and removes it in `finally`. TaskList marks the row busy and disables its View/Edit/Delete controls during that request. Other task rows remain usable. The browser regression includes a delayed PUT and assertions that competing actions are disabled.

### UX03 — Focus restoration must not interrupt deliberate keyboard movement

The initial focus effect always focused the inline select when busy became false, and unmount cleanup always focused Status filter while restoration was pending. A user who deliberately Tabs to another row or toolbar during a slow request should retain that focus when the response arrives.

**Fixed in final source.** `canRestoreFocus` limits restoration to body, original control, or a disconnected active element. Surviving controls and removed-row fallback use the same guard. A unit regression moves focus to another control during a delayed save and verifies the response leaves that focus intact.

## Visual evidence and limits

Inspected `output/playwright/desktop-light.png` and `output/playwright/mobile-light.png` after the latest layout changes. Sidebar status links are absent, dashboard metrics carry selected underline, row status selects are visible, and the narrow layout retains descriptions/dates without the earlier sidebar overlay artifact. The screenshots show operational copy and flat styling matching the user's direction.

Source review confirms the intended REST/state behavior. The root browser suite includes actual-backend assertions for full-record preservation, failed quick saves/retry, focus after filtered-row removal, mobile quick changes, and same-metric pagination reset. This reviewer did not run another simultaneous test suite against the shared API; executed results must be recorded in the root verification report.

## Current verdict

Final browser follow-up by the root agent: all 14 Chromium scenarios passed. A focus assertion initially used Playwright `selectOption()` immediately after a metric click. The reviewer inspected Playwright's implementation and confirmed that this changes the value without focusing the select. The test now focuses the status control before the keyboard-originated change; the production guard correctly preserves another control's deliberate focus. Mobile native select padding was reduced after screenshot inspection to show the entire Completed label.

**PASS — final source/visual review.** Required functionality remains complete. UX01, UX02 and UX03 are fixed; no remaining actionable usability defect found in the reviewed changes. Final automated-check results are being produced by the root agent and remain a separate completion gate. No authentication, database, additional integrations, or deployment work is proposed. User manual verification still precedes hosting/publication/submission.
