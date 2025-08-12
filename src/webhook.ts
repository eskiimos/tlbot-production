import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { prisma } from './lib/prisma';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Middleware для парсинга JSON
app.use(express.json());

// Функция для создания/обновления пользователя
async function upsertUser(ctx: any) {
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

    return dbUser;
  } catch (error) {
    console.error('Error upserting user:', error);
    return null;
  }
}

// Команда /start
bot.start(async (ctx) => {
  console.log('🤖 Starting Telegram bot...');
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  
  console.log(`✅ Database connected`);
  console.log(`📱 Web App URL: ${webAppUrl}`);
  
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
});

// Обработка данных из веб-приложения
bot.on('web_app_data', async (ctx) => {
  console.log('🎯 WEB_APP_DATA EVENT TRIGGERED!');
  console.log('📱 Context:', JSON.stringify({
    from: ctx.from,
    chat: ctx.chat,
    webAppData: ctx.webAppData
  }, null, 2));
  
  const user = await upsertUser(ctx);
  
  try {
    if (!ctx.webAppData) {
      console.error('❌ No webAppData in context');
      return;
    }
    
    const dataText = ctx.webAppData.data.text();
    const data = JSON.parse(dataText);
    console.log('📦 Parsed web app data:', JSON.stringify(data, null, 2));

    // Сохраняем данные в базу
    await prisma.webAppData.create({
      data: {
        userId: user?.id?.toString() || 'unknown',
        data: JSON.stringify(data)
      }
    });
    console.log('💾 Data saved to database');

    // Проверяем тип данных и обрабатываем соответствующим образом
    if (data.type === 'commercial_proposal') {
      console.log('💼 Processing commercial proposal');
      const orderData = data.orderData;
      
      // Отвечаем пользователю
      await ctx.reply('✅ Ваше коммерческое предложение успешно сформировано и отправлено менеджеру! Мы свяжемся с вами в ближайшее время.');
      console.log('✅ Response sent to user');
    } else {
      // Стандартный ответ для других типов данных
      await ctx.reply('Спасибо! Ваши данные получены и обрабатываются.');
      console.log('✅ Standard response sent');
    }
  } catch (error) {
    console.error('❌ Error processing web app data:', error);
    ctx.reply('Произошла ошибка при обработке данных. Попробуйте еще раз.');
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Telegram Bot Webhook Server is running',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint для Telegram
app.post('/webhook', (req, res) => {
  console.log('📨 Webhook received at:', new Date().toISOString());
  console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📨 Body:', JSON.stringify(req.body, null, 2));
  
  // Проверяем наличие web_app_data
  if (req.body.message && req.body.message.web_app_data) {
    console.log('🎯 WEB_APP_DATA DETECTED!');
    console.log('📱 Web App Data:', req.body.message.web_app_data.data);
  }
  
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🤖 Starting Telegram bot...');
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    console.log(`✅ Бот инициализирован: @${botInfo.username} (ID: ${botInfo.id})`);
    
    // Проверяем подключение к БД
    await prisma.$connect();
    console.log('✅ Database connected');
    
    console.log(`📱 Web App URL: ${process.env.WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL}`);
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`🚀 Webhook server running on port ${PORT}`);
      console.log(`🌐 Ready to receive webhooks at /webhook`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();
