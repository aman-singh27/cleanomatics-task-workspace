# Task workspace screenshot gallery

[Live workspace](https://cleanomatics-task-workspace.vercel.app) · [Project README](../../README.md) · [Swagger](https://cleanomatics-task-workspace.vercel.app/api/docs/)

Overview views: [Light desktop](desktop-light.png) · [Dark desktop](desktop-dark.png) · [Light mobile](mobile-light.png) · [Dark mobile](mobile-dark.png) · [Task details](task-details.png) · [Mobile task form](mobile-form.png).

The walkthrough below follows one sample task through creation, editing, status changes and deletion, then shows the supporting workspace views. Task changes use the actual Express REST API. The capture script removes only its own temporary task ID; existing workspace tasks are preserved.

## 1. Required-field validation

The create form associates feedback with the required title and description fields.

![Required title and description feedback](workflows/01-form-validation.png)

## 2. Add a task

The form contains title, description, status, priority and an optional due date.

![Create form with the sample task fields](workflows/02-create-task.png)

## 3. Task created

The new task appears in the workspace after saving.

![Workspace showing the newly created task](workflows/03-task-created.png)

## 4. Edit the task

The edit form opens the existing task's fields for changes.

![Edit form for the sample task](workflows/04-edit-task.png)

## 5. Changes saved

The workspace displays the updated task values.

![Workspace reflecting the edited task](workflows/05-task-updated.png)

## 6. Change status to In progress

The row's status control updates the task without opening the edit form.

![Sample task marked In progress](workflows/06-status-in-progress.png)

## 7. Complete the task

The same inline control changes the task to Completed.

![Sample task marked Completed](workflows/07-task-completed.png)

## 8. Search and filter

Search works with status and priority filters to narrow the list.

![Workspace with search and filter controls](workflows/08-search-and-filters.png)

## 9. Find overdue work

The Overdue metric selects unfinished tasks whose due dates have passed.

![Overdue task view](workflows/09-overdue-queue.png)

## 10. Browse another page

Pagination keeps the list to six tasks per page.

![Paginated task list](workflows/10-pagination.png)

## 11. Edit on mobile

The task form remains usable in a narrow mobile viewport.

![Mobile edit form](workflows/11-mobile-edit.png)

## 12. Confirm deletion

The confirmation names the task and offers a choice to keep it or delete it.

![Named task deletion confirmation](workflows/12-delete-confirmation.png)

## 13. Task deleted

The deleted sample task is removed from the workspace.

![Workspace after deleting the sample task](workflows/13-task-deleted.png)

## 14. No matching tasks

An unmatched search displays a clear recovery action.

![No matching tasks state](workflows/14-no-matching-tasks.png)

## 15. Interactive API documentation

Swagger presents the REST operations, schemas and controls for trying requests.

![Interactive Swagger API documentation](workflows/15-swagger-api.png)

## 16. Unknown-page recovery

An unknown frontend path offers a route back to the task workspace.

![Page not found with Back to tasks](workflows/16-page-not-found.png)

## Refresh the images

Start the default local frontend/API with `npm run dev`, then run:

```sh
npm run screenshots
npm run screenshots:workflows
```

Both commands default to `http://127.0.0.1:5173`. To use the hosted app, set `PREVIEW_URL` before running the command; in PowerShell:

```powershell
$env:PREVIEW_URL = 'https://cleanomatics-task-workspace.vercel.app'
npm run screenshots:workflows
```

The workflow command performs real create/update/delete operations on its own temporary sample task. Only the theme preference is stored in the browser; task records remain in backend memory.
