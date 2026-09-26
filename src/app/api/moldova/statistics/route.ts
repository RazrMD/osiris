import { NextResponse } from 'next/server';
import { fetchMoldovaStatistics } from '@/lib/moldova/sources/moldova-statistics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMoldovaStatistics();
    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
