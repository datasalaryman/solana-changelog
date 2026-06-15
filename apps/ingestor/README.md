# Ingestor

Independent Temporal service that reads `apps/web/src/data/repositories.json`, fetches GitHub releases, pull requests, and discussions, then upserts them into the same PostgreSQL database tables used by `apps/web`.

The service imports `apps/web/src/db/schema.ts` and `apps/web/src/server/githubCache.ts` so both applications use the same Drizzle schema and upsert behavior.

## Environment

The ingestor uses its own env file at `apps/ingestor/.env`. Copy `apps/ingestor/.env.example` to `apps/ingestor/.env` for local runs. It does not read `apps/web/.env` directly.

Required:

```sh
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
GITHUB_TOKEN=github_pat_or_token
```

Optional:

```sh
GITHUB_BASE_URL=https://api.github.com
TEMPORAL_TASK_QUEUE=solana-changelog-ingestor
TEMPORAL_SCHEDULE_ID=solana-changelog-ingestor
SYNC_INTERVAL="1 hour"
```

`GITHUB_TOKEN` is required for GitHub Discussions because the GitHub GraphQL discussions API requires authentication. Releases and pull requests can fetch without it, but unauthenticated requests have lower rate limits.

## Local Run

Start a Temporal server separately, then run the worker:

```sh
bun --filter solana-changelog-ingestor worker
```

Create or update the recurring Temporal Schedule:

```sh
bun --filter solana-changelog-ingestor schedule
```

Trigger a one-off workflow execution:

```sh
bun --filter solana-changelog-ingestor run-once
```

## Docker

Build the image from the repository root:

```sh
docker build -f apps/ingestor/Dockerfile -t solana-changelog-ingestor .
```

Run the worker container:

```sh
docker run --rm \
  -e DATABASE_URL="postgresql://username:password@host/database?sslmode=require" \
  -e GITHUB_TOKEN="github_pat_or_token" \
  -e TEMPORAL_ADDRESS="host.docker.internal:7233" \
  -e TEMPORAL_NAMESPACE="default" \
  solana-changelog-ingestor
```

Create or update the schedule from the image:

```sh
docker run --rm \
  -e DATABASE_URL="postgresql://username:password@host/database?sslmode=require" \
  -e GITHUB_TOKEN="github_pat_or_token" \
  -e TEMPORAL_ADDRESS="host.docker.internal:7233" \
  -e TEMPORAL_NAMESPACE="default" \
  solana-changelog-ingestor \
  bun run schedule
```

## Schema

Run migrations from `apps/web`; this service does not generate or own schema changes:

```sh
bun --filter solana-engineering-dashboard db:migrate
```
