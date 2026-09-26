/**
 * OSIRIS — Moldova Aviation Source Adapter
 * Airport intelligence, runways, and live METAR/TAF observations from NOAA Aviation Weather Center.
 */

import { safeFetchJson } from '../security/safe-fetch';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaAirport } from '../types';

export interface NoaaMetarItem {
  icaoId: string;
  rawOb?: string;
  reportTime?: string;
  temp?: number;
  dewp?: number;
  wdir?: number | string;
  wspd?: number;
  visib?: number | string;
  altim?: number;
  fltcat?: string;
}

export interface NoaaTafItem {
  icaoId: string;
  rawTAF?: string;
  bulletinTime?: string;
}

const STATIC_AIRPORTS = [
  {
    icao: 'LUKK',
    iata: 'RMO',
    name: 'Aeroportul Internațional Chișinău (RMO / KIV)',
    city: 'Chișinău',
    lat: 47.0272,
    lng: 28.9314,
    elevationFt: 390,
    type: 'INTERNATIONAL' as const,
    status: 'OPEN' as const,
    runways: [
      { ident: '08/26', lengthMeters: 3590, surface: 'CONCRETE' },
      { ident: '09/27', lengthMeters: 2500, surface: 'ASPHALT' },
    ],
    activeFlightsCount: 8,
    notamCount: 1,
  },
  {
    icao: 'LUBL',
    iata: 'BZY',
    name: 'Aeroportul Internațional Bălți-Leadoveni',
    city: 'Bălți',
    lat: 47.8383,
    lng: 27.7811,
    elevationFt: 758,
    type: 'INTERNATIONAL' as const,
    status: 'LIMITED' as const,
    runways: [
      { ident: '15/33', lengthMeters: 2240, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 0,
    notamCount: 1,
  },
  {
    icao: 'LUBM',
    iata: 'MLD',
    name: 'Aeroportul Internațional Liber Mărculești',
    city: 'Florești / Mărculești',
    lat: 47.8636,
    lng: 28.2133,
    elevationFt: 331,
    type: 'DOMESTIC' as const,
    status: 'OPEN' as const,
    runways: [
      { ident: '07/25', lengthMeters: 2512, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 1,
    notamCount: 0,
  },
  {
    icao: 'LUVL',
    iata: 'NONE',
    name: 'Aerodromul Sportiv Vadul lui Vodă',
    city: 'Vadul lui Vodă',
    lat: 47.0872,
    lng: 29.0792,
    elevationFt: 180,
    type: 'AIRSTRIP' as const,
    status: 'OPEN' as const,
    runways: [
      { ident: '12/30', lengthMeters: 800, surface: 'GRASS' },
    ],
    activeFlightsCount: 2,
    notamCount: 0,
  },
  {
    icao: 'LUTR',
    iata: 'NONE',
    name: 'Aerodromul Tiraspol',
    city: 'Tiraspol',
    lat: 46.8700,
    lng: 29.5900,
    elevationFt: 141,
    type: 'MILITARY' as const,
    status: 'LIMITED' as const,
    runways: [
      { ident: '11/29', lengthMeters: 2500, surface: 'CONCRETE' },
    ],
    activeFlightsCount: 0,
    notamCount: 0,
  },
];

export async function fetchMoldovaAirports(): Promise<MoldovaAirport[]> {
  const cacheKey = 'moldova:aviation:airports:v2';

  return fetchWithMoldovaCache<MoldovaAirport[]>(
    cacheKey,
    async () => {
      let metars: Record<string, NoaaMetarItem> = {};
      let tafs: Record<string, string> = {};

      try {
        const metarUrl = 'https://aviationweather.gov/api/data/metar?ids=LUKK,LUBL,LUBM&format=json';
        const rawMetar = await safeFetchJson<NoaaMetarItem[]>(metarUrl, { timeoutMs: 6000 });
        if (Array.isArray(rawMetar)) {
          for (const m of rawMetar) {
            if (m.icaoId) metars[m.icaoId] = m;
          }
        }
      } catch (err: any) {
        console.warn(`[Aviation METAR Ingestion] ${err.message}`);
      }

      try {
        const tafUrl = 'https://aviationweather.gov/api/data/taf?ids=LUKK&format=json';
        const rawTaf = await safeFetchJson<NoaaTafItem[]>(tafUrl, { timeoutMs: 6000 });
        if (Array.isArray(rawTaf)) {
          for (const t of rawTaf) {
            if (t.icaoId && t.rawTAF) tafs[t.icaoId] = t.rawTAF;
          }
        }
      } catch (err: any) {
        console.warn(`[Aviation TAF Ingestion] ${err.message}`);
      }

      return STATIC_AIRPORTS.map((apt) => {
        const metar = metars[apt.icao];
        const taf = tafs[apt.icao];

        return {
          icao: apt.icao,
          iata: apt.iata,
          name: apt.name,
          city: apt.city,
          lat: apt.lat,
          lng: apt.lng,
          elevationFt: apt.elevationFt,
          type: apt.type,
          status: apt.status,
          runways: apt.runways,
          metarRaw: metar?.rawOb,
          metarDecoded: metar ? {
            tempC: metar.temp,
            dewpointC: metar.dewp,
            windSpeedKt: metar.wspd,
            windDirDeg: typeof metar.wdir === 'number' ? metar.wdir : undefined,
            flightRules: (metar.fltcat as any) || 'VFR',
            altimeterHpa: metar.altim,
          } : undefined,
          tafRaw: taf,
          activeFlightsCount: apt.activeFlightsCount,
          notamCount: apt.notamCount,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    5 * 60 * 1000, // 5 min TTL
    STATIC_AIRPORTS.map(a => ({ ...a, updatedAt: new Date().toISOString() })),
  );
}
