/**
 * OSIRIS — Moldova Multi-Source Real News Ingestion
 * Fetches and normalizes live feeds from verified Moldovan news publications.
 */

import { parseGenericRssFeed, parseMoldpresRss } from '../normalizers/news-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import { safeFetchText } from '../security/safe-fetch';
import type { MoldovaNewsArticle } from '../types';

export interface NewsFeedConfig {
  id: string;
  name: string;
  agency: string;
  url: string;
  language: 'ro' | 'ru' | 'en' | 'uk';
  category: string;
}

export const VERIFIED_NEWS_FEEDS: NewsFeedConfig[] = [
  {
    id: 'newsmaker-ro',
    name: 'NewsMaker (RO)',
    agency: 'NewsMaker',
    url: 'https://newsmaker.md/ro/feed',
    language: 'ro',
    category: 'Actualitate',
  },
  {
    id: 'newsmaker-ru',
    name: 'NewsMaker (RU)',
    agency: 'NewsMaker',
    url: 'https://newsmaker.md/ru/feed',
    language: 'ru',
    category: 'Новости',
  },
  {
    id: 'zdg-ro',
    name: 'Ziarul de Gardă (RO)',
    agency: 'Ziarul de Gardă',
    url: 'https://www.zdg.md/feed/',
    language: 'ro',
    category: 'Investigații & Știri',
  },
  {
    id: 'zdg-ru',
    name: 'Ziarul de Gardă (RU)',
    agency: 'Ziarul de Gardă',
    url: 'https://www.zdg.md/ru/feed/',
    language: 'ru',
    category: 'Расследования & Новости',
  },
  {
    id: 'unimedia-ro',
    name: 'Unimedia (RO)',
    agency: 'Unimedia',
    url: 'https://unimedia.info/ro/rss/all',
    language: 'ro',
    category: 'Evenimente',
  },
  {
    id: 'diez-ro',
    name: '#diez (RO)',
    agency: 'diez.md',
    url: 'https://diez.md/feed/',
    language: 'ro',
    category: 'Știri & Tineret',
  },
  {
    id: 'tv8-ro',
    name: 'TV8 Moldova (RO)',
    agency: 'TV8',
    url: 'https://tv8.md/rss',
    language: 'ro',
    category: 'Actualitate TV',
  },
  {
    id: 'cotidianul-ro',
    name: 'Cotidianul (RO)',
    agency: 'Cotidianul',
    url: 'https://cotidianul.md/feed/',
    language: 'ro',
    category: 'Politică & Știri',
  },
  {
    id: 'moldpres-ro',
    name: 'Moldpres (RO)',
    agency: 'MOLDPRES',
    url: 'https://www.moldpres.md/config/rss.php?lang=rom',
    language: 'ro',
    category: 'Oficial',
  },
  {
    id: 'moldpres-ru',
    name: 'Moldpres (RU)',
    agency: 'MOLDPRES',
    url: 'https://www.moldpres.md/config/rss.php?lang=rus',
    language: 'ru',
    category: 'Официально',
  },
];

export async function fetchFeedArticles(feed: NewsFeedConfig): Promise<MoldovaNewsArticle[]> {
  const cacheKey = `moldova:news:feed:${feed.id}`;
  return fetchWithMoldovaCache<MoldovaNewsArticle[]>(
    cacheKey,
    async () => {
      try {
        const xml = await safeFetchText(feed.url, { timeoutMs: 12000 });
        if (feed.agency === 'MOLDPRES') {
          return parseMoldpresRss(xml, feed.language as any);
        }
        return parseGenericRssFeed(xml, {
          sourceId: feed.id,
          sourceName: feed.name,
          agency: feed.agency,
          defaultLanguage: feed.language,
          defaultCategory: feed.category,
        });
      } catch (err: any) {
        console.warn(`[Moldova News Ingestion] Failed to fetch feed ${feed.name}: ${err.message}`);
        return [];
      }
    },
    10 * 60 * 1000, // 10 min TTL
    [],
  );
}

/**
 * Ingest all verified Moldova news feeds, deduplicate by canonical URL / similarity, and sort by published date.
 */
export async function fetchAllVerifiedMoldovaNews(): Promise<MoldovaNewsArticle[]> {
  const results = await Promise.allSettled(VERIFIED_NEWS_FEEDS.map(fetchFeedArticles));

  const allArticles: MoldovaNewsArticle[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allArticles.push(...r.value);
    }
  }

  // Deduplicate articles by normalized URL and title similarity
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped: MoldovaNewsArticle[] = [];

  for (const article of allArticles) {
    const cleanUrl = article.url.split('?')[0].replace(/\/$/, '').toLowerCase();
    const cleanTitle = article.title.toLowerCase().replace(/[^a-z0-9ăâîșțа-яё]/gi, '').slice(0, 60);

    if (seenUrls.has(cleanUrl) || seenTitles.has(cleanTitle)) {
      continue;
    }

    seenUrls.add(cleanUrl);
    seenTitles.add(cleanTitle);
    deduped.push(article);
  }

  return deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
