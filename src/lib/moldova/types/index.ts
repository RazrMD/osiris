/**
 * OSIRIS — Moldova Data Intelligence Layer Types
 * Extensible Geospatial OSINT data models for Republic of Moldova.
 */

export type MoldovaCategory =
  | 'NEWS'
  | 'OFFICIAL_DISPATCH'
  | 'TRAFFIC_INCIDENT'
  | 'ROAD_CLOSURE'
  | 'BORDER_STATUS'
  | 'WEATHER_ALERT'
  | 'SEISMIC'
  | 'AVIATION'
  | 'EMERGENCY'
  | 'INFRASTRUCTURE'
  | 'GIS_FEATURE';

export type EventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  alt?: number;
  accuracyMeters?: number;
}

export interface GeocodedLocation {
  name: string;
  nameRo: string;
  nameRu?: string;
  nameEn?: string;
  district?: string; // Raion / Municipiul
  regionType: 'MUNICIPALITY' | 'DISTRICT' | 'CITY' | 'VILLAGE' | 'BORDER_CROSSING' | 'AIRPORT' | 'HIGHWAY_JUNCTION';
  lat: number;
  lng: number;
  confidence: number; // 0.0 - 1.0
  source: 'GAZETTEER' | 'REGEX_MATCH' | 'GEOCODER' | 'COORDINATES';
}

export interface SourceHealth {
  id: string;
  name: string;
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'INITIALIZING';
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  consecutiveFailures: number;
  latencyMs: number;
  itemCount: number;
  error?: string;
}

export interface NormalizedRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  category: MoldovaCategory;
  title: string;
  summary: string;
  content?: string;
  url: string;
  publishedAt: string; // ISO 8601
  fetchedAt: string;   // ISO 8601
  location?: GeocodedLocation;
  coordinates?: [number, number]; // [lat, lng]
  language: 'ro' | 'ru' | 'en' | 'mixed';
  tags: string[];
  metadata: Record<string, unknown>;
  confidence: number;
}

export interface MoldovaNewsArticle extends NormalizedRecord {
  category: 'NEWS' | 'OFFICIAL_DISPATCH';
  agency: 'MOLDPRES' | 'GOV_MD' | 'POLICE_MD' | 'CUSTOMS_MD' | 'ASD_MD' | 'INFP_RO' | 'OTHER';
  topic: string;
  author?: string;
  thumbnailUrl?: string;
}

export interface MoldovaEvent extends NormalizedRecord {
  category: 'TRAFFIC_INCIDENT' | 'ROAD_CLOSURE' | 'BORDER_STATUS' | 'WEATHER_ALERT' | 'SEISMIC' | 'EMERGENCY' | 'INFRASTRUCTURE';
  severity: EventSeverity;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING' | 'MONITORING';
  correlatedRecordIds: string[];
  startTime: string;
  endTime?: string;
  impactRadiusKm?: number;
}

export interface MoldovaCamera {
  id: string;
  name: string;
  description?: string;
  category: 'TRAFFIC' | 'HIGHWAY' | 'BORDER' | 'MUNICIPAL' | 'WEATHER';
  region: string; // Chișinău, Bălți, M1, M2, R1, Sculeni, etc.
  road?: string; // M1, M2, M3, M5, R1, R6
  lat: number;
  lng: number;
  streamUrl?: string;
  snapshotUrl: string;
  direction?: string;
  operator: 'ASD' | 'POLITIA' | 'CUSTOMS' | 'MUNICIPALITY' | 'PUBLIC';
  status: 'ONLINE' | 'INTERMITTENT' | 'OFFLINE';
  lastUpdated: string;
}

export interface MoldovaWeatherStation {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windGustKmh?: number;
  pressureHpa: number;
  condition: string;
  conditionCode: number;
  precipitationMm: number;
  uvIndex?: number;
  visibilityKm?: number;
  updatedAt: string;
}

export interface MoldovaEarthquake {
  id: string;
  magnitude: number;
  depthKm: number;
  epicenter: string;
  distanceFromChisinauKm: number;
  lat: number;
  lng: number;
  time: string;
  intensityMercalli?: string;
  alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  source: 'INFP_RO' | 'USGS' | 'EMSC';
}

export interface MoldovaBorderCrossing {
  id: string;
  name: string;
  counterpartName: string; // e.g., Albița for Leușeni
  neighborCountry: 'RO' | 'UA';
  type: 'ROAD' | 'RAIL' | 'RIVER' | 'AIR';
  lat: number;
  lng: number;
  status: 'NORMAL' | 'BUSY' | 'CONGESTED' | 'RESTRICTED' | 'CLOSED';
  waitTimeCarsMinutes: number;
  waitTimeTrucksMinutes: number;
  waitTimeBusesMinutes: number;
  isOpen24h: boolean;
  pedestrianAllowed: boolean;
  liveCameraId?: string;
  updatedAt: string;
}

export interface MoldovaAirport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  elevationFt: number;
  type: 'INTERNATIONAL' | 'DOMESTIC' | 'MILITARY' | 'AIRSTRIP';
  status: 'OPEN' | 'LIMITED' | 'CLOSED';
  runways: Array<{ ident: string; lengthMeters: number; surface: string }>;
  activeFlightsCount: number;
  notamCount: number;
  updatedAt: string;
}

export interface MoldovaGisFeature {
  id: string;
  name: string;
  category: 'ADMIN_BOUNDARY' | 'ROAD_NETWORK' | 'ENERGY_GRID' | 'WATERWAY' | 'BRIDGE' | 'GOVERNMENT_FACILITY' | 'PROTECTED_AREA';
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
  properties: Record<string, unknown>;
}

export interface MoldovaOverview {
  summary: {
    totalEventsActive: number;
    criticalAlertsCount: number;
    trafficCamerasOnline: number;
    trafficCamerasTotal: number;
    borderCrossingsOpen: number;
    borderCrossingsTotal: number;
    activeWeatherAlerts: number;
    recentEarthquakesCount: number;
    lastUpdated: string;
  };
  news: MoldovaNewsArticle[];
  events: MoldovaEvent[];
  cameras: MoldovaCamera[];
  weatherStations: MoldovaWeatherStation[];
  earthquakes: MoldovaEarthquake[];
  borderCrossings: MoldovaBorderCrossing[];
  airports: MoldovaAirport[];
  sourcesHealth: SourceHealth[];
}
