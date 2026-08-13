import type { RequestHandler } from 'express';

/**
 * Placeholder. Every request is allowed through untouched — there is no
 * authentication on this API yet.
 *
 * It is mounted in the real position in the chain (after body parsing, before
 * any router) so that filling it in later is a change to this file alone. When
 * it does start rejecting requests, it should respond 401 rather than call
 * `next(err)`, and put the caller's identity on `res.locals` for handlers to
 * read.
 */
export const authenticate: RequestHandler = (_req, _res, next) => {
  next();
};
