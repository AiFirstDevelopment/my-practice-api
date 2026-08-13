import type { TodoRepo } from './todo.repo';
import type { Todo, TodoPatch } from './todo.types';

/**
 * Non-persistent TodoRepo. Tests build one per test case, which gives every test
 * an isolated database with no cleanup step and no shared file on disk.
 */
export class InMemoryTodoRepo implements TodoRepo {
  private readonly todos: Todo[];

  constructor(seed: Todo[] = []) {
    this.todos = [...seed];
  }

  async list(): Promise<Todo[]> {
    return [...this.todos];
  }

  async findById(id: string): Promise<Todo | undefined> {
    return this.todos.find((todo) => todo.id === id);
  }

  async add(todo: Todo): Promise<Todo> {
    this.todos.push(todo);
    return todo;
  }

  async patch(id: string, patch: TodoPatch): Promise<Todo | undefined> {
    const todo = this.todos.find((candidate) => candidate.id === id);
    if (!todo) return undefined;
    Object.assign(todo, patch);
    return todo;
  }

  async remove(id: string): Promise<boolean> {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) return false;
    this.todos.splice(index, 1);
    return true;
  }
}
