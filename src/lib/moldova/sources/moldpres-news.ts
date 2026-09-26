/**
 * OSIRIS — Moldpres Official News Source Adapter
 * Live verified feed from State Information Agency Moldpres (RO, RU, EN).
 */

import { MOLDOVA_CONFIG } from '../config';
import { parseMoldpresRss } from '../normalizers/news-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaNewsArticle } from '../types';

export async function fetchMoldpresNews(language: 'ro' | 'ru' | 'en' = 'ro'): Promise<MoldovaNewsArticle[]> {
  const cacheKey = `moldova:news:moldpres:${language}`;
  const url = language === 'ru' ? MOLDOVA_CONFIG.endpoints.moldpres.ru :
              language === 'en' ? MOLDOVA_CONFIG.endpoints.moldpres.en :
              MOLDOVA_CONFIG.endpoints.moldpres.ro;

  return fetchWithMoldovaCache<MoldovaNewsArticle[]>(
    cacheKey,
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'OSIRIS-Geospatial-Intelligence/2.0 (compatible; security-research)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
        });

        if (!res.ok) {
          throw new Error(`Moldpres RSS returned HTTP ${res.status}`);
        }

        const xml = await res.text();
        return parseMoldpresRss(xml, language);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    MOLDOVA_CONFIG.cacheTtl.news,
    [],
  );
}

export async function fetchAllMoldovaNews(): Promise<MoldovaNewsArticle[]> {
  const [roArticles, ruArticles, enArticles] = await Promise.allSettled([
    fetchMoldpresNews('ro'),
    fetchMoldpresNews('ru'),
    fetchMoldpresNews('en'),
  ]);

  const all: MoldovaNewsArticle[] = [];
  if (roArticles.status === 'fulfilled') all.push(...roArticles.value);
  if (ruArticles.status === 'fulfilled') all.push(...ruArticles.value);
  if (enArticles.status === 'fulfilled') all.push(...enArticles.value);

  // Deduplicate by URL/Title and sort newest first
  const seen = new Set<string>();
  const deduped: MoldovaNewsArticle[] = [];

  for (const item of all) {
    const key = item.url || item.title;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
