import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context, session } from 'telegraf';
import { prisma } from '../../../lib/prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Типы для Telegram
interface UserSession {
  step?: string;
}

// Используем простую локальную сессию для webhook режима
const sessions = new Map<number, UserSession>();

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
    const user = await upsertUser(ctx.from!);
    
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
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.command('webapp', async (ctx: Context) => {
  try {
    const user = await upsertUser(ctx.from!);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍️ Открыть каталог TL', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }]
      ]
    };
    
    await ctx.reply('Нажмите на кнопку ниже, чтобы открыть каталог:', { reply_markup: keyboard });
  } catch (error) {
    console.error('Error in webapp command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('contact', async (ctx: Context) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('📞 Свяжитесь с нами:\n\n📧 Email: info@tl-clothing.com\n📱 Telegram: @tl_support\n🌐 Сайт: tl-clothing.com');
  } catch (error) {
    console.error('Error in contact action:', error);
  }
});

bot.action('about', async (ctx: Context) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('ℹ️ О TL Clothing:\n\nМы специализируемся на производстве качественной одежды. Наша миссия - предоставить вам комфортную и стильную одежду по доступным ценам.\n\n🎯 Индивидуальный подход к каждому заказу\n⚡ Быстрое производство\n💯 Гарантия качества');
  } catch (error) {
    console.error('Error in about action:', error);
  }
});

// Обработка веб-приложения данных
bot.on('web_app_data', async (ctx: Context) => {
  try {
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
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    await ctx.reply('Произошла ошибка при обработке заказа. Попробуйте еще раз.');
  }
});

export async function GET() {
  return NextResponse.json({ message: 'Telegram bot is running' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);
    
    // Обрабатываем обновление через бота
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
