import { NextResponse } from 'next/server';
import { discoverMoldovaDatasets } from '@/lib/moldova/sources/dataset-discovery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category');

    const result = await discoverMoldovaDatasets(Math.min(limit, 200));

    let datasets = result.datasets;
    if (category && category !== 'ALL') {
      datasets = datasets.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      totalCatalogCount: result.count,
      returnedCount: datasets.length,
      data: datasets,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}
