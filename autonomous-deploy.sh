#!/bin/bash

# 🤖 Автономный деплой с логированием и отчетами

echo "🤖 Автономный деплой TL Bot"
echo "=========================="

LOG_FILE="/tmp/tlbot_deploy.log"
STATUS_FILE="/tmp/tlbot_deploy_status"

# Функция логирования
log() {
    echo "$(date '+%H:%M:%S') $1" | tee -a $LOG_FILE
}

# Начинаем деплой
log "🚀 Начинаем автономный деплой..."
echo "starting" > $STATUS_FILE

# Переходим в директорию
cd /home/tlbot/app
log "📁 Перешли в директорию: $(pwd)"

# Проверяем файлы
if [ ! -f "docker-compose.regoblako.yml" ]; then
    log "❌ Файл docker-compose.regoblako.yml не найден"
    echo "error: docker-compose file not found" > $STATUS_FILE
    exit 1
fi

if [ ! -f ".env.regoblako" ]; then
    log "❌ Файл .env.regoblako не найден"
    echo "error: env file not found" > $STATUS_FILE
    exit 1
fi

log "✅ Файлы найдены, продолжаем..."

# Экспортируем переменные
export $(cat .env.regoblako | grep -v '^#' | xargs)
log "📋 Переменные окружения загружены"

# Останавливаем старые контейнеры
log "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.regoblako.yml down 2>&1 | tee -a $LOG_FILE

# Очищаем Docker
log "🧹 Очищаем Docker кеш..."
docker system prune -f 2>&1 | tee -a $LOG_FILE

# Запускаем PostgreSQL
log "🗄️  Запускаем PostgreSQL..."
echo "postgres_starting" > $STATUS_FILE
docker-compose -f docker-compose.regoblako.yml up -d postgres 2>&1 | tee -a $LOG_FILE

# Ждем запуска PostgreSQL
log "⏳ Ждем запуска PostgreSQL (30 секунд)..."
sleep 30

# Проверяем статус PostgreSQL
if docker-compose -f docker-compose.regoblako.yml ps postgres | grep -q "Up"; then
    log "✅ PostgreSQL запущен успешно"
else
    log "❌ Ошибка запуска PostgreSQL"
    echo "error: postgres failed" > $STATUS_FILE
    exit 1
fi

# Собираем образ приложения
log "🔨 Собираем образ приложения..."
echo "building" > $STATUS_FILE
timeout 600 docker-compose -f docker-compose.regoblako.yml build app 2>&1 | tee -a $LOG_FILE

if [ $? -eq 0 ]; then
    log "✅ Образ собран успешно"
else
    log "❌ Ошибка сборки образа (таймаут 10 минут)"
    echo "error: build failed" > $STATUS_FILE
    exit 1
fi

# Применяем миграции
log "📊 Применяем миграции..."
echo "migrating" > $STATUS_FILE
docker-compose -f docker-compose.regoblako.yml run --rm app npx prisma migrate deploy 2>&1 | tee -a $LOG_FILE

# Заполняем базу
log "📝 Заполняем базу начальными данными..."
docker-compose -f docker-compose.regoblako.yml run --rm app npx prisma db seed 2>&1 | tee -a $LOG_FILE || log "⚠️  Seed пропущен (возможно уже выполнен)"

# Запускаем приложение
log "🚀 Запускаем приложение..."
echo "starting_app" > $STATUS_FILE
docker-compose -f docker-compose.regoblako.yml up -d app 2>&1 | tee -a $LOG_FILE

# Ждем запуска приложения
log "⏳ Ждем запуска приложения..."
sleep 30

# Проверяем health check
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Приложение запущено успешно!"
        echo "success" > $STATUS_FILE
        break
    else
        log "⏳ Попытка $i/10: Приложение еще запускается..."
        sleep 10
    fi
    
    if [ $i -eq 10 ]; then
        log "❌ Приложение не отвечает после 10 попыток"
        echo "error: app not responding" > $STATUS_FILE
        exit 1
    fi
done

# Настраиваем webhook
log "🤖 Настраиваем Telegram webhook..."
WEBHOOK_RESULT=$(curl -s -F "url=http://89.104.65.237:3000/api/bot" \
     "https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook")

log "📱 Результат настройки webhook: $WEBHOOK_RESULT"

# Финальный статус
log "🎉 Деплой завершен успешно!"
log "🌐 Приложение: http://89.104.65.237:3000"
log "👤 Админка: http://89.104.65.237:3000/admin"
log "📧 Email: admin@tlbot.local | Пароль: AdminTLBot2025!"

echo "completed" > $STATUS_FILE

log "📋 Логи деплоя сохранены в: $LOG_FILE"
log "📊 Статус деплоя в: $STATUS_FILE"
