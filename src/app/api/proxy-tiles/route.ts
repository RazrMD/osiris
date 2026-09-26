import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    const host = targetUrl.hostname.toLowerCase();
    if (
      host !== 'cartocdn.com' &&
      !host.endsWith('.cartocdn.com') &&
      host !== 'arcgisonline.com' &&
      !host.endsWith('.arcgisonline.com') &&
      host !== 'openstreetmap.org' &&
      !host.endsWith('.openstreetmap.org')
    ) {
      return NextResponse.json({ error: 'Forbidden domain' }, { status: 403 });
    }

    const response = await fetch(targetUrl.toString(), {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch tile' }, { status: response.status });
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Tile proxy error:', error, 'cause:', error?.cause);
    return NextResponse.json({ error: 'Internal server error', details: String(error), cause: String(error?.cause?.message || error?.cause || error?.message) }, { status: 500 });
  }
}
