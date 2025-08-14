import { Telegraf, Context } from 'telegraf';
import { PrismaClient, MessageType, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const prisma = new PrismaClient();
const app = express();

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
        let messageType: MessageType = MessageType.TEXT;
        if ('text' in ctx.message && ctx.message.text?.startsWith('/')) {
          messageType = MessageType.COMMAND;
        } else if (ctx.callbackQuery) {
          messageType = MessageType.CALLBACK_QUERY;
        }

        await prisma.message.create({
          data: {
            userId: user.id,
            messageId: ctx.message.message_id,
            text: 'text' in ctx.message ? ctx.message.text : null,
            type: messageType,
            // Упрощаем данные для JSON
            data: {
              message_id: ctx.message.message_id,
              date: ctx.message.date,
              chat: { id: ctx.message.chat.id, type: ctx.message.chat.type }
            } as Prisma.InputJsonValue,
          },
        });
      }
    } catch (error) {
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

🏢 Адрес: г. Казань, ул. Сибирский Тракт, 78, Казаньофис 301
📱 Телефон: +7 (999) 162-77-58
📧 Email: info@totallookas.com
🌐 Сайт: totallookas.com
💬 Telegram: @totallookas

� Ваш менеджер: @zelenayaaliya

�🕒 Режим работы:
Пн-Пт: 9:00 - 18:00
Сб-Вс: выходные
  `;

  await ctx.reply(contactsMessage);
});

// Команда ping для быстрой проверки
bot.command('ping', async (ctx) => {
  await ctx.reply('pong');
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

🏢 Адрес: г. Казань, ул. Сибирский Тракт, 78, Казаньофис 301
📱 Телефон: +7 (999) 162-77-58
📧 Email: info@totallookas.com
🌐 Сайт: totallookas.com
💬 Telegram: @totallookas

💬 <b>Ваш менеджер:</b> @zelenayaaliya

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
    const msg: any = ctx.message;
    const webAppDataStr: string | undefined = msg?.web_app_data?.data;
    if (!webAppDataStr) {
      throw new Error('web_app_data.data is empty');
    }
    const parsedData = JSON.parse(webAppDataStr);

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from!.id) }
    });

    if (user) {
      await prisma.webAppData.create({
        data: {
          userId: user.id,
          data: parsedData,
          type: 'order'
        }
      });

      if (process.env.ADMIN_CHAT_ID) {
        await bot.telegram.sendMessage(
          process.env.ADMIN_CHAT_ID,
          `🆕 Новый заказ от ${ctx.from!.first_name || 'пользователя'}\n\n${JSON.stringify(parsedData, null, 2)}`
        );
      }

      await ctx.reply('✅ Ваш заказ получен! Наши менеджеры свяжутся с вами в ближайшее время для подготовки коммерческого предложения.');
    }
  } catch (error) {
    console.error('Ошибка обработки WebApp данных:', error);
    await ctx.reply('❌ Произошла ошибка при обработке данных. Попробуйте еще раз или свяжитесь с поддержкой.');
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка бота:', err);
  console.error('Context:', ctx.updateType, ctx.update);
  try {
    ctx.reply('😕 Произошла техническая ошибка. Попробуйте позже или свяжитесь с поддержкой.');
  } catch (replyError) {
    console.error('❌ Не удалось отправить сообщение об ошибке:', replyError);
  }
});

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Запуск бота и веб-сервера
async function startBot() {
  try {
    console.log('🔄 Генерация Prisma Client...');
    
    console.log('� Подключение к базе данных...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // Подключение к базе данных
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');

    // Запуск health check сервера
    const healthPort = process.env.HEALTH_PORT || 3001;
    app.listen(healthPort, () => {
      console.log(`🏥 Health check сервер запущен на порту ${healthPort}`);
    });

    // Удаляем вебхук, чтобы получать апдейты через long polling
    await bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch((e) => {
      console.warn('⚠️ Не удалось удалить webhook (можно игнорировать если не был установлен):', e?.message || e);
    });

    // Получаем информацию о боте
    const me = await bot.telegram.getMe();
    console.log(`🤖 Авторизован как @${me.username} (id: ${me.id})`);

    // Запуск бота
    await bot.launch();
    console.log('🚀 Telegram бот Total Lookas запущен!');

    // Уведомляем администратора о старте бота, если указан ADMIN_CHAT_ID
    if (process.env.ADMIN_CHAT_ID) {
      try {
        await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, '✅ Bot started and is online');
        console.log('📤 Уведомление администратору отправлено');
      } catch (e) {
        console.warn('⚠️ Не удалось отправить стартовое сообщение администратору:', (e as any)?.message || e);
      }
    }

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
  } catch (error) {
    console.error('❌ Ошибка запуска бота:');
    console.error('Error name:', (error as any)?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    
    if ((error as any)?.code) {
      console.error('Error code:', (error as any)?.code);
    }
    
    process.exit(1);
  }
}

// Запуск приложения
startBot();
