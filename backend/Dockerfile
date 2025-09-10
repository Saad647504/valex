FROM node:18

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies  
RUN npm ci

# Deploy migrations to empty database and generate client
RUN npx prisma migrate deploy
RUN npx prisma generate

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "src/ultra-minimal.js"]