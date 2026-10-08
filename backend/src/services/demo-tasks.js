import { randomUUID } from "node:crypto";

const examples = [
  [
    "Prepare the morning pickup route",
    "Group today’s scheduled pickups by neighbourhood and confirm driver availability.",
    "in_progress",
    "high",
    0,
  ],
  [
    "Review linen quality before dispatch",
    "Inspect the hotel linen batch for stains, finish, and correct packaging before the afternoon delivery.",
    "pending",
    "high",
    0,
  ],
  [
    "Confirm the weekly hotel collection",
    "Coordinate pickup windows with the hotel housekeeping team and update the collection manifest.",
    "pending",
    "medium",
    1,
  ],
  [
    "Service the steam finishing station",
    "Complete the scheduled maintenance check and log the pressure and temperature readings.",
    "pending",
    "high",
    -1,
  ],
  [
    "Restock biodegradable packaging",
    "Check stock levels and prepare an order for garment covers, paper bags, and reusable labels.",
    "in_progress",
    "medium",
    2,
  ],
  [
    "Resolve the delayed delivery request",
    "Call the customer with an updated delivery window and coordinate the priority dispatch.",
    "pending",
    "high",
    -2,
  ],
  [
    "Update garment care guidelines",
    "Document handling guidance for wool, silk, and embellished garments for the operations team.",
    "pending",
    "low",
    5,
  ],
  [
    "Reconcile yesterday’s pickup orders",
    "Match collection receipts against the order register and investigate any missing entries.",
    "completed",
    "medium",
    -1,
  ],
  [
    "Train the team on stain identification",
    "Run a short practical session on recognising common stains and selecting the appropriate treatment.",
    "in_progress",
    "low",
    3,
  ],
  [
    "Audit the customer feedback log",
    "Review recent feedback and identify the three service improvements with the highest impact.",
    "completed",
    "low",
    -3,
  ],
  [
    "Check delivery handover checklist",
    "Verify that completed orders include item counts, care notes, and the customer delivery confirmation.",
    "completed",
    "high",
    -1,
  ],
  [
    "Draft next month’s service calendar",
    "Plan recurring commercial pickups and team capacity for the coming month.",
    "pending",
    "medium",
    null,
  ],
];

export function createDemoTasks(today = new Date()) {
  const base = new Date(today);
  base.setUTCHours(0, 0, 0, 0);
  return examples.map(
    ([title, description, status, priority, offset], index) => {
      const due = new Date(base);
      due.setUTCDate(due.getUTCDate() + (offset ?? 0));
      const createdAt = new Date(
        base.getTime() - (index + 1) * 86400000,
      ).toISOString();
      return {
        id: randomUUID(),
        title,
        description,
        status,
        priority,
        dueDate: offset === null ? null : due.toISOString().slice(0, 10),
        createdAt,
        updatedAt: createdAt,
      };
    },
  );
}
