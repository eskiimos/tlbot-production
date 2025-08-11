const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLongsleeveImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'longsleeve' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/longsleeve/long_sleeve_1.webp',
        '/products/longsleeve/long_sleeve_2.webp',
        '/products/longsleeve/long_sleeve_3.webp',
        '/products/longsleeve/long_sleeve_4.webp',
        '/products/longsleeve/long_sleeve_5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'longsleeve' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug longsleeve не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLongsleeveImages();
