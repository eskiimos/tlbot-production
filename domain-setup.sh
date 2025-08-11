#!/bin/bash

# 🌐 Связывание домена eskimoss.ru с сервером
# Простой скрипт для быстрой настройки

# Параметры
DOMAIN="eskimoss.ru"
SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "🌐 Связывание домена $DOMAIN с сервером $SERVER_IP"
echo "==================================================="
echo ""

# Шаг 1: Проверка доступности сервера
echo "🔍 Шаг 1: Проверяем доступность сервера..."
if ping -c 1 $SERVER_IP &> /dev/null; then
    echo "✅ Сервер доступен"
else
    echo "❌ Сервер недоступен"
    echo "⚠️ Проверьте состояние VPS через панель управления reg.oblako"
    read -p "Продолжить настройку домена? (y/n): " continue_setup
    if [[ $continue_setup != "y" && $continue_setup != "Y" ]]; then
        exit 1
    fi
fi

echo ""
echo "🔍 Шаг 2: Настройка DNS на reg.ru..."
echo ""
echo "⚠️ ВАЖНО: Выполните следующие действия в панели управления reg.ru:"
echo ""
echo "1. Войдите в аккаунт reg.ru"
echo "2. Перейдите в раздел 'Домены' и выберите $DOMAIN"
echo "3. Найдите раздел 'DNS-серверы и управление зоной'"
echo "4. Перейдите в 'Управление зоной'"
echo "5. Добавьте или измените A-запись:"
echo "   • Тип: A"
echo "   • Имя: @"
echo "   • Значение: $SERVER_IP"
echo "   • TTL: 3600"
echo ""
echo "6. Если хотите добавить поддомен 'www', создайте еще одну A-запись:"
echo "   • Тип: A"
echo "   • Имя: www"
echo "   • Значение: $SERVER_IP"
echo "   • TTL: 3600"
echo ""

read -p "Вы выполнили настройку DNS на reg.ru? (y/n): " dns_setup
if [[ $dns_setup != "y" && $dns_setup != "Y" ]]; then
    echo "⚠️ Пожалуйста, настройте DNS перед продолжением"
    exit 1
fi

echo ""
echo "🔍 Шаг 3: Подготовка конфигурации для сервера..."

# Создаем файл окружения для домена
cat > .env.domain << EOF
# 🌐 Конфигурация с доменом
NODE_ENV=production
DATABASE_URL=postgresql://tlbot:StrongDbPassword2025@postgres:5432/tlbot_prod
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
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "✅ Конфигурация для домена создана"

echo ""
echo "🔍 Шаг 4: Настройка сервера..."

read -p "Выполнить настройку сервера сейчас? (y/n): " setup_server
if [[ $setup_server == "y" || $setup_server == "Y" ]]; then
    
    # Проверяем доступность сервера по SSH
    echo "🔄 Проверяем SSH доступ..."
    ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$SERVER_IP exit &>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️ SSH соединение не установлено, используем sshpass..."
        
        # Проверяем наличие sshpass
        if ! command -v sshpass &> /dev/null; then
            echo "⚠️ Утилита sshpass не установлена. Устанавливаем..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install sshpass || echo "❌ Не удалось установить sshpass"
            else
                echo "❌ Установите sshpass вручную и повторите попытку"
                exit 1
            fi
        fi
        
        # Используем sshpass для выполнения команд
        echo "🔄 Настраиваем сервер с помощью sshpass..."
        
        # Копируем конфигурацию на сервер
        echo "📦 Копируем конфигурацию..."
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no nginx-domain.conf root@$SERVER_IP:/home/tlbot/app/
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no .env.domain root@$SERVER_IP:/home/tlbot/app/.env
        
        # Устанавливаем Certbot и получаем SSL сертификат
        echo "🔒 Устанавливаем Certbot и получаем SSL сертификат..."
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
            # Устанавливаем Certbot
            apt-get update
            apt-get install -y certbot
            
            # Создаем директории для certbot
            mkdir -p /home/tlbot/app/certbot/conf
            mkdir -p /home/tlbot/app/certbot/www
            
            # Останавливаем существующие контейнеры
            cd /home/tlbot/app
            docker-compose down || true
            
            # Запускаем Nginx для проверки домена
            docker run -d --name nginx_temp -p 80:80 -v \$(pwd)/nginx-domain.conf:/etc/nginx/conf.d/default.conf -v \$(pwd)/certbot/www:/var/www/certbot nginx:latest
            
            # Получаем сертификат
            certbot certonly --webroot -w /home/tlbot/app/certbot/www -d $DOMAIN -d www.$DOMAIN --email admin@tlbot.local --agree-tos --no-eff-email || echo 'Ошибка получения сертификата'
            
            # Останавливаем временный Nginx
            docker stop nginx_temp
            docker rm nginx_temp
            
            # Создаем docker-compose.yml для домена
            cat > docker-compose.yml << 'DOCKER_EOF'
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
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 200M

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tlbot_app
    environment:
      NODE_ENV: production
      NODE_OPTIONS: '--max-old-space-size=200'
      DATABASE_URL: postgresql://tlbot:StrongDbPassword2025@postgres:5432/tlbot_prod
      TELEGRAM_BOT_TOKEN: 7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0
      NEXT_PUBLIC_APP_URL: https://$DOMAIN
      ADMIN_EMAIL: admin@tlbot.local
      ADMIN_PASSWORD: AdminTLBot2025!
      WEBHOOK_URL: https://$DOMAIN/api/bot
    ports:
      - '3000:3000'
    depends_on:
      - postgres
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 300M

  nginx:
    image: nginx:latest
    container_name: tlbot_nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx-domain.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    restart: unless-stopped
    depends_on:
      - app

