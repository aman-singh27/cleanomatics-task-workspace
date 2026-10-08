import { Check, Circle, LoaderCircle, Flag } from "lucide-react";
import {
  statusLabel,
  priorityLabel,
  type Status,
  type Priority,
} from "../lib/tasks";
export function StatusBadge({ status }: { status: Status }) {
  const Icon =
    status === "completed"
      ? Check
      : status === "in_progress"
        ? LoaderCircle
        : Circle;
  return (
    <span className={`status-badge ${status}`}>
      <Icon size={13} />
      {statusLabel[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge ${priority}`}>
      <Flag size={12} />
      {priorityLabel[priority]}
    </span>
  );
}
