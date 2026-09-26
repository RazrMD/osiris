/**
 * OSIRIS — Moldova Spatiotemporal Event Correlator
 * Groups related events, alerts, and reports occurring in geographical and temporal proximity.
 */

import type { MoldovaEvent } from '../types';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function correlateEvents(events: MoldovaEvent[], maxDistKm: number = 3.0, maxTimeDiffMs: number = 2 * 60 * 60 * 1000): MoldovaEvent[] {
  if (events.length <= 1) return events;

  const correlated: MoldovaEvent[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    const primary = events[i];
    if (processed.has(primary.id)) continue;

    const group: MoldovaEvent[] = [primary];
    processed.add(primary.id);

    const primaryTime = new Date(primary.publishedAt).getTime();
    const primaryCoords = primary.coordinates || [primary.location?.lat ?? 0, primary.location?.lng ?? 0];

    for (let j = i + 1; j < events.length; j++) {
      const candidate = events[j];
      if (processed.has(candidate.id)) continue;

      const candTime = new Date(candidate.publishedAt).getTime();
      const timeDiff = Math.abs(primaryTime - candTime);

      if (timeDiff > maxTimeDiffMs) continue;

      const candCoords = candidate.coordinates || [candidate.location?.lat ?? 0, candidate.location?.lng ?? 0];
      const dist = calculateDistanceKm(primaryCoords[0], primaryCoords[1], candCoords[0], candCoords[1]);

      if (dist <= maxDistKm || (primary.location?.name && primary.location?.name === candidate.location?.name)) {
        group.push(candidate);
        processed.add(candidate.id);
      }
    }

    if (group.length === 1) {
      correlated.push(primary);
    } else {
      // Create correlated composite event
      const correlatedIds = group.map(g => g.id);
      const compositeSeverity = group.some(g => g.severity === 'CRITICAL') ? 'CRITICAL' :
                                group.some(g => g.severity === 'HIGH') ? 'HIGH' :
                                group.some(g => g.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW';

      correlated.push({
        ...primary,
        id: `corr-${primary.id}`,
        title: `${primary.title} (+${group.length - 1} related reports)`,
        severity: compositeSeverity,
        correlatedRecordIds: correlatedIds,
        confidence: Math.min(0.99, primary.confidence + 0.05 * (group.length - 1)),
        metadata: {
          ...primary.metadata,
          correlatedCount: group.length,
          subEvents: group.map(g => ({ id: g.id, title: g.title, source: g.sourceName, time: g.publishedAt })),
        },
      });
    }
  }

  return correlated;
}
