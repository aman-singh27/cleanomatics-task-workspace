import "dotenv/config";
import { createApp } from "./app.js";
import { readConfig } from "./config.js";

const config = readConfig();
const server = createApp(config).listen(config.port, () => {
  console.log(`Task API ready at http://localhost:${config.port}/api`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
