const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomerFlow() {
  console.log('🧪 Тестируем полный процесс создания заказа с данными клиента...\n');

  // Симулируем данные из формы клиента
  const customerData = {
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'ivan.petrov@example.com',
    phoneNumber: '+7 (999) 123-45-67',
    companyName: 'ООО "Тестовая компания"',
    inn: '1234567890',
    telegramId: '123456789'
  };

  // Симулируем товары в корзине
  const cartItems = [
    {
      id: 'test-product-1',
      name: 'Футболка',
      basePrice: 1000,
      quantity: 2,
      selectedOptions: {
        color: 'Черный',
        size: 'M'
      },
      optionsDetails: [
        { name: 'Цвет', value: 'Черный', priceModifier: 0 },
        { name: 'Размер', value: 'M', priceModifier: 0 }
      ],
      totalPrice: 2000
    },
    {
      id: 'test-product-2',
      name: 'Худи',
      basePrice: 3000,
      quantity: 1,
      selectedOptions: {
        color: 'Белый',
        size: 'L'
      },
      optionsDetails: [
        { name: 'Цвет', value: 'Белый', priceModifier: 100 },
        { name: 'Размер', value: 'L', priceModifier: 200 }
      ],
      totalPrice: 3300
    }
  ];

  // Симулируем создание orderData как в компоненте cart
  const orderData = {
    userId: customerData.telegramId,
    customerName: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Не указано',
    customerEmail: customerData.email,
    customerPhone: customerData.phoneNumber,
    customerCompany: customerData.companyName,
    customerInn: customerData.inn,
    items: cartItems,
    totalAmount: 5300 * 100 // В копейках
  };

  console.log('📋 Данные заказа для создания:');
  console.log(JSON.stringify(orderData, null, 2));

  try {
    // Создаем заказ напрямую в базе данных
    const order = await prisma.order.create({
      data: {
        userId: orderData.userId.toString(),
        telegramId: orderData.userId.toString(),
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail || '',
        customerPhone: orderData.customerPhone || '',
        customerCompany: orderData.customerCompany || '',
        customerInn: orderData.customerInn || '',
        totalAmount: orderData.totalAmount,
        items: orderData.items,
        status: 'NEW'
      }
    });

    console.log('\n✅ Заказ успешно создан!');
    console.log('📊 Данные созданного заказа:');
    console.log({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerCompany: order.customerCompany,
      customerInn: order.customerInn,
      totalAmount: order.totalAmount,
      status: order.status,
      itemsCount: order.items.length
    });

    // Проверяем, как заказ выглядит в админке
    const orderForAdmin = await prisma.order.findUnique({
      where: { id: order.id }
    });

    console.log('\n📈 Данные заказа для админки:');
    console.log({
      id: orderForAdmin.id,
      customerName: orderForAdmin.customerName,
      customerEmail: orderForAdmin.customerEmail,
      customerPhone: orderForAdmin.customerPhone,
      customerCompany: orderForAdmin.customerCompany,
      totalAmount: orderForAdmin.totalAmount,
      items: orderForAdmin.items
    });

    console.log('\n🎯 Проверьте заказ в админке: http://localhost:3000/admin');
    
    return order.id;

  } catch (error) {
    console.error('❌ Ошибка при создании заказа:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тест
testCustomerFlow()
  .then(orderId => {
    console.log(`\n🎉 Тест завершен! ID созданного заказа: ${orderId}`);
  })
  .catch(error => {
    console.error('❌ Тест провален:', error);
    process.exit(1);
  });
