/**
 * OSIRIS — Moldova Aviation Normalizer
 */

import type { MoldovaAirport } from '../types';

export function normalizeAirport(data: Partial<MoldovaAirport> & { icao: string; iata: string; name: string; lat: number; lng: number }): MoldovaAirport {
  return {
    icao: data.icao,
    iata: data.iata,
    name: data.name,
    city: data.city || 'Chișinău',
    lat: data.lat,
    lng: data.lng,
    elevationFt: data.elevationFt || 390,
    type: data.type || 'INTERNATIONAL',
    status: data.status || 'OPEN',
    runways: data.runways || [],
    activeFlightsCount: data.activeFlightsCount ?? 0,
    notamCount: data.notamCount ?? 0,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
