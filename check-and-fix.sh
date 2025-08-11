#!/bin/bash

# 🔧 Быстрая диагностика и восстановление TL Bot

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "🔍 Диагностика TL Bot на $SERVER_IP"
echo "==================================="

# Проверяем доступность сервера
echo "1. Проверяем доступность сервера..."
if ping -c 1 $SERVER_IP &> /dev/null; then
    echo "✅ Сервер доступен"
else
    echo "❌ Сервер недоступен"
    exit 1
fi

# Проверяем статус контейнеров
echo ""
echo "2. Проверяем статус Docker контейнеров..."
CONTAINERS_STATUS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$SERVER_IP '
cd /home/tlbot/app 2>/dev/null
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker не найден"
' 2>/dev/null)

echo "$CONTAINERS_STATUS"

# Проверяем память
echo ""
echo "3. Проверяем использование памяти..."
MEMORY_STATUS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$SERVER_IP '
free -h | grep Mem
' 2>/dev/null)

echo "$MEMORY_STATUS"

# Проверяем веб-доступ
echo ""
echo "4. Проверяем веб-доступ..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$SERVER_IP:3000 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Сайт работает! HTTP $HTTP_STATUS"
    echo ""
    echo "🌐 Ваше приложение доступно:"
    echo "   Главная: http://$SERVER_IP:3000"
    echo "   Админка: http://$SERVER_IP:3000/admin"
    echo ""
    echo "👤 Данные для входа в админку:"
    echo "   Email: admin@tlbot.local"
    echo "   Пароль: AdminTLBot2025!"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo "❌ Сайт недоступен (не отвечает)"
    echo ""
    echo "🔧 ИСПРАВЛЯЕМ ПРОБЛЕМУ..."
    
    # Перезапускаем контейнеры
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP '
    echo "🔄 Перезапускаем контейнеры..."
    cd /home/tlbot/app
    
    # Останавливаем все контейнеры
    docker stop $(docker ps -q) 2>/dev/null || true
    
    # Очищаем память
    docker system prune -f
    
    # Запускаем PostgreSQL
    echo "📦 Запускаем PostgreSQL..."
    su tlbot -c "cd /home/tlbot/app && docker-compose -f docker-compose.final.yml up -d postgres"
    sleep 10
    
    # Запускаем приложение с ограничением памяти
    echo "🚀 Запускаем приложение..."
    su tlbot -c "cd /home/tlbot/app && docker run -d --name tlbot_app_simple \
        --network app_tlbot_network \
        -p 3000:3000 \
        --memory=300m \
        -e NODE_ENV=production \
        -e NODE_OPTIONS=\"--max-old-space-size=200\" \
        -e DATABASE_URL=\"postgresql://tlbot:StrongDbPassword2025@tlbot_postgres:5432/tlbot_prod\" \
        -e TELEGRAM_BOT_TOKEN=\"7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0\" \
        -e NEXT_PUBLIC_APP_URL=\"http://89.104.65.237:3000\" \
        app-app npm start"
    
    echo "⏳ Ждем запуска (20 секунд)..."
    sleep 20
    
    echo "✅ Перезапуск завершен!"
    '
    
    # Проверяем результат
    echo ""
    echo "🔍 Проверяем результат..."
    sleep 5
    HTTP_STATUS_NEW=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$SERVER_IP:3000 2>/dev/null)
    
    if [ "$HTTP_STATUS_NEW" = "200" ]; then
        echo "✅ ИСПРАВЛЕНО! Сайт теперь работает!"
    else
        echo "❌ Проблема не решена. HTTP: $HTTP_STATUS_NEW"
    fi
else
    echo "⚠️  Сайт отвечает, но с ошибкой: HTTP $HTTP_STATUS"
fi

echo ""
echo "📱 Для тестирования Telegram Bot:"
echo "   1. Найдите бота: @YourBotName"
echo "   2. Отправьте /start"
echo "   3. Нажмите 'Открыть магазин' для Mini App"
