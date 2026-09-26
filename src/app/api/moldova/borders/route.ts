import { NextResponse } from 'next/server';
import { fetchMoldovaBorderCrossings } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const borderCrossings = await fetchMoldovaBorderCrossings();
    return NextResponse.json({
      success: true,
      count: borderCrossings.length,
      timestamp: new Date().toISOString(),
      borderCrossings,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova border crossings', details: error.message }, { status: 500 });
  }
}
