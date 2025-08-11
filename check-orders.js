const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentOrders() {
  console.log('🔍 Проверяем последние заказы в базе данных...\n');

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (orders.length === 0) {
      console.log('📭 Заказов в базе данных не найдено');
      return;
    }

    console.log(`📊 Найдено заказов: ${orders.length}\n`);

    orders.forEach((order, index) => {
      console.log(`📋 Заказ ${index + 1}:`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Клиент: ${order.customerName}`);
      console.log(`   Email: ${order.customerEmail || 'Не указан'}`);
      console.log(`   Телефон: ${order.customerPhone || 'Не указан'}`);
      console.log(`   Компания: ${order.customerCompany || 'Не указана'}`);
      console.log(`   ИНН: ${order.customerInn || 'Не указан'}`);
      console.log(`   Сумма: ${(order.totalAmount / 100).toLocaleString('ru-RU')}₽`);
      console.log(`   Статус: ${order.status}`);
      console.log(`   Товаров: ${order.items ? order.items.length : 0}`);
      console.log(`   Создан: ${order.createdAt.toLocaleString('ru-RU')}`);
      console.log('');
    });

    // Показываем детали последнего заказа
    const lastOrder = orders[0];
    if (lastOrder.items && lastOrder.items.length > 0) {
      console.log('🛍️ Детали последнего заказа:');
      lastOrder.items.forEach((item, index) => {
        console.log(`   Товар ${index + 1}: ${item.name} x${item.quantity} = ${item.totalPrice?.toLocaleString('ru-RU') || 'N/A'}₽`);
        if (item.optionsDetails && item.optionsDetails.length > 0) {
          item.optionsDetails.forEach(option => {
            console.log(`     - ${option.name}: ${option.value} ${option.priceModifier > 0 ? `(+${option.priceModifier}₽)` : ''}`);
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при получении заказов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем проверку
checkRecentOrders();
