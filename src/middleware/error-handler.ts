import type { ErrorRequestHandler } from 'express';

/**
 * Registered last, and takes four arguments — that arity is how Express tells an
 * error handler apart from ordinary middleware. Express 5 routes rejected
 * promises from async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
};
