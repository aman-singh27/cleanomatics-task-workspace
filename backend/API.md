# Task API

Local base: `http://localhost:4000`. Interactive documentation: `/api/docs/`. Machine-readable contract: `/api/openapi.json`. The committed `backend/openapi.json` snapshot matches the live specification; a test guards against drift.

| Method | Path             | Success                              | Failure            |
| ------ | ---------------- | ------------------------------------ | ------------------ |
| GET    | `/api/tasks`     | 200 task array                       | 500                |
| GET    | `/api/tasks/:id` | 200 task                             | 404, 500           |
| POST   | `/api/tasks`     | 201 task                             | 400, 413, 500      |
| PUT    | `/api/tasks/:id` | 200 task                             | 400, 404, 413, 500 |
| DELETE | `/api/tasks/:id` | 200 `{message,id}`                   | 404, 500           |
| GET    | `/api/health`    | 200 `{status:"ok",storage:"memory"}` | —                  |

Send JSON with required `title` (1–120 trimmed characters) and `description` (1–2000 trimmed characters). `status`: `pending`, `in_progress`, `completed`. `priority`: `low`, `medium`, `high`. `dueDate`: real calendar date `YYYY-MM-DD`, or `null`; historical dates are accepted. Optional fields default to `pending`, `medium`, `null` for both POST and PUT. PUT replaces editable fields and preserves identity/creation time. The server owns UUID `id` and ISO `createdAt`/`updatedAt` timestamps. Unknown fields are rejected. Invalid PUT data returns 400 before checking existence. Maximum JSON body: 100 KiB.

Error responses use `{ "message": "...", "errors": { "field": "..." } }`; `errors` appears only for field validation. Unexpected errors return safe 500 messages without stack traces. Unrecognised paths return JSON 404. Allowed CORS origins are configured by comma-separated `CORS_ORIGINS`.

```sh
curl http://localhost:4000/api/tasks
curl -X POST http://localhost:4000/api/tasks -H "Content-Type: application/json" -d '{"title":"Inspect quality","description":"Review the linen batch.","priority":"high","dueDate":"2026-10-09"}'
curl http://localhost:4000/api/tasks/TASK_ID
curl -X PUT http://localhost:4000/api/tasks/TASK_ID -H "Content-Type: application/json" -d '{"title":"Inspect quality","description":"Review completed.","status":"completed","priority":"high","dueDate":null}'
curl -X DELETE http://localhost:4000/api/tasks/TASK_ID
```

Tasks are isolated in process memory. Restarting resets the store. `SEED_DEMO_DATA=true` (default) starts with twelve demonstration tasks; set `false` for an empty workspace. Backend `.env` is loaded from the backend working directory. Tests create fresh apps/stores without touching a running server.
