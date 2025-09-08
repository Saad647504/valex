Deployment Guide

Quick Start (Docker Compose)
- Prereqs: Docker + Docker Compose
- Copy env files:
  - cp backend/.env.example backend/.env  (edit secrets and DB URL)
  - cp frontend/.env.example frontend/.env (set NEXT_PUBLIC_API_BASE if not proxying)
- Start stack:
  - docker compose up -d --build
- Verify:
  - Backend health: http://localhost:5001/api/health/healthz (DB/Redis status)
  - Frontend: http://localhost:3000
- Migrations: backend container runs `prisma migrate deploy` on startup; falls back to `db push` if no migrations found.

Production Split (Vercel + Backend on Render/Fly/Heroku)
- Backend:
  - Set env: DATABASE_URL, JWT_SECRET, GITHUB_WEBHOOK_SECRET, CORS_ORIGIN
  - Expose port 5001
  - Health endpoints: /health (liveness), /api/health/healthz (readiness)
  - Redis (optional): set REDIS_URL
  - Run on boot: prisma migrate deploy (use provided start script as reference)
- Frontend (Vercel):
  - NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api
  - NEXT_PUBLIC_WS_URL=https://api.yourdomain.com (or leave empty to use same origin)

GitHub Webhooks
- URL: https://api.yourdomain.com/api/github/webhook
- Content type: application/json
- Secret: same as backend GITHUB_WEBHOOK_SECRET
- Events: push, pull_request, ping

Kubernetes (outline)
- Liveness: GET /health
- Readiness: GET /api/health/ready
- ConfigMap/Secret for envs; service per app; ingress terminating TLS; sticky sessions not required (Socket.IO auth via token).

