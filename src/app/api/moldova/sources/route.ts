import { NextResponse } from 'next/server';
import { getSourcesHealth } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sources = getSourcesHealth();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sources,
    }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova sources health', details: error.message }, { status: 500 });
  }
}
