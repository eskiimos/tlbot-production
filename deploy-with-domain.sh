#!/bin/bash

DOMAIN_NAME="$1"
SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

if [[ -z "$DOMAIN_NAME" ]]; then
    echo "❌ Использование: ./deploy-with-domain.sh yourdomain.tk"
    exit 1
fi

echo "🚀 Деплой с доменом: $DOMAIN_NAME"
echo "====================================="

# Обновляем файлы на сервере
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
cd /home/tlbot/app

# Обновляем переменные окружения
cat > .env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://tlbot:StrongDbPassword2025@tlbot_postgres:5432/tlbot_prod
TELEGRAM_BOT_TOKEN=7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0
NEXT_PUBLIC_APP_URL=https://$DOMAIN_NAME
ADMIN_EMAIL=admin@tlbot.local
ADMIN_PASSWORD=AdminTLBot2025!
WEBHOOK_URL=https://$DOMAIN_NAME/api/bot
ENVEOF

# Перезапускаем с новой конфигурацией
docker-compose down
docker-compose up --build -d

echo '✅ Деплой завершен!'
echo ''
echo '📋 СЛЕДУЮЩИЕ ШАГИ:'
echo '1. Настройте DNS: $DOMAIN_NAME -> $SERVER_IP'
echo '2. Включите Cloudflare Proxy (оранжевое облако)'
echo '3. В BotFather установите Mini App URL: https://$DOMAIN_NAME'
echo '4. Обновите webhook: https://$DOMAIN_NAME/api/bot'
"
