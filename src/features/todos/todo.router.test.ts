import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express, { type Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { makeTodoRouter } from './todo.router';
import { InMemoryTodoRepo } from './todo.repo.memory';

describe('todos router', () => {
  let app: Express;

  // A fresh app on a fresh in-memory repo per test: no shared state, no
  // filesystem, nothing to clean up between cases.
  beforeEach(() => {
    app = createApp(new InMemoryTodoRepo());
  });

  it('returns an empty list when there are no todos', async () => {
    const res = await request(app).get('/todos').expect(200);
    assert.deepEqual(res.body, []);
  });

  it('creates a todo and returns 201', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'buy milk' })
      .expect('Content-Type', /json/)
      .expect(201);

    assert.equal(res.body.title, 'buy milk');
    assert.equal(res.body.done, false);
    assert.ok(res.body.id);
  });

  it('rejects a todo with no title', async () => {
    const res = await request(app).post('/todos').send({}).expect(400);
    assert.match(res.body.error, /title/);
  });

  it('lists todos that were created', async () => {
    await request(app).post('/todos').send({ title: 'first' }).expect(201);
    await request(app).post('/todos').send({ title: 'second' }).expect(201);

    const res = await request(app).get('/todos').expect(200);

    assert.equal(res.body.length, 2);
    assert.deepEqual(
      res.body.map((t: { title: string }) => t.title),
      ['first', 'second']
    );
  });

  it('fetches a single todo by id', async () => {
    const created = (await request(app).post('/todos').send({ title: 'read docs' })).body;

    const res = await request(app).get(`/todos/${created.id}`).expect(200);

    assert.deepEqual(res.body, created);
  });

  it('404s for an unknown id', async () => {
    const res = await request(app).get('/todos/does-not-exist').expect(404);
    assert.match(res.body.error, /does-not-exist/);
  });

  it('patches a todo', async () => {
    const created = (await request(app).post('/todos').send({ title: 'walk dog' })).body;

    const res = await request(app)
      .patch(`/todos/${created.id}`)
      .send({ done: true })
      .expect(200);

    assert.equal(res.body.done, true);
    assert.equal(res.body.title, 'walk dog');
  });

  it('rejects a patch with an invalid title', async () => {
    const created = (await request(app).post('/todos').send({ title: 'walk dog' })).body;

    // Every value here fails the same non-empty-string guard the create path uses.
    for (const title of ['', '   ', 42]) {
      const res = await request(app)
        .patch(`/todos/${created.id}`)
        .send({ title })
        .expect(400);

      assert.match(res.body.error, /title/);
    }
  });

  it('rejects a patch with a non-boolean done', async () => {
    const created = (await request(app).post('/todos').send({ title: 'walk dog' })).body;

    const res = await request(app)
      .patch(`/todos/${created.id}`)
      .send({ done: 'yes' })
      .expect(400);

    assert.match(res.body.error, /done/);
  });

  it('deletes a todo', async () => {
    const created = (await request(app).post('/todos').send({ title: 'temp' })).body;

    await request(app).delete(`/todos/${created.id}`).expect(204);
    await request(app).get(`/todos/${created.id}`).expect(404);
  });

  it('works wherever it is mounted', async () => {
    const other = express();
    other.use(express.json());
    other.use('/api/v1/todos', makeTodoRouter(new InMemoryTodoRepo()));

    await request(other).post('/api/v1/todos').send({ title: 'mounted elsewhere' }).expect(201);

    const res = await request(other).get('/api/v1/todos').expect(200);
    assert.equal(res.body.length, 1);
  });

  describe('filtering GET /todos', () => {
    const titles = (body: { title: string }[]) => body.map((t) => t.title);

    beforeEach(() => {
      const createdAt = new Date(0).toISOString();
      app = createApp(
        new InMemoryTodoRepo([
          { id: '1', title: 'Buy milk', done: false, createdAt },
          { id: '2', title: 'buy oat MILK', done: true, createdAt },
          { id: '3', title: 'walk dog', done: true, createdAt },
          { id: '4', title: 'read docs', done: false, createdAt },
        ])
      );
    });

    it('filters by done=true', async () => {
      const res = await request(app).get('/todos?done=true').expect(200);
      assert.deepEqual(titles(res.body), ['buy oat MILK', 'walk dog']);
    });

    it('filters by done=false', async () => {
      const res = await request(app).get('/todos?done=false').expect(200);
      assert.deepEqual(titles(res.body), ['Buy milk', 'read docs']);
    });

    it('matches q case-insensitively against the title', async () => {
      const res = await request(app).get('/todos?q=MiLk').expect(200);
      assert.deepEqual(titles(res.body), ['Buy milk', 'buy oat MILK']);
    });

    it('combines done and q', async () => {
      const res = await request(app).get('/todos?done=false&q=milk').expect(200);
      assert.deepEqual(titles(res.body), ['Buy milk']);
    });

    it('ignores an empty q', async () => {
      const res = await request(app).get('/todos?q=').expect(200);
      assert.equal(res.body.length, 4);
    });

    it('rejects a done that is not true or false', async () => {
      const res = await request(app).get('/todos?done=yes').expect(400);
      assert.match(res.body.error, /done/);
    });

    it('rejects a repeated q', async () => {
      const res = await request(app).get('/todos?q=a&q=b').expect(400);
      assert.match(res.body.error, /q/);
    });
  });
});
