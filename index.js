const express = require('express');
const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const { prisma } = require('./src/lib/prisma');

// Загружаем переменные окружения
dotenv.config();

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware
app.use(express.json());

// Храним ID последних сообщений для каждого пользователя
const userMessages = new Map();

// Функция для очистки предыдущих сообщений
async function deleteUserMessages(chatId) {
  const messageIds = userMessages.get(chatId);
  if (messageIds && messageIds.length > 0) {
    try {
      for (const messageId of messageIds) {
        try {
          await bot.telegram.deleteMessage(chatId, messageId);
        } catch (err) {
          console.log(`Cannot delete message ${messageId}: ${err.message}`);
        }
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
    userMessages.set(chatId, []);
  }
}

// Функция для сохранения ID отправленного сообщения
function saveMessageId(chatId, messageId) {
  const messages = userMessages.get(chatId) || [];
  messages.push(messageId);
  if (messages.length > 10) {
    messages.shift();
  }
  userMessages.set(chatId, messages);
}

// Функция для создания/обновления пользователя
async function upsertUser(ctx) {
  const user = ctx.from;
  if (!user) return null;

  try {
    const dbUser = await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        updatedAt: new Date()
      },
      create: {
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        isBot: user.is_bot || false
      }
    });

    console.log(`👤 User upserted: ${dbUser.id}`);
    return dbUser;
  } catch (error) {
    console.error('Error upserting user:', error);
    return null;
  }
}

// Команда /start
bot.start(async (ctx) => {
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.WEB_APP_URL;
  
  console.log(`📨 /start command from: ${firstName}`);
  
  // Очищаем предыдущие сообщения бота
  await deleteUserMessages(ctx.chat.id);
  
  const message = await ctx.reply(
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
  
  saveMessageId(ctx.chat.id, message.message_id);
  console.log(`✅ Welcome message sent`);
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const user = await upsertUser(ctx);
  const webAppUrl = process.env.WEB_APP_URL;
  
  await deleteUserMessages(ctx.chat.id);
  
  const message = await ctx.reply(
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
  saveMessageId(ctx.chat.id, message.message_id);
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

async function startServer() {
  try {
    console.log('🤖 Starting Telegram bot...');
    
    const botInfo = await bot.telegram.getMe();
    console.log(`📱 Web App URL: ${process.env.WEB_APP_URL}`);
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
