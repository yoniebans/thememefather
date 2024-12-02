#!/bin/bash
echo "Passing arguments: $*"

# Build packages sequentially to see clear output
echo "=== Building Core ==="
pnpm --dir packages/core dev -- $* &
sleep 5

echo "=== Building SQLite Adapter ==="
pnpm --dir packages/adapter-sqlite dev -- $* &
sleep 5

echo "=== Building Postgres Adapter ==="
pnpm --dir packages/adapter-postgres dev -- $* &
sleep 5

echo "=== Building Bootstrap Plugin ==="
pnpm --dir packages/plugin-bootstrap dev -- $* &
sleep 5

echo "=== Building Node Plugin ==="
pnpm --dir packages/plugin-node dev -- $* &
sleep 5

echo "=== Starting Clients ==="
pnpm --dir client dev -- $* &
pnpm --dir packages/client-telegram dev -- $* &
pnpm --dir packages/client-discord dev -- $* &
pnpm --dir packages/client-twitter dev -- $* &
pnpm --dir packages/client-direct dev -- $* &

echo "=== Starting Agent ==="
sleep 5 && pnpm --dir agent dev -- $* &

# Keep the script running
wait