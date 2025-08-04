<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Telegram Bot и Mini App Инструкции для Copilot

Этот проект представляет собой Telegram бота с мини-приложением на Next.js и интегрированной базой данных PostgreSQL.

## Структура проекта:

- `/src/bot/` - Telegram бот на библиотеке Telegraf
- `/src/app/` - Next.js приложение (мини-приложение для Telegram)
- `/src/app/api/` - API маршруты для работы с базой данных
- `/src/lib/prisma.ts` - Prisma Client для работы с БД
- `/src/lib/utils.ts` - утилиты для shadcn/ui
- `/prisma/schema.prisma` - схема базы данных
- `bot.ts` - точка входа для запуска бота

## Технологии:

- Next.js 15 с App Router
- TypeScript
- Tailwind CSS
- shadcn/ui компоненты
- Telegraf для Telegram бота
- Telegram WebApp API
- Prisma ORM
- PostgreSQL база данных

## Переменные окружения:

- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `NEXT_PUBLIC_APP_URL` - URL мини-приложения
- `DATABASE_URL` - строка подключения к базе данных

## Команды для разработки:

- `npm run dev` - запуск Next.js приложения в режиме разработки
- `npm run bot` - запуск Telegram бота
- `npm run dev:bot` - запуск бота в режиме разработки с автоперезагрузкой
- `npm run db:dev` - запуск локальной PostgreSQL базы данных через Prisma
- `npm run db:migrate` - применение миграций базы данных
- `npm run db:studio` - открытие Prisma Studio
- `npm run db:seed` - заполнение базы тестовыми данными

## База данных:

Модели в схеме:
- **User** - пользователи Telegram с полями telegramId, username, firstName, etc.
- **Message** - сообщения от пользователей с типами (TEXT, WEBAPP_DATA, etc.)
- **Session** - сессии для хранения состояния бота
- **WebAppData** - данные из мини-приложения (JSON)
- **BotSettings** - настройки бота (ключ-значение)

## API Endpoints:

- `/api/users` - CRUD операции с пользователями
- `/api/messages` - CRUD операции с сообщениями
- `/api/webapp-data` - работа с данными веб-приложения
- `/api/bot` - webhook для Telegram бота

## Особенности:

1. Бот автоматически создает/обновляет пользователей в БД при взаимодействии
2. Все сообщения сохраняются в базу данных с типами
3. Мини-приложение интегрируется с Telegram WebApp API
4. Данные из приложения сохраняются в отдельную таблицу
5. BigInt значения преобразуются в строки для JSON API
6. Используется Prisma для типобезопасной работы с БД

## Тестирование:

- Тестовая страница БД: `/test`
- Команды бота: `/start`, `/webapp`, `/stats`
- Prisma Studio для просмотра данных

При работе с кодом учитывайте:
- Асинхронную природу операций с БД
- Необходимость обработки ошибок подключения к БД
- Преобразование BigInt в строки для JSON
- Специфику Telegram WebApp API
- Правильное использование Prisma Client
