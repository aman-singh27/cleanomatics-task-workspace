import { useEffect, useRef, useState } from "react";
import { statuses, statusLabel, type Status, type Task } from "../lib/tasks";
function canRestoreFocus(origin: HTMLElement | null) {
  const active = document.activeElement;
  return active === document.body || active === origin || !active?.isConnected;
}

export function InlineTaskStatus({
  task,
  onChange,
}: {
  task: Task;
  onChange: (task: Task, status: Status) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const control = useRef<HTMLSelectElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!busy && restoreFocus.current && control.current) {
      if (canRestoreFocus(control.current)) control.current.focus();
      restoreFocus.current = false;
    }
  }, [busy]);
  useEffect(
    () => () => {
      if (restoreFocus.current && canRestoreFocus(control.current))
        document
          .querySelector<HTMLSelectElement>('[aria-label="Status filter"]')
          ?.focus();
    },
    [],
  );
  async function update(status: Status) {
    if (pending.current || status === task.status) return;
    pending.current = true;
    restoreFocus.current = true;
    setBusy(true);
    setError("");
    try {
      const origin = control.current;
      await onChange(task, status);
      if (origin && !origin.isConnected && canRestoreFocus(origin))
        document
          .querySelector<HTMLSelectElement>('[aria-label="Status filter"]')
          ?.focus();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Status could not be saved. Try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="inline-status-control" aria-busy={busy}>
      <select
        ref={control}
        className={`inline-status ${task.status}`}
        aria-label={`Status for ${task.title}`}
        value={task.status}
        disabled={busy}
        onChange={(event) => void update(event.target.value as Status)}
        aria-describedby={error ? `status-error-${task.id}` : undefined}
      >
        {statuses.map((status) => (
          <option value={status} key={status}>
            {statusLabel[status]}
          </option>
        ))}
      </select>
      {busy && (
        <span className="inline-status-saving" role="status">
          Saving…
        </span>
      )}
      {error && (
        <p
          className="inline-status-error"
          id={`status-error-${task.id}`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
