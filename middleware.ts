import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Разрешаем публичный доступ к webhook endpoint для Telegram
  if (request.nextUrl.pathname === '/api/bot') {
    return NextResponse.next();
  }
  
  // Для остальных API routes применяем стандартную обработку
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/bot/:path*',
  ],
};
