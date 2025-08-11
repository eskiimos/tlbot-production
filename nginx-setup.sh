#!/bin/bash

# 🌐 Настройка Nginx на сервере для работы с вашим доменом

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🌐 Настройка Nginx для домена $DOMAIN"
echo "======================================"

# Создаем конфигурацию для Nginx
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    # Пути к SSL сертификатам - будут настроены позже
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Прокси к приложению Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Загружаем конфигурацию на сервер и настраиваем Nginx и Certbot
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔄 Останавливаем контейнер Nginx...'
    docker stop tlbot_nginx || true
    docker rm tlbot_nginx || true
    
    echo '📦 Устанавливаем необходимые пакеты...'
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    
    echo '📁 Создаем директорию для сертификатов...'
    mkdir -p /var/www/html/.well-known/acme-challenge
    
    echo '🔧 Копируем конфигурацию Nginx...'
    cat > /etc/nginx/sites-available/$DOMAIN << 'CONFEOF'
$(cat nginx.conf)
CONFEOF
    
    echo '🔄 Активируем конфигурацию...'
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    echo '🔄 Проверяем конфигурацию Nginx...'
    nginx -t
    
    echo '🔄 Перезапускаем Nginx...'
    systemctl restart nginx
    
    echo '🔒 Получаем SSL сертификат...'
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@tlbot.local
    
    echo '🔄 Перезапускаем Nginx после получения сертификата...'
    systemctl restart nginx
    
    echo '📡 Обновляем webhook для бота...'
    curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
    
    echo '✅ Настройка Nginx завершена!'
"

echo ""
echo "🔍 Ожидание обновления DNS..."
echo "DNS обновляются в течение 5-15 минут. После этого ваш сайт будет доступен по адресу:"
echo "https://$DOMAIN"
echo ""

echo "📱 НАСТРОЙКА TELEGRAM БОТА:"
echo "1. Откройте @BotFather в Telegram"
echo "2. Отправьте команду /setdomain"
echo "3. Выберите вашего бота"
echo "4. Введите: $DOMAIN"
echo ""
echo "5. Отправьте команду /setmenubutton"
echo "6. Выберите вашего бота"
echo "7. Введите текст кнопки (например: Открыть магазин)"
echo "8. Введите URL: https://$DOMAIN"
echo ""

echo "✅ ГОТОВО! Ваше Mini App будет доступно по адресу:"
echo "https://$DOMAIN"
echo ""
