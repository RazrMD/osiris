/**
 * OSIRIS — Moldova & Vrancea Seismic Monitoring Source Adapter
 * Live earthquake monitoring covering Moldova and the seismic Vrancea zone.
 */

import { MOLDOVA_CONFIG } from '../config';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaEarthquake } from '../types';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function fetchMoldovaEarthquakes(): Promise<MoldovaEarthquake[]> {
  const cacheKey = 'moldova:seismic:earthquakes';

  return fetchWithMoldovaCache<MoldovaEarthquake[]>(
    cacheKey,
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(MOLDOVA_CONFIG.endpoints.infpEarthquakes, {
          signal: controller.signal,
          headers: { 'User-Agent': 'OSIRIS-Geospatial-Intelligence/2.0' },
        });

        if (!res.ok) {
          throw new Error(`Earthquake feed returned HTTP ${res.status}`);
        }

        const json = await res.json();
        const features = json.features || [];
        const chisinauLat = 47.0105;
        const chisinauLng = 28.8638;

        const quakes: MoldovaEarthquake[] = features.map((f: any) => {
          const mag = f.properties.mag || 0;
          const coords = f.geometry.coordinates || [0, 0, 0];
          const lng = coords[0];
          const lat = coords[1];
          const depthKm = Math.round(coords[2] || 10);
          const dist = calculateDistanceKm(chisinauLat, chisinauLng, lat, lng);

          const alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' =
            mag >= 6.0 ? 'RED' :
            mag >= 5.0 ? 'ORANGE' :
            mag >= 4.0 ? 'YELLOW' : 'GREEN';

          return {
            id: f.id || `eq-${f.properties.time}`,
            magnitude: Math.round(mag * 10) / 10,
            depthKm,
            epicenter: f.properties.place || 'Zona Vrancea / Moldova',
            distanceFromChisinauKm: dist,
            lat,
            lng,
            time: new Date(f.properties.time).toISOString(),
            alertLevel,
            source: 'USGS',
          };
        });

        return quakes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      } finally {
        clearTimeout(timeoutId);
      }
    },
    MOLDOVA_CONFIG.cacheTtl.earthquakes,
    [],
  );
}
