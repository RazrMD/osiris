import { NextResponse } from 'next/server';
import { fetchMoldovaInfrastructure } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const features = await fetchMoldovaInfrastructure();
    return NextResponse.json({
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        id: f.id,
        geometry: {
          type: f.type,
          coordinates: f.coordinates,
        },
        properties: {
          name: f.name,
          category: f.category,
          ...f.properties,
        },
      })),
    }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch Moldova GIS features', details: error.message }, { status: 500 });
  }
}
