const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestOrder() {
  try {
    console.log('Создаем тестовый заказ...');
    
    const order = await prisma.order.create({
      data: {
        userId: 'test-user-123',
        telegramId: '123456789',
        customerName: 'Иван Петров',
        customerEmail: 'ivan@example.com',
        customerPhone: '+7 123 456-78-90',
        customerCompany: 'ООО "Тестовая"',
        customerInn: '1234567890',
        items: [
          {
            id: 'test-item-1',
            productName: 'Тестовый товар',
            productSlug: 'test-product',
            quantity: 2,
            basePrice: 1000,
            totalPrice: 2150,
            image: '/products/t-shirt/IMG_0161_resized.webp',
            optionsDetails: [
              {
                id: 'opt1',
                name: 'Черный цвет',
                price: 0,
                category: 'color'
              },
              {
                id: 'opt2',
                name: 'Размер L',
                price: 50,
                category: 'size'
              },
              {
                id: 'opt3',
                name: 'Логотип',
                price: 25,
                category: 'design'
              }
            ],
            selectedOptions: {
              color: ['opt1'],
              size: ['opt2'],
              design: ['opt3']
            }
          }
        ],
        totalAmount: 215000, // в копейках
        status: 'NEW'
      }
    });
    
    console.log('Тестовый заказ создан:', order.id);
    console.log('Теперь можно протестировать админку с ID:', order.id);
    
  } catch (error) {
    console.error('Ошибка создания тестового заказа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
