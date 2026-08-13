import type { ErrorRequestHandler } from 'express';

/**
 * Registered last, and takes four arguments — that arity is how Express tells an
 * error handler apart from ordinary middleware. Express 5 routes rejected
 * promises from async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = statusOf(err);

  if (status >= 500) {
    console.error(err);
    // Never the thrown message: it can carry a stack, a query, or a path.
    res.status(status).json({ error: 'internal server error' });
    return;
  }

  // 4xx means the caller can fix it, so the reason has to reach them. These are
  // raised by middleware that already writes caller-safe messages — body-parser
  // sends "request entity too large" for a body over the limit, and
  // "Unexpected token ... in JSON" for a malformed one.
  console.warn(`${status}: ${messageOf(err)}`);
  res.status(status).json({ error: messageOf(err) });
};

function statusOf(err: unknown): number {
  const candidate = (err as { status?: unknown; statusCode?: unknown } | null)?.status
    ?? (err as { statusCode?: unknown } | null)?.statusCode;

  return typeof candidate === 'number' && candidate >= 400 && candidate <= 599
    ? candidate
    : 500;
}

function messageOf(err: unknown): string {
  const message = (err as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message !== '' ? message : 'bad request';
}