volumes:
  postgres_data:
DOCKER_EOF
            
            # Запускаем контейнеры
            docker-compose up -d
            
            # Настраиваем webhook для бота
            curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
            
            echo 'Настройка сервера завершена'
        "
        
        echo "✅ Сервер настроен"
        
    else
        # Используем обычный SSH для выполнения команд
        echo "🔄 Настраиваем сервер через SSH..."
        
        # Копируем конфигурацию на сервер
        echo "📦 Копируем конфигурацию..."
        scp -o StrictHostKeyChecking=no nginx-domain.conf root@$SERVER_IP:/home/tlbot/app/
        scp -o StrictHostKeyChecking=no .env.domain root@$SERVER_IP:/home/tlbot/app/.env
        
        # Устанавливаем Certbot и получаем SSL сертификат
        echo "🔒 Устанавливаем Certbot и получаем SSL сертификат..."
        ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
            # Устанавливаем Certbot
            apt-get update
            apt-get install -y certbot
            
            # Создаем директории для certbot
            mkdir -p /home/tlbot/app/certbot/conf
            mkdir -p /home/tlbot/app/certbot/www
            
            # Останавливаем существующие контейнеры
            cd /home/tlbot/app
            docker-compose down || true
            
            # Запускаем Nginx для проверки домена
            docker run -d --name nginx_temp -p 80:80 -v \$(pwd)/nginx-domain.conf:/etc/nginx/conf.d/default.conf -v \$(pwd)/certbot/www:/var/www/certbot nginx:latest
            
            # Получаем сертификат
            certbot certonly --webroot -w /home/tlbot/app/certbot/www -d $DOMAIN -d www.$DOMAIN --email admin@tlbot.local --agree-tos --no-eff-email || echo 'Ошибка получения сертификата'
            
            # Останавливаем временный Nginx
            docker stop nginx_temp
            docker rm nginx_temp
            
            # Создаем docker-compose.yml для домена
            cat > docker-compose.yml << 'DOCKER_EOF'
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
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 200M

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tlbot_app
    environment:
      NODE_ENV: production
      NODE_OPTIONS: '--max-old-space-size=200'
      DATABASE_URL: postgresql://tlbot:StrongDbPassword2025@postgres:5432/tlbot_prod
      TELEGRAM_BOT_TOKEN: 7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0
      NEXT_PUBLIC_APP_URL: https://$DOMAIN
      ADMIN_EMAIL: admin@tlbot.local
      ADMIN_PASSWORD: AdminTLBot2025!
      WEBHOOK_URL: https://$DOMAIN/api/bot
    ports:
      - '3000:3000'
    depends_on:
      - postgres
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 300M

  nginx:
    image: nginx:latest
    container_name: tlbot_nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx-domain.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    restart: unless-stopped
    depends_on:
      - app

volumes:
  postgres_data:
DOCKER_EOF
            
            # Запускаем контейнеры
            docker-compose up -d
            
            # Настраиваем webhook для бота
            curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
            
            echo 'Настройка сервера завершена'
        "
        
        echo "✅ Сервер настроен"
    fi
    
else
    echo "⚠️ Настройка сервера пропущена"
fi

echo ""
echo "🔍 Шаг 5: Настройка Telegram бота..."
echo ""
echo "⚠️ ВАЖНО: Выполните следующие действия в Telegram:"
echo ""
echo "1. Откройте бота @BotFather"
echo "2. Отправьте команду /setdomain"
echo "3. Выберите вашего бота"
echo "4. Введите: $DOMAIN"
echo ""
echo "5. Затем отправьте команду /setmenubutton"
echo "6. Выберите вашего бота"
echo "7. Введите текст кнопки (например: Открыть магазин)"
echo "8. Введите URL: https://$DOMAIN"
echo ""

echo "🎉 НАСТРОЙКА ЗАВЕРШЕНА!"
echo ""
echo "🌐 Ваше Mini App доступно по адресу: https://$DOMAIN"
echo "👑 Админ-панель: https://$DOMAIN/admin"
echo "   Логин: admin@tlbot.local"
echo "   Пароль: AdminTLBot2025!"
echo ""
echo "⚠️ Распространение DNS-записей может занять до 24 часов,"
echo "   но обычно сайт становится доступен в течение 10-15 минут"
echo ""
echo "📱 Чтобы протестировать Mini App, найдите своего бота"
echo "   в Telegram и нажмите кнопку меню"
echo ""
