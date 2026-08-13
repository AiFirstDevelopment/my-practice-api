# syntax=docker/dockerfile:1

# --- build: full dependency tree, compiles TypeScript to dist/ ---------------
FROM node:22-alpine AS build
WORKDIR /app

# Copied before the source so a source-only edit reuses the cached install.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# --- deps: production dependencies only, resolved separately from the build --
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime ----------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# FileTodoRepo writes here. Owned by `node` because the process drops root
# below; mount a volume over it or the todos die with the container.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]
ENV DATA_FILE=/app/data/todos.json

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form, no shell wrapper: PID 1 is node itself, so it receives the SIGTERM
# that server.ts installs a handler for.
CMD ["node", "dist/server.js"]
