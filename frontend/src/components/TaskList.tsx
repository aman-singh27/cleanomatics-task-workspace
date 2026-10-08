import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  ArrowUpRight,
  RotateCcw,
  Plus,
  CircleCheck,
} from "lucide-react";
import {
  formatDate,
  isOverdue,
  statusLabel,
  priorityLabel,
  statuses,
  priorities,
  type Task,
  type Status,
  type Priority,
  type Sort,
} from "../lib/tasks";
import { PriorityBadge } from "./TaskBadges";
import { InlineTaskStatus } from "./InlineTaskStatus";
interface Props {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string;
  onRetry: () => void;
  query: string;
  onQuery: (value: string) => void;
  status: Status | "all";
  onStatus: (value: Status | "all") => void;
  priority: Priority | "all";
  onPriority: (value: Priority | "all") => void;
  sort: Sort;
  onSort: (value: Sort) => void;
  page: number;
  onPage: (value: number) => void;
  pageSize: number;
  onClear: () => void;
  onNew: () => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => Promise<void>;
  pendingStatusIds: ReadonlySet<string>;
  workspaceEmpty: boolean;
}
export function TaskList(props: Props) {
  const {
    tasks,
    total,
    loading,
    error,
    onRetry,
    query,
    onQuery,
    status,
    onStatus,
    priority,
    onPriority,
    sort,
    onSort,
    page,
    onPage,
    pageSize,
    onClear,
    onNew,
    onView,
    onEdit,
    onDelete,
    onStatusChange,
    pendingStatusIds,
    workspaceEmpty,
  } = props;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <section className="tasks-panel" aria-label="Tasks">
      <div className="panel-heading">
        <div>
          <div className="section-title">
            <h2>Your tasks</h2>
            <span className="count-badge">{total}</span>
          </div>
          <p>Search tasks or filter by status and priority.</p>
        </div>
        <span className="list-view">
          <ListTodo size={16} />
          List view
        </span>
      </div>
      <div className="toolbar">
        <div className="search-control">
          <Search size={17} />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
          <kbd>/</kbd>
        </div>
        <div className="filter-controls">
          <span className="filter-icon">
            <SlidersHorizontal size={16} />
          </span>
          <select
            aria-label="Status filter"
            value={status}
            onChange={(e) => onStatus(e.target.value as Status | "all")}
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option value={value} key={value}>
                {statusLabel[value]}
              </option>
            ))}
          </select>
          <select
            aria-label="Priority filter"
            value={priority}
            onChange={(e) => onPriority(e.target.value as Priority | "all")}
          >
            <option value="all">All priorities</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {priorityLabel[value]}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort tasks"
            value={sort}
            onChange={(e) => onSort(e.target.value as Sort)}
          >
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="priority-desc">Priority: high first</option>
            <option value="due-asc">Due date: earliest first</option>
            <option value="due-desc">Due date: latest first</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="loading-list" role="status" aria-label="Loading tasks">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="skeleton-row" key={index}>
              <div />
              <div />
              <div />
              <div />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state error-state">
          <RotateCcw size={28} />
          <h3>Tasks could not be loaded</h3>
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={onRetry}>
            <RotateCcw size={16} />
            Retry
          </button>
        </div>
      ) : !tasks.length ? (
        <div className="empty-state">
          <div className="empty-illustration">
            <CircleCheck size={32} />
          </div>
          <h3>
            {workspaceEmpty ? "No tasks yet" : "No tasks match your filters"}
          </h3>
          <p>
            {workspaceEmpty
              ? "Create a task to add it to this workspace."
              : "Change your search or clear the filters."}
          </p>
          <button
            className={`button ${workspaceEmpty ? "primary" : "secondary"}`}
            onClick={workspaceEmpty ? onNew : onClear}
          >
            {workspaceEmpty ? <Plus size={16} /> : <RotateCcw size={16} />}{" "}
            {workspaceEmpty ? "New task" : "Clear filters"}
          </button>
        </div>
      ) : (
        <>
          <div className="task-table">
            <div className="table-header">
              <span>Task name</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Created</span>
              <span>Due date</span>
              <span className="sr-only">Actions</span>
            </div>
            {tasks.map((task) => (
              <article
                className={`task-row ${task.status === "completed" ? "done" : ""}`}
                key={task.id}
                data-testid="task-row"
                data-task-id={task.id}
                aria-busy={pendingStatusIds.has(task.id)}
              >
                <div className="task-info">
                  <span className={`task-symbol ${task.status}`}>
                    <ListTodo size={17} />
                  </span>
                  <div>
                    <button
                      className="task-title"
                      id={`task-title-${task.id}`}
                      aria-label={`View task ${task.title}`}
                      disabled={pendingStatusIds.has(task.id)}
                      onClick={() => onView(task)}
                    >
                      {task.title}
                      <ArrowUpRight size={14} />
                    </button>
                    <p>{task.description}</p>
                    <span className="task-created-inline">
                      Created <span>{formatDate(task.createdAt)}</span>
                    </span>
                  </div>
                </div>
                <div className="row-status">
                  <InlineTaskStatus task={task} onChange={onStatusChange} />
                </div>
                <div className="row-priority">
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="created-date">
                  <span className="mobile-label">Created</span>
                  <span>{formatDate(task.createdAt)}</span>
                </div>
                <div className={`due-date ${isOverdue(task) ? "late" : ""}`}>
                  <CalendarDays size={13} />
                  <span>{formatDate(task.dueDate)}</span>
                  {isOverdue(task) && <span className="sr-only">Overdue</span>}
                </div>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label="Edit task"
                    aria-describedby={`task-title-${task.id}`}
                    disabled={pendingStatusIds.has(task.id)}
                    title={`Edit ${task.title}`}
                    onClick={() => onEdit(task)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button delete-action"
                    aria-label="Delete task"
                    aria-describedby={`task-title-${task.id}`}
                    disabled={pendingStatusIds.has(task.id)}
                    title={`Delete ${task.title}`}
                    onClick={() => onDelete(task)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="pagination">
            <p>
              Showing{" "}
              <strong>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
              </strong>{" "}
              of <strong>{total}</strong> tasks
            </p>
            <div>
              <span>
                Page {page} of {pages}
              </span>
              <button
                className="icon-button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => onPage(page - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Next page"
                disabled={page === pages}
                onClick={() => onPage(page + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
