const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateShortsImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'shorts' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/shorts/short_1.webp',
        '/products/shorts/short_2.webp',
        '/products/shorts/short_3.webp',
        '/products/shorts/short_4.webp',
        '/products/shorts/short_5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'shorts' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug shorts не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateShortsImages();
