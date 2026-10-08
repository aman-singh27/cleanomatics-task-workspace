import { Component, type ReactNode } from "react";

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="utility-page">
      <header className="utility-header">
        <a href="/" className="utility-brand">
          CLEANOMATICS <span>Task workspace</span>
        </a>
        <a href="/">Back to tasks</a>
      </header>
      <main className="utility-content">{children}</main>
      <footer className="utility-footer">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms of use</a>
      </footer>
    </div>
  );
}

export function RouteBoundary({
  children,
  path = window.location.pathname,
}: {
  children: ReactNode;
  path?: string;
}) {
  if (path === "/") return children;
  if (path === "/privacy" || path === "/privacy/")
    return (
      <PageFrame>
        <p className="utility-label">PROJECT INFORMATION</p>
        <h1>Privacy notice</h1>
        <p className="utility-date">Updated 8 October 2026</p>
        <p>
          This notice describes the task workspace demo created by Aman Singh
          for the Cleanomatics developer assignment.
        </p>
        <h2>Task data</h2>
        <p>
          The title, description, status, priority, and due date you enter are
          sent to the task API so the workspace can display and update them. The
          API stores tasks in the running server's memory. Task changes
          disappear when that server restarts.
        </p>
        <h2>Browser storage</h2>
        <p>
          Your theme preference is saved in localStorage on this browser. Task
          records are not saved in browser storage. Clear site data in your
          browser settings to remove the theme preference.
        </p>
        <h2>Tracking and access</h2>
        <p>
          This application includes no analytics, advertising trackers, account
          registration, or authentication. Anyone who can reach the same API can
          view and change its tasks. Use sample data when evaluating the demo.
        </p>
        <h2>Your controls</h2>
        <p>
          You can inspect, edit, and delete task records through the workspace.
          Deleting a task removes it from the running API. Seeded examples
          return when demo seeding is enabled and the server restarts.
        </p>
        <h2>Questions</h2>
        <p>
          The project author is Aman Singh. For questions about this evaluation
          project, use the contact details supplied with the assignment
          submission.
        </p>
      </PageFrame>
    );
  if (path === "/terms" || path === "/terms/")
    return (
      <PageFrame>
        <p className="utility-label">PROJECT INFORMATION</p>
        <h1>Terms of use</h1>
        <p className="utility-date">Updated 8 October 2026</p>
        <p>
          This workspace is a developer assignment demo for evaluating task
          management functionality.
        </p>
        <h2>Using the demo</h2>
        <p>
          Use sample task information to try creating, viewing, editing, and
          deleting records. Keep a separate copy of anything you need to retain.
        </p>
        <h2>Temporary data</h2>
        <p>
          Task changes reset when the backend restarts. A restart may restore
          the example task set. There is no account protection or permanent task
          storage.
        </p>
        <h2>Availability</h2>
        <p>
          The demo may be stopped or restarted during development and review. It
          is provided for evaluation rather than ongoing business operations.
        </p>
        <h2>Project scope</h2>
        <p>
          Aman Singh built this interface for the full-stack developer
          assignment. Cleanomatics is the company referenced by the assignment;
          this demo does not process laundry bookings or customer payments.
        </p>
      </PageFrame>
    );
  return (
    <PageFrame>
      <p className="utility-label">404</p>
      <h1>Page not found</h1>
      <p>
        The address you opened does not match a page in this workspace. Check
        the address or return to your tasks.
      </p>
    </PageFrame>
  );
}

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <PageFrame>
        <p className="utility-label">APPLICATION ERROR</p>
        <h1>Something went wrong</h1>
        <p>
          The page could not be displayed. Try again, or reload the page if the
          problem continues.
        </p>
        <div className="utility-actions">
          <button
            className="button primary"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </button>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </PageFrame>
    );
  }
}
