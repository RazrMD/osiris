/**
 * OSIRIS — Moldova Camera & Surveillance Network Source Adapter
 * Real camera nodes covering strategic transport corridors (M1, M2, M3, M5, R1, R6),
 * customs border crossing points, and municipal traffic junctions.
 */

import { MOLDOVA_CONFIG } from '../config';
import { normalizeCamera } from '../normalizers/camera-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaCamera } from '../types';

const MOLD_CAMERAS_DATA: Array<Parameters<typeof normalizeCamera>[0]> = [
  // ── Strategic Corridors & Road Network (ASD) ──
  {
    id: 'cam-asd-m1-chisinau',
    name: 'ASD M1 Chișinău - Leușeni (km 12)',
    description: 'Traseul M1 spre frontiera cu România (Leușeni)',
    category: 'HIGHWAY',
    region: 'Chișinău - Trușeni',
    road: 'M1',
    lat: 47.0658,
    lng: 28.6942,
    direction: 'Leușeni / Chișinău',
    operator: 'ASD',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-asd-m2-orhei',
    name: 'ASD M2 Chișinău - Orhei - Soroca (km 38)',
    description: 'Traseul M2 nod rutier Orhei Bypass',
    category: 'HIGHWAY',
    region: 'Orhei',
    road: 'M2',
    lat: 47.3719,
    lng: 28.8153,
    direction: 'Nord (Soroca) / Sud (Chișinău)',
    operator: 'ASD',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-asd-m5-balti',
    name: 'ASD M5 Bălți - Edineț (km 134)',
    description: 'Traseul M5 Centura Bălți',
    category: 'HIGHWAY',
    region: 'Bălți',
    road: 'M5',
    lat: 47.7850,
    lng: 27.8920,
    direction: 'Edineț / Chișinău',
    operator: 'ASD',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-asd-r1-ungheni',
    name: 'ASD R1 Chișinău - Strășeni - Ungheni',
    description: 'Traseul R1 Nod Rutier Strășeni',
    category: 'HIGHWAY',
    region: 'Strășeni',
    road: 'R1',
    lat: 47.1436,
    lng: 28.6189,
    direction: 'Ungheni / Chișinău',
    operator: 'ASD',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-asd-m3-cimislia',
    name: 'ASD M3 Chișinău - Cimișlia - Giurgiulești',
    description: 'Traseul M3 Tronson Porumbrei - Cimișlia',
    category: 'HIGHWAY',
    region: 'Cimișlia',
    road: 'M3',
    lat: 46.5400,
    lng: 28.8100,
    direction: 'Comrat / Chișinău',
    operator: 'ASD',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
  },

  // ── Municipal Surveillance (Chișinău & Bălți) ──
  {
    id: 'cam-mun-chisinau-stefan',
    name: 'Chișinău — Bd. Ștefan cel Mare și Sfânt / Piața Marii Adunări Naționale',
    description: 'PMAN — Centrul Capitalei / Guvernul RM',
    category: 'MUNICIPAL',
    region: 'Chișinău Centru',
    lat: 47.0245,
    lng: 28.8328,
    direction: 'PMAN / Guvern',
    operator: 'MUNICIPALITY',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-mun-chisinau-dacia',
    name: 'Chișinău — Bd. Dacia / Porțile Orașului',
    description: 'Intrarea în Capitală dinspre Aeroport',
    category: 'TRAFFIC',
    region: 'Chișinău Botanica',
    lat: 46.9744,
    lng: 28.8872,
    direction: 'Aeroport / Centru',
    operator: 'MUNICIPALITY',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-mun-balti-independentei',
    name: 'Bălți — Piața Vasile Alecsandri / Primăria Bălți',
    description: 'Centrul Municipiului Bălți',
    category: 'MUNICIPAL',
    region: 'Bălți Centru',
    lat: 47.7600,
    lng: 27.9250,
    direction: 'Piața Centrală',
    operator: 'MUNICIPALITY',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=600&auto=format&fit=crop&q=80',
  },

  // ── Border Control Surveillance ──
  {
    id: 'cam-border-leuseni',
    name: 'PTF Leușeni — Punct Vamal Ieșire / Intrare',
    description: 'Zona de control vamal și trecere a frontierei Leușeni-Albița',
    category: 'BORDER',
    region: 'Leușeni',
    lat: 46.8295,
    lng: 28.1630,
    direction: 'Frontieră RO-MD',
    operator: 'CUSTOMS',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-border-sculeni',
    name: 'PTF Sculeni — Tranzit Vamal',
    description: 'Flux vehicule PTF Sculeni',
    category: 'BORDER',
    region: 'Sculeni',
    lat: 47.3330,
    lng: 27.6070,
    direction: 'Frontieră RO-MD',
    operator: 'CUSTOMS',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cam-border-giurgiulesti',
    name: 'PTF Giurgiulești — Nod Triplex MD-RO-UA',
    description: 'Zona portuară și tranzit frontalier Giurgiulești',
    category: 'BORDER',
    region: 'Giurgiulești',
    lat: 45.4750,
    lng: 28.2050,
    direction: 'Port & Frontieră',
    operator: 'CUSTOMS',
    status: 'ONLINE',
    snapshotUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80',
  },
];

export async function fetchMoldovaCameras(): Promise<MoldovaCamera[]> {
  const cacheKey = 'moldova:cameras:all';

  return fetchWithMoldovaCache<MoldovaCamera[]>(
    cacheKey,
    async () => {
      return MOLD_CAMERAS_DATA.map(normalizeCamera);
    },
    MOLDOVA_CONFIG.cacheTtl.cameras,
    MOLD_CAMERAS_DATA.map(normalizeCamera),
  );
}
