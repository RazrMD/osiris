/**
 * OSIRIS — Moldova Open Data & Dataset Discovery Engine
 * Automated discovery and classification of official open datasets from dataset.gov.md (CKAN).
 */

import { safeFetchJson } from '../security/safe-fetch';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaDataset } from '../types';

export interface CkanPackageSearchResponse {
  help: string;
  success: boolean;
  result: {
    count: number;
    results: Array<{
      id: string;
      name: string;
      title: string;
      notes?: string;
      organization?: {
        id: string;
        name: string;
        title: string;
        description?: string;
      };
      metadata_modified?: string;
      tags?: Array<{ id: string; name: string; display_name?: string }>;
      resources?: Array<{
        id: string;
        name: string;
        description?: string;
        format: string;
        url: string;
        created?: string;
        last_modified?: string;
      }>;
    }>;
  };
}

function classifyDataset(title: string, notes: string, org: string, tags: string[]): MoldovaDataset['category'] {
  const text = `${title} ${notes} ${org} ${tags.join(' ')}`.toLowerCase();

  if (/geospatial|gis|hart[aă]|coordonat|teren|cadastr|topograf|geodez|satelit/i.test(text)) return 'GIS';
  if (/transport|drum|rutier|auto|feroviar|tren|trafic|vehicul|naviga/i.test(text)) return 'Transport';
  if (/energie|electric|gaz|ap[aă]|canalizar|re[tț]ea|infrastructur|termic/i.test(text)) return 'Energy';
  if (/mediu|aer|poluare|p[aă]dur|rezerva[tț]ie|hidro|climat|de[sș]e/i.test(text)) return 'Environment';
  if (/popula[tț]i|demograf|n[aă]scu|deceda|recens[aă]m|migra/i.test(text)) return 'Population';
  if (/econom|buget|finan[tț]|fiscal|vam|venit|cheltuiel|banc|investi/i.test(text)) return 'Economy';
  if (/s[aă]n[aă]tat|medical|spital|medicament|covid|pacient|boal/i.test(text)) return 'Health';
  if (/educa[tț]i|școal|universita|student|elev|profesor|înv[aă][tț]/i.test(text)) return 'Education';
  if (/statistic|indicator|bns|recens/i.test(text)) return 'Statistics';
  if (/administra|minister|prim[aă]ri|decizi|regulament|guvern|parlament/i.test(text)) return 'Public administration';
  if (/construc[tț]|edifici|locuin[tț]|urbanism|arhitect/i.test(text)) return 'Infrastructure';

  return 'Other';
}

function isGeospatialDataset(formats: string[], text: string): boolean {
  const geoFormats = ['geojson', 'kml', 'kmz', 'shp', 'shapefile', 'gml', 'geotiff', 'wms', 'wfs'];
  const hasGeoFormat = formats.some(f => geoFormats.includes(f.toLowerCase()));
  const hasGeoWords = /gis|harta|coordonate|spatial|geoloc|cadastru|topografie/i.test(text);
  return hasGeoFormat || hasGeoWords;
}

function isTimeSeriesDataset(formats: string[], text: string): boolean {
  return /lunar|anual|trimestrial|zilnic|serie|dinamica|evolutie|perioad|2024|2025|2026/i.test(text);
}

function isEventDataset(text: string): boolean {
  return /incident|accident|urgenta|eveniment|alerte|infractiun|controale|chemari/i.test(text);
}

/**
 * Discover and fetch official datasets from dataset.gov.md
 */
export async function discoverMoldovaDatasets(limit = 40): Promise<{ count: number; datasets: MoldovaDataset[] }> {
  const cacheKey = 'moldova:datasets:discovery:master:v2';
  const rowsToFetch = Math.min(Math.max(limit, 40), 50);
  const url = `https://dataset.gov.md/api/3/action/package_search?rows=${rowsToFetch}&sort=metadata_modified+desc`;

  const cachedResult = await fetchWithMoldovaCache<{ count: number; datasets: MoldovaDataset[] }>(
    cacheKey,
    async () => {
      try {
        const data = await safeFetchJson<CkanPackageSearchResponse>(url, {
          timeoutMs: 20000,
          maxSizeBytes: 15 * 1024 * 1024, // 15MB allowance for large CKAN responses
        });
        if (!data.success || !data.result) {
          throw new Error('CKAN package search returned unsuccessful response');
        }

        const rawResults = data.result.results || [];
        const datasets: MoldovaDataset[] = rawResults.map((pkg) => {
          const title = pkg.title || pkg.name;
          const notes = pkg.notes || '';
          const org = pkg.organization?.title || pkg.organization?.name || 'Guvernul Republicii Moldova';
          const tags = (pkg.tags || []).map(t => t.display_name || t.name);
          const resources = (pkg.resources || []).map(r => ({
            id: r.id,
            name: r.name || r.format || 'Resource',
            format: r.format ? r.format.toUpperCase() : 'UNKNOWN',
            url: r.url,
          }));
          const formats = Array.from(new Set(resources.map(r => r.format)));
          const combinedText = `${title} ${notes} ${org} ${tags.join(' ')}`;

          const category = classifyDataset(title, notes, org, tags);
          const isGeospatial = isGeospatialDataset(formats, combinedText);
          const isTimeSeries = isTimeSeriesDataset(formats, combinedText);
          const isEventData = isEventDataset(combinedText);
          const isUsefulForMap = isGeospatial || category === 'Transport' || category === 'Infrastructure' || category === 'Environment';
          const isUsefulForIntelligence = true;

          return {
            id: pkg.id,
            name: pkg.name,
            title,
            description: notes.slice(0, 300) + (notes.length > 300 ? '...' : ''),
            organization: org,
            category,
            formats,
            resourcesCount: resources.length,
            metadataModified: pkg.metadata_modified || new Date().toISOString(),
            isGeospatial,
            isTimeSeries,
            isEventData,
            isUsefulForMap,
            isUsefulForIntelligence,
            tags,
            url: `https://dataset.gov.md/ro/dataset/${pkg.name}`,
            resources,
          };
        });

        return {
          count: data.result.count,
          datasets,
        };
      } catch (err: any) {
        console.warn(`[Dataset Discovery] Failed to fetch from dataset.gov.md: ${err.message}`);
        return { count: 0, datasets: [] };
      }
    },
    30 * 60 * 1000, // 30 min cache TTL
    { count: 0, datasets: [] },
  );

  return {
    count: cachedResult.count,
    datasets: cachedResult.datasets.slice(0, limit),
  };
}
