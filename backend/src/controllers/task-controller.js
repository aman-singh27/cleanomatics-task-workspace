import { validateTask } from "../validation/task-validation.js";

export function createTaskController(service) {
  return {
    list: (_req, res) => res.json(service.list()),
    get: (req, res) => res.json(service.get(req.params.id)),
    create: (req, res) =>
      res.status(201).json(service.create(validateTask(req.body))),
    update: (req, res) =>
      res.json(service.update(req.params.id, validateTask(req.body))),
    remove: (req, res) => res.json(service.remove(req.params.id)),
  };
}
