#!/bin/bash

# 🚀 Автоматический деплой TL Bot
# Использование: ./deploy.sh [production|staging]

set -e  # Остановить скрипт при ошибке

ENVIRONMENT=${1:-production}
PROJECT_DIR="/home/tlbot"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Начинаем деплой в окружение: $ENVIRONMENT"

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: Не найден package.json. Убедитесь, что вы в корне проекта."
    exit 1
fi

# Создаем бэкап базы данных
echo "📦 Создаем бэкап базы данных..."
mkdir -p "$BACKUP_DIR"
if docker ps | grep -q tlbot_postgres; then
    docker exec tlbot_postgres_prod pg_dump -U tlbot tlbot_prod > "$BACKUP_DIR/backup_before_deploy_$DATE.sql"
    echo "✅ Бэкап создан: backup_before_deploy_$DATE.sql"
else
    echo "⚠️  PostgreSQL контейнер не запущен, бэкап пропущен"
fi

# Останавливаем приложение (но не базу данных)
echo "🛑 Останавливаем приложение..."
docker-compose -f docker-compose.prod.yml stop app || true

# Обновляем код
echo "📥 Обновляем код из Git..."
git fetch origin
git reset --hard origin/main

# Проверяем наличие новых миграций
echo "🔍 Проверяем миграции..."
if [ -d "prisma/migrations" ]; then
    echo "📊 Применяем миграции базы данных..."
    
    # Запускаем только базу данных если она не запущена
    docker-compose -f docker-compose.prod.yml up -d postgres
    
    # Ждем запуска БД
    echo "⏳ Ждем запуска базы данных..."
    sleep 10
    
    # Применяем миграции
    docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
    echo "✅ Миграции применены"
fi

# Собираем новый образ
echo "🔨 Собираем новый образ приложения..."
docker-compose -f docker-compose.prod.yml build app

# Запускаем обновленное приложение
echo "🚀 Запускаем обновленное приложение..."
docker-compose -f docker-compose.prod.yml up -d

# Ждем запуска приложения
echo "⏳ Ждем запуска приложения..."
sleep 15

# Проверяем здоровье приложения
echo "🏥 Проверяем здоровье приложения..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Приложение успешно запущено!"
        break
    else
        echo "⏳ Попытка $i/10: Приложение еще запускается..."
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Ошибка: Приложение не отвечает после деплоя"
        echo "📋 Логи приложения:"
        docker-compose -f docker-compose.prod.yml logs --tail=20 app
        exit 1
    fi
done

# Очищаем старые образы
echo "🧹 Очищаем старые Docker образы..."
docker image prune -f

# Очищаем старые бэкапы (оставляем последние 7 дней)
echo "🧹 Очищаем старые бэкапы..."
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true

# Показываем статус
echo ""
echo "🎉 Деплой завершен успешно!"
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Полезные команды:"
echo "  Логи:           docker-compose -f docker-compose.prod.yml logs -f app"
echo "  Перезапуск:     docker-compose -f docker-compose.prod.yml restart app"
echo "  Консоль БД:     docker exec -it tlbot_postgres_prod psql -U tlbot -d tlbot_prod"
echo "  Состояние:      curl http://localhost:3000/api/health"
echo ""
echo "🌐 Приложение доступно по адресу: https://$(hostname -f || echo 'your-domain.com')"
