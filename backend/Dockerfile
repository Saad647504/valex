FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip postinstall)
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "src/ultra-minimal.js"]