import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      console.log('Админ уже существует:', existingAdmin.username);
      return;
    }

    // Создаем админа
    const username = 'admin';
    const password = 'admin123'; // Поменяйте на более безопасный пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    console.log('✅ Админ создан успешно!');
    console.log('Логин:', username);
    console.log('Пароль:', password);
    console.log('🔒 Обязательно смените пароль после первого входа!');
  } catch (error) {
    console.error('Ошибка создания админа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
