FROM node:18-alpine

WORKDIR /app

# Copy package files - use ./ prefix to be explicit about context
COPY ./package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy prisma schema
COPY ./prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy all source code
COPY ./ ./

# Railway uses PORT env variable
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]
