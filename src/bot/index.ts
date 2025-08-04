import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

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
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'Пользователь';
  
  ctx.reply(
    `Добро пожаловать, ${firstName}! 👋\n\n` +
    `Используйте /webapp для запуска мини-приложения.\n` +
    `Используйте /stats для просмотра статистики.`
  );
});

// Команда /webapp - открывает мини-приложение
bot.command('webapp', async (ctx) => {
  const user = await upsertUser(ctx);
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  
  ctx.reply('Откройте мини-приложение:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Открыть приложение',
          web_app: { url: webAppUrl }
        }
      ]]
    }
  });
});

// Команда /stats - показать статистику
bot.command('stats', async (ctx) => {
  try {
    const user = await upsertUser(ctx);
    if (!user) {
      ctx.reply('Ошибка получения данных пользователя');
      return;
    }

    const messageCount = await prisma.message.count({
      where: { userId: user.id }
    });

    const webappDataCount = await prisma.webAppData.count({
      where: { userId: user.id }
    });

    const totalUsers = await prisma.user.count();

    ctx.reply(
      `📊 Ваша статистика:\n\n` +
      `💬 Отправлено сообщений: ${messageCount}\n` +
      `📱 Данных из приложения: ${webappDataCount}\n` +
      `👥 Всего пользователей: ${totalUsers}\n` +
      `📅 Дата регистрации: ${user.createdAt.toLocaleDateString('ru-RU')}`
    );
  } catch (error) {
    console.error('Error getting stats:', error);
    ctx.reply('Ошибка получения статистики');
  }
});

// Обработка всех текстовых сообщений
bot.on('text', async (ctx) => {
  const user = await upsertUser(ctx);
  if (!user) return;

  try {
    await prisma.message.create({
      data: {
        userId: user.id,
        content: ctx.message.text,
        type: 'TEXT',
        telegramId: BigInt(ctx.message.message_id)
      }
    });
  } catch (error) {
    console.error('Error saving message:', error);
  }
});

// Обработка данных из мини-приложения
bot.on('web_app_data', async (ctx) => {
  const user = await upsertUser(ctx);
  if (!user) return;

  const data = ctx.webAppData?.data?.text() || '{}';
  console.log('Получены данные из мини-приложения:', data);
  
  try {
    const parsedData = JSON.parse(data);
    
    // Сохраняем данные веб-приложения в базу
    await prisma.webAppData.create({
      data: {
        userId: user.id,
        data: parsedData
      }
    });

    // Сохраняем как сообщение
    await prisma.message.create({
      data: {
        userId: user.id,
        content: `Данные из приложения: ${parsedData.message || 'Неизвестно'}`,
        type: 'WEBAPP_DATA'
      }
    });

    ctx.reply(
      `✅ Данные получены и сохранены!\n\n` +
      `📱 Сообщение: ${parsedData.message || 'Не указано'}\n` +
      `⏰ Время: ${new Date(parsedData.timestamp || Date.now()).toLocaleString('ru-RU')}`
    );
  } catch (error) {
    console.error('Error processing webapp data:', error);
    ctx.reply('❌ Ошибка обработки данных из приложения');
  }
});

// Функция для запуска бота
export async function startBot() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Запускаем бота через Long Polling только в режиме разработки
      await bot.launch();
      console.log('Telegram бот запущен в режиме разработки!');
      
      // Обработка завершения процесса
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } else {
      // В production режиме просто проверяем подключение к API
      await bot.telegram.getMe();
      console.log('Telegram бот готов к обработке webhook запросов!');
    }
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации бота:', error);
    return false;
  }
}

export default bot;
