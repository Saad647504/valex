# Backend Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:18-alpine AS builder
WORKDIR /app
COPY backend ./backend
WORKDIR /app/backend
RUN npm ci && npx prisma generate && npx tsc

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/scripts/start.sh ./scripts/start.sh
RUN npm ci --omit=dev && npx prisma generate
EXPOSE 5001
RUN chmod +x ./scripts/start.sh
CMD ["./scripts/start.sh"]
