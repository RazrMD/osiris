/**
 * OSIRIS — Moldova Events Normalizer & Classifier
 */

import type { MoldovaEvent, EventSeverity, GeocodedLocation } from '../types';

export function createMoldovaEvent(params: {
  id: string;
  sourceId: string;
  sourceName: string;
  category: 'TRAFFIC_INCIDENT' | 'ROAD_CLOSURE' | 'BORDER_STATUS' | 'WEATHER_ALERT' | 'SEISMIC' | 'EMERGENCY' | 'INFRASTRUCTURE';
  title: string;
  summary: string;
  url: string;
  severity: EventSeverity;
  status?: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING' | 'MONITORING';
  location?: GeocodedLocation;
  coordinates?: [number, number];
  language?: 'ro' | 'ru' | 'en' | 'mixed';
  tags?: string[];
  impactRadiusKm?: number;
  metadata?: Record<string, unknown>;
  startTime?: string;
}): MoldovaEvent {
  const now = new Date().toISOString();
  return {
    id: params.id,
    sourceId: params.sourceId,
    sourceName: params.sourceName,
    category: params.category,
    severity: params.severity,
    status: params.status || 'ACTIVE',
    title: params.title,
    summary: params.summary,
    url: params.url,
    publishedAt: params.startTime || now,
    fetchedAt: now,
    startTime: params.startTime || now,
    location: params.location,
    coordinates: params.coordinates || (params.location ? [params.location.lat, params.location.lng] : [47.0105, 28.8638]),
    language: params.language || 'ro',
    tags: params.tags || [params.category],
    confidence: params.location ? params.location.confidence : 0.85,
    impactRadiusKm: params.impactRadiusKm || 1.0,
    correlatedRecordIds: [],
    metadata: params.metadata || {},
  };
}
