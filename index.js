const express = require('express');
const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware
app.use(express.json());

console.log('🤖 Starting Telegram bot...');
console.log(`📱 Web App URL: ${process.env.WEB_APP_URL}`);

// Команда /start
bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.WEB_APP_URL;
  
  console.log(`📨 /start command from: ${firstName}`);
  
  await ctx.reply(
    `Привет, ${firstName}! 👋 Добро пожаловать в Total Lookas!\n\n` +
    `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
    `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
    `⚡️ От идеи до готового продукта всего за 30 дней!\n` +
    `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
    `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
    `Готов "полностью одеть" свой бренд? Жми кнопку и погнали создавать что-то крутое! 🚀`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🔥 Открыть каталог',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  );
  
  console.log(`✅ Welcome message sent`);
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const webAppUrl = process.env.WEB_APP_URL;
  
  await ctx.reply(
    'Привет! 😊 Для удобного просмотра каталога и создания заказа лучше использовать наше мини-приложение — там вся магия происходит! ✨',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🛍 Открыть каталог',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  );
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Запуск сервера
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
