import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { Input } from 'telegraf';

export async function POST(request: NextRequest) {
  let file: Blob | null = null;
  let telegramId: string | null = null;
  
  try {
    const formData = await request.formData();
    file = formData.get('file') as Blob | null;
    telegramId = formData.get('telegramId') as string | null;

    if (!file || !telegramId) {
      return NextResponse.json({ error: 'Файл или ID пользователя отсутствуют.' }, { status: 400 });
    }

    // Проверяем, если это тестовый пользователь (для разработки)
    if (telegramId === '123456789') {
      console.log('🧪 Тестовый режим: PDF генерация прошла успешно, но отправка в Telegram пропущена');
      return NextResponse.json({ 
        message: 'Файл успешно сгенерирован (тестовый режим).',
        mode: 'development'
      }, { status: 200 });
    }

    // Инициализируем бот здесь, а не глобально
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
    
    // Преобразуем Blob в Buffer, чтобы Telegraf мог с ним работать
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      console.log(`Попытка отправки документа в Telegram для пользователя: ${telegramId}`);
      console.log(`Размер документа: ${fileBuffer.length} байт`);
      
      // Отправляем документ пользователю
      const sentMessage = await bot.telegram.sendDocument(
        telegramId,
        Input.fromBuffer(fileBuffer, `commercial-proposal-${telegramId}.pdf`),
        {
          caption: 'Ваше коммерческое предложение готово!',
        }
      );
      
      console.log(`Документ успешно отправлен, message_id: ${sentMessage.message_id}`);
    } catch (telegramError) {
      console.error('Ошибка отправки в Telegram:', telegramError);
      
      // Добавляем дополнительную диагностику для ошибки Telegram
      const telegramErrorDetails = {
        message: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка Telegram',
        stack: telegramError instanceof Error ? telegramError.stack : undefined,
        telegramId: telegramId
      };
      
      console.error('Детали ошибки Telegram:', telegramErrorDetails);
      
      return NextResponse.json({ 
        error: 'Ошибка при отправке в Telegram', 
        details: telegramErrorDetails.message
      }, { status: 500 });
    }

    // Если дошли до этой точки, значит отправка прошла успешно
    console.log(`✅ КП успешно отправлено пользователю ${telegramId}`);
    return NextResponse.json({ message: 'Файл успешно отправлен.' }, { status: 200 });
  } catch (error) {
    console.error('Ошибка на сервере при отправке файла:', error);
    
    // Определяем, является ли ошибка экземпляром Error
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    
    // Добавляем детали для диагностики
    const details = {
      telegramId: telegramId ? `${telegramId.substring(0, 3)}...` : 'undefined', // Для безопасности показываем только часть ID
      fileExists: Boolean(file),
      fileSize: file ? file.size : 0,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? 'exists (length: ' + 
        process.env.TELEGRAM_BOT_TOKEN.length + ')' : 'missing'
    };

    console.error('Детали ошибки:', details);

    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера.',
      details: errorMessage,
      diagnostics: details 
    }, { status: 500 });
  }
}
