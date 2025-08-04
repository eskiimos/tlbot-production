import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/webapp-data - сохранить данные из мини-приложения
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data } = body;

    if (!userId || !data) {
      return NextResponse.json(
        { error: 'userId and data are required' },
        { status: 400 }
      );
    }

    const webappData = await prisma.webAppData.create({
      data: {
        userId,
        data
      }
    });

    return NextResponse.json(webappData);
  } catch (error) {
    console.error('Error saving webapp data:', error);
    return NextResponse.json(
      { error: 'Failed to save webapp data' },
      { status: 500 }
    );
  }
}

// GET /api/webapp-data - получить данные веб-приложения
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = userId ? { userId } : {};

    const webappData = await prisma.webAppData.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(webappData);
  } catch (error) {
    console.error('Error fetching webapp data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webapp data' },
      { status: 500 }
    );
  }
}
