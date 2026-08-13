import path from "path";
import { createApp } from "./app";
import { FileTodoRepo } from "./features/todos/todo.repo";

const port = Number(process.env.PORT) || 3000;
const dataFile = process.env.DATA_FILE ?? path.join(process.cwd(), "data", "todos.json");

const app = createApp(new FileTodoRepo(dataFile));

const server = app.listen(port, () => {
  console.log(`API started on port: ${port}`);
});

// Without this the process dies the instant the platform sends SIGTERM, which
// drops every request still in flight on each deploy.
function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
