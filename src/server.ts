import { createApp } from "./app";
import { loadConfig } from "./config";
import { FileTodoRepo } from "./features/todos/todo.repo";

const config = loadConfig();

const app = createApp({
  todoRepo: new FileTodoRepo(config.dataFile),
  bodyLimit: config.bodyLimit,
});

const server = app.listen(config.port, () => {
  console.log(`API started on port: ${config.port}`);
});

// How long to let in-flight requests finish before giving up. Keep this under
// the orchestrator's own kill timeout (Kubernetes defaults to 30s).
const SHUTDOWN_TIMEOUT_MS = 10_000;

let shuttingDown = false;

/**
 * Without this the process dies the instant the platform sends SIGTERM, which
 * drops every request still in flight on each deploy. Stop accepting new
 * connections, let the open ones finish, then exit.
 */
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received, closing server`);

  // Exit non-zero if a wedged connection outlives the grace period, so the
  // platform records it as an unclean stop rather than a normal one.
  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out, exiting");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((err) => {
    if (err) {
      console.error("Error while closing server", err);
      process.exit(1);
    }
    console.log("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
