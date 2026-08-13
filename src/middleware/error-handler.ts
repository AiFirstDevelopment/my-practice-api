import type { ErrorRequestHandler } from 'express';

/**
 * Registered last, and takes four arguments — that arity is how Express tells an
 * error handler apart from ordinary middleware. Express 5 routes rejected
 * promises from async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;

  if (status >= 500) {
    console.error(err);
    // Never the thrown message: it can carry a stack, a query, or a path.
    res.status(500).json({ error: 'internal server error' });
    return;
  }

  // 4xx means the caller can fix it, so the reason has to reach them. These come
  // from middleware that already writes caller-safe messages.
  res.status(status).json({ error: err.message ?? 'bad request' });
};
