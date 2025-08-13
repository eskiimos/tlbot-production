import { Telegraf } from 'telegraf';

// Диагностика переменных окружения
console.log('=== ДИАГНОСТИКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Все переменные содержащие TELEGRAM:', 
  Object.keys(process.env).filter(key => key.includes('TELEGRAM')).map(key => `${key}=${process.env[key]?.substring(0, 20)}...`)
);
console.log('DATABASE_URL доступен:', !!process.env.DATABASE_URL);
console.log('=======================================');

// Проверяем наличие токена
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения!');
  process.exit(1);
}

console.log('✅ TELEGRAM_BOT_TOKEN найден, длина:', botToken.length);

const bot = new Telegraf(botToken);

// Функция для создания/обновления пользователя (без БД)
async function upsertUser(ctx: any) {
  const user = ctx.from;
  if (!user) return null;

  console.log('Пользователь:', user.first_name, user.username);
  
  // Возвращаем мок-объект вместо записи в БД
  return {
    id: 'mock-id',
    firstName: user.first_name,
    username: user.username
  };
}

// Команда /start
bot.start(async (ctx) => {
  console.log('Получена команда /start');
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  const message = await ctx.reply(
    `Йоу! � Добро пожаловать в мини-приложение Total Lookas!\n\n` +
    `Всё просто:\n` +
    `1. Открывай приложение\n` +
    `2. Выбери позиции\n` +
    `3. Укажи тираж\n` +
    `4. Получи готовое КП`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть каталог', web_app: { url: webAppUrl } }],
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: 'ℹ️ О компании', callback_data: 'about' }]
        ]
      }
    }
  );
  console.log('Отправлено приветственное сообщение');
});

// Обработчики inline кнопок
bot.action('contact', async (ctx) => {
  console.log('Нажата кнопка "Связаться с нами"');
  await ctx.answerCbQuery();
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `📞 **Связаться с нами**\n\n` +
    `💬 **Telegram менеджера:** @zelenayaaliya\n` +
    `📱 **WhatsApp:** +7 (999) 162-77-58\n` +
    `📧 **Email:** hello@totallookas.com\n` +
    `🌐 **Сайт:** totallookas.ru\n\n` +
    `📍 **Офис:** г. Казань, ул. Сибирский Тракт, 78 (офис 301)\n\n` +
    `⏰ **Время работы:**\n` +
    `Пн-Пт: 10:00 - 19:00\n` +
    `Сб-Вс: 11:00 - 17:00\n\n` +
    `🚀 Готовы обсудить ваш проект прямо сейчас!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
});

bot.action('about', async (ctx) => {
  console.log('Нажата кнопка "О компании"');
  await ctx.answerCbQuery();
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `Йоу! Мы — Total Lookas. Не «наносим логотип», а собираем для брендов арт-капсулы, которые живут дольше события.\n\n` +
    `**Что делаем**\n` +
    `• Идея и визуальный язык\n` +
    `• Подбор тканей и фурнитуры\n` +
    `• Лекала и посадка\n` +
    `• Пошив и контроль качества\n` +
    `• Упаковка и логистика\n\n` +
    `**Для кого и под какие задачи**\n` +
    `• Онбординг-наборы для HR\n` +
    `• Ивент-мерч и спецпроекты\n` +
    `• Бренд-коллаборации\n` +
    `• Капсулы для продаж\n\n` +
    `**Как работаем**\n` +
    `• Дерзкий стиль, корпоративный сервис\n` +
    `• Прозрачные сметы и понятные дедлайны\n` +
    `• Персональный менеджер на проект\n\n` +
    `**Техники**\n` +
    `• Шелкография, вышивка, DTG\n` +
    `• Патчи, кастом деталей, спецфиниши\n\n` +
    `**Юридическая часть**\n` +
    `• Документация и маркировка «Честный Знак» — по требованию\n\n` +
    `**Масштаб**\n` +
    `• От пилотных партий до тиражного производства\n\n` +
    `Готовы начать?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '� Готов', callback_data: 'webapp' }],
          [{ text: '⬅️ Назад', callback_data: 'start' }]
        ]
      }
    }
  );
});

bot.action('back_to_main', async (ctx) => {
  console.log('Нажата кнопка "Назад в главное меню"');
  await ctx.answerCbQuery();
  const firstName = ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `Йоу! � Добро пожаловать в мини-приложение Total Lookas!\n\n` +
    `Всё просто:\n` +
    `1. Открывай приложение\n` +
    `2. Выбери позиции\n` +
    `3. Укажи тираж\n` +
    `4. Получи готовое КП`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть каталог', web_app: { url: webAppUrl } }],
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: 'ℹ️ О компании', callback_data: 'about' }]
        ]
      }
    }
  );
});

// Обработка данных из веб-приложения
bot.on('web_app_data', async (ctx) => {
  console.log('Получены данные из веб-приложения');
  
  try {
    const webAppData = ctx.message?.web_app_data?.data;
    if (!webAppData) {
      console.log('Нет данных от веб-приложения');
      return;
    }

    const data = JSON.parse(webAppData);
    console.log('Данные из веб-приложения:', JSON.stringify(data, null, 2));

    if (data.type === 'commercial_proposal') {
      const orderData = data.orderData;
      
      console.log('Получено коммерческое предложение от:', orderData.customerName);
      
      await ctx.reply('✅ Ваше коммерческое предложение успешно сформировано и отправлено менеджеру! Мы свяжемся с вами в ближайшее время.');
    } else {
      await ctx.reply('Спасибо! Ваши данные получены и обрабатываются.');
    }
  } catch (error) {
    console.error('Ошибка при обработке данных веб-приложения:', error);
    await ctx.reply('Произошла ошибка при обработке данных. Попробуйте еще раз.');
  }
});

// Перехват текстовых сообщений
bot.on('text', async (ctx) => {
  console.log('Получено текстовое сообщение:', ctx.message.text);
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
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

export { bot };
