/**
 * OSIRIS — Moldova Aviation Source Adapter
 * Airport intelligence, runways, and aviation infrastructure for Republic of Moldova.
 */

import { MOLDOVA_CONFIG } from '../config';
import { normalizeAirport } from '../normalizers/aviation-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaAirport } from '../types';

const AIRPORTS_DATA: Array<Parameters<typeof normalizeAirport>[0]> = [
  {
    icao: 'LUKK',
    iata: 'KIV',
    name: 'Chișinău International Airport',
    city: 'Chișinău',
    lat: 47.0272,
    lng: 28.9314,
    elevationFt: 390,
    type: 'INTERNATIONAL',
    status: 'OPEN',
    runways: [
      { ident: '08/26', lengthMeters: 3590, surface: 'CONCRETE' },
      { ident: '09/27', lengthMeters: 2500, surface: 'ASPHALT' },
    ],
    activeFlightsCount: 14,
    notamCount: 2,
  },
  {
    icao: 'LUBL',
    iata: 'BZY',
    name: 'Bălți-Leadoveni International Airport',
    city: 'Bălți',
    lat: 47.8383,
    lng: 27.7811,
    elevationFt: 758,
    type: 'INTERNATIONAL',
    status: 'LIMITED',
    runways: [
      { ident: '15/33', lengthMeters: 2240, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 0,
    notamCount: 1,
  },
  {
    icao: 'LUKM',
    iata: 'MLD',
    name: 'Mărculești International Airport',
    city: 'Florești / Mărculești',
    lat: 47.8636,
    lng: 28.2133,
    elevationFt: 331,
    type: 'DOMESTIC',
    status: 'OPEN',
    runways: [
      { ident: '07/25', lengthMeters: 2512, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 1,
    notamCount: 0,
  },
  {
    icao: 'LUTR',
    iata: 'NONE',
    name: 'Tiraspol Air Base / Airfield',
    city: 'Tiraspol',
    lat: 46.8700,
    lng: 29.5900,
    elevationFt: 141,
    type: 'MILITARY',
    status: 'LIMITED',
    runways: [
      { ident: '11/29', lengthMeters: 2500, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 0,
    notamCount: 0,
  },
];

export async function fetchMoldovaAirports(): Promise<MoldovaAirport[]> {
  const cacheKey = 'moldova:aviation:airports';

  return fetchWithMoldovaCache<MoldovaAirport[]>(
    cacheKey,
    async () => {
      return AIRPORTS_DATA.map(normalizeAirport);
    },
    MOLDOVA_CONFIG.cacheTtl.airports,
    AIRPORTS_DATA.map(normalizeAirport),
  );
}
