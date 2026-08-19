# ==========================================
# Resume2Role — Backend Dockerfile
# Multi-stage production build (Node.js 20 LTS)
# ==========================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies if needed
COPY package*.json ./

# Install clean production dependencies
RUN npm ci --omit=dev

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Security: Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy installed production node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create uploads directory with appropriate permissions
RUN mkdir -p uploads && chown -R node:node /usr/src/app

# Security: Run as non-root user
USER node

# Expose backend API port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
