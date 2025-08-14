# Total Lookas Telegram Bot

Telegram бот для компании Total Lookas, специализирующейся на производстве корпоративного мерча. Бот предоставляет интерфейс для заказа товаров, генерации коммерческих предложений и интеграции с веб-приложением каталога.

## 🚀 Возможности

- **Интуитивный интерфейс** с inline кнопками
- **WebApp интеграция** для работы с каталогом товаров
- **Автоматическое сохранение** всех взаимодействий в БД
- **Обработка заказов** и генерация коммерческих предложений
- **Уведомления администратора** о новых заказах
- **Health check endpoint** для мониторинга

## 🛠 Технологический стек

- **TypeScript** - типизированный JavaScript
- **Telegraf** - современный Telegram Bot Framework
- **Prisma ORM** - типобезопасная работа с базой данных
- **PostgreSQL** - основная база данных
- **Express.js** - веб-сервер для health check
- **Docker** - контейнеризация для развертывания

## 📋 Команды бота

- `/start` - Приветственное сообщение с основным меню
- `/webapp` - Прямой доступ к каталогу товаров
- `/help` - Справочная информация
- `/contacts` - Контактная информация компании

## 🗄 База данных

Бот использует PostgreSQL с следующими моделями:

- **User** - пользователи Telegram
- **Message** - история всех сообщений
- **WebAppData** - данные из веб-приложения (заказы)
- **Session** - сессии пользователей

## ⚙️ Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd totallookasmvp
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` с переменными:

```env
# Обязательные переменные
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DATABASE_URL=postgresql://user:password@localhost:5432/tlbot

# Опциональные переменные  
NEXT_PUBLIC_APP_URL=https://ваш-домен.com
ADMIN_CHAT_ID=ваш_telegram_id
NODE_ENV=development
```

### 3. Настройка базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение миграций (или создание БД)
npm run db:push

# Опционально: открыть Prisma Studio
npm run db:studio
```

### 4. Запуск бота

#### Разработка
```bash
npm run dev
```

#### Production
```bash
npm run build
npm start
```

## 🐳 Docker развертывание

### Сборка образа
```bash
docker build -t total-lookas-bot .
```

### Запуск контейнера
```bash
docker run -d \
  --name total-lookas-bot \
  -e TELEGRAM_BOT_TOKEN=ваш_токен \
  -e DATABASE_URL=ваша_бд \
  -e NEXT_PUBLIC_APP_URL=ваш_вебапп \
  -p 3001:3001 \
  total-lookas-bot
```

## 📊 Мониторинг

Бот предоставляет health check endpoint:

```
GET http://localhost:3001/health
```

Ответ:
```json
{
  "status": "OK",
  "timestamp": "2025-08-14T10:30:00.000Z",
  "uptime": 12345.67
}
```

## 🔗 Интеграция с WebApp

Бот готов к интеграции с любым веб-приложением через Telegram WebApp API:

```javascript
// В веб-приложении
window.Telegram.WebApp.sendData(JSON.stringify({
  type: 'order',
  items: cartItems,
  total: totalPrice,
  userInfo: userInfo
}));
```

## 📁 Структура проекта

```
├── src/
│   └── bot.ts              # Основной файл бота
├── prisma/
│   └── schema.prisma       # Схема базы данных
├── dist/                   # Скомпилированные файлы
├── .env                    # Переменные окружения
├── Dockerfile              # Docker конфигурация
├── package.json            # Зависимости и скрипты
└── tsconfig.json          # TypeScript конфигурация
```

## 🚀 Развертывание

### Railway.app
1. Подключите GitHub репозиторий
2. Установите переменные окружения
3. Развертывание произойдет автоматически

### Vercel (для WebApp)
1. Деплой фронтенда на Vercel
2. Укажите URL в переменной `NEXT_PUBLIC_APP_URL`

### VPS/Dedicated Server
```bash
# Клонирование
git clone <repository-url>
cd totallookasmvp

# Установка зависимостей
npm ci --production

# Настройка базы данных
npm run db:generate
npm run db:push

# Сборка
npm run build

# Запуск через PM2
pm2 start dist/bot.js --name "total-lookas-bot"
```

## 🔒 Безопасность

- ✅ Никогда не коммитьте токены в репозиторий
- ✅ Используйте переменные окружения
- ✅ Регулярные резервные копии БД
- ✅ Мониторинг логов и ошибок
- ✅ Health check для отслеживания состояния

## 📞 Поддержка

При возникновении вопросов:

1. Проверьте логи бота
2. Убедитесь в правильности переменных окружения
3. Проверьте подключение к базе данных
4. Свяжитесь с командой разработки

## 📄 Лицензия

MIT License - смотрите файл [LICENSE](LICENSE) для деталей.

---

**Total Lookas** - создаем качественный корпоративный мерч! 🎯
