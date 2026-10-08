import { ArrowUpRight, Moon, Sun, X, Droplets, BookOpen } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const navigation = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia("(max-width: 850px)");
    if (!mobile.matches) {
      close.current();
      return;
    }
    const node = navigation.current!;
    const opener = document.querySelector<HTMLElement>(
      '[aria-controls="workspace-navigation"]',
    );
    const background = document.querySelector<HTMLElement>(".main-shell");
    const previouslyInert = background?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]"),
      ).filter((item) => item.getClientRects().length > 0);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      } else if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (
          !node.contains(document.activeElement) ||
          (!event.shiftKey && document.activeElement === last) ||
          (event.shiftKey && document.activeElement === first)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    const resize = () => {
      if (!mobile.matches) close.current();
    };
    document.addEventListener("keydown", handleKey);
    mobile.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", handleKey);
      mobile.removeEventListener("change", resize);
      if (background) background.inert = previouslyInert;
      document.body.style.overflow = previousOverflow;
      if (mobile.matches && opener?.isConnected) opener.focus();
    };
  }, [open]);
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
        tabIndex={-1}
      />
      <aside
        ref={navigation}
        id="workspace-navigation"
        aria-label="Workspace navigation"
        className={`sidebar ${open ? "open" : ""}`}
      >
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
