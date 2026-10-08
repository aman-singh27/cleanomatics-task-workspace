import { CheckCheck, CircleDot, Layers3, Clock3, Plus } from "lucide-react";
import { isOverdue, type Task, type TaskView } from "../lib/tasks";
export function Overview({
  tasks,
  loading,
  onNew,
  status,
  onView,
}: {
  tasks: Task[];
  loading: boolean;
  onNew: () => void;
  status: TaskView;
  onView: (status: TaskView) => void;
}) {
  const complete = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length
    ? Math.round((complete / tasks.length) * 100)
    : 0;
  const metrics = [
    {
      label: "Total tasks",
      value: tasks.length,
      icon: Layers3,
      className: "total",
      note: "Across all statuses",
      filter: "all" as const,
    },
    {
      label: "In progress",
      value: tasks.filter((task) => task.status === "in_progress").length,
      icon: CircleDot,
      className: "progress",
      note: "Tasks currently underway",
      filter: "in_progress" as const,
    },
    {
      label: "Completed",
      value: complete,
      icon: CheckCheck,
      className: "complete",
      note: "Tasks marked complete",
      filter: "completed" as const,
    },
    {
      label: "Overdue",
      value: tasks.filter(isOverdue).length,
      icon: Clock3,
      className: "overdue",
      note: "Past due and unfinished",
      filter: "overdue" as const,
    },
  ];
  return (
    <>
      <section className="intro">
        <div>
          <p className="eyebrow">
            <span />
            OPERATIONS WORKSPACE
          </p>
          <h1>
            Operations <span>tasks</span>
          </h1>
          <p>Track task status, priority, and due dates.</p>
        </div>
        <button className="button primary create-button" onClick={onNew}>
          <Plus size={18} />
          New task
        </button>
      </section>
      <section className="overview" aria-label="Task overview">
        <div className="metrics">
          {metrics.map(
            ({ label, value, icon: Icon, className, note, filter }) => {
              const content = (
                <>
                  <div className="metric-top">
                    <span>{label}</span>
                    <span className="metric-icon">
                      <Icon size={18} />
                    </span>
                  </div>
                  <strong>{loading ? "…" : value}</strong>
                  <p>{note}</p>
                </>
              );
              return (
                <button
                  type="button"
                  key={label}
                  className={`metric metric-filter ${className} ${status === filter ? "selected" : ""}`}
                  aria-label={`${filter === "all" ? "All tasks" : label} ${value}`}
                  aria-pressed={status === filter}
                  onClick={() => onView(filter)}
                >
                  {content}
                </button>
              );
            },
          )}
        </div>
        <div className="progress-card">
          <div className="completion-values">
            <strong>{loading ? "…" : `${progress}%`}</strong>
            <small>completed</small>
          </div>
          <div className="completion-content">
            <h2>Task completion</h2>
            <p>
              {loading
                ? "Loading task totals…"
                : tasks.length
                  ? `${complete} of ${tasks.length} tasks completed.`
                  : "No tasks created yet."}
            </p>
            <progress
              value={loading ? 0 : progress}
              max={100}
              aria-label="Task completion"
            />
          </div>
        </div>
      </section>
    </>
  );
}
