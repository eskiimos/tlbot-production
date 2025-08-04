import { NextRequest, NextResponse } from 'next/server';
import bot from '../../../../bot';

export async function GET(request: NextRequest) {
  try {
    // Получаем текущий домен приложения
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/bot`;

    // Получаем параметр secret из URL, если он есть
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const configuredSecret = process.env.WEBHOOK_SECRET || 'your-secret-here';

    // Проверяем секретный ключ для безопасности
    if (!secret || secret !== configuredSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Пробуем получить информацию о боте для проверки токена
    const botInfo = await bot.telegram.getMe();
    
    // Настраиваем webhook
    await bot.telegram.setWebhook(webhookUrl);
    
    // Получаем информацию о текущем webhook
    const webhookInfo = await bot.telegram.getWebhookInfo();

    return NextResponse.json({
      success: true,
      message: 'Webhook setup successful',
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name
      },
      webhook: {
        url: webhookInfo.url,
        has_custom_certificate: webhookInfo.has_custom_certificate,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message
      }
    });
  } catch (error) {
    console.error('Error setting up webhook:', error);
    return NextResponse.json(
      { error: 'Failed to setup webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
