import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Получены данные:', body);
    
    const { contactName, inn, phone, email, user } = body;

    // Валидация обязательных полей
    if (!contactName || !inn || !phone || !user?.id) {
      console.log('Ошибка валидации:', { contactName, inn, phone, userId: user?.id });
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    console.log('Создаем пользователя...');
    // Создаем или находим пользователя
    const existingUser = await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name || null,
      },
      create: {
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name || null,
      }
    });

    console.log('Пользователь создан/обновлен:', existingUser.id);

    console.log('Создаем организацию...');
    // Создаем или обновляем организацию
    const organization = await prisma.organization.upsert({
      where: { userId: existingUser.id },
      update: {
        contactName,
        inn,
        phone,
        email: email || null,
      },
      create: {
        contactName,
        inn,
        phone,
        email: email || null,
        userId: existingUser.id,
      }
    });

    console.log('Организация создана/обновлена:', organization.id);

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        contactName: organization.contactName,
        inn: organization.inn,
        phone: organization.phone,
        email: organization.email,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Ошибка при сохранении организации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Отсутствует telegramId' },
        { status: 400 }
      );
    }

    // Находим пользователя и его организацию
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { organization: true }
    });

    if (!user || !user.organization) {
      return NextResponse.json(
        { organization: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      organization: {
        id: user.organization.id,
        contactName: user.organization.contactName,
        inn: user.organization.inn,
        phone: user.organization.phone,
        email: user.organization.email,
        createdAt: user.organization.createdAt.toISOString(),
        updatedAt: user.organization.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Ошибка при получении организации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
