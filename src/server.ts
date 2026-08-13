import { createApp } from "./app";
import { FileTodoRepo } from "./features/todos/todo.repo";

const port = 3000;
createApp({ todoRepo: new FileTodoRepo() }).listen(port, () => {
  console.log(`API Started on port: ${port}`);
});
