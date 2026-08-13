import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app";
import { InMemoryTodoRepo } from "../features/todos/todo.repo.memory";
import request from "supertest"

const app = createApp(new InMemoryTodoRepo());

describe("Integration/component tests", () => {
    test("GET /healthz reports ok", async () => {
        const res = await request(app)
            .get("/healthz")
            .expect(200)

        assert.deepEqual(res.body, { status: "ok" })
    })
})
