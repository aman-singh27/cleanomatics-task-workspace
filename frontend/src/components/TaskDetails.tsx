import { useEffect, useState } from "react";
import { CalendarDays, Pencil, Trash2, LoaderCircle } from "lucide-react";
import { taskApi } from "../api/tasks";
import { formatDate, type Task } from "../lib/tasks";
import { Dialog } from "./Dialog";
import { PriorityBadge, StatusBadge } from "./TaskBadges";
export function TaskDetails({
  id,
  onClose,
  onEdit,
  onDelete,
}: {
  id: string;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    taskApi
      .get(id)
      .then((result) => {
        if (active) setTask(result);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load task.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <Dialog title="Task details" onClose={onClose} drawer>
      <div className="detail-body">
        {loading ? (
          <div className="detail-loading" role="status">
            <LoaderCircle className="spin" />
            Loading task…
          </div>
        ) : error ? (
          <div className="alert" role="alert">
            <p>{error}</p>
            <button
              className="button secondary"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          task && (
            <>
              <div className="detail-badges">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              <h3 className="detail-title">{task.title}</h3>
              <p className="detail-description">{task.description}</p>
              <dl className="detail-meta">
                <div>
                  <dt>
                    <CalendarDays size={16} />
                    Due date
                  </dt>
                  <dd>{formatDate(task.dueDate)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(task.createdAt, true)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(task.updatedAt, true)}</dd>
                </div>
                <div>
                  <dt>Task ID</dt>
                  <dd className="task-id">{task.id}</dd>
                </div>
              </dl>
            </>
          )
        )}
      </div>
      {task && !loading && !error && (
        <footer className="dialog-footer">
          <button
            className="button danger-ghost"
            onClick={() => onDelete(task)}
          >
            <Trash2 size={17} />
            Delete task
          </button>
          <button className="button primary" onClick={() => onEdit(task)}>
            <Pencil size={16} />
            Edit task
          </button>
        </footer>
      )}
    </Dialog>
  );
}
