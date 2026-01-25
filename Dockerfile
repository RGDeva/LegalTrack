FROM node:18-alpine

# Install OpenSSL and other dependencies required by Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy backend package files first
COPY backend/package.json backend/package-lock.json ./

# Copy prisma schema BEFORE npm install (needed for postinstall)
COPY backend/prisma ./prisma/

# Install dependencies (this runs prisma generate via postinstall)
RUN npm ci

# Copy backend source code
COPY backend/src ./src/
COPY backend/templates ./templates/

# Railway uses PORT env variable
EXPOSE 8080

# Push schema changes and start server (db push for schemaless migrations)
CMD npx prisma db push --accept-data-loss && node src/server.js
