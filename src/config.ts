import path from 'path';

/**
 * Everything the process reads from its environment, resolved once at startup so
 * a bad value fails the boot rather than the first request that happens to need
 * it. Nothing below `server.ts` reads `process.env` directly.
 */
export interface Config {
  nodeEnv: string;
  port: number;
  /** JSON file backing FileTodoRepo. Mount a volume here in a container. */
  dataFile: string;
  /** Cap on request body size, passed to express.json(). */
  bodyLimit: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT, 3000),
    dataFile: env.DATA_FILE ?? path.join(process.cwd(), 'data', 'todos.json'),
    bodyLimit: env.BODY_LIMIT ?? '100kb',
  };
}

function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${value}"`);
  }
  return port;
}
