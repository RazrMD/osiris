/**
 * OSIRIS — Moldova News Normalizer
 * Robust XML/RSS/Atom parsing with entity extraction, gazetteer geolocating, and multilingual canonicalization.
 */

import type { MoldovaNewsArticle } from '../types';
import { extractMoldovaLocation } from '../geocoding/moldova-gazetteer';
import { extractEntities } from './entity-extractor';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&icirc;/gi, 'î')
    .replace(/&acirc;/gi, 'â')
    .replace(/&Icirc;/gi, 'Î')
    .replace(/&Acirc;/gi, 'Â')
    .replace(/&bdquo;/gi, '„')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

export function stripHtml(html: string): string {
  if (!html) return '';
  const clean = html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeHtmlEntities(clean);
}

function extractTag(xmlChunk: string, tagName: string): string {
  const match = xmlChunk.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match) return '';
  return stripHtml(match[1]);
}

function extractMediaUrl(xmlChunk: string): string | undefined {
  const mediaMatch = xmlChunk.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1]?.startsWith('http')) return mediaMatch[1];

  const enclosureMatch = xmlChunk.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch && enclosureMatch[1]?.startsWith('http')) return enclosureMatch[1];

  const imgMatch = xmlChunk.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]?.startsWith('http')) return imgMatch[1];

  return undefined;
}

export interface ParseFeedOptions {
  sourceId: string;
  sourceName: string;
  agency: string;
  defaultLanguage?: 'ro' | 'ru' | 'en' | 'uk';
  defaultCategory?: string;
}

export function parseGenericRssFeed(xmlText: string, options: ParseFeedOptions): MoldovaNewsArticle[] {
  if (!xmlText || typeof xmlText !== 'string') return [];

  const articles: MoldovaNewsArticle[] = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  for (const item of itemMatches) {
    const title = extractTag(item, 'title');
    let link = extractTag(item, 'link') || extractTag(item, 'guid');
    
    // Atom feeds link tag fallback: <link href="..." />
    if (!link) {
      const atomLink = item.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (atomLink) link = atomLink[1];
    }

    const description = extractTag(item, 'description') || extractTag(item, 'summary') || extractTag(item, 'content');
    const pubDateStr = extractTag(item, 'pubDate') || extractTag(item, 'dc:date') || extractTag(item, 'published') || extractTag(item, 'updated');
    const category = extractTag(item, 'category') || options.defaultCategory || 'Actualitate';
    const author = extractTag(item, 'author') || extractTag(item, 'dc:creator');
    const thumbnailUrl = extractMediaUrl(item);

    if (!title || !link) continue;

    // Detect language if not explicitly specified
    let language: 'ro' | 'ru' | 'en' | 'uk' = options.defaultLanguage || 'ro';
    if (!options.defaultLanguage) {
      const hasCyrillic = /[а-яА-ЯёЁіІїЇєЄ]/.test(`${title} ${description}`);
      if (hasCyrillic) {
        const hasUkrainian = /[іїєІЇЄ]/.test(`${title} ${description}`);
        language = hasUkrainian ? 'uk' : 'ru';
      } else {
        language = 'ro';
      }
    }

    let publishedAt = new Date().toISOString();
    if (pubDateStr) {
      const parsedDate = new Date(pubDateStr);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    const fullText = `${title}. ${description}`;
    const location = extractMoldovaLocation(fullText);
    const entities = extractEntities(fullText);
    const id = `${options.sourceId}-${Buffer.from(link).toString('base64url').slice(0, 24)}`;

    // Tags
    const tags: string[] = [options.agency, language.toUpperCase()];
    if (category && category !== 'Actualitate') tags.push(category);
    if (location?.district) tags.push(location.district);
    for (const ent of entities.slice(0, 3)) {
      tags.push(ent.name);
    }

    articles.push({
      id,
      sourceId: options.sourceId,
      sourceName: options.sourceName,
      category: 'NEWS',
      agency: options.agency,
      title,
      summary: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
      content: description,
      url: link,
      publishedAt,
      fetchedAt: new Date().toISOString(),
      location,
      coordinates: location ? [location.lat, location.lng] : [47.0105, 28.8638],
      language,
      topic: category,
      author: author || undefined,
      tags: Array.from(new Set(tags)),
      entities,
      thumbnailUrl,
      metadata: {
        rawCategory: category,
        originalGuid: link,
      },
      confidence: location ? location.confidence : 0.85,
    });
  }

  return articles;
}

export function parseMoldpresRss(xmlText: string, language: 'ro' | 'ru' | 'en' = 'ro'): MoldovaNewsArticle[] {
  return parseGenericRssFeed(xmlText, {
    sourceId: `moldpres-${language}`,
    sourceName: `Moldpres News (${language.toUpperCase()})`,
    agency: 'MOLDPRES',
    defaultLanguage: language,
    defaultCategory: 'Oficial',
  });
}
