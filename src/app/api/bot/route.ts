import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
import { prisma } from '../../../lib/prisma';

// Инициализируем бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Функция для создания/обновления пользователя
async function upsertUser(telegramUser: any) {
  const userDataForDb = {
    telegramId: telegramUser.id.toString(),
    username: telegramUser.username || null,
    firstName: telegramUser.first_name || null,
    lastName: telegramUser.last_name || null,
    languageCode: telegramUser.language_code || null,
  };

  const user = await prisma.user.upsert({
    where: { telegramId: userDataForDb.telegramId },
    update: userDataForDb,
    create: userDataForDb,
  });

  return user;
}

// Обработчики команд бота
bot.start(async (ctx: Context) => {
  try {
    console.log('Bot /start command received');
    const user = await upsertUser(ctx.from!);
    console.log('User upserted:', user.id);
    
    const welcome = `Привет! 👋
    
Добро пожаловать в TL Bot! 
Здесь ты можешь:

🛍️ Посмотреть наш каталог товаров
📱 Оформить заказ через веб-приложение
💬 Связаться с нами

Выбери действие:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍️ Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
        [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
        [{ text: 'ℹ️ О нас', callback_data: 'about' }]
      ]
    };

    await ctx.reply(welcome, { reply_markup: keyboard });
    console.log('Reply sent successfully');
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.command('webapp', async (ctx: Context) => {
  try {
    console.log('Bot /webapp command received');
    const user = await upsertUser(ctx.from!);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍️ Открыть каталог TL', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }]
      ]
    };
    
    await ctx.reply('Нажмите на кнопку ниже, чтобы открыть каталог:', { reply_markup: keyboard });
    console.log('Webapp reply sent successfully');
  } catch (error) {
    console.error('Error in webapp command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('contact', async (ctx: Context) => {
  try {
    console.log('Contact action received');
    await ctx.answerCbQuery();
    await ctx.reply('📞 Свяжитесь с нами:\n\n📧 Email: info@tl-clothing.com\n📱 Telegram: @tl_support\n🌐 Сайт: tl-clothing.com');
  } catch (error) {
    console.error('Error in contact action:', error);
  }
});

bot.action('about', async (ctx: Context) => {
  try {
    console.log('About action received');
    await ctx.answerCbQuery();
    await ctx.reply('ℹ️ О TL Clothing:\n\nМы специализируемся на производстве качественной одежды. Наша миссия - предоставить вам комфортную и стильную одежду по доступным ценам.\n\n🎯 Индивидуальный подход к каждому заказу\n⚡ Быстрое производство\n💯 Гарантия качества');
  } catch (error) {
    console.error('Error in about action:', error);
  }
});

// Обработка веб-приложения данных
bot.on('web_app_data', async (ctx: Context) => {
  try {
    console.log('Web app data received');
    const user = await upsertUser(ctx.from!);
    const webAppData = ctx.webAppData?.data;
    
    if (webAppData) {
      // Сохраняем данные в базу
      await prisma.webAppData.create({
        data: {
          userId: user.id,
          data: JSON.parse(webAppData.text()),
        },
      });
      
      await ctx.reply('✅ Спасибо! Ваш заказ принят. Мы свяжемся с вами в ближайшее время.');
      console.log('Web app data processed successfully');
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    await ctx.reply('Произошла ошибка при обработке заказа. Попробуйте еще раз.');
  }
});

// GET endpoint для проверки статуса
export async function GET() {
  console.log('GET /api/bot - Bot webhook endpoint is active');
  return NextResponse.json({ 
    message: 'Telegram bot webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
}

// POST endpoint для обработки webhook
export async function POST(request: NextRequest) {
  try {
    console.log('🌐 Bot API POST request received');
    
    const body = await request.json();
    console.log('📨 Request body type:', body.type);
    
    // Обработка web_app_data через API (альтернативный способ)
    if (body.type === 'web_app_data') {
      console.log('📱 Processing web_app_data via API');
      
      const user = await upsertUser(body.user);
      const webAppData = body.data;
      
      if (webAppData) {
        // Сохраняем данные в базу
        await prisma.webAppData.create({
          data: {
            userId: user.id,
            data: webAppData,
          },
        });
        
        console.log('💾 Web app data saved via API for user:', user.id);
        
        // Отправляем уведомление в Telegram
        try {
          await bot.telegram.sendMessage(
            body.user.id,
            '✅ Спасибо! Ваш заказ принят. Мы свяжемся с вами в ближайшее время.'
          );
          console.log('✅ Notification sent to user');
        } catch (telegramError) {
          console.error('❌ Error sending Telegram notification:', telegramError);
        }
        
        return NextResponse.json({ success: true, message: 'Order received' });
      }
      
      return NextResponse.json({ success: false, message: 'No data provided' }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Unknown request type' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in bot API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
