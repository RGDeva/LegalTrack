# Build date: 2026-01-25 - Force cache invalidation
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy remaining source files
COPY src/ ./src/
COPY templates/ ./templates/

# Railway injects PORT at runtime
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

# Start server
CMD ["node", "src/server.js"]
