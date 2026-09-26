import { NextResponse } from 'next/server';
import { getMoldovaOverviewData } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const overview = await getMoldovaOverviewData();
    return NextResponse.json({
      success: true,
      count: overview.events.length,
      timestamp: new Date().toISOString(),
      events: overview.events,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova events', details: error.message }, { status: 500 });
  }
}
