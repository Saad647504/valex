FROM node:18

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies  
RUN npm ci

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Create a startup script that runs migrations then starts the server
RUN echo '#!/bin/bash\n\
npx prisma migrate deploy\n\
npx prisma generate\n\
node src/ultra-minimal.js' > start.sh && chmod +x start.sh

# Start with the script
CMD ["./start.sh"]