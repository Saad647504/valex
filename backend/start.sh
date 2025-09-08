#!/usr/bin/env bash
set -euo pipefail

# Run database migrations
npx prisma migrate deploy

# Start the server
npm start