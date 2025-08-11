#!/bin/bash

# 🔒 Настройка SSL и финальное подключение Telegram бота

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🔒 Настройка SSL и Telegram бота для $DOMAIN"
echo "=========================================="

# Подключаемся к серверу и настраиваем SSL
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔧 Устанавливаем certbot...'
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    
    echo '🔒 Получаем SSL сертификат...'
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@tlbot.local
    
    echo '🔄 Перезапускаем Nginx...'
    systemctl restart nginx
    
    echo '📡 Обновляем webhook для бота...'
    curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
    
    echo '✅ SSL и Telegram бот настроены!'
"

echo ""
echo "🔍 Проверка HTTPS..."
curl -I https://$DOMAIN || echo "Сайт пока не доступен по HTTPS"

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
echo "   • Откройте бота в Telegram"
echo "   • Нажмите кнопку меню"
echo "   • Mini App откроется внутри Telegram"
echo ""
echo "🌐 АДРЕСА ВАШЕГО ПРОЕКТА:"
echo "   • Mini App (через бота): https://t.me/ваш_бот"
echo "   • Веб-сайт: https://$DOMAIN"
echo "   • Админка: https://$DOMAIN/admin"
echo "      Логин: admin@tlbot.local"
echo "      Пароль: AdminTLBot2025!"
echo ""
