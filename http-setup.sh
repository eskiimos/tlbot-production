#!/bin/bash

# 🌐 Окончательная настройка Nginx для домена (без SSL сначала)

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🌐 Финальная настройка для домена $DOMAIN"
echo "=========================================="

# Создаем конфигурацию для Nginx (только HTTP сначала)
cat > nginx-http.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

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

# Загружаем конфигурацию и настраиваем сервер
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔧 Настраиваем HTTP версию сайта...'
    
    # Удаляем старую конфигурацию, если есть
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-available/$DOMAIN
    rm -f /etc/nginx/sites-enabled/$DOMAIN
    
    # Копируем новую конфигурацию
    cat > /etc/nginx/sites-available/$DOMAIN << 'CONFEOF'
$(cat nginx-http.conf)
CONFEOF
    
    # Активируем конфигурацию
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Проверяем и перезапускаем Nginx
    nginx -t && systemctl restart nginx
    
    echo '✅ HTTP версия сайта настроена!'
    
    echo '🔄 Перезапускаем приложение...'
    cd /home/tlbot/app
    docker-compose down
    docker-compose up -d postgres app
    
    echo '⏱️ Ждем 10 секунд для запуска приложения...'
    sleep 10
    
    # Проверяем, что приложение запущено
    curl http://localhost:3000 -I
    
    echo '📡 Обновляем webhook для бота...'
    curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=http://$DOMAIN/api/bot'
    
    echo '⚠️ ВАЖНО: После того, как DNS обновится и сайт станет доступен, выполните:'
    echo 'certbot --nginx -d $DOMAIN -d www.$DOMAIN'
    echo 'для получения SSL сертификата'
    
    echo '✅ Настройка завершена!'
"

echo ""
echo "🔍 ФИНАЛЬНЫЕ ШАГИ:"
echo ""
echo "1️⃣  НАСТРОЙТЕ DNS НА REG.RU:"
echo "   • A-запись: @ -> $SERVER_IP"
echo "   • A-запись: www -> $SERVER_IP"
echo ""
echo "2️⃣  ДОЖДИТЕСЬ ОБНОВЛЕНИЯ DNS (5-15 минут)"
echo "   • Проверить можно по ссылке: http://$DOMAIN"
echo ""
echo "3️⃣  УСТАНОВИТЕ SSL СЕРТИФИКАТ:"
echo "   • Подключитесь к серверу: ssh root@$SERVER_IP"
echo "   • Выполните: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   • Следуйте инструкциям"
echo ""
echo "4️⃣  НАСТРОЙТЕ TELEGRAM БОТА:"
echo "   • /setdomain -> $DOMAIN"
echo "   • /setmenubutton -> Текст кнопки | https://$DOMAIN"
echo ""
echo "✅ ГОТОВО! После этих шагов, ваше Mini App будет доступно по адресу:"
echo "https://$DOMAIN"
echo ""
