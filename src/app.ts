import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler";
import { authenticate } from "./middleware/auth";
import { makeTodoRouter } from "./features/todos/todo.router";
import type { TodoRepo } from "./features/todos/todo.repo";

export interface AppDeps {
    todoRepo: TodoRepo;
    /** Max request body size. Optional so tests can take the default. */
    bodyLimit?: string;
}

/**
 * Composition root: the one place that decides which implementations the app
 * runs with and where each router is mounted.
 */
export function createApp(deps: AppDeps): Express {
    const app: Express = express();

    // Security headers first, so they are set even on responses from the
    // middleware below.
    app.use(helmet());

    // Bounded: without a limit a single request can buffer unlimited memory.
    app.use(express.json({ limit: deps.bodyLimit ?? "100kb" }));

    // Above authenticate on purpose — an orchestrator's liveness probe has no
    // credentials to present.
    app.get("/healthz", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    });

    // Currently a no-op that calls next(). Mounted here so that when it starts
    // enforcing, every route below is covered by default rather than by
    // remembering to opt each one in.
    app.use(authenticate);

    // The router's own routes are written as "/" and "/:id" — the prefix lives here.
    app.use("/todos", makeTodoRouter(deps.todoRepo));

    // Must come last: everything above can hand it an error via next(err) or a
    // rejected promise.
    app.use(errorHandler);

    return app;
}
