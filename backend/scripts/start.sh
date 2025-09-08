#!/usr/bin/env sh
set -e

echo "[start] Running Prisma generate..."
npx prisma generate 1>/dev/null

echo "[start] Applying database migrations..."
if ! npx prisma migrate deploy 1>/dev/null; then
  echo "[start] No migrations found or failed to apply; attempting db push (dev sync)"
  npx prisma db push 1>/dev/null || true
fi

echo "[start] Launching server..."
node dist/server.js

