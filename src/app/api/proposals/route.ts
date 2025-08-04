import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { Input } from 'telegraf';

// Инициализация бота
// Убедитесь, что токен бота доступен в переменных окружения
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const telegramId = formData.get('telegramId') as string | null;

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

    // Преобразуем Blob в Buffer, чтобы Telegraf мог с ним работать
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Отправляем документ пользователю
    await bot.telegram.sendDocument(
      telegramId,
      Input.fromBuffer(fileBuffer, `commercial-proposal-${telegramId}.pdf`),
      {
        caption: 'Ваше коммерческое предложение готово!',
      }
    );

    return NextResponse.json({ message: 'Файл успешно отправлен.' }, { status: 200 });
  } catch (error) {
    console.error('Ошибка на сервере при отправке файла:', error);
    
    // Определяем, является ли ошибка экземпляром Error
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

    return NextResponse.json({ error: 'Внутренняя ошибка сервера.', details: errorMessage }, { status: 500 });
  }
}
