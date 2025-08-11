const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateHoodiesImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'hoodies' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/hoodies/hoodies_1.webp',
        '/products/hoodies/hoodies_2.webp',
        '/products/hoodies/hoodies_3.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'hoodies' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug hoodies не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHoodiesImages();
