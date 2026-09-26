import { NextResponse } from 'next/server';
import { fetchMoldovaAirQuality } from '@/lib/moldova/sources/moldova-environment';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMoldovaAirQuality();
    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch air quality data' },
      { status: 500 }
    );
  }
}
