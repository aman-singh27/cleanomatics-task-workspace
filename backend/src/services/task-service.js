import { randomUUID } from "node:crypto";
import { HttpError } from "../middleware/errors.js";

/** Each service owns its Map; records never persist or leak mutable references. */
export function createTaskService(initialTasks = []) {
  const tasks = new Map(initialTasks.map((task) => [task.id, { ...task }]));
  function find(id) {
    const task = tasks.get(id);
    if (!task) throw new HttpError(404, "Task not found.");
    return task;
  }
  return {
    list: () => [...tasks.values()].map((task) => ({ ...task })),
    get: (id) => ({ ...find(id) }),
    create(input) {
      const now = new Date().toISOString();
      const task = {
        ...input,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      tasks.set(task.id, task);
      return { ...task };
    },
    update(id, input) {
      const current = find(id);
      const task = {
        ...input,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      tasks.set(id, task);
      return { ...task };
    },
    remove(id) {
      find(id);
      tasks.delete(id);
      return { message: "Task deleted successfully.", id };
    },
  };
}
