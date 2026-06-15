FROM node:22-slim AS base

WORKDIR /app

RUN corepack enable && corepack prepare bun@1.3.1 --activate

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY apps/ingestor/package.json apps/ingestor/package.json

RUN bun install --frozen-lockfile

COPY apps/web apps/web
COPY apps/ingestor apps/ingestor

WORKDIR /app/apps/ingestor

CMD ["bun", "run", "worker"]
