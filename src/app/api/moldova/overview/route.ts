import { NextResponse } from 'next/server';
import { getMoldovaOverviewData } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getMoldovaOverviewData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Osiris-Region': 'MD',
      },
    });
  } catch (error: any) {
    console.error('[API /api/moldova/overview] Error:', error);
    return NextResponse.json({ error: 'Failed to generate Moldova overview', details: error.message }, { status: 500 });
  }
}
