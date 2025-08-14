# -------- Builder stage --------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests and prisma schema first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including dev) for building TS
RUN npm ci

# Copy the rest of the source
COPY . .

# Generate Prisma Client (requires dev dep prisma)
RUN npx prisma generate

# Build TypeScript -> dist
RUN npm run build

# -------- Runtime stage --------
FROM node:18-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy only what we need to run
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Reuse built node_modules and prune dev deps
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S botuser -u 1001
RUN chown -R botuser:nodejs /app
USER botuser

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

CMD ["npm", "start"]
