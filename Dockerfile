FROM node:18-alpine

WORKDIR /app

# Копирование файлов проекта
COPY package*.json ./
COPY prisma ./prisma/

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Генерация Prisma Client
RUN npx prisma generate

# Сборка проекта
RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Назначение владельца файлов
RUN chown -R botuser:nodejs /app
USER botuser

# Экспорт портов
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

# Запуск приложения
CMD ["npm", "start"]
