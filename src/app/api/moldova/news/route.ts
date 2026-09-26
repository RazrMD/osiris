import { NextRequest, NextResponse } from 'next/server';
import { fetchMoldpresNews, fetchAllMoldovaNews } from '@/lib/moldova';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang');

    let articles;
    if (lang === 'ro' || lang === 'ru' || lang === 'en') {
      articles = await fetchMoldpresNews(lang);
    } else {
      articles = await fetchAllMoldovaNews();
    }

    return NextResponse.json({
      success: true,
      count: articles.length,
      timestamp: new Date().toISOString(),
      articles,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[API /api/moldova/news] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Moldova news', details: error.message }, { status: 500 });
  }
}
