import { Router } from "express";
import { createTaskController } from "../controllers/task-controller.js";

export function createTaskRouter(service) {
  const router = Router();
  const controller = createTaskController(service);
  router.route("/").get(controller.list).post(controller.create);
  router
    .route("/:id")
    .get(controller.get)
    .put(controller.update)
    .delete(controller.remove);
  return router;
}
