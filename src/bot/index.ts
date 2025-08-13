import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Храним ID последних сообщений для каждого пользователя
const userMessages = new Map<number, number[]>();

// Функция для очистки предыдущих сообщений
async function deleteUserMessages(chatId: number) {
  const messageIds = userMessages.get(chatId);
  if (messageIds && messageIds.length > 0) {
    try {
      // Удаляем все предыдущие сообщения бота
      for (const messageId of messageIds) {
        try {
          await bot.telegram.deleteMessage(chatId, messageId);
        } catch (err) {
          // Игнорируем ошибки удаления (сообщение уже удалено или старое)
          console.log(`Не удалось удалить сообщение ${messageId}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении сообщений:', error);
    }
    // Очищаем список после удаления
    userMessages.set(chatId, []);
  }
}

// Функция для сохранения ID отправленного сообщения
function saveMessageId(chatId: number, messageId: number) {
  const messages = userMessages.get(chatId) || [];
  messages.push(messageId);
  // Храним только последние 10 сообщений
  if (messages.length > 10) {
    messages.shift();
  }
  userMessages.set(chatId, messages);
}

// Функция для создания/обновления пользователя
async function upsertUser(ctx: any) {
  const user = ctx.from;
  if (!user) return null;

  // В режиме разработки возвращаем объект пользователя без записи в БД
  if (process.env.NODE_ENV !== 'production') {
    return {
      id: 1,
      telegramId: BigInt(user.id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      language: user.language_code || 'ru',
      isPremium: user.is_premium || false,
      isBot: user.is_bot || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

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
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Очищаем предыдущие сообщения бота
  await deleteUserMessages(ctx.chat.id);
  
  // В режиме разработки отправляем простое сообщение без Web App кнопки
  if (process.env.NODE_ENV !== 'production') {
    const message = await ctx.reply(
      `Привет, ${firstName}! 👋 Добро пожаловать в Total Lookas!\n\n` +
      `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
      `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
      `⚡️ От идеи до готового продукта всего за 20 дней!\n` +
      `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
      `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
      `🔧 Режим разработки: откройте ${webAppUrl} в браузере для тестирования каталога.\n\n` +
      `Готов "полностью одеть" свой бренд? Мы всегда готовы помочь! 🚀`
    );
    saveMessageId(ctx.chat.id, message.message_id);
    return;
  }
  
  // В продакшене используем Web App кнопку
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
});

// Команда /id - показать Telegram ID пользователя (для разработки)
bot.command('id', async (ctx) => {
  if (process.env.NODE_ENV === 'development') {
    const userId = ctx.from?.id;
    ctx.reply(
      `🆔 Ваш Telegram ID: \`${userId}\`\n\n` +
      `Этот ID можно использовать для тестирования отправки КП в режиме разработки.`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.reply('Эта команда доступна только в режиме разработки.');
  }
});

// Перехватываем все сообщения для повторного предложения открыть приложение
bot.on('text', async (ctx) => {
  const user = await upsertUser(ctx);
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Очищаем предыдущие сообщения бота
  await deleteUserMessages(ctx.chat.id);
  
  // В режиме разработки логируем сообщения
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Получено сообщение от ${user?.firstName || ctx.from?.first_name}: ${ctx.message.text}`);
    
    // В режиме разработки отправляем простое сообщение без Web App кнопки
    const message = await ctx.reply(
      `Привет! 😊 Для просмотра каталога откройте ${webAppUrl} в браузере.\n\n` +
      `🔧 Режим разработки: Web App кнопки не работают с HTTP, используйте прямую ссылку.`
    );
    saveMessageId(ctx.chat.id, message.message_id);
    return;
  }
  
  // В продакшене используем Web App кнопку
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

// Обработка данных из веб-приложения
bot.on('web_app_data', async (ctx) => {
  const user = await upsertUser(ctx);
  
  // Очищаем предыдущие сообщения бота
  await deleteUserMessages(ctx.chat.id);
  
  try {
    const data = JSON.parse(ctx.webAppData.data);
    console.log('Получены данные из веб-приложения:', data);

    // Сохраняем данные в базу
    if (process.env.NODE_ENV === 'production') {
      await prisma.webAppData.create({
        data: {
          userId: user?.id?.toString() || 'unknown',
          data: JSON.stringify(data),
          type: data.type || 'UNKNOWN'
        }
      });
    }

    // Создаем сообщение для пользователя
    await prisma.message.create({
      data: {
        userId: user?.id?.toString(),
        content: `Данные из веб-приложения: ${JSON.stringify(data)}`,
        type: 'WEBAPP_DATA'
      }
    });

    // Проверяем тип данных и обрабатываем соответствующим образом
    if (data.type === 'commercial_proposal') {
      // Обработка коммерческого предложения
      const orderData = data.orderData;
      
      // Формируем сообщение для администратора
      const adminMessage = `🔔 *Новое коммерческое предложение!*\n\n` +
        `👤 *Клиент:* ${orderData.customerName}\n` +
        `🏢 *Компания:* ${orderData.customerCompany}\n` +
        `🔢 *ИНН:* ${orderData.customerInn}\n` +
        `📱 *Телефон:* ${orderData.customerPhone}\n` +
        `📧 *Email:* ${orderData.customerEmail}\n\n` +
        `🛒 *Товаров в заказе:* ${orderData.items.length}\n` +
        `💰 *Сумма заказа:* ${(orderData.totalAmount/100).toLocaleString('ru-RU')} ₽\n\n` +
        `Детали заказа будут отправлены отдельным сообщением.`;
      
      // Отправляем уведомление администратору
      try {
        // Здесь можно добавить отправку уведомления администратору
        console.log('Отправка уведомления администратору:', adminMessage);
      } catch (err) {
        console.error('Ошибка отправки уведомления администратору:', err);
      }
      
      // Отвечаем пользователю
      const message = await ctx.reply('✅ Ваше коммерческое предложение успешно сформировано и отправлено менеджеру! Мы свяжемся с вами в ближайшее время.');
      saveMessageId(ctx.chat.id, message.message_id);
    } else {
      // Стандартный ответ для других типов данных
      const message = await ctx.reply('Спасибо! Ваши данные получены и обрабатываются.');
      saveMessageId(ctx.chat.id, message.message_id);
    }
  } catch (error) {
    console.error('Ошибка при обработке данных веб-приложения:', error);
    const message = await ctx.reply('Произошла ошибка при обработке данных. Попробуйте еще раз.');
    saveMessageId(ctx.chat.id, message.message_id);
  }
});

// Функция для запуска бота
export async function startBot() {
  try {
    console.log('Инициализация бота...');
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Бот запущен: @${botInfo.username} (ID: ${botInfo.id})`);
    
    if (process.env.NODE_ENV !== 'production') {
      // Запускаем бота через Long Polling только в режиме разработки
      // Сначала удаляем вебхук
      console.log('Удаляем вебхук...');
      await bot.telegram.deleteWebhook();
      console.log('Вебхук успешно удален');
      
      // Перехватываем ошибки базы данных для локального режима
      console.log('Настройка обработчика ошибок...');
      bot.catch((err, ctx) => {
        console.error('Ошибка при обработке обновления Telegram:', err);
      });
      
      console.log('Запуск Long Polling...');
      bot.launch().then(() => {
        console.log('�� Telegram бот запущен в режиме разработки и готов к работе!');
      }).catch((error) => {
        console.error('Ошибка при запуске Long Polling:', error);
      });
      
      // Даем время боту инициализироваться
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Инициализация завершена, бот слушает обновления...');
      
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
