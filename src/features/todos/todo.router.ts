import { Router, type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import type { TodoRepo } from './todo.repo';
import type { Todo, TodoFilter, TodoPatch } from './todo.types';

/**
 * Builds the /todos router. Nothing in here knows where it will be mounted, and
 * its storage arrives as an argument — so the same router works at `/todos`,
 * `/api/v1/todos`, or against an in-memory repo in tests.
 */
export function makeTodoRouter(repo: TodoRepo): Router {
  const router = Router();

  // Runs once per request before any handler on a route containing `:id`.
  // Express 5 forwards a rejected promise from a param handler to the error
  // middleware, so there is no try/catch here.
  router.param('id', async (req: Request, res: Response, next: NextFunction, id: string) => {
    const todo = await repo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: `no todo with id ${id}` });
    }
    res.locals.todo = todo;
    next();
  });

  router
    .route('/')
    .get(async (req: Request, res: Response) => {
      const { done, q } = req.query;
      const filter: TodoFilter = {};

      if (done !== undefined) {
        if (done !== 'true' && done !== 'false') {
          return res.status(400).json({ error: 'done must be "true" or "false"' });
        }
        filter.done = done === 'true';
      }

      if (q !== undefined) {
        // A repeated `?q=a&q=b` parses as an array.
        if (typeof q !== 'string') {
          return res.status(400).json({ error: 'q must be a single string' });
        }
        if (q.trim() !== '') filter.q = q.trim();
      }

      res.status(200).json(await repo.list(filter));
    })
    .post(async (req: Request, res: Response) => {
      const { title } = req.body ?? {};

      if (!isNonEmptyString(title)) {
        return res.status(400).json({ error: 'title is required and must be a non-empty string' });
      }

      const todo: Todo = {
        id: randomUUID(),
        title: title.trim(),
        done: false,
        createdAt: new Date().toISOString(),
      };

      await repo.add(todo);
      res.status(201).json(todo);
    });

  router
    .route('/:id')
    .get((_req: Request, res: Response) => {
      res.status(200).json(res.locals.todo);
    })
    .patch(async (req: Request, res: Response) => {
      const { title, done } = req.body ?? {};
      const patch: TodoPatch = {};

      if (title !== undefined) {
        if (!isNonEmptyString(title)) {
          return res.status(400).json({ error: 'title must be a non-empty string' });
        }
        patch.title = title.trim();
      }

      if (done !== undefined) {
        if (typeof done !== 'boolean') {
          return res.status(400).json({ error: 'done must be a boolean' });
        }
        patch.done = done;
      }

      res.status(200).json(await repo.patch(res.locals.todo.id, patch));
    })
    .delete(async (_req: Request, res: Response) => {
      await repo.remove(res.locals.todo.id);
      res.status(204).end();
    });

  return router;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
