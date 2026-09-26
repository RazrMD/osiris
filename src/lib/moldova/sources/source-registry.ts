/**
 * OSIRIS — Moldova Data Sources Registry & Orchestrator
 * Coordinates all source adapters, maintains telemetry & health statuses,
 * and builds unified overview and events datasets.
 */

import { fetchAllMoldovaNews } from './moldpres-news';
import { fetchMoldovaWeather } from './moldova-weather';
import { fetchMoldovaEarthquakes } from './moldova-quakes';
import { fetchMoldovaBorderCrossings } from './moldova-borders';
import { fetchMoldovaAirports } from './moldova-aviation';
import { fetchMoldovaCameras } from './moldova-cams';
import { fetchMoldovaInfrastructure } from './moldova-infrastructure';
import { classifyMoldovaText } from '../events/event-classifier';
import { createMoldovaEvent } from '../normalizers/events-normalizer';
import { correlateEvents } from '../events/event-correlator';
import type { SourceHealth, MoldovaOverview, MoldovaEvent } from '../types';

// In-memory health tracker
const sourceHealthMap = new Map<string, SourceHealth>([
  ['moldpres-news', { id: 'moldpres-news', name: 'Moldpres State News Feed (RO/RU/EN)', endpoint: 'https://www.moldpres.md/config/rss.php', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['open-meteo-md', { id: 'open-meteo-md', name: 'Moldova Meteorological Stations', endpoint: 'https://api.open-meteo.com/v1/forecast', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['usgs-infp-quakes', { id: 'usgs-infp-quakes', name: 'Vrancea & Moldova Seismic Network', endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['border-customs-md', { id: 'border-customs-md', name: 'Poliția de Frontieră & Vama RM', endpoint: 'internal://customs-borders-md', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['aviation-caa-md', { id: 'aviation-caa-md', name: 'Moldova Civil Aviation Authority Hubs', endpoint: 'internal://caa-airports-md', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['asd-cams-md', { id: 'asd-cams-md', name: 'ASD & Municipal Surveillance Network', endpoint: 'internal://asd-cctv-md', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
  ['gis-infrastructure-md', { id: 'gis-infrastructure-md', name: 'Critical Infrastructure & Strategic GIS', endpoint: 'internal://gis-infrastructure-md', status: 'HEALTHY', lastSuccessAt: null, lastAttemptAt: null, consecutiveFailures: 0, latencyMs: 0, itemCount: 0 }],
]);

function updateHealth(id: string, success: boolean, latencyMs: number, count: number, error?: string): void {
  const existing = sourceHealthMap.get(id);
  if (!existing) return;

  const now = new Date().toISOString();
  if (success) {
    existing.status = 'HEALTHY';
    existing.lastSuccessAt = now;
    existing.lastAttemptAt = now;
    existing.consecutiveFailures = 0;
    existing.latencyMs = latencyMs;
    existing.itemCount = count;
    existing.error = undefined;
  } else {
    existing.consecutiveFailures++;
    existing.status = existing.consecutiveFailures >= 3 ? 'UNAVAILABLE' : 'DEGRADED';
    existing.lastAttemptAt = now;
    existing.latencyMs = latencyMs;
    existing.error = error;
  }
}

export function getSourcesHealth(): SourceHealth[] {
  return Array.from(sourceHealthMap.values());
}

/**
 * Derives dynamic events from raw data across all sources
 */
export async function getMoldovaOverviewData(): Promise<MoldovaOverview> {
  const t0 = Date.now();

  // Execute all sources in parallel
  const [
    newsRes,
    weatherRes,
    quakesRes,
    bordersRes,
    airportsRes,
    camsRes,
  ] = await Promise.allSettled([
    (async () => {
      const start = Date.now();
      try {
        const news = await fetchAllMoldovaNews();
        updateHealth('moldpres-news', true, Date.now() - start, news.length);
        return news;
      } catch (err: any) {
        updateHealth('moldpres-news', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
    (async () => {
      const start = Date.now();
      try {
        const w = await fetchMoldovaWeather();
        updateHealth('open-meteo-md', true, Date.now() - start, w.length);
        return w;
      } catch (err: any) {
        updateHealth('open-meteo-md', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
    (async () => {
      const start = Date.now();
      try {
        const q = await fetchMoldovaEarthquakes();
        updateHealth('usgs-infp-quakes', true, Date.now() - start, q.length);
        return q;
      } catch (err: any) {
        updateHealth('usgs-infp-quakes', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
    (async () => {
      const start = Date.now();
      try {
        const b = await fetchMoldovaBorderCrossings();
        updateHealth('border-customs-md', true, Date.now() - start, b.length);
        return b;
      } catch (err: any) {
        updateHealth('border-customs-md', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
    (async () => {
      const start = Date.now();
      try {
        const a = await fetchMoldovaAirports();
        updateHealth('aviation-caa-md', true, Date.now() - start, a.length);
        return a;
      } catch (err: any) {
        updateHealth('aviation-caa-md', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
    (async () => {
      const start = Date.now();
      try {
        const c = await fetchMoldovaCameras();
        updateHealth('asd-cams-md', true, Date.now() - start, c.length);
        return c;
      } catch (err: any) {
        updateHealth('asd-cams-md', false, Date.now() - start, 0, err.message);
        return [];
      }
    })(),
  ]);

  const news = newsRes.status === 'fulfilled' ? newsRes.value : [];
  const weatherStations = weatherRes.status === 'fulfilled' ? weatherRes.value : [];
  const earthquakes = quakesRes.status === 'fulfilled' ? quakesRes.value : [];
  const borderCrossings = bordersRes.status === 'fulfilled' ? bordersRes.value : [];
  const airports = airportsRes.status === 'fulfilled' ? airportsRes.value : [];
  const cameras = camsRes.status === 'fulfilled' ? camsRes.value : [];

  // Extract events from news items
  const extractedEvents: MoldovaEvent[] = [];

  for (const article of news) {
    const classification = classifyMoldovaText(`${article.title} ${article.summary}`);
    if (classification.isIncident) {
      extractedEvents.push(
        createMoldovaEvent({
          id: `ev-${article.id}`,
          sourceId: article.sourceId,
          sourceName: article.sourceName,
          category: classification.category as any,
          severity: classification.severity,
          title: article.title,
          summary: article.summary,
          url: article.url,
          location: article.location,
          coordinates: article.coordinates,
          language: article.language,
          tags: [...article.tags, ...classification.tags],
          startTime: article.publishedAt,
        })
      );
    }
  }

  // Create events from severe earthquakes (magnitude >= 3.5)
  for (const q of earthquakes) {
    if (q.magnitude >= 3.5) {
      extractedEvents.push(
        createMoldovaEvent({
          id: `ev-quake-${q.id}`,
          sourceId: 'usgs-infp-quakes',
          sourceName: 'Seismic Monitoring Vrancea/MD',
          category: 'SEISMIC',
          severity: q.magnitude >= 5.0 ? 'CRITICAL' : q.magnitude >= 4.0 ? 'HIGH' : 'MEDIUM',
          title: `Seismic Event M${q.magnitude} - ${q.epicenter}`,
          summary: `Seismic activity registered at depth ${q.depthKm} km, distance ${q.distanceFromChisinauKm} km from Chișinău.`,
          url: 'https://earthquake.usgs.gov/',
          coordinates: [q.lat, q.lng],
          startTime: q.time,
          tags: ['SEISMIC', 'EARTHQUAKE', `M${q.magnitude}`],
        })
      );
    }
  }

  // Correlate extracted events
  const correlatedEvents = correlateEvents(extractedEvents);

  const totalEventsActive = correlatedEvents.length;
  const criticalAlertsCount = correlatedEvents.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const trafficCamerasOnline = cameras.filter(c => c.status === 'ONLINE').length;
  const borderCrossingsOpen = borderCrossings.filter(b => b.status === 'NORMAL' || b.status === 'BUSY').length;
  const activeWeatherAlerts = weatherStations.filter(w => [95, 96, 99, 71, 73, 75].includes(w.conditionCode)).length;

  return {
    summary: {
      totalEventsActive,
      criticalAlertsCount,
      trafficCamerasOnline,
      trafficCamerasTotal: cameras.length,
      borderCrossingsOpen,
      borderCrossingsTotal: borderCrossings.length,
      activeWeatherAlerts,
      recentEarthquakesCount: earthquakes.length,
      lastUpdated: new Date().toISOString(),
    },
    news,
    events: correlatedEvents,
    cameras,
    weatherStations,
    earthquakes,
    borderCrossings,
    airports,
    sourcesHealth: getSourcesHealth(),
  };
}
