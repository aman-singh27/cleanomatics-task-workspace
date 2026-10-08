import { useState } from "react";
import { Trash2, LoaderCircle } from "lucide-react";
import { Dialog } from "./Dialog";
import type { Task } from "../lib/tasks";
export function ConfirmDelete({
  task,
  onClose,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onDelete(task.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete this task.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Delete task" onClose={onClose} busy={busy}>
      <div className="delete-body">
        <div className="delete-icon">
          <Trash2 size={26} />
        </div>
        <p>
          Delete <strong>“{task.title}”</strong>?
        </p>
        <p className="muted">
          This task will be permanently removed. This action cannot be undone.
        </p>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
      </div>
      <footer className="dialog-footer">
        <button
          data-autofocus
          className="button secondary"
          onClick={onClose}
          disabled={busy}
        >
          Keep task
        </button>
        <button className="button danger" onClick={confirm} disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Trash2 size={17} />
          )}{" "}
          {busy ? "Deleting…" : "Delete task"}
        </button>
      </footer>
    </Dialog>
  );
}
