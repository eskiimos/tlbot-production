import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

// HTML шаблон для коммерческого предложения
const generateProposalHTML = (cartItems: any[], userData: any) => {
  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getOptionsPrice = (item: any) => {
    if (!item.detailedProposal) return 0;
    return item.optionsDetails?.reduce((total: number, option: any) => total + option.price, 0) || 0;
  };

  const getOptionsByCategory = (item: any) => {
    const categorizedOptions: { [category: string]: string[] } = {};
    if (item.optionsDetails) {
      item.optionsDetails.forEach((option: any) => {
        if (!categorizedOptions[option.category]) {
          categorizedOptions[option.category] = [];
        }
        categorizedOptions[option.category].push(option.name);
      });
    }
    return categorizedOptions;
  };

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Коммерческое предложение - Total Lookas</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-size: 13px;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .price {
            text-align: right;
        }
        .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
        }
        .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .customer-info {
            background-color: #fff;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .note {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 14px;
        }
        .options {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        .option-category {
            margin-bottom: 3px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .contact-info { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TOTAL LOOKAS</div>
        <div class="subtitle">Превращаем мерч в арт-объекты</div>
    </div>

    <div class="section">
        <div class="section-title">📋 Коммерческое предложение</div>
        <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
        <p><strong>Номер:</strong> КП-${Date.now().toString().slice(-6)}</p>
    </div>

    <div class="section">
        <div class="section-title">👤 Заказчик</div>
        <div class="customer-info">
            <p><strong>Имя:</strong> ${userData.firstName || 'Не указано'}</p>
            ${userData.phoneNumber ? `<p><strong>Телефон:</strong> ${userData.phoneNumber}</p>` : ''}
            ${userData.email ? `<p><strong>Email:</strong> ${userData.email}</p>` : ''}
            ${userData.inn ? `<p><strong>ИНН:</strong> ${userData.inn}</p>` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">🛍️ Состав заказа</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">№</th>
                    <th style="width: 50%;">Наименование</th>
                    <th style="width: 10%;">Кол-во</th>
                    <th style="width: 17.5%;">Цена за ед.</th>
                    <th style="width: 17.5%;">Сумма</th>
                </tr>
            </thead>
            <tbody>
                ${cartItems.map((item, index) => {
                  const categorizedOptions = getOptionsByCategory(item);
                  const unitPrice = item.totalPrice / item.quantity;
                  return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <strong>${item.productName}</strong>
                            ${item.detailedProposal ? `
                                <div class="options">
                                    <div><strong>Базовая цена:</strong> ${item.basePrice.toLocaleString('ru-RU')} ₽</div>
                                    ${Object.entries(categorizedOptions).map(([category, options]) => `
                                        <div class="option-category">
                                            <strong>${category}:</strong> ${(options as string[]).join(', ')}
                                        </div>
                                    `).join('')}
                                    ${getOptionsPrice(item) > 0 ? `<div><strong>Доплаты:</strong> +${getOptionsPrice(item).toLocaleString('ru-RU')} ₽</div>` : ''}
                                </div>
                            ` : ''}
                        </td>
                        <td style="text-align: center;">${item.quantity} шт.</td>
                        <td class="price">${unitPrice.toLocaleString('ru-RU')} ₽</td>
                        <td class="price">${item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total-row">
                    <td colspan="4"><strong>ИТОГО:</strong></td>
                    <td class="price"><strong>${getTotalAmount().toLocaleString('ru-RU')} ₽</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="note">
        <strong>📝 Примечание:</strong><br>
        Это предварительное коммерческое предложение. Окончательная стоимость может быть скорректирована после уточнения всех деталей заказа.
    </div>

    <div class="contact-info">
        <div class="section-title">📞 Контактная информация</div>
        <p><strong>Менеджер:</strong> Андрей Копытин</p>
        <p><strong>Telegram:</strong> @akopytin</p>
        <p><strong>Телефон:</strong> +7 (910) 123-45-67</p>
        <p><strong>Email:</strong> info@totallookas.ru</p>
        <p><strong>Сайт:</strong> totallookas.ru</p>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        Total Lookas — превращаем мерч в арт-объекты!<br>
        Сгенерировано ${new Date().toLocaleString('ru-RU')}
    </div>
</body>
</html>
  `;
};

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/proposals-html вызван');
  
  try {
    const { cartItems, userData } = await request.json();
    
    console.log('📦 Получены данные:', {
      itemsCount: cartItems?.length,
      hasUserData: Boolean(userData)
    });

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'Данные корзины отсутствуют' }, { status: 400 });
    }

    // Проверяем токен бота
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден');
      return NextResponse.json({ error: 'Конфигурация бота отсутствует' }, { status: 500 });
    }

    // Генерируем HTML
    const htmlContent = generateProposalHTML(cartItems, userData);
    console.log('✅ HTML сгенерирован, размер:', htmlContent.length, 'символов');

    // Отправляем HTML как сообщение в Telegram
    const bot = new Telegraf(botToken);
    
    const proposalText = `🎉 *Ваше коммерческое предложение готово!*

📋 *Состав заказа:*
${cartItems.map((item: any, index: number) => 
  `${index + 1}\\. ${item.productName} \\- ${item.quantity} шт\\. \\(${item.totalPrice.toLocaleString('ru-RU')} ₽\\)`
).join('\n')}

💰 *Общая сумма:* ${cartItems.reduce((total: number, item: any) => total + item.totalPrice, 0).toLocaleString('ru-RU')} ₽

📞 *Контакты для связи:*
👤 Менеджер: Андрей Копытин
📱 Telegram: @akopytin
☎️ Телефон: \\+7 \\(910\\) 123\\-45\\-67
📧 Email: info@totallookas\\.ru

💬 Есть вопросы или нужны изменения? Мы всегда готовы обсудить детали\\!

🚀 Total Lookas — превращаем мерч в арт\\-объекты\\!`;

    try {
      const sentMessage = await bot.telegram.sendMessage(
        userData.telegramId || '228594178',
        proposalText,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '📄 Подробное КП (HTML)', 
                  url: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
                }
              ],
              [
                { text: '📞 Связаться с менеджером', url: 'https://t.me/akopytin' }
              ]
            ]
          }
        }
      );
      
      console.log(`✅ Сообщение успешно отправлено, message_id: ${sentMessage.message_id}`);
      
      return NextResponse.json({ 
        message: 'Коммерческое предложение успешно отправлено!',
        messageId: sentMessage.message_id,
        format: 'html'
      });

    } catch (telegramError: any) {
      console.error('❌ Ошибка отправки в Telegram:', telegramError);
      
      const errorMessage = telegramError.message || 'Неизвестная ошибка Telegram';
      
      if (errorMessage.includes('chat not found') || errorMessage.includes('Bad Request')) {
        return NextResponse.json({ 
          error: 'Чат с ботом не найден', 
          details: `Пользователь должен сначала написать боту /start. ID: ${userData.telegramId}`
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Ошибка при отправке в Telegram', 
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Ошибка на сервере:', error);
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message
    }, { status: 500 });
  }
}
