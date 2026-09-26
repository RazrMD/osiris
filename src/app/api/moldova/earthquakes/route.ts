import { NextResponse } from 'next/server';
import { fetchMoldovaEarthquakes } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const earthquakes = await fetchMoldovaEarthquakes();
    return NextResponse.json({
      success: true,
      count: earthquakes.length,
      timestamp: new Date().toISOString(),
      earthquakes,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova earthquakes', details: error.message }, { status: 500 });
  }
}
