import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users - получить всех пользователей или конкретного по telegramId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (telegramId) {
      // Получаем конкретного пользователя по telegramId
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
        include: {
          organization: true,
          messages: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { messages: true }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Преобразуем BigInt в строку для JSON
      const userWithStringId = {
        ...user,
        telegramId: user.telegramId.toString()
      };

      return NextResponse.json(userWithStringId);
    }

    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      include: {
        organization: true,
        messages: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем BigInt в строки для JSON
    const usersWithStringIds = users.map(user => ({
      ...user,
      telegramId: user.telegramId.toString()
    }));

    return NextResponse.json(usersWithStringIds);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - создать или обновить пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, username, firstName, lastName, language, isPremium } = body;

    if (!telegramId || !firstName) {
      return NextResponse.json(
        { error: 'telegramId and firstName are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {
        username,
        firstName,
        lastName,
        language: language || 'ru',
        isPremium: isPremium || false,
        updatedAt: new Date()
      },
      create: {
        telegramId: BigInt(telegramId),
        username,
        firstName,
        lastName,
        language: language || 'ru',
        isPremium: isPremium || false
      }
    });

    // Преобразуем BigInt в строку для JSON
    const userResponse = {
      ...user,
      telegramId: user.telegramId.toString()
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}
