# Stage 1: Build the Angular App
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Run pre-commit tests with coverage verification
RUN npm run test:coverage

# Build the Angular production application
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy server logic and compiled static assets
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist/finanzas ./dist/finanzas

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
