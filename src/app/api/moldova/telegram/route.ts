import { NextResponse } from 'next/server';
import { fetchMoldovaTelegramChannels } from '@/lib/moldova/sources/moldova-telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMoldovaTelegramChannels();
    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Telegram catalog' },
      { status: 500 }
    );
  }
}
