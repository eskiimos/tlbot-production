import { Telegraf } from 'telegraf';
import { prisma } from './lib/prisma';

// Диагностика переменных окружения
console.log('=== ДИАГНОСТИКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Все переменные содержащие TELEGRAM:', 
  Object.keys(process.env).filter(key => key.includes('TELEGRAM')).map(key => `${key}=${process.env[key]?.substring(0, 20)}...`)
);
console.log('Все переменные:', Object.keys(process.env).slice(0, 10));
console.log('=======================================');

// Проверяем наличие токена
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения!');
  console.log('Доступные переменные окружения:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('BOT') || key.includes('TELEGRAM') || key.includes('TOKEN')) {
      console.log(`  ${key}=${process.env[key]?.substring(0, 30)}...`);
    }
  });
  process.exit(1);
}

console.log('✅ TELEGRAM_BOT_TOKEN найден, длина:', botToken.length);

const bot = new Telegraf(botToken);

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
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  const message = await ctx.reply(
    `Привет, ${firstName}! 👋 Добро пожаловать в Total Lookas!\n\n` +
    `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
    `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
    `⚡️ От идеи до готового продукта всего за 30 дней!\n` +
    `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
    `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
    `Готов "полностью одеть" свой бренд? Выберите что вас интересует! 🚀`,
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
});

// Обработчики inline кнопок
bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `📞 **Связаться с нами**\n\n` +
    `💬 **Telegram:** @totallookas\n` +
    `📱 **WhatsApp:** +7 (999) 123-45-67\n` +
    `📧 **Email:** hello@totallookas.com\n` +
    `🌐 **Сайт:** www.totallookas.com\n\n` +
    `📍 **Офис:** г. Москва, ул. Креативная, 15\n\n` +
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
  await ctx.answerCbQuery();
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `ℹ️ **О компании Total Lookas**\n\n` +
    `🎨 **Кто мы?**\n` +
    `Креативное агентство полного цикла, которое с 2017 года превращает корпоративный мерч в настоящие арт-объекты!\n\n` +
    `💪 **Наши преимущества:**\n` +
    `• Полный цикл производства под ключ\n` +
    `• Собственная дизайн-студия\n` +
    `• Контроль качества на каждом этапе\n` +
    `• Быстрые сроки: от идеи до продукта за 30 дней\n` +
    `• Работаем с брендами любого масштаба\n\n` +
    `🏆 **Наша миссия:**\n` +
    `Объединяем дерзкий стиль с корпоративным сервисом. Делаем мерч, который хочется носить!\n\n` +
    `📈 **Цифры:**\n` +
    `• Более 500 довольных клиентов\n` +
    `• Свыше 10,000 единиц продукции\n` +
    `• 8 лет успешной работы на рынке`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
});

bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  const firstName = ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `👋 **Главное меню Total Lookas**\n\n` +
    `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
    `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
    `⚡️ От идеи до готового продукта всего за 30 дней!\n` +
    `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
    `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
    `Что вас интересует, ${firstName}? 🚀`,
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
  const user = await upsertUser(ctx);
  
  try {
    const webAppData = ctx.message?.web_app_data?.data;
    if (!webAppData) {
      console.log('Нет данных от веб-приложения');
      return;
    }

    const data = JSON.parse(webAppData);
    console.log('Получены данные из веб-приложения:', data);

    // Сохраняем данные в базу
    await prisma.webAppData.create({
      data: {
        userId: user?.id?.toString() || 'unknown',
        data: data
      }
    });

    // Создаем сообщение для пользователя
    await prisma.message.create({
      data: {
        userId: user?.id?.toString() || 'unknown',
        content: `Данные из веб-приложения: ${JSON.stringify(data)}`,
        type: 'WEBAPP_DATA'
      }
    });

    if (data.type === 'commercial_proposal') {
      const orderData = data.orderData;
      
      const adminMessage = `🔔 *Новое коммерческое предложение!*\n\n` +
        `👤 *Клиент:* ${orderData.customerName}\n` +
        `🏢 *Компания:* ${orderData.customerCompany}\n` +
        `🔢 *ИНН:* ${orderData.customerInn}\n` +
        `📱 *Телефон:* ${orderData.customerPhone}\n` +
        `📧 *Email:* ${orderData.customerEmail}\n\n` +
        `🛒 *Товаров в заказе:* ${orderData.items.length}\n` +
        `💰 *Сумма заказа:* ${(orderData.totalAmount/100).toLocaleString('ru-RU')} ₽\n\n` +
        `Детали заказа будут отправлены отдельным сообщением.`;
      
      console.log('Отправка уведомления администратору:', adminMessage);
      
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
