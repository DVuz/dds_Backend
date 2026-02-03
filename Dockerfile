# Multi-stage build for smaller image size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage (optional, for local testing)
FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressuser

# Copy dependencies from deps stage
COPY --from=deps --chown=expressuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=expressuser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R expressuser:nodejs logs

# Switch to non-root user
USER expressuser

# Expose port (Koyeb will override this)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
