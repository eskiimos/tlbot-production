import { NextRequest, NextResponse } from 'next/server';
import '../../../bot';

export async function GET() {
  return NextResponse.json({ message: 'Telegram bot is running' });
}

export async function POST(request: NextRequest) {
  // Здесь можно обрабатывать webhook от Telegram
  const body = await request.json();
  console.log('Webhook received:', body);
  
  return NextResponse.json({ ok: true });
}
