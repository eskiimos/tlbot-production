const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSweatshirtImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'sweatshirt' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/sweatshirt/sweatshirt_1.webp',
        '/products/sweatshirt/sweatshirt_2.webp',
        '/products/sweatshirt/sweatshirt_3.webp',
        '/products/sweatshirt/sweatshirt_4.webp',
        '/products/sweatshirt/sweatshirt_5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'sweatshirt' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug sweatshirt не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSweatshirtImages();
