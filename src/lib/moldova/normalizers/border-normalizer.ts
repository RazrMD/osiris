/**
 * OSIRIS — Moldova Border Normalizer
 */

import type { MoldovaBorderCrossing } from '../types';

export function normalizeBorderCrossing(data: Partial<MoldovaBorderCrossing> & { id: string; name: string; lat: number; lng: number }): MoldovaBorderCrossing {
  return {
    id: data.id,
    name: data.name,
    counterpartName: data.counterpartName || '',
    neighborCountry: data.neighborCountry || 'RO',
    type: data.type || 'ROAD',
    lat: data.lat,
    lng: data.lng,
    status: data.status || 'NORMAL',
    waitTimeCarsMinutes: data.waitTimeCarsMinutes ?? 10,
    waitTimeTrucksMinutes: data.waitTimeTrucksMinutes ?? 35,
    waitTimeBusesMinutes: data.waitTimeBusesMinutes ?? 15,
    isOpen24h: data.isOpen24h ?? true,
    pedestrianAllowed: data.pedestrianAllowed ?? false,
    liveCameraId: data.liveCameraId,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
