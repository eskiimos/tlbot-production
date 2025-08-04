import { NextRequest, NextResponse } from 'next/server';
import bot, { startBot } from '../../../bot';

// Переменная для отслеживания статуса бота
let botInitialized = false;

export async function GET() {
  try {
    // Инициализируем бота при первом запросе, если еще не инициализирован
    if (!botInitialized) {
      botInitialized = await startBot();
    }
    
    return NextResponse.json({ 
      message: 'Telegram bot is ready',
      status: botInitialized ? 'running' : 'error'
    });
  } catch (error) {
    console.error('Error in GET /api/bot:', error);
    return NextResponse.json({ error: 'Failed to initialize bot' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Инициализируем бота при каждом webhook-запросе, если еще не инициализирован
    if (!botInitialized) {
      botInitialized = await startBot();
    }

    // Получаем данные запроса
    const body = await request.json();
    console.log('Webhook received:', body);
    
    // Здесь можно обрабатывать webhook от Telegram
    // В production режиме нужно обработать обновление через webhook
    if (process.env.NODE_ENV === 'production' && botInitialized) {
      await bot.handleUpdate(body);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in POST /api/bot:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
