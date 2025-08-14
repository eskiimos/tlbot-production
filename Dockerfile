# Dockerfile для Telegram бота
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Генерируем Prisma Client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 botuser

# Копируем зависимости и код
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package*.json ./
COPY bot.ts ./
COPY public ./public
COPY src/bot ./src/bot
COPY src/lib ./src/lib

USER botuser

# Запускаем бота
CMD ["npm", "run", "bot"]
