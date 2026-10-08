export const statuses = ["pending", "in_progress", "completed"] as const;
export const priorities = ["low", "medium", "high"] as const;
export type Status = (typeof statuses)[number];
export type TaskView = Status | "all" | "overdue";
export type Priority = (typeof priorities)[number];
export interface TaskInput {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
}
export interface Task extends TaskInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export type Sort =
  "created-desc" | "created-asc" | "priority-desc" | "due-asc" | "due-desc";
export const statusLabel: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};
export const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export function selectTasks(
  tasks: Task[],
  query: string,
  status: TaskView,
  priority: Priority | "all",
  sort: Sort,
) {
  const text = query.trim().toLowerCase();
  const rank = { low: 1, medium: 2, high: 3 };
  return tasks
    .filter(
      (task) =>
        (!text ||
          `${task.title} ${task.description}`.toLowerCase().includes(text)) &&
        (status === "all" ||
          (status === "overdue" ? isOverdue(task) : task.status === status)) &&
        (priority === "all" || task.priority === priority),
    )
    .sort((a, b) => {
      let result = 0;
      if (sort === "priority-desc")
        result = rank[b.priority] - rank[a.priority];
      else if (sort.startsWith("due")) {
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        result =
          (a.dueDate || "").localeCompare(b.dueDate || "") *
          (sort === "due-desc" ? -1 : 1);
      } else
        result =
          a.createdAt.localeCompare(b.createdAt) *
          (sort === "created-desc" ? -1 : 1);
      return result || a.id.localeCompare(b.id);
    });
}
export function validateTask(values: {
  title: string;
  description: string;
  dueDate: string | null;
}) {
  const errors: Record<string, string> = {};
  if (!values.title.trim()) errors.title = "Add a title for your task.";
  else if (values.title.trim().length > 120)
    errors.title = "Keep the title under 121 characters.";
  if (!values.description.trim())
    errors.description = "Add a description for your task.";
  else if (values.description.trim().length > 2000)
    errors.description = "Keep the description under 2,001 characters.";
  if (
    values.dueDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate) ||
      Number.isNaN(Date.parse(`${values.dueDate}T12:00:00Z`)) ||
      new Date(`${values.dueDate}T12:00:00Z`).toISOString().slice(0, 10) !==
        values.dueDate)
  )
    errors.dueDate = "Choose a valid calendar date.";
  return errors;
}
export function formatDate(value: string | null, includeTime = false) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}
export function isOverdue(task: Task) {
  return Boolean(
    task.dueDate &&
    task.status !== "completed" &&
    task.dueDate <
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
  );
}
