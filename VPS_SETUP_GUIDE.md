# 📋 Инструкция по развертыванию на VPS

## 🎯 Вариант 1: Полностью автоматический (рекомендуется)

### На вашем локальном компьютере:

1. **Загрузите архив на VPS:**
   ```bash
   scp tlbot-deploy.tar.gz root@YOUR_VPS_IP:/root/
   ```

2. **Подключитесь к VPS:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

### На VPS:

3. **Извлеките архив и запустите автонастройку:**
   ```bash
   cd /root
   tar -xzf tlbot-deploy.tar.gz
   chmod +x quick-setup.sh
   ./quick-setup.sh
   ```

4. **Перейдите в пользователя tlbot:**
   ```bash
   su - tlbot
   cd /home/tlbot
   ```

5. **Скопируйте файлы проекта:**
   ```bash
   sudo cp -r /root/* /home/tlbot/app/ 2>/dev/null || true
   cd /home/tlbot/app
   sudo chown -R tlbot:tlbot /home/tlbot/app
   ```

6. **Настройте окружение:**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```

   **Заполните следующие переменные:**
   ```env
   DATABASE_URL="postgresql://tlbot:STRONG_PASSWORD@localhost:5432/tlbot_prod"
   POSTGRES_PASSWORD="STRONG_PASSWORD"
   TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   NEXTAUTH_SECRET="RANDOM_32_CHAR_STRING"
   ADMIN_EMAIL="admin@your-domain.com"
   ADMIN_PASSWORD="strong-admin-password"
   ```

7. **Запустите деплой:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

---

## 🎯 Вариант 2: Пошаговая настройка

Если автоматический скрипт не подошел, следуйте инструкции в `DEPLOYMENT_GUIDE.md`

---

## 🌐 Настройка домена

### Если у вас есть домен:

1. **Настройте DNS записи:**
   ```
   A     @          YOUR_VPS_IP
   A     www        YOUR_VPS_IP
   ```

2. **Настройте Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/tlbot
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
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

3. **Активируйте сайт:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tlbot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Получите SSL сертификат:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

### Если домена нет:

Приложение будет доступно по IP: `http://YOUR_VPS_IP:3000`

---

## 🤖 Настройка Telegram Bot

1. **Установите webhook:**
   ```bash
   curl -F "url=https://your-domain.com/api/bot" \
        "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook"
   ```

2. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```

---

## 🛠️ Полезные команды

### Мониторинг:
```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи приложения
docker-compose -f docker-compose.prod.yml logs -f app

# Логи базы данных
docker-compose -f docker-compose.prod.yml logs -f postgres

# Проверка здоровья
curl http://localhost:3000/api/health
```

### Управление:
```bash
# Перезапуск приложения
docker-compose -f docker-compose.prod.yml restart app

# Остановка всех сервисов
docker-compose -f docker-compose.prod.yml down

# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d
```

### Бэкапы:
```bash
# Создать бэкап БД
docker exec tlbot_postgres_prod pg_dump -U tlbot tlbot_prod > backup_$(date +%Y%m%d).sql

# Восстановить бэкап
docker exec -i tlbot_postgres_prod psql -U tlbot -d tlbot_prod < backup_file.sql
```

---

## 🚨 Решение проблем

### Если приложение не запускается:
```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs app

# Проверьте переменные окружения
docker-compose -f docker-compose.prod.yml config

# Пересоберите образ
docker-compose -f docker-compose.prod.yml build app --no-cache
```

### Если база данных недоступна:
```bash
# Проверьте статус PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Перезапустите БД
docker-compose -f docker-compose.prod.yml restart postgres
```

### Если webhook не работает:
```bash
# Проверьте статус webhook
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Удалите webhook (для тестирования)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```
