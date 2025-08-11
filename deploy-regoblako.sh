#!/bin/bash

# 🚀 Деплой TL Bot на рег.облако VPS
# IP: 89.104.65.237
# Ubuntu 24.04 LTS

echo "🚀 Деплой TL Bot на рег.облако VPS"
echo "IP: 89.104.65.237"
echo "=================================="

# Настройка для рег.облако (1GB RAM)
echo "⚙️  Настройка под характеристики сервера..."

# Обновляем docker-compose для слабого сервера
cat > docker-compose.regoblako.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tlbot_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: tlbot
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: tlbot_prod
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - tlbot_network
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: tlbot_app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS="--max-old-space-size=384"
    env_file:
      - .env.regoblako
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - tlbot_network
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

volumes:
  postgres_data:

networks:
  tlbot_network:
    driver: bridge
EOF

echo "✅ Конфигурация Docker создана"

# Запускаем развертывание
echo "🚀 Запускаем развертывание..."

# Проверяем наличие файлов
if [ ! -f ".env.regoblako" ]; then
    echo "❌ Файл .env.regoblako не найден!"
    exit 1
fi

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.regoblako.yml down 2>/dev/null || true

# Собираем образ
echo "🔨 Собираем образ приложения..."
docker-compose -f docker-compose.regoblako.yml build

# Запускаем базу данных
echo "🗄️  Запускаем базу данных..."
docker-compose -f docker-compose.regoblako.yml up -d postgres

# Ждем запуска БД
echo "⏳ Ждем запуска базы данных..."
sleep 15

# Применяем миграции
echo "📊 Применяем миграции..."
docker-compose -f docker-compose.regoblako.yml run --rm app npx prisma migrate deploy

# Заполняем начальными данными
echo "📝 Заполняем базу начальными данными..."
docker-compose -f docker-compose.regoblako.yml run --rm app npx prisma db seed || echo "⚠️  Seed пропущен (возможно уже выполнен)"

# Запускаем приложение
echo "🚀 Запускаем приложение..."
docker-compose -f docker-compose.regoblako.yml up -d app

# Ждем запуска
echo "⏳ Ждем запуска приложения..."
sleep 20

# Проверяем статус
echo "📊 Проверяем статус..."
docker-compose -f docker-compose.regoblako.yml ps

# Проверяем доступность
echo "🏥 Проверяем доступность приложения..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Приложение запущено успешно!"
        break
    else
        echo "⏳ Попытка $i/10..."
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Приложение не отвечает"
        echo "📋 Логи:"
        docker-compose -f docker-compose.regoblako.yml logs --tail=20 app
        exit 1
    fi
done

echo ""
echo "🎉 Деплой завершен!"
echo "========================"
echo "🌐 Приложение: http://89.104.65.237:3000"
echo "👤 Админка: http://89.104.65.237:3000/admin"
echo "📋 Health check: http://89.104.65.237:3000/api/health"
echo ""
echo "👤 Данные для входа в админку:"
echo "Email: admin@tlbot.local"
echo "Password: AdminTLBot2025!"
echo ""
echo "🤖 Настройка Telegram webhook:"
echo "curl -F \"url=http://89.104.65.237:3000/api/bot\" \"https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook\""
echo ""
echo "📋 Полезные команды:"
echo "docker-compose -f docker-compose.regoblako.yml logs -f app  # логи"
echo "docker-compose -f docker-compose.regoblako.yml restart app  # перезапуск"
echo "docker-compose -f docker-compose.regoblako.yml ps          # статус"
