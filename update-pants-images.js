const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePantsImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'pants' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/pants/pants_1.webp',
        '/products/pants/pants_2.webp',
        '/products/pants/pants_3.webp',
        '/products/pants/pants_4.webp',
        '/products/pants/pants_5.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'pants' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug pants не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePantsImages();
