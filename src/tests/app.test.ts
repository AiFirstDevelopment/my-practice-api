import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app";
import { InMemoryTodoRepo } from "../features/todos/todo.repo.memory";
import request from "supertest"

const app = createApp({ todoRepo: new InMemoryTodoRepo() });

describe("Integration/component tests", () => {
    test("GET /healthz reports ok", async () => {
        const res = await request(app)
            .get("/healthz")
            .expect(200)

        assert.deepEqual(res.body, { status: "ok" })
    })

    test("sets security headers from helmet", async () => {
        const res = await request(app)
            .get("/healthz")
            .expect(200)

        assert.equal(res.headers["x-content-type-options"], "nosniff")
    })

    test("rejects a body over the size limit with 413", async () => {
        const small = createApp({ todoRepo: new InMemoryTodoRepo(), bodyLimit: "1kb" });

        await request(small)
            .post("/todos")
            .send({ title: "x".repeat(2048) })
            .expect(413)
    })
})
