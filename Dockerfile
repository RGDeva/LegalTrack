FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend prisma schema
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy backend source code
COPY backend/ .

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Start the server
CMD ["node", "src/server.js"]
