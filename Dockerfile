FROM node:18-alpine

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

# Start the server
CMD ["node", "src/server.js"]
