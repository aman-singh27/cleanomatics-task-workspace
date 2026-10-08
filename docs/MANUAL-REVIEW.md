# Manual review guide

Run `npm run dev` from the root, then open `http://127.0.0.1:5173`.

The current review session uses **http://127.0.0.1:5175** because another project already occupies port 5173. The API still uses port 4000. To reproduce this alternate preview, start the API with `npm run start --workspace backend`, then in a second terminal run `npm run dev --workspace frontend -- --port=5175`. Use the default `npm run dev` when port 5173 is free.

1. Inspect desktop dashboard, task descriptions, status/priority badges, created/due dates, and summary metrics.
2. Select **New task**. Submit blank form: title/description errors should appear. Create a task with all five fields.
3. View the task. Verify description, status, priority, due date, created/updated timestamps, and ID. Press Escape and confirm focus returns to the task.
4. Edit all five fields and save. Reopen details to confirm values.
5. Search for text from the description. Combine status/priority filters. Try created-date, priority, and due-date sorting; browse pages.
6. Delete the created task. Cancel once, then confirm. Check dashboard updates immediately.
7. Toggle dark mode and reload. Theme persists; task data remains in the running API.
8. Resize to a narrow mobile viewport. Read task descriptions, open forms/details, and check controls fit without horizontal scrolling.
9. Open `http://127.0.0.1:4000/api/docs`. Try GET/POST/PUT/DELETE and invalid input through Swagger.
10. Stop/restart backend when done. Changes reset by design. With `SEED_DEMO_DATA=false`, an empty workspace appears; with defaults, example tasks return.
11. Change a task's status using its dropdown directly in the list. Counts update after saving. While filtered to In progress, mark one Completed: it leaves that list. Select the Completed metric to find it again. Other task fields remain intact.
12. Use the All tasks, In progress, and Completed metrics to switch views. These controls clear search/priority filters and return to page 1. Check the navy scrollbar when the navigation needs scrolling.
13. Follow Privacy and Terms from the sidebar, then return to tasks. Visit `/missing-page` to check the 404 recovery screen.
14. On mobile, focus Open navigation and press Enter. Tab stays in the navigation; Escape closes it and returns focus to the opener. Resizing to desktop restores normal page interaction.

Automated tests cover controlled loading, API failures/retry, save failure, validation, keyboard focus, and mobile behavior; see `docs/VERIFICATION.md` for executed results.

After manual review, request any changes. GitHub publication, hosting, and sharing links happen only when you ask for them.
