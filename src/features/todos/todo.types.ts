export interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface TodoPatch {
  title?: string;
  done?: boolean;
}

declare global {
  namespace Express {
    interface Locals {
      // Populated by the router's `:id` param handler, which 404s when the todo
      // is missing — so every handler on a `/:id` route can rely on it.
      todo: Todo;
    }
  }
}
