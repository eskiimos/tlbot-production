const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateHalfzipImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'halfzip' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/halfzip/halfzip_1.webp',
        '/products/halfzip/halfzip_2.webp',
        '/products/halfzip/halfzip_3.webp',
        '/products/halfzip/halfzip_4.webp',
        '/products/halfzip/halfzip_5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'halfzip' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug halfzip не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHalfzipImages();
