import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  drawer?: boolean;
  busy?: boolean;
  subtitle?: string;
}
export function Dialog({
  title,
  onClose,
  children,
  drawer = false,
  busy = false,
  subtitle,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const pending = useRef(busy);
  pending.current = busy;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current!;
    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]',
        ),
      ).filter((el) => !el.hidden);
    const initial =
      node.querySelector<HTMLElement>("[data-autofocus]") ||
      focusable()[0] ||
      node;
    initial.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending.current) {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) {
          event.preventDefault();
          node.focus();
          return;
        }
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !node.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !node.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = old;
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>(".create-button")?.focus();
    };
  }, []);
  return (
    <div
      className={`overlay ${drawer ? "drawer-overlay" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={`dialog ${drawer ? "drawer" : ""}`}
        ref={ref}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="dialog-header">
          <div>
            <p className="eyebrow">TASK WORKSPACE</p>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
