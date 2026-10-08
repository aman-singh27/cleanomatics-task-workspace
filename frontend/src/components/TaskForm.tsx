import { useState, type FormEvent } from "react";
import { Pencil, Plus, LoaderCircle } from "lucide-react";
import { Dialog } from "./Dialog";
import {
  priorities,
  priorityLabel,
  statuses,
  statusLabel,
  validateTask,
  type Task,
  type TaskInput,
} from "../lib/tasks";
export function TaskForm({
  task,
  onClose,
  onSave,
}: {
  task?: Task;
  onClose: () => void;
  onSave: (values: TaskInput, id?: string) => Promise<unknown>;
}) {
  const [values, setValues] = useState<TaskInput>(
    task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : {
          title: "",
          description: "",
          status: "pending",
          priority: "medium",
          dueDate: null,
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = (name: keyof TaskInput, value: string) => {
    setValues((current) => ({
      ...current,
      [name]: name === "dueDate" ? value || null : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    const problems = validateTask(values);
    setErrors(problems);
    if (busy) return;
    if (Object.keys(problems).length) {
      document.getElementById(Object.keys(problems)[0])?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(
        {
          ...values,
          title: values.title.trim(),
          description: values.description.trim(),
        },
        task?.id,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save this task.",
      );
      if (cause && typeof cause === "object" && "errors" in cause)
        setErrors((cause.errors as Record<string, string>) || {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={task ? "Edit task" : "New task"}
      subtitle={
        task
          ? "Update this task’s details and schedule."
          : "Enter the task details. Title and description are required."
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} noValidate className="task-form">
        <div className="form-body">
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          <label htmlFor="title">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            data-autofocus
            id="title"
            aria-label="Title"
            name="title"
            value={values.title}
            onChange={(e) => field("title", e.target.value)}
            placeholder="e.g. Review franchise onboarding"
            required
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p className="field-error" id="title-error">
              {errors.title}
            </p>
          )}
          <label htmlFor="description">
            Description <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            aria-label="Description"
            name="description"
            rows={4}
            value={values.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="Describe the work and any relevant context."
            required
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
          />
          {errors.description && (
            <p className="field-error" id="description-error">
              {errors.description}
            </p>
          )}
          <div className="form-grid">
            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={values.status}
                onChange={(e) => field("status", e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
              {errors.status && <p className="field-error">{errors.status}</p>}
            </div>
            <div>
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={values.priority}
                onChange={(e) => field("priority", e.target.value)}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel[priority]}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="field-error">{errors.priority}</p>
              )}
            </div>
          </div>
          <label htmlFor="dueDate">
            Due date <span className="optional">Optional</span>
          </label>
          <input
            id="dueDate"
            aria-label="Due date"
            type="date"
            value={values.dueDate || ""}
            onChange={(e) => field("dueDate", e.target.value)}
            aria-invalid={!!errors.dueDate}
            aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
          />
          {errors.dueDate && (
            <p id="dueDate-error" className="field-error">
              {errors.dueDate}
            </p>
          )}
          <p className="form-note">Fields marked * are required.</p>
        </div>
        <footer className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : task ? (
              <Pencil size={17} />
            ) : (
              <Plus size={17} />
            )}{" "}
            {busy ? "Saving…" : task ? "Save changes" : "Create task"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
