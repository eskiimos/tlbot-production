const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTShirtImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 't-shirt' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/t-shirt/t-shirt 1.webp',
        '/products/t-shirt/t-shirt 2.webp',
        '/products/t-shirt/t-shirt 3.webp',
        '/products/t-shirt/t-shirt 4.webp',
        '/products/t-shirt/t-shirt 5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 't-shirt' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug t-shirt не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTShirtImages();
