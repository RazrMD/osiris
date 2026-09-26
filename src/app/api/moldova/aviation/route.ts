import { NextResponse } from 'next/server';
import { fetchMoldovaAirports } from '@/lib/moldova/sources/moldova-aviation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMoldovaAirports();
    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch aviation data' },
      { status: 500 }
    );
  }
}
