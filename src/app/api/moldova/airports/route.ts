import { NextResponse } from 'next/server';
import { fetchMoldovaAirports } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const airports = await fetchMoldovaAirports();
    return NextResponse.json({
      success: true,
      count: airports.length,
      timestamp: new Date().toISOString(),
      airports,
    }, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=240' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova airports', details: error.message }, { status: 500 });
  }
}
