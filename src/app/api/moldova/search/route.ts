import { NextResponse } from 'next/server';
import { getMoldovaOverviewData } from '@/lib/moldova/sources/source-registry';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    if (!q) {
      return NextResponse.json({
        success: true,
        query: '',
        totalMatches: 0,
        results: [],
      });
    }

    const overview = await getMoldovaOverviewData();
    const results: Array<{
      id: string;
      category: string;
      title: string;
      subtitle: string;
      url?: string;
      coordinates?: [number, number];
      type: string;
    }> = [];

    // Search News
    for (const n of overview.news) {
      if (n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))) {
        results.push({
          id: n.id,
          category: 'NEWS',
          title: n.title,
          subtitle: `${n.sourceName} • ${new Date(n.publishedAt).toLocaleDateString()}`,
          url: n.url,
          coordinates: n.coordinates,
          type: 'article',
        });
      }
    }

    // Search Events
    for (const e of overview.events) {
      if (e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)) {
        results.push({
          id: e.id,
          category: 'EVENT',
          title: e.title,
          subtitle: `${e.severity} • ${e.sourceName}`,
          coordinates: e.coordinates,
          type: 'event',
        });
      }
    }

    // Search Cameras
    for (const c of overview.cameras) {
      if (c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || (c.road && c.road.toLowerCase().includes(q))) {
        results.push({
          id: c.id,
          category: 'CAMERA',
          title: c.name,
          subtitle: `${c.region} • Status: ${c.status}`,
          coordinates: [c.lat, c.lng],
          type: 'camera',
        });
      }
    }

    // Search Datasets
    for (const d of overview.datasets) {
      if (d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.organization.toLowerCase().includes(q)) {
        results.push({
          id: d.id,
          category: 'DATASET',
          title: d.title,
          subtitle: `${d.organization} • ${d.category}`,
          url: d.url,
          type: 'dataset',
        });
      }
    }

    // Search Borders
    for (const b of overview.borderCrossings) {
      if (b.name.toLowerCase().includes(q) || b.counterpartName.toLowerCase().includes(q)) {
        results.push({
          id: b.id,
          category: 'BORDER',
          title: `PTF ${b.name} (${b.counterpartName})`,
          subtitle: `Graniță ${b.neighborCountry === 'RO' ? 'România' : 'Ucraina'} • Status: ${b.status}`,
          coordinates: [b.lat, b.lng],
          type: 'border',
        });
      }
    }

    // Search Airports
    for (const a of overview.airports) {
      if (a.name.toLowerCase().includes(q) || a.icao.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)) {
        results.push({
          id: a.icao,
          category: 'AVIATION',
          title: `${a.name} (${a.icao} / ${a.iata})`,
          subtitle: `${a.city} • Status: ${a.status} • METAR: ${a.metarRaw || 'N/A'}`,
          coordinates: [a.lat, a.lng],
          type: 'airport',
        });
      }
    }

    return NextResponse.json({
      success: true,
      query: q,
      totalMatches: results.length,
      results: results.slice(0, 50),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
