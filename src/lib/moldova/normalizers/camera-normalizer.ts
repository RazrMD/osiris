/**
 * OSIRIS — Moldova Camera Normalizer
 */

import type { MoldovaCamera } from '../types';

export function normalizeCamera(raw: Partial<MoldovaCamera> & { id: string; name: string; lat: number; lng: number }): MoldovaCamera {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || `Surveillance point: ${raw.name}`,
    category: raw.category || 'TRAFFIC',
    region: raw.region || 'Republic of Moldova',
    road: raw.road,
    lat: raw.lat,
    lng: raw.lng,
    streamUrl: raw.streamUrl,
    snapshotUrl: raw.snapshotUrl || `/api/cctv/proxy?url=${encodeURIComponent(raw.streamUrl || '')}`,
    direction: raw.direction || 'N/A',
    operator: raw.operator || 'ASD',
    status: raw.status || 'ONLINE',
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
  };
}
