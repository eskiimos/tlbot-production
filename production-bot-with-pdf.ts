import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';

// Импорт PDFKit через require для совместимости
const PDFDocument = require('pdfkit');

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

// Обработчик для кнопки "🚀 Готов" (открытие веб-приложения)
bot.action('webapp', async (ctx) => {
  console.log('Нажата кнопка "Готов" - сразу открываем веб-приложение');
  await ctx.answerCbQuery();
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  // Сразу открываем веб-приложение
  await ctx.reply(
    '🚀 Открываю каталог...',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть каталог', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

// Обработчик для кнопки "⬅️ Назад" (возврат в главное меню)
bot.action('start', async (ctx) => {
  console.log('Нажата кнопка "Назад" - возврат в главное меню');
  await ctx.answerCbQuery();
  const firstName = ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tlbot-2sl9hgbyw-eskimos-projects.vercel.app';
  
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  await ctx.reply(
    `Йоу! 👋 Добро пожаловать в мини-приложение Total Lookas!\n\n` +
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

// Функция для генерации PDF коммерческого предложения
async function generateCommercialProposalPDF(orderData: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `kp_${Date.now()}.pdf`;
      const filePath = path.join('/tmp', fileName);
      
      doc.pipe(fs.createWriteStream(filePath));

      // Заголовок
      doc.fontSize(20).text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('Total Lookas', { align: 'center' });
      doc.moveDown(2);

      // Информация о клиенте
      doc.fontSize(14).text('ИНФОРМАЦИЯ О КЛИЕНТЕ:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Имя: ${orderData.customerName || 'Не указано'}`)
        .text(`Email: ${orderData.customerEmail || 'Не указано'}`)
        .text(`Телефон: ${orderData.customerPhone || 'Не указано'}`)
        .text(`Компания: ${orderData.customerCompany || 'Не указано'}`);
      doc.moveDown(1.5);

      // Детали заказа
      doc.fontSize(14).text('ДЕТАЛИ ЗАКАЗА:', { underline: true });
      doc.moveDown(0.5);

      let totalAmount = 0;
      let itemNumber = 1;

      if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach((item: any) => {
          doc.fontSize(12)
            .text(`${itemNumber}. ${item.name}`)
            .text(`   Размер: ${item.size || 'Не указан'}`)
            .text(`   Цвет: ${item.color || 'Не указан'}`)
            .text(`   Количество: ${item.quantity || 1} шт.`)
            .text(`   Цена за единицу: ${item.price || 0} ₽`)
            .text(`   Сумма: ${(item.price || 0) * (item.quantity || 1)} ₽`);
          
          totalAmount += (item.price || 0) * (item.quantity || 1);
          itemNumber++;
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(12).text('Товары не указаны');
      }

      doc.moveDown(1);

      // Итоговая сумма
      doc.fontSize(14).text(`ИТОГО: ${totalAmount} ₽`, { align: 'right' });
      doc.moveDown(2);

      // Контактная информация
      doc.fontSize(14).text('КОНТАКТЫ:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text('Менеджер: @zelenayaaliya')
        .text('Телефон: +7 (999) 162-77-58')
        .text('Сайт: totallookas.ru')
        .text('Офис: Казань, ул. Сибирский Тракт, 78, офис 301');

      doc.moveDown(2);
      doc.fontSize(10).text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'right' });

      doc.end();

      doc.on('end', () => {
        console.log(`PDF создан: ${filePath}`);
        resolve(filePath);
      });

      doc.on('error', (error: any) => {
        console.error('Ошибка создания PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      reject(error);
    }
  });
}

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
      
      try {
        // Уведомляем о начале генерации
        await ctx.reply('📄 Генерирую коммерческое предложение...');
        
        // Генерируем PDF
        const pdfPath = await generateCommercialProposalPDF(orderData);
        
        // Отправляем PDF файл
        await ctx.replyWithDocument(
          { source: pdfPath, filename: `Коммерческое_предложение_${orderData.customerName?.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') || 'Total_Lookas'}.pdf` },
          { 
            caption: `📋 Коммерческое предложение для ${orderData.customerName || 'клиента'}\n\n✅ Менеджер @zelenayaaliya свяжется с вами в ближайшее время!`
          }
        );
        
        // Удаляем временный файл
        fs.unlinkSync(pdfPath);
        console.log('PDF отправлен и временный файл удален');
        
      } catch (pdfError) {
        console.error('Ошибка генерации/отправки PDF:', pdfError);
        await ctx.reply('❌ Произошла ошибка при создании PDF. Ваши данные сохранены, менеджер свяжется с вами.');
      }
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
