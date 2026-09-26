/**
 * OSIRIS — Moldova Critical Infrastructure & GIS Features Source Adapter
 * Energy nodes, hydro dams, high-voltage substations, river bridges, ports, and state facilities.
 */

import { MOLDOVA_CONFIG } from '../config';
import { normalizeGisFeature } from '../normalizers/gis-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaGisFeature } from '../types';

const INFRASTRUCTURE_FEATURES: Array<Parameters<typeof normalizeGisFeature>[0]> = [
  // ── Energy Generation & High-Voltage Grids ──
  {
    id: 'infra-energy-mgres',
    name: 'Centrala Termoelectrică de la Cuciurgan (MGRES / Dnestrovsc)',
    category: 'ENERGY_GRID',
    type: 'Point',
    coordinates: [29.8083, 46.6319],
    properties: {
      type: 'THERMAL_POWER_PLANT',
      capacityMw: 2520,
      fuel: 'Natural Gas / Coal / Heavy Oil',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-energy-cet2',
    name: 'CET-2 Chișinău (Termoelectrica Sursa 1)',
    category: 'ENERGY_GRID',
    type: 'Point',
    coordinates: [28.9133, 46.9856],
    properties: {
      type: 'CHP_PLANT',
      capacityMw: 240,
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-energy-costesti',
    name: 'Centrala Hidroelectrică Costești-Stânca',
    category: 'ENERGY_GRID',
    type: 'Point',
    coordinates: [27.2186, 47.8286],
    properties: {
      type: 'HYDROELECTRIC_DAM',
      river: 'Prut',
      capacityMw: 32,
      strategicLevel: 'HIGH',
    },
  },
  {
    id: 'infra-energy-dubasari',
    name: 'Centrala Hidroelectrică Dubăsari',
    category: 'ENERGY_GRID',
    type: 'Point',
    coordinates: [29.1333, 47.2833],
    properties: {
      type: 'HYDROELECTRIC_DAM',
      river: 'Nistru',
      capacityMw: 48,
      strategicLevel: 'HIGH',
    },
  },
  {
    id: 'infra-energy-vulcanesti-substation',
    name: 'Stația Electrică Vulcănești 400/110 kV (Interconexiune Isaccea-Vulcănești)',
    category: 'ENERGY_GRID',
    type: 'Point',
    coordinates: [28.3847, 45.6983],
    properties: {
      type: 'SUBSTATION_400KV',
      interconnection: 'Romania - Moldova (Isaccea - Vulcănești)',
      strategicLevel: 'CRITICAL',
    },
  },

  // ── River Bridges (Prut & Nistru) ──
  {
    id: 'infra-bridge-eiffel-ungheni',
    name: 'Podul Feroviar Eiffel peste Prut (Ungheni)',
    category: 'BRIDGE',
    type: 'Point',
    coordinates: [27.7872, 47.2014],
    properties: {
      type: 'RAIL_BRIDGE',
      river: 'Prut',
      designer: 'Gustave Eiffel (1877)',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-bridge-leuseni',
    name: 'Podul Rutier Leușeni - Albița peste Prut',
    category: 'BRIDGE',
    type: 'Point',
    coordinates: [28.1611, 46.8289],
    properties: {
      type: 'ROAD_BRIDGE',
      corridor: 'M1 / E581',
      river: 'Prut',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-bridge-sculeni',
    name: 'Podul Rutier Sculeni peste Prut',
    category: 'BRIDGE',
    type: 'Point',
    coordinates: [27.6047, 47.3319],
    properties: {
      type: 'ROAD_BRIDGE',
      corridor: 'R1 / DN24',
      river: 'Prut',
      strategicLevel: 'HIGH',
    },
  },
  {
    id: 'infra-bridge-giurgiulesti',
    name: 'Podul Rutier & Feroviar Giurgiulești - Galați',
    category: 'BRIDGE',
    type: 'Point',
    coordinates: [28.2019, 45.4736],
    properties: {
      type: 'MULTIMODAL_BRIDGE',
      corridor: 'M3 / DN2B',
      river: 'Prut',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-bridge-gura-bicului',
    name: 'Podul Rutier Gura Bîcului - Bîcioc peste Nistru',
    category: 'BRIDGE',
    type: 'Point',
    coordinates: [29.4639, 46.9242],
    properties: {
      type: 'ROAD_BRIDGE',
      corridor: 'M14 / M21',
      river: 'Nistru',
      strategicLevel: 'HIGH',
    },
  },

  // ── Maritime & River Ports ──
  {
    id: 'infra-port-giurgiulesti',
    name: 'Portul Internațional Liber Giurgiulești (PILG)',
    category: 'WATERWAY',
    type: 'Point',
    coordinates: [28.2047, 45.4744],
    properties: {
      type: 'INTERNATIONAL_FREE_PORT',
      waterway: 'Dunăre / Prut / Marea Neagră',
      access: 'Maritime & River vessels (draught up to 7m)',
      strategicLevel: 'CRITICAL',
    },
  },

  // ── Government & Cyber Defense Facilities ──
  {
    id: 'infra-gov-chisinau-pman',
    name: 'Casa Guvernului Republicii Moldova',
    category: 'GOVERNMENT_FACILITY',
    type: 'Point',
    coordinates: [28.8328, 47.0245],
    properties: {
      type: 'GOVERNMENT_HQ',
      city: 'Chișinău',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-gov-presidency',
    name: 'Clădirea Președinției Republicii Moldova',
    category: 'GOVERNMENT_FACILITY',
    type: 'Point',
    coordinates: [28.8286, 47.0289],
    properties: {
      type: 'PRESIDENTIAL_PALACE',
      city: 'Chișinău',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-gov-parliament',
    name: 'Parlamentul Republicii Moldova',
    category: 'GOVERNMENT_FACILITY',
    type: 'Point',
    coordinates: [28.8272, 47.0278],
    properties: {
      type: 'LEGISLATIVE_HQ',
      city: 'Chișinău',
      strategicLevel: 'CRITICAL',
    },
  },
  {
    id: 'infra-gov-stisc',
    name: 'STISC — Serviciul Tehnologia Informației și Securitate Cibernetică',
    category: 'GOVERNMENT_FACILITY',
    type: 'Point',
    coordinates: [28.8417, 47.0194],
    properties: {
      type: 'CYBER_DEFENSE_CERT_GOV',
      city: 'Chișinău',
      strategicLevel: 'CRITICAL',
    },
  },
];

export async function fetchMoldovaInfrastructure(): Promise<MoldovaGisFeature[]> {
  const cacheKey = 'moldova:gis:infrastructure';

  return fetchWithMoldovaCache<MoldovaGisFeature[]>(
    cacheKey,
    async () => {
      return INFRASTRUCTURE_FEATURES.map(normalizeGisFeature);
    },
    MOLDOVA_CONFIG.cacheTtl.gis,
    INFRASTRUCTURE_FEATURES.map(normalizeGisFeature),
  );
}
