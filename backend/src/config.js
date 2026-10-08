export const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function readConfig(env = process.env) {
  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return {
    port,
    origins: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : [...DEFAULT_ORIGINS],
    seed: env.SEED_DEMO_DATA !== "false",
  };
}
