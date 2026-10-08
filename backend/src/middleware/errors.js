export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Route not found."));
}

export function errorHandler(error, _req, res, _next) {
  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
  }
  return res
    .status(500)
    .json({ message: "An unexpected server error occurred." });
}
