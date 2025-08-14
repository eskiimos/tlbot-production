"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
// Middleware для создания/обновления пользователя
bot.use(async (ctx, next) => {
    if (ctx.from) {
        try {
            const user = await prisma.user.upsert({
                where: { telegramId: BigInt(ctx.from.id) },
                update: {
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    languageCode: ctx.from.language_code,
                },
                create: {
                    telegramId: BigInt(ctx.from.id),
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    languageCode: ctx.from.language_code,
                    isBot: ctx.from.is_bot,
                },
            });
            // Сохранение сообщения в БД
            if (ctx.message) {
                let messageType = client_1.MessageType.TEXT;
                if ('text' in ctx.message && ctx.message.text?.startsWith('/')) {
                    messageType = client_1.MessageType.COMMAND;
                }
                else if (ctx.callbackQuery) {
                    messageType = client_1.MessageType.CALLBACK_QUERY;
                }
                await prisma.message.create({
                    data: {
                        userId: user.id,
                        messageId: ctx.message.message_id,
                        text: 'text' in ctx.message ? ctx.message.text : null,
                        type: messageType,
                        data: ctx.message,
                    },
                });
            }
        }
        catch (error) {
            console.error('Ошибка работы с базой данных:', error);
        }
    }
    return next();
});
// Стартовая команда
bot.command('start', async (ctx) => {
    const welcomeMessage = `
👋 Эй, йоу! Добро пожаловать в Total Lookas! Мы создаем классный мерч и можем сделать тебе!

Всё просто:
1. Нажми «НАЧАТЬ»
2. Выбери нужные опции
3. Укажи тираж
4. Получи готовое КП
  `;
    await ctx.reply(welcomeMessage, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍️ Открыть приложение', callback_data: 'open_app' }],
                [
                    { text: '📞 Контакты', callback_data: 'contacts' },
                    { text: 'ℹ️ О нас', callback_data: 'about' }
                ]
            ]
        }
    });
});
// Команда webapp
bot.command('webapp', async (ctx) => {
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-webapp-url.com';
    await ctx.reply('🛍️ Откройте каталог товаров:', {
        reply_markup: {
            inline_keyboard: [
                [{
                        text: '🛍️ Открыть каталог',
                        web_app: { url: webAppUrl }
                    }]
            ]
        }
    });
});
// Команда help
bot.command('help', async (ctx) => {
    const helpMessage = `
🤖 Справка по боту Total Lookas

Доступные команды:
• /start - Главное меню
• /webapp - Открыть каталог товаров
• /contacts - Контактная информация
• /help - Эта справка

Как заказать:
1. Используйте /webapp для выбора товаров
2. Настройте параметры заказа
3. Получите коммерческое предложение
4. Свяжитесь с нами для финализации

Нужна помощь? Напишите нам: @totallookas
  `;
    await ctx.reply(helpMessage);
});
// Команда contacts
bot.command('contacts', async (ctx) => {
    const contactsMessage = `
📞 Контакты Total Lookas

🏢 Адрес: г. Москва, ул. Примерная, д. 123
📱 Телефон: +7 (999) 123-45-67
📧 Email: info@totallookas.com
🌐 Сайт: totallookas.com
💬 Telegram: @totallookas

🕒 Режим работы:
Пн-Пт: 9:00 - 18:00
Сб-Вс: выходные

Мы всегда на связи! 🚀
  `;
    await ctx.reply(contactsMessage);
});
// Обработка callback кнопок
bot.action('open_app', async (ctx) => {
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-webapp-url.com';
    await ctx.answerCbQuery();
    await ctx.reply('🛍️ Открываю каталог товаров...', {
        reply_markup: {
            inline_keyboard: [
                [{
                        text: '🛍️ Открыть каталог',
                        web_app: { url: webAppUrl }
                    }]
            ]
        }
    });
});
bot.action('contacts', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithHTML(`
📞 <b>Контакты Total Lookas</b>

🏢 Адрес: г. Москва, ул. Примерная, д. 123
📱 Телефон: +7 (999) 123-45-67
📧 Email: info@totallookas.com
🌐 Сайт: totallookas.com
💬 Telegram: @totallookas

🕒 <b>Режим работы:</b>
Пн-Пт: 9:00 - 18:00
Сб-Вс: выходные
  `);
});
bot.action('about', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithHTML(`
ℹ️ <b>О компании Total Lookas</b>

🎯 Мы создаем качественный корпоративный мерч для вашего бизнеса!

✨ <b>Наши услуги:</b>
• Фирменная одежда
• Сувенирная продукция
• Брендинг и дизайн
• Полный цикл производства

🚀 <b>Почему выбирают нас:</b>
• Высокое качество материалов
• Быстрые сроки производства
• Конкурентные цены
• Индивидуальный подход

💡 Сделаем ваш бренд запоминающимся!
  `);
});
// Обработка WebApp данных
bot.on('web_app_data', async (ctx) => {
    try {
        if (!ctx.webAppData) {
            throw new Error('WebApp data is undefined');
        }
        const webAppData = ctx.webAppData.data.text();
        const parsedData = JSON.parse(webAppData);
        // Найти пользователя
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(ctx.from.id) }
        });
        if (user) {
            // Сохранение в базу данных
            await prisma.webAppData.create({
                data: {
                    userId: user.id,
                    data: parsedData,
                    type: 'order'
                }
            });
            // Уведомление администратора (если указан ADMIN_CHAT_ID)
            if (process.env.ADMIN_CHAT_ID) {
                await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, `🆕 Новый заказ от ${ctx.from.first_name || 'пользователя'}\n\n${JSON.stringify(parsedData, null, 2)}`);
            }
            await ctx.reply('✅ Ваш заказ получен! Наши менеджеры свяжутся с вами в ближайшее время для подготовки коммерческого предложения.');
        }
    }
    catch (error) {
        console.error('Ошибка обработки WebApp данных:', error);
        await ctx.reply('❌ Произошла ошибка при обработке данных. Попробуйте еще раз или свяжитесь с поддержкой.');
    }
});
// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('Ошибка бота:', err);
    ctx.reply('😕 Произошла техническая ошибка. Попробуйте позже или свяжитесь с поддержкой.');
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Запуск бота и веб-сервера
async function startBot() {
    try {
        // Генерация Prisma Client
        console.log('🔄 Генерация Prisma Client...');
        // Подключение к базе данных
        await prisma.$connect();
        console.log('✅ Подключение к базе данных установлено');
        // Запуск health check сервера
        const healthPort = process.env.HEALTH_PORT || 3001;
        app.listen(healthPort, () => {
            console.log(`🏥 Health check сервер запущен на порту ${healthPort}`);
        });
        // Запуск бота
        await bot.launch();
        console.log('🤖 Telegram бот Total Lookas запущен!');
        // Graceful shutdown
        process.once('SIGINT', () => {
            console.log('⏹️ Получен сигнал SIGINT, завершение работы...');
            bot.stop('SIGINT');
            prisma.$disconnect();
        });
        process.once('SIGTERM', () => {
            console.log('⏹️ Получен сигнал SIGTERM, завершение работы...');
            bot.stop('SIGTERM');
            prisma.$disconnect();
        });
    }
    catch (error) {
        console.error('❌ Ошибка запуска бота:', error);
        process.exit(1);
    }
}
// Запуск приложения
startBot();
//# sourceMappingURL=bot.js.map