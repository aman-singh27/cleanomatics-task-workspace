import { ArrowUpRight, Moon, Sun, X, Droplets, BookOpen } from "lucide-react";
import { apiDocsUrl } from "../api/tasks";
import type { Task } from "../lib/tasks";
export function Sidebar({
  tasks,
  dark,
  onTheme,
  open,
  onClose,
}: {
  tasks: Task[];
  dark: boolean;
  onTheme: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const pending = tasks.filter((task) => task.status === "pending").length;
  const highPriority = tasks.filter(
    (task) => task.priority === "high" && task.status !== "completed",
  ).length;
  return (
    <>
      <button
        className={`nav-backdrop ${open ? "visible" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Droplets size={25} />
          </div>
          <div>
            <strong>CLEANOMATICS</strong>
            <span>Task workspace</span>
          </div>
          <button
            className="mobile-nav-close icon-button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">C</span>
          <div>
            <strong>Operations workspace</strong>
            <span>Task management</span>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="focus-card">
            <p>Pending tasks</p>
            <strong className="sidebar-count">{pending}</strong>
            <span>
              {highPriority} unfinished high-priority{" "}
              {highPriority === 1 ? "task" : "tasks"}
            </span>
          </div>
          <a
            className="nav-item docs-link"
            href={apiDocsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={18} />
            <span>API documentation</span>
            <ArrowUpRight size={15} />
          </a>
          <button
            className="theme-toggle"
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
            onClick={onTheme}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{dark ? "Light appearance" : "Dark appearance"}</span>
            <span className={`theme-switch ${dark ? "on" : ""}`}>
              <i />
            </span>
          </button>
          <div className="sidebar-footer">
            <a href="/privacy">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </aside>
    </>
  );
}
