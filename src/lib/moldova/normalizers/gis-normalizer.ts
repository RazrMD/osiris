/**
 * OSIRIS — Moldova GIS Normalizer
 */

import type { MoldovaGisFeature } from '../types';

export function normalizeGisFeature(raw: {
  id: string;
  name: string;
  category: 'ADMIN_BOUNDARY' | 'ROAD_NETWORK' | 'ENERGY_GRID' | 'WATERWAY' | 'BRIDGE' | 'GOVERNMENT_FACILITY' | 'PROTECTED_AREA';
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
  properties?: Record<string, unknown>;
}): MoldovaGisFeature {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    type: raw.type,
    coordinates: raw.coordinates,
    properties: raw.properties || {},
  };
}
