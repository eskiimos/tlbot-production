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

    // Проверка, что бот успешно инициализирован
    if (!botInitialized) {
      console.error('Failed to initialize bot for webhook processing');
      return NextResponse.json({ error: 'Bot not initialized' }, { status: 500 });
    }

    // Получаем данные запроса
    const body = await request.json().catch(err => {
      console.error('Error parsing webhook JSON:', err);
      return null;
    });
    
    // Проверяем, что получили валидные данные
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    console.log('Webhook received:', JSON.stringify(body).substring(0, 200) + '...');
    
    // Обрабатываем update от Telegram через webhook
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in POST /api/bot:', error);
    return NextResponse.json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
