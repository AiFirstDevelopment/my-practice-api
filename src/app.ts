import express, { type Express, type Request, type Response } from "express";
import { errorHandler } from "./middleware/error-handler";
import { makeTodoRouter } from "./features/todos/todo.router";
import type { TodoRepo } from "./features/todos/todo.repo";

export interface AppDeps {
    todoRepo: TodoRepo;
}

/**
 * Composition root: the one place that decides which implementations the app
 * runs with and where each router is mounted.
 */
export function createApp(deps: AppDeps): Express {
    const app: Express = express();

    app.use(express.json());

    // endpoint
    app.get("/foo", (req: Request, res: Response) => {
        res.json({
            message: "Yep"
        })
    })

    // The router's own routes are written as "/" and "/:id" — the prefix lives here.
    app.use("/todos", makeTodoRouter(deps.todoRepo));

    // Must come last: everything above can hand it an error via next(err) or a
    // rejected promise.
    app.use(errorHandler);

    return app;
}
