import test, { describe } from "node:test";
import { createApp } from "../app";
import { InMemoryTodoRepo } from "../features/todos/todo.repo.memory";
import request from "supertest"

const app = createApp({ todoRepo: new InMemoryTodoRepo() });

describe("Integration/component tests", () => {
    test("GET /foo returns something", async () => {
        const res = await request(app)
        .get("/foo")
        .expect(200)
    })
})
