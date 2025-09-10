FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies  
RUN npm ci

# Baseline the existing database and generate client
RUN npx prisma migrate resolve --applied 0_init || true
RUN npx prisma generate

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "src/ultra-minimal.js"]