import { NextResponse } from 'next/server';
import { fetchMoldovaWeather } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const weatherStations = await fetchMoldovaWeather();
    return NextResponse.json({
      success: true,
      count: weatherStations.length,
      timestamp: new Date().toISOString(),
      weatherStations,
    }, {
      headers: { 'Cache-Control': 'public, max-age=180, stale-while-revalidate=300' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova weather', details: error.message }, { status: 500 });
  }
}
