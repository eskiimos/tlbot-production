#!/bin/bash

# 🔒 Исправление SSL с правильным email

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🔒 Исправление SSL для $DOMAIN"
echo "============================="

# Запрашиваем email
read -p "Введите ваш email для Let's Encrypt (например: yourmail@gmail.com): " EMAIL

# Подключаемся к серверу и исправляем SSL
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔒 Получаем SSL сертификат с email: $EMAIL...'
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    
    echo '🔄 Перезапускаем Nginx...'
    systemctl restart nginx
    
    echo '📡 Обновляем webhook для бота...'
    curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
    
    echo '🔍 Проверяем статус веб-сервера...'
    systemctl status nginx | grep Active
    
    echo '✅ SSL настроен!'
"

echo ""
echo "🔍 Проверка HTTPS..."
curl -k -I https://$DOMAIN || echo "Сайт пока не доступен по HTTPS"

echo ""
echo "📱 ФИНАЛЬНЫЕ ШАГИ НАСТРОЙКИ БОТА:"
echo ""
echo "1️⃣  ОТКРОЙТЕ @BOTFATHER В TELEGRAM"
echo ""
echo "2️⃣  НАСТРОЙТЕ ДОМЕН:"
echo "   • Отправьте команду: /setdomain"
echo "   • Выберите вашего бота"
echo "   • Введите: $DOMAIN"
echo ""
echo "3️⃣  НАСТРОЙТЕ КНОПКУ МЕНЮ:"
echo "   • Отправьте команду: /setmenubutton"
echo "   • Выберите вашего бота"
echo "   • Введите текст кнопки (например: 🛍️ Открыть магазин)"
echo "   • Введите URL: https://$DOMAIN"
echo ""
echo "✅ ПОСЛЕ ЭТОГО ВАШЕ MINI APP БУДЕТ ГОТОВО!"
echo ""
