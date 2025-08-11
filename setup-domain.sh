#!/bin/bash

# 🌐 Настройка домена для Telegram Mini App

echo "🌐 Настройка домена для Telegram Mini App"
echo "========================================"
echo ""
echo "📋 ПЛАН ДЕЙСТВИЙ:"
echo ""
echo "1️⃣  ПОЛУЧИТЬ БЕСПЛАТНЫЙ ДОМЕН:"
echo "   • Freenom.com (бесплатно .tk, .ml, .ga)"
echo "   • Или купить домен ($1-2/год)"
echo ""
echo "2️⃣  НАСТРОИТЬ CLOUDFLARE:"
echo "   • Добавить домен в Cloudflare"
echo "   • Получить бесплатный SSL"
echo "   • Настроить DNS на IP: 89.104.65.237"
echo ""
echo "3️⃣  ОБНОВИТЬ КОНФИГУРАЦИЮ БОТА:"
echo "   • Изменить NEXT_PUBLIC_APP_URL"
echo "   • Обновить webhook URL"
echo "   • Настроить Mini App URL в BotFather"
echo ""

read -p "🤔 Хотите, чтобы я создал автоматический скрипт настройки? (y/n): " answer

if [[ $answer == "y" || $answer == "Y" ]]; then
    echo ""
    echo "📝 Введите данные для настройки:"
    read -p "🌐 Введите ваш домен (например: mybot.tk): " DOMAIN
    
    if [[ -z "$DOMAIN" ]]; then
        echo "❌ Домен не указан!"
        exit 1
    fi
    
    echo ""
    echo "🔧 Создаю конфигурацию для домена: $DOMAIN"
    
    # Создаем новый .env файл с доменом
    cat > .env.domain << EOF
# 🌐 Конфигурация с доменом
NODE_ENV=production
DATABASE_URL=postgresql://tlbot:StrongDbPassword2025@tlbot_postgres:5432/tlbot_prod
TELEGRAM_BOT_TOKEN=7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0
NEXT_PUBLIC_APP_URL=https://$DOMAIN
ADMIN_EMAIL=admin@tlbot.local
ADMIN_PASSWORD=AdminTLBot2025!
WEBHOOK_URL=https://$DOMAIN/api/bot
EOF

    # Создаем nginx конфигурацию для домена
    cat > nginx-domain.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL certificates (will be set up by Cloudflare)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Proxy to Next.js app
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

    # Создаем docker-compose с доменом
    cat > docker-compose.domain.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:13
    container_name: tlbot_postgres
    environment:
      POSTGRES_DB: tlbot_prod
      POSTGRES_USER: tlbot
      POSTGRES_PASSWORD: StrongDbPassword2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 200M

  app:
    build:
      context: .
      dockerfile: Dockerfile.simple
    container_name: tlbot_app
    environment:
      NODE_ENV: production
      NODE_OPTIONS: "--max-old-space-size=200"
      DATABASE_URL: postgresql://tlbot:StrongDbPassword2025@postgres:5432/tlbot_prod
      TELEGRAM_BOT_TOKEN: 7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0
      NEXT_PUBLIC_APP_URL: https://$DOMAIN
      ADMIN_EMAIL: admin@tlbot.local
      ADMIN_PASSWORD: AdminTLBot2025!
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 300M

volumes:
  postgres_data:
EOF

    # Создаем скрипт деплоя с доменом
    cat > deploy-with-domain.sh << 'EOF'
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
EOF

    chmod +x deploy-with-domain.sh
    
    echo ""
    echo "✅ Файлы созданы:"
    echo "   📄 .env.domain - новые переменные окружения"
    echo "   📄 nginx-domain.conf - конфигурация nginx"
    echo "   📄 docker-compose.domain.yml - docker compose с доменом"
    echo "   📄 deploy-with-domain.sh - скрипт деплоя"
    echo ""
    echo "🎯 СЛЕДУЮЩИЕ ШАГИ:"
    echo ""
    echo "1️⃣  ПОЛУЧИТЕ ДОМЕН:"
    echo "   • Freenom.com - бесплатные домены .tk, .ml, .ga"
    echo "   • Или купите на Namecheap/GoDaddy ($1-2/год)"
    echo ""
    echo "2️⃣  НАСТРОЙТЕ CLOUDFLARE:"
    echo "   • Зарегистрируйтесь на cloudflare.com"
    echo "   • Добавьте ваш домен: $DOMAIN"
    echo "   • Измените nameservers у регистратора на Cloudflare"
    echo "   • Добавьте A-запись: $DOMAIN -> 89.104.65.237"
    echo "   • Включите 'Proxied' (оранжевое облако)"
    echo "   • SSL/TLS -> Full (strict)"
    echo ""
    echo "3️⃣  ДЕПЛОЙ:"
    echo "   ./deploy-with-domain.sh $DOMAIN"
    echo ""
    echo "4️⃣  НАСТРОЙТЕ БОТА:"
    echo "   • BotFather -> /setmenubutton -> https://$DOMAIN"
    echo "   • BotFather -> /setdomain -> https://$DOMAIN"
    echo ""
    
else
    echo ""
    echo "📖 ИНСТРУКЦИЯ ДЛЯ РУЧНОЙ НАСТРОЙКИ:"
    echo ""
    echo "1️⃣  Получите бесплатный домен на freenom.com"
    echo "2️⃣  Зарегистрируйтесь на cloudflare.com"
    echo "3️⃣  Добавьте домен в Cloudflare"
    echo "4️⃣  Настройте DNS: A-запись домен -> 89.104.65.237"
    echo "5️⃣  Включите Cloudflare Proxy (SSL)"
    echo "6️⃣  Обновите NEXT_PUBLIC_APP_URL в .env"
    echo "7️⃣  В BotFather установите Mini App URL"
    echo ""
fi

echo ""
echo "💡 АЛЬТЕРНАТИВА - Ngrok (для тестирования):"
echo "   • Установите ngrok"
echo "   • ngrok http 3000"
echo "   • Используйте https://xxxxx.ngrok.io для тестов"
echo ""
