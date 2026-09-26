import { NextResponse } from 'next/server';
import { fetchMoldovaCameras } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cameras = await fetchMoldovaCameras();
    return NextResponse.json({
      success: true,
      count: cameras.length,
      timestamp: new Date().toISOString(),
      cameras,
    }, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=240' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova cameras', details: error.message }, { status: 500 });
  }
}
