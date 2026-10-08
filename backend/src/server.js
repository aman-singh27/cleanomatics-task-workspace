import "dotenv/config";
import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { createShutdownHandler } from "./shutdown.js";

const config = readConfig();
const server = createApp(config).listen(config.port, config.host, () => {
  console.log(`Task API ready at http://localhost:${config.port}/api`);
});

const shutdown = createShutdownHandler({ server });
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
