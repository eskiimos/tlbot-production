# 🔧 Пошаговое развертывание на VPS

## Шаг 1: Подготовка VPS

1. **Создайте VPS** (рекомендую Hetzner CPX21 за €4.90/мес)
2. **Подключитесь по SSH:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Запустите скрипт настройки сервера:**
   ```bash
   # Скопируйте server-setup.sh на сервер
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

## Шаг 2: Настройка домена

1. **Купите домен** (reg.ru, namecheap.com)
2. **Настройте DNS записи:**
   ```
   A     @          YOUR_SERVER_IP
   A     www        YOUR_SERVER_IP  
   A     bot        YOUR_SERVER_IP
   ```

## Шаг 3: Подготовка проекта

1. **Создайте production окружение:**
   ```bash
   cp .env.local .env.production
   ```

2. **Обновите переменные в .env.production:**
   ```env
   # Database
   DATABASE_URL="postgresql://tlbot:STRONG_PASSWORD@localhost:5432/tlbot_prod"
   
   # Telegram
   TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   
   # Security
   NEXTAUTH_SECRET="generate-strong-secret-key"
   NEXTAUTH_URL="https://your-domain.com"
   
   # Admin
   ADMIN_EMAIL="admin@your-domain.com"
   ADMIN_PASSWORD="strong-admin-password"
   
   # Node
   NODE_ENV="production"
   ```

3. **Обновите docker-compose.yml для продакшена:**
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:15
       container_name: tlbot_postgres
       restart: unless-stopped
       environment:
         POSTGRES_USER: tlbot
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
         POSTGRES_DB: tlbot_prod
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./backups:/backups
       ports:
         - "5432:5432"
       networks:
         - tlbot_network
   
     app:
       build: .
       container_name: tlbot_app
       restart: unless-stopped
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       volumes:
         - ./uploads:/app/uploads
       ports:
         - "3000:3000"
       depends_on:
         - postgres
       networks:
         - tlbot_network
   
   volumes:
     postgres_data:
   
   networks:
     tlbot_network:
       driver: bridge
   ```

## Шаг 4: Развертывание

1. **Клонируйте проект на сервер:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tlbot.git
   cd tlbot
   ```

2. **Настройте окружение:**
   ```bash
   # Создайте .env.production с вашими данными
   nano .env.production
   
   # Создайте пароль для БД
   echo "POSTGRES_PASSWORD=your-strong-db-password" >> .env.production
   ```

3. **Запустите контейнеры:**
   ```bash
   docker-compose up -d
   ```

4. **Выполните миграции:**
   ```bash
   docker exec -it tlbot_app npx prisma migrate deploy
   docker exec -it tlbot_app npx prisma db seed
   ```

## Шаг 5: Настройка Nginx

1. **Создайте конфигурацию сайта:**
   ```bash
   sudo nano /etc/nginx/sites-available/tlbot
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Активируйте сайт:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tlbot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Получите SSL сертификат:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

## Шаг 6: Настройка Telegram Bot

1. **Установите webhook:**
   ```bash
   curl -F "url=https://your-domain.com/api/bot" \
        "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook"
   ```

2. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```

## Шаг 7: Мониторинг

1. **Проверьте логи:**
   ```bash
   docker-compose logs -f app
   docker-compose logs -f postgres
   ```

2. **Настройте автоматические бэкапы БД:**
   ```bash
   # Создайте скрипт бэкапа
   cat > /home/tlbot/backup.sh << 'EOF'
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   docker exec tlbot_postgres pg_dump -U tlbot tlbot_prod > /home/tlbot/backups/backup_$DATE.sql
   find /home/tlbot/backups -name "backup_*.sql" -mtime +7 -delete
   EOF
   
   chmod +x /home/tlbot/backup.sh
   
   # Добавьте в crontab (каждый день в 2:00)
   echo "0 2 * * * /home/tlbot/backup.sh" | crontab -
   ```

## Шаг 8: Обновления

**Для обновления приложения:**
```bash
cd /home/tlbot
git pull
docker-compose build app
docker-compose up -d app
```

**Для обновления с миграциями:**
```bash
cd /home/tlbot
git pull
docker-compose build app
docker exec -it tlbot_app npx prisma migrate deploy
docker-compose up -d app
```
