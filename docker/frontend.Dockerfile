# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci && npm run build

FROM node:18-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm","start"]

