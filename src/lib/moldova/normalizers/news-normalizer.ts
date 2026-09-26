/**
 * OSIRIS — Moldova News Normalizer
 * Robust XML/RSS parsing for Moldpres and official government feeds.
 */

import type { MoldovaNewsArticle } from '../types';
import { extractMoldovaLocation } from '../geocoding/moldova-gazetteer';

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(xmlChunk: string, tagName: string): string {
  const match = xmlChunk.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match) return '';
  return stripHtml(match[1]);
}

export function parseMoldpresRss(xmlText: string, language: 'ro' | 'ru' | 'en' = 'ro'): MoldovaNewsArticle[] {
  if (!xmlText || typeof xmlText !== 'string') return [];

  const articles: MoldovaNewsArticle[] = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const item of itemMatches) {
    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link') || extractTag(item, 'guid');
    const description = extractTag(item, 'description');
    const pubDateStr = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
    const category = extractTag(item, 'category') || 'Actualitate';

    if (!title) continue;

    const publishedAt = pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString();
    const location = extractMoldovaLocation(`${title} ${description}`);
    const id = `moldpres-${Buffer.from(link || title).toString('base64url').slice(0, 24)}`;

    // Generate tags based on content
    const tags: string[] = ['Moldpres', language.toUpperCase()];
    if (category) tags.push(category);
    if (location?.district) tags.push(location.district);

    articles.push({
      id,
      sourceId: `moldpres-${language}`,
      sourceName: `Moldpres News (${language.toUpperCase()})`,
      category: 'NEWS',
      agency: 'MOLDPRES',
      title,
      summary: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
      content: description,
      url: link || 'https://www.moldpres.md',
      publishedAt,
      fetchedAt: new Date().toISOString(),
      location,
      coordinates: location ? [location.lat, location.lng] : [47.0105, 28.8638],
      language,
      topic: category,
      tags,
      metadata: {
        rawCategory: category,
      },
      confidence: location ? location.confidence : 0.8,
    });
  }

  return articles;
}
