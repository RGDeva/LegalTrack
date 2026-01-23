FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/server.js"]
