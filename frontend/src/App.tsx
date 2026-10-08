import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Menu, X } from "lucide-react";
import { useDebounce, useTasks } from "./hooks/useTasks";
import {
  selectTasks,
  type Task,
  type TaskInput,
  type TaskView,
  type Priority,
  type Sort,
} from "./lib/tasks";
import { Sidebar } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { TaskList } from "./components/TaskList";
import { TaskForm } from "./components/TaskForm";
import { TaskDetails } from "./components/TaskDetails";
import { ConfirmDelete } from "./components/ConfirmDelete";
type Modal =
  | { kind: "create" }
  | { kind: "edit" | "delete"; task: Task }
  | { kind: "details"; id: string }
  | null;
function initialTheme() {
  try {
    return (
      localStorage.getItem("cleanomatics-theme") === "dark" ||
      (!localStorage.getItem("cleanomatics-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  } catch {
    return false;
  }
}
export default function App() {
  const { tasks, loading, error, load, save, remove } = useTasks();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const [status, setStatus] = useState<TaskView>("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<Sort>("created-desc");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [dark, setDark] = useState(initialTheme);
  const [navOpen, setNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingStatusIds, setPendingStatusIds] = useState<Set<string>>(
    new Set(),
  );
  const pageSize = 6;
  const filtered = useMemo(
    () => selectTasks(tasks, debounced, status, priority, sort),
    [tasks, debounced, status, priority, sort],
  );
  const clampedPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / pageSize)),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("cleanomatics-theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works when browser storage is unavailable. */
    }
  }, [dark]);
  useEffect(() => {
    setPage(1);
  }, [debounced, status, priority, sort]);
  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [page, clampedPage]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !modal &&
        !navOpen &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement)?.tagName,
        )
      ) {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>('input[type="search"]')
          ?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal, navOpen]);
  async function onSave(values: TaskInput, id?: string) {
    await save(values, id);
    setModal(null);
    setNotice(id ? "Task updated." : "Task created.");
  }
  async function onDelete(id: string) {
    await remove(id);
    setModal(null);
    setNotice("Task deleted.");
  }
  const clear = () => {
    setQuery("");
    setStatus("all");
    setPriority("all");
    setSort("created-desc");
    setPage(1);
  };
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to tasks
      </a>
      <Sidebar
        tasks={tasks}
        dark={dark}
        onTheme={() => setDark((value) => !value)}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              aria-controls="workspace-navigation"
              onClick={() => setNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Overview</strong>
          </div>
          <div className="topbar-context">
            <span className="today">{today}</span>
            <span className="workspace-indicator">
              <span />
              Shared demo
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Overview
            tasks={tasks}
            loading={loading}
            status={status}
            onView={(value) => {
              setStatus(value);
              setPriority("all");
              setQuery("");
              setPage(1);
              setNavOpen(false);
            }}
            onNew={() => setModal({ kind: "create" })}
          />
          <TaskList
            tasks={filtered.slice(
              (clampedPage - 1) * pageSize,
              clampedPage * pageSize,
            )}
            total={filtered.length}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            query={query}
            onQuery={setQuery}
            status={status}
            onStatus={setStatus}
            priority={priority}
            onPriority={setPriority}
            sort={sort}
            onSort={setSort}
            page={clampedPage}
            onPage={setPage}
            pageSize={pageSize}
            onClear={clear}
            onNew={() => setModal({ kind: "create" })}
            onView={(task) => setModal({ kind: "details", id: task.id })}
            onEdit={(task) => setModal({ kind: "edit", task })}
            onDelete={(task) => setModal({ kind: "delete", task })}
            onStatusChange={async (task, nextStatus) => {
              setPendingStatusIds((current) => new Set(current).add(task.id));
              try {
                await save(
                  {
                    title: task.title,
                    description: task.description,
                    status: nextStatus,
                    priority: task.priority,
                    dueDate: task.dueDate,
                  },
                  task.id,
                );
                setNotice("Status updated.");
              } finally {
                setPendingStatusIds((current) => {
                  const next = new Set(current);
                  next.delete(task.id);
                  return next;
                });
              }
            }}
            pendingStatusIds={pendingStatusIds}
            workspaceEmpty={!tasks.length}
          />
          <footer className="main-footer">
            <span>
              CLEANOMATICS <i /> TASK WORKSPACE
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Check size={17} />
          </span>
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal?.kind === "create" && (
        <TaskForm onClose={() => setModal(null)} onSave={onSave} />
      )}{" "}
      {modal?.kind === "edit" && (
        <TaskForm
          task={modal.task}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}{" "}
      {modal?.kind === "details" && (
        <TaskDetails
          id={modal.id}
          onClose={() => setModal(null)}
          onEdit={(task) => setModal({ kind: "edit", task })}
          onDelete={(task) => setModal({ kind: "delete", task })}
        />
      )}{" "}
      {modal?.kind === "delete" && (
        <ConfirmDelete
          task={modal.task}
          onClose={() => setModal(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
