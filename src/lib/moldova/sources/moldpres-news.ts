/**
 * OSIRIS — Moldpres & Multi-Source News Bridge
 */

import { fetchAllVerifiedMoldovaNews, fetchFeedArticles, VERIFIED_NEWS_FEEDS } from './news-sources';
import type { MoldovaNewsArticle } from '../types';

export async function fetchMoldpresNews(language: 'ro' | 'ru' | 'en' = 'ro'): Promise<MoldovaNewsArticle[]> {
  const targetId = `moldpres-${language}`;
  const feed = VERIFIED_NEWS_FEEDS.find(f => f.id === targetId) || VERIFIED_NEWS_FEEDS[0];
  return fetchFeedArticles(feed);
}

export async function fetchAllMoldovaNews(): Promise<MoldovaNewsArticle[]> {
  return fetchAllVerifiedMoldovaNews();
}
