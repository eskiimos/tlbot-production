const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateZipHoodieImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'zip-hoodie' }
    });
    
    if (product) {
      console.log('Найден продукт:', product.name);
      console.log('Текущие изображения:', product.images);
      
      const updatedImages = [
        '/products/zip-hoodie/zip-hoodie_1.webp',
        '/products/zip-hoodie/zip-hoodie_2.webp',
        '/products/zip-hoodie/zip-hoodie_3.webp'
      ];
      
      const updatedProduct = await prisma.product.update({
        where: { slug: 'zip-hoodie' },
        data: { images: updatedImages }
      });
      
      console.log('Изображения обновлены:', updatedProduct.images);
    } else {
      console.log('Продукт с slug zip-hoodie не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateZipHoodieImages();
