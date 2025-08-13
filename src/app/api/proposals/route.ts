import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { Input } from 'telegraf';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  let file: Blob | null = null;
  let telegramId: string | null = null;
  let orderData: any = null;
  
  try {
    const formData = await request.formData();
    file = formData.get('file') as Blob | null;
    telegramId = formData.get('telegramId') as string | null;
    
    // Получаем данные заказа из формы
    const orderDataString = formData.get('orderData') as string | null;
    if (orderDataString) {
      orderData = JSON.parse(orderDataString);
    }

    if (!file || !telegramId) {
      return NextResponse.json({ error: 'Файл или ID пользователя отсутствуют.' }, { status: 400 });
    }

    // Проверяем, если это тестовый пользователь без реального ID (для демонстрации)
    if (telegramId === '123456789' && !process.env.DEBUG_TELEGRAM_ID) {
      console.log('🧪 Тестовый режим: PDF генерация прошла успешно, но отправка в Telegram пропущена (нет реального ID)');
      return NextResponse.json({ 
        message: 'Файл успешно сгенерирован (тестовый режим).',
        mode: 'development'
      }, { status: 200 });
    }

    // Для локальной разработки проверяем переменную окружения DEBUG_TELEGRAM_ID
    const debugTelegramId = process.env.DEBUG_TELEGRAM_ID;
    const isLocalDevelopment = process.env.NODE_ENV === 'development';
    
    // В режиме разработки используем реальный ID из переменной окружения
    if (isLocalDevelopment && debugTelegramId && (telegramId === '123456789' || telegramId !== debugTelegramId)) {
      console.log(`🧪 Локальная разработка: замена telegramId с ${telegramId} на ${debugTelegramId}`);
      telegramId = debugTelegramId;
    }

    // Инициализируем бот здесь, а не глобально
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
    
    // Преобразуем Blob в Buffer, чтобы Telegraf мог с ним работать
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      console.log(`Попытка отправки документа в Telegram для пользователя: ${telegramId}`);
      console.log(`Размер документа: ${fileBuffer.length} байт`);
      
      // Сначала очищаем предыдущие сообщения от бота
      try {
        console.log('🧹 Очищаем предыдущие сообщения от бота...');
        
        // Получаем последние сообщения из чата
        const updates = await bot.telegram.getUpdates({
          offset: -100,
          limit: 100,
          timeout: 1
        });
        
        // Ищем сообщения от бота к этому пользователю
        const botMessagesToDelete = updates
          .filter(update => 
            update.message && 
            update.message.chat.id.toString() === telegramId &&
            update.message.from?.is_bot === true
          )
          .slice(-10) // Берем только последние 10 сообщений
          .map(update => update.message!.message_id);
        
        // Удаляем найденные сообщения
        for (const messageId of botMessagesToDelete) {
          try {
            await bot.telegram.deleteMessage(telegramId, messageId);
            console.log(`🗑️ Удалено сообщение ${messageId}`);
          } catch (deleteError: any) {
            console.log(`ℹ️ Не удалось удалить сообщение ${messageId}: ${deleteError.message}`);
          }
        }
        
        console.log(`✅ Очистка завершена, обработано ${botMessagesToDelete.length} сообщений`);
      } catch (cleanupError: any) {
        console.log(`⚠️ Ошибка при очистке сообщений: ${cleanupError.message}`);
        // Продолжаем выполнение, даже если очистка не удалась
      }
      
      // Отправляем документ пользователю
      const sentMessage = await bot.telegram.sendDocument(
        telegramId,
        Input.fromBuffer(fileBuffer, `commercial-proposal-${telegramId}.pdf`),
        {
          caption: `🎉 Ваше коммерческое предложение готово!\n\n` +
                  `📋 Это предварительный документ для ознакомления с составом и стоимостью заказа. ` +
                  `В процессе дальнейшей работы предложение может быть скорректировано в соответствии с вашими пожеланиями.\n\n` +
                  `💬 Есть вопросы или нужны изменения? Мы всегда готовы обсудить детали и найти идеальное решение для вашего бренда!\n\n` +
                  `🚀 Total Lookas — превращаем мерч в арт-объекты!`,
        }
      );
      
      console.log(`Документ успешно отправлен, message_id: ${sentMessage.message_id}`);
      
      // Создаем заказ в базе данных (только для реальных отправок)
      if (orderData && telegramId !== '123456789') {
        try {
          console.log('📋 Создание заказа в базе данных с данными:', {
            userId: orderData.userId || telegramId,
            telegramId: telegramId,
            customerName: orderData.customerName || 'Не указано',
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            customerCompany: orderData.customerCompany,
            customerInn: orderData.customerInn,
            totalAmount: orderData.totalAmount || 0
          });
          
          const order = await prisma.order.create({
            data: {
              userId: orderData.userId || telegramId,
              telegramId: telegramId,
              customerName: orderData.customerName || 'Не указано',
              customerEmail: orderData.customerEmail,
              customerPhone: orderData.customerPhone,
              customerCompany: orderData.customerCompany,
              customerInn: orderData.customerInn,
              items: orderData.items || [],
              totalAmount: orderData.totalAmount || 0,
              status: 'NEW'
            }
          });
          
          console.log(`✅ Заказ создан для пользователя ${telegramId}, ID заказа: ${order.id}`);
          console.log('📊 Созданный заказ:', {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            totalAmount: order.totalAmount
          });
        } catch (orderError) {
          console.error('❌ Ошибка создания заказа:', orderError);
          // Не прерываем выполнение, так как КП уже отправлено
        }
      } else {
        console.log('ℹ️ Пропуск создания заказа:', {
          hasOrderData: Boolean(orderData),
          isTestUser: telegramId === '123456789',
          telegramId
        });
      }
    } catch (telegramError) {
      console.error('Ошибка отправки в Telegram:', telegramError);
      
      // Проверяем специфичные ошибки Telegram
      const errorMessage = telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка Telegram';
      
      if (errorMessage.includes('chat not found') || errorMessage.includes('Bad Request')) {
        return NextResponse.json({ 
          error: 'Чат с ботом не найден', 
          details: `Пользователь должен сначала написать боту /start. ID: ${telegramId}`
        }, { status: 400 });
      }
      
      // Добавляем дополнительную диагностику для других ошибок Telegram
      const telegramErrorDetails = {
        message: errorMessage,
        stack: telegramError instanceof Error ? telegramError.stack : undefined,
        telegramId: telegramId
      };
      
      console.error('Детали ошибки Telegram:', telegramErrorDetails);
      
      return NextResponse.json({ 
        error: 'Ошибка при отправке в Telegram', 
        details: errorMessage
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
