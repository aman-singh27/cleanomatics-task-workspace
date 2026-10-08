import { HttpError } from "../middleware/errors.js";

export const STATUSES = ["pending", "in_progress", "completed"];
export const PRIORITIES = ["low", "medium", "high"];
const editableFields = new Set([
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
]);

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === 0) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

/** Both POST and PUT accept the complete editable task; absent optional fields use defaults. */
export function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  const errors = Object.create(null);
  for (const field of Object.keys(body)) {
    if (!editableFields.has(field)) errors[field] = "This field cannot be set.";
  }
  const result = {};
  for (const [field, maxLength] of [
    ["title", 120],
    ["description", 2000],
  ]) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
      errors[field] =
        `${field === "title" ? "Title" : "Description"} is required.`;
    } else if (value.trim().length > maxLength) {
      errors[field] = `Use ${maxLength} characters or fewer.`;
    } else {
      result[field] = value.trim();
    }
  }
  result.status = body.status === undefined ? "pending" : body.status;
  result.priority = body.priority === undefined ? "medium" : body.priority;
  result.dueDate = body.dueDate === undefined ? null : body.dueDate;
  if (!STATUSES.includes(result.status))
    errors.status = "Choose pending, in_progress, or completed.";
  if (!PRIORITIES.includes(result.priority))
    errors.priority = "Choose low, medium, or high.";
  if (result.dueDate !== null && !isCalendarDate(result.dueDate))
    errors.dueDate = "Use a valid date in YYYY-MM-DD format, or null.";
  if (Object.keys(errors).length)
    throw new HttpError(400, "Please correct the task fields.", errors);
  return result;
}
