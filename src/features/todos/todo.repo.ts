import { promises as fs } from 'fs';
import path from 'path';
import type { Todo, TodoPatch } from './todo.types';

/**
 * The storage contract the router depends on. The router is handed one of these
 * rather than reaching for the filesystem itself, so tests can swap in
 * `InMemoryTodoRepo` without touching disk.
 */
export interface TodoRepo {
  list(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | undefined>;
  add(todo: Todo): Promise<Todo>;
  patch(id: string, patch: TodoPatch): Promise<Todo | undefined>;
  remove(id: string): Promise<boolean>;
}

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'todos.json');

/** Persists todos as a single JSON file. */
export class FileTodoRepo implements TodoRepo {
  private readonly dbPath: string;

  // Every mutation is a read-modify-write of the whole file, so mutations are
  // chained onto one promise. Two concurrent POSTs would otherwise both read the
  // same snapshot and the second write would drop the first todo.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
  }

  async list(): Promise<Todo[]> {
    return this.read();
  }

  async findById(id: string): Promise<Todo | undefined> {
    const todos = await this.read();
    return todos.find((todo) => todo.id === id);
  }

  add(todo: Todo): Promise<Todo> {
    return this.mutate((todos) => {
      todos.push(todo);
      return todo;
    });
  }

  patch(id: string, patch: TodoPatch): Promise<Todo | undefined> {
    return this.mutate((todos) => {
      const todo = todos.find((candidate) => candidate.id === id);
      if (!todo) return undefined;
      Object.assign(todo, patch);
      return todo;
    });
  }

  remove(id: string): Promise<boolean> {
    return this.mutate((todos) => {
      const index = todos.findIndex((todo) => todo.id === id);
      if (index === -1) return false;
      todos.splice(index, 1);
      return true;
    });
  }

  private mutate<T>(change: (todos: Todo[]) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const todos = await this.read();
      const result = change(todos);
      await this.write(todos);
      return result;
    });

    // Keep the chain alive even if this operation fails.
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async read(): Promise<Todo[]> {
    try {
      const raw = await fs.readFile(this.dbPath, 'utf8');
      return JSON.parse(raw) as Todo[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }

  private async write(todos: Todo[]): Promise<void> {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    await fs.writeFile(this.dbPath, JSON.stringify(todos, null, 2), 'utf8');
  }
}
