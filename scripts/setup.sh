#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

docker compose up -d
echo "Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U postgres -d cx_support >/dev/null 2>&1; do sleep 1; done

pnpm install
pnpm --filter @cx/shared --filter @cx/db --filter @cx/ai build
docker compose exec -T postgres psql -U postgres -d cx_support -f - < packages/db/drizzle/0000_init.sql
pnpm db:seed
pnpm db:ingest
pnpm widget:build

echo ""
echo "Setup complete."
echo "Start services:"
echo "  pnpm dev:api      # API on :3001"
echo "  pnpm dev:worker   # ingestion worker"
echo "  pnpm dev:web      # admin on :3000"
