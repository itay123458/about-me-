import { loadEnvFile } from "node:process";
import { connectDiscord } from "./discord.js";
import { createProfileServer } from "./http.js";

let discord;
let server;
let closing = false;

function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  discord?.close();
  const forceExit = setTimeout(() => process.exit(code), 5000);
  forceExit.unref();
  if (server?.listening) server.close(() => process.exit(code));
  else process.exit(code);
}

process.once("SIGINT", () => shutdown());
process.once("SIGTERM", () => shutdown());
process.on("unhandledRejection", (error) =>
  console.error(
    "Unhandled promise rejection:",
    error instanceof Error ? error.message : String(error),
  ),
);
process.once("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  shutdown(1);
});

try {
  try {
    loadEnvFile();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be between 1 and 65535.");
  discord = await connectDiscord(process.env);
  server = createProfileServer(discord.snapshot, process.env.ALLOWED_ORIGIN);
  server.once("error", (error) => {
    console.error("HTTP server error:", error.message);
    shutdown(1);
  });
  server.listen(port, "0.0.0.0", () =>
    console.log(`Profile server listening on port ${port}`),
  );
} catch (error) {
  console.error("Startup failed:", error.message);
  shutdown(1);
}
