# Task REST API

Local base: `http://127.0.0.1:4000/api`. Responses are JSON. Request bodies use `Content-Type: application/json`.

## Task model

```json
{
  "id": "server-generated UUID",
  "title": "Confirm pickup routes",
  "description": "Check tomorrow's garment collection schedule.",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-10-09",
  "createdAt": "2026-10-08T08:00:00.000Z",
  "updatedAt": "2026-10-08T08:00:00.000Z"
}
```

Title and description are required nonblank strings, trimmed on save, with limits of 120 and 2,000 characters. Status is `pending`, `in_progress`, or `completed`; priority is `low`, `medium`, or `high`. The server generates identity and timestamps; clients cannot overwrite those fields or submit unknown fields.

Due date is optional: a real `YYYY-MM-DD` calendar date or `null`. Past dates are accepted so overdue tasks remain editable. Defaults for omitted optional fields are `pending`, `medium`, and `null`.

## Endpoints

`GET /tasks` returns **200** with an array. No server-side query parameters are implemented; frontend filtering/pagination works on this array.

`GET /tasks/:id` returns **200** with a task or **404** if absent.

`POST /tasks` returns **201** with the complete created task. Invalid payloads return **400**.

`PUT /tasks/:id` returns **200** with the updated task or **404** if absent. It uses replacement semantics for editable fields: title/description are required; omitted optional fields reset to their defaults. Identity and created timestamp remain unchanged. Invalid payloads return **400**.

`DELETE /tasks/:id` returns **200** with `{ "message": "...", "id": "..." }`, or **404** for an absent task. Repeating deletion returns 404.

`GET /health` returns **200** service health. `GET /docs` serves interactive Swagger UI; `GET /openapi.json` returns the OpenAPI specification.

## Errors

Validation responses use `{ "message": "...", "errors": { "field": "reason" } }`. Other errors use `{ "message": "..." }`. Malformed JSON/non-object bodies return 400, oversized bodies return 413, unknown routes/records return 404, and unexpected errors return a safe 500 without leaking internals.

## Examples

Use `curl.exe` rather than the PowerShell `curl` alias on Windows, or any HTTP client with the following requests:

```sh
curl http://127.0.0.1:4000/api/tasks
curl -X POST http://127.0.0.1:4000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Complete assignment","description":"Build and verify task manager","status":"pending","priority":"high","dueDate":"2026-10-09"}'
```

The POST curl example uses POSIX shell quoting. In PowerShell, Swagger is the simplest way to try request bodies; alternatively:

```powershell
$body = @{ title = 'Complete assignment'; description = 'Build and verify task manager'; status = 'pending'; priority = 'high'; dueDate = '2026-10-09' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/tasks' -ContentType 'application/json' -Body $body
```

## Configuration and lifecycle

`PORT` selects backend port. `CORS_ORIGINS` is a comma-separated list of exact allowed frontend origins. `SEED_DEMO_DATA=false` starts empty. Tasks are local to this running backend process; restart resets them. Running multiple backend instances would create independent stores, so this demo should later use one backend instance.
