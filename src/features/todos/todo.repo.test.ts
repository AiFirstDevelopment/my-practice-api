import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { FileTodoRepo } from './todo.repo';
import type { Todo } from './todo.types';

describe('FileTodoRepo.list filtering', () => {
  let dir: string;
  let repo: FileTodoRepo;

  const titles = (todos: Todo[]) => todos.map((t) => t.title);

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'todos-'));
    repo = new FileTodoRepo(path.join(dir, 'todos.json'));

    const createdAt = new Date(0).toISOString();
    await repo.add({ id: '1', title: 'Buy milk', done: false, createdAt });
    await repo.add({ id: '2', title: 'buy oat MILK', done: true, createdAt });
    await repo.add({ id: '3', title: 'walk dog', done: true, createdAt });
    await repo.add({ id: '4', title: 'read docs', done: false, createdAt });
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('returns everything with no filter', async () => {
    assert.equal((await repo.list()).length, 4);
  });

  it('filters by done: true', async () => {
    assert.deepEqual(titles(await repo.list({ done: true })), ['buy oat MILK', 'walk dog']);
  });

  it('filters by done: false', async () => {
    assert.deepEqual(titles(await repo.list({ done: false })), ['Buy milk', 'read docs']);
  });

  it('matches q case-insensitively', async () => {
    assert.deepEqual(titles(await repo.list({ q: 'MILK' })), ['Buy milk', 'buy oat MILK']);
  });

  it('combines done and q', async () => {
    assert.deepEqual(titles(await repo.list({ done: false, q: 'milk' })), ['Buy milk']);
  });

  it('returns an empty list when nothing matches', async () => {
    assert.deepEqual(await repo.list({ q: 'nomatch' }), []);
  });
});
