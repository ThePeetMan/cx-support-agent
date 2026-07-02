#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-3001}"
EXISTING_API_PID="$(lsof -ti :"$API_PORT" 2>/dev/null || true)"
STARTED_API=0
API_PID=""

if [ -n "$EXISTING_API_PID" ]; then
  echo "API already running on :$API_PORT (pid $EXISTING_API_PID)"
  API_PID="$EXISTING_API_PID"
else
  echo "Starting API on :$API_PORT..."
  pnpm dev:api &
  API_PID=$!
  STARTED_API=1
fi

echo "Starting worker..."
pnpm dev:worker &
WORKER_PID=$!

echo "Starting web on :3000..."
pnpm dev:web &
WEB_PID=$!

cleanup() {
  kill "$WORKER_PID" "$WEB_PID" 2>/dev/null || true
  if [ "$STARTED_API" = "1" ] && [ -n "$API_PID" ]; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo ""
echo "Dev stack running:"
echo "  Admin:  http://localhost:3000"
echo "  Demo:   http://localhost:3000/demo"
echo "  API:    http://localhost:${API_PORT}/health"
echo ""
echo "Press Ctrl+C to stop worker + web."

wait
