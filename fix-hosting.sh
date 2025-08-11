#!/bin/bash

# 🚨 Исправление ошибки reg.ru "Сайт размещен некорректно"

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🚨 Исправление ошибки размещения для $DOMAIN"
echo "=========================================="

# Подключаемся к серверу и устраняем проблему
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔍 Проверяем, кто прослушивает порт 80...'
    lsof -i :80 || netstat -tulpn | grep :80
    
    echo '🔍 Проверяем директории хостинга...'
    ls -la /var/www/ || mkdir -p /var/www/
    
    echo '🔧 Создаем директорию для домена...'
    mkdir -p /var/www/$DOMAIN/public_html
    
    echo '📄 Создаем тестовый файл...'
    echo '<html><body><h1>🚀 Сайт $DOMAIN работает!</h1><p>Настройка в процессе...</p></body></html>' > /var/www/$DOMAIN/public_html/index.html
    
    # Проверяем конфигурацию веб-сервера
    echo '🔧 Проверяем конфигурацию веб-сервера...'
    if [ -d /etc/nginx ]; then
        echo 'Найден Nginx'
        
        # Создаем конфигурацию виртуального хоста
        cat > /etc/nginx/conf.d/$DOMAIN.conf << 'CONFEOF'
server {
    listen 80;
    server_name eskimoss.ru www.eskimoss.ru;

    root /var/www/eskimoss.ru/public_html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
CONFEOF

        # Перезагружаем Nginx
        nginx -t && systemctl reload nginx
        
        echo '✅ Конфигурация Nginx настроена'
    elif [ -d /etc/apache2 ]; then
        echo 'Найден Apache'
        
        # Создаем конфигурацию виртуального хоста для Apache
        cat > /etc/apache2/sites-available/$DOMAIN.conf << 'CONFEOF'
<VirtualHost *:80>
    ServerName eskimoss.ru
    ServerAlias www.eskimoss.ru
    DocumentRoot /var/www/eskimoss.ru/public_html
    
    <Directory /var/www/eskimoss.ru/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
CONFEOF

        # Активируем сайт и перезагружаем Apache
        a2ensite $DOMAIN.conf
        systemctl reload apache2
        
        echo '✅ Конфигурация Apache настроена'
    else
        echo '❌ Не найдено ни Nginx, ни Apache!'
        echo '🔄 Устанавливаем Nginx...'
        apt-get update
        apt-get install -y nginx
        
        # Создаем конфигурацию виртуального хоста
        cat > /etc/nginx/conf.d/$DOMAIN.conf << 'CONFEOF'
server {
    listen 80;
    server_name eskimoss.ru www.eskimoss.ru;

    root /var/www/eskimoss.ru/public_html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
CONFEOF

        # Перезагружаем Nginx
        nginx -t && systemctl reload nginx
        
        echo '✅ Установлен и настроен Nginx'
    fi
    
    # Проверяем результат
    echo '🔍 Проверяем доступность сайта...'
    curl -I http://localhost
    
    echo '✅ Настройка хостинга завершена!'
"

echo ""
echo "🔍 Проверка доступности сайта..."
curl -I http://$DOMAIN || echo "Сайт пока не доступен"

echo ""
echo "🌐 Теперь попробуйте открыть:"
echo "http://$DOMAIN"
echo ""
echo "📱 СЛЕДУЮЩИЕ ШАГИ ПОСЛЕ ИСПРАВЛЕНИЯ ОШИБКИ:"
echo ""
echo "1️⃣  ПРОВЕРЬТЕ РАБОТУ САЙТА:"
echo "   • Откройте: http://$DOMAIN"
echo "   • Должна появиться тестовая страница"
echo ""
echo "2️⃣  НАСТРОЙТЕ НАСТОЯЩЕЕ ПРИЛОЖЕНИЕ:"
echo "   • Запустите: ./http-setup.sh"
echo "   • Это настроит ваше приложение"
echo ""
echo "3️⃣  УСТАНОВИТЕ SSL-СЕРТИФИКАТ:"
echo "   • ssh root@$SERVER_IP 'certbot --nginx -d $DOMAIN -d www.$DOMAIN'"
echo ""
echo "4️⃣  НАСТРОЙТЕ TELEGRAM БОТА:"
echo "   • /setdomain -> $DOMAIN"
echo "   • /setmenubutton -> Текст кнопки | https://$DOMAIN"
echo ""
echo "⚠️ Если сайт все еще недоступен, проверьте:"
echo "   • DNS-записи: А-запись должна указывать на $SERVER_IP"
echo "   • Состояние хостинг-аккаунта на reg.ru"
echo ""
