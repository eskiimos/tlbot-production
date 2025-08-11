const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProductionTimes() {
  try {
    const products = await prisma.product.findMany();
    let updatedCount = 0;

    for (const p of products) {
      if (!p.description) continue;

      const newDescription = p.description.replace(/(-\s*Производство:\s*)(.*?)(?=\n)/g, '$1от 30 дней');

      if (newDescription !== p.description) {
        await prisma.product.update({
          where: { id: p.id },
          data: { description: newDescription }
        });
        console.log(`Обновлено: ${p.name}`);
        updatedCount++;
      }
    }

    console.log(`Готово. Обновлено товаров: ${updatedCount}`);
  } catch (err) {
    console.error('Ошибка при обновлении сроков производства:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductionTimes();
