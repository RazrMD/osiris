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
  | 'GIS_FEATURE'
  | 'DATASET'
  | 'STATISTIC'
  | 'ENVIRONMENT'
  | 'TELEGRAM';

export type EventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type SourceVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNAVAILABLE'
  | 'REQUIRES_AUTH'
  | 'BLOCKED'
  | 'NOT_SUITABLE';

export type SourceReliability =
  | 'OFFICIAL'
  | 'PUBLIC_INSTITUTION'
  | 'ESTABLISHED_MEDIA'
  | 'COMMUNITY'
  | 'UNKNOWN';

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

export interface SourceRegistryItem {
  sourceId: string;
  name: string;
  organization: string;
  country: string; // MD, RO, US, EU
  category: 'news' | 'government' | 'gis' | 'cameras' | 'weather' | 'aviation' | 'transport' | 'emergency' | 'statistics' | 'environment' | 'infrastructure' | 'telegram';
  type: 'RSS' | 'ATOM' | 'CKAN' | 'PXWEB' | 'REST_JSON' | 'GEOJSON' | 'WMS' | 'WFS' | 'PUBLIC_FEED';
  officialUrl: string;
  dataUrl?: string;
  apiUrl?: string;
  feedUrl?: string;
  format: 'JSON' | 'XML' | 'RSS' | 'GEOJSON' | 'HTML' | 'CSV' | 'PX';
  authentication: 'NONE' | 'API_KEY' | 'OAUTH' | 'TOKEN';
  license: string;
  attribution: string;
  updateFrequency: string; // e.g. "Every 5 mins", "Hourly", "Daily"
  coverage: string; // "National (MD)", "Transnistria", "Chișinău", etc.
  lastVerified: string;
  status: SourceVerificationStatus;
  reliability: SourceReliability;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  recordsFetched?: number;
  latencyMs?: number;
  notes?: string;
}

export interface SourceHealth {
  id: string;
  name: string;
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'INITIALIZING';
  verificationStatus: SourceVerificationStatus;
  reliability: SourceReliability;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  consecutiveFailures: number;
  latencyMs: number;
  itemCount: number;
  error?: string;
}

export interface ExtractedEntity {
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'ROAD' | 'AIRPORT' | 'BORDER_POINT' | 'GOVERNMENT_INSTITUTION' | 'EVENT';
  name: string;
  mentions: number;
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
  language: 'ro' | 'ru' | 'en' | 'uk' | 'mixed';
  tags: string[];
  entities?: ExtractedEntity[];
  metadata: Record<string, unknown>;
  confidence: number;
}

export interface MoldovaNewsArticle extends NormalizedRecord {
  category: 'NEWS' | 'OFFICIAL_DISPATCH';
  agency: string;
  topic: string;
  author?: string;
  thumbnailUrl?: string;
  canonicalId?: string;
  languageVariants?: Array<{ language: string; url: string; title: string }>;
}

export interface MoldovaEvent extends NormalizedRecord {
  category: 'TRAFFIC_INCIDENT' | 'ROAD_CLOSURE' | 'BORDER_STATUS' | 'WEATHER_ALERT' | 'SEISMIC' | 'EMERGENCY' | 'INFRASTRUCTURE';
  severity: EventSeverity;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING' | 'MONITORING';
  correlatedRecordIds: string[];
  evidence?: string[];
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
  isVerified: boolean;
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

export interface MoldovaAirQuality {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  europeanAqi: number; // 1-5 (Good to Extremely Poor)
  aqiLabel: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Extremely Poor';
  pm2_5: number;       // μg/m³
  pm10: number;        // μg/m³
  no2: number;         // μg/m³
  o3: number;          // μg/m³
  so2: number;         // μg/m³
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
  metarRaw?: string;
  metarDecoded?: {
    tempC?: number;
    dewpointC?: number;
    windSpeedKt?: number;
    windDirDeg?: number;
    visibilityMeters?: number;
    flightRules?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    altimeterHpa?: number;
  };
  tafRaw?: string;
  activeFlightsCount: number;
  notamCount: number;
  updatedAt: string;
}

export interface MoldovaDataset {
  id: string;
  name: string;
  title: string;
  description: string;
  organization: string;
  category: 'GIS' | 'Transport' | 'Infrastructure' | 'Population' | 'Economy' | 'Health' | 'Education' | 'Environment' | 'Energy' | 'Public administration' | 'Statistics' | 'Other';
  formats: string[];
  resourcesCount: number;
  metadataModified: string;
  isGeospatial: boolean;
  isTimeSeries: boolean;
  isEventData: boolean;
  isUsefulForMap: boolean;
  isUsefulForIntelligence: boolean;
  tags: string[];
  url: string;
  resources: Array<{ id: string; name: string; format: string; url: string }>;
}

export interface MoldovaStatisticItem {
  id: string;
  category: string;
  topic: string;
  title: string;
  value: number | string;
  unit: string;
  period: string;
  region: string;
  source: string;
  url: string;
  updatedAt: string;
}

export interface MoldovaTelegramChannel {
  id: string;
  handle: string;
  title: string;
  category: 'GOVERNMENT' | 'POLICE' | 'EMERGENCY' | 'NEWS' | 'TRAFFIC' | 'WEATHER' | 'REGIONAL';
  language: 'ro' | 'ru' | 'mixed';
  url: string;
  isOfficial: boolean;
  status: 'VERIFIED_ACTIVE' | 'PUBLIC';
  lastSeen: string;
  description: string;
}

export interface MoldovaGisFeature {
  id: string;
  name: string;
  category: 'ADMIN_BOUNDARY' | 'ROAD_NETWORK' | 'ENERGY_GRID' | 'WATERWAY' | 'BRIDGE' | 'GOVERNMENT_FACILITY' | 'PROTECTED_AREA' | 'HOSPITAL' | 'POLICE' | 'FIRE_STATION' | 'BORDER_CROSSING' | 'AIRPORT';
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
    totalDatasetsCount: number;
    totalSourcesVerified: number;
    lastUpdated: string;
  };
  news: MoldovaNewsArticle[];
  events: MoldovaEvent[];
  cameras: MoldovaCamera[];
  weatherStations: MoldovaWeatherStation[];
  airQuality: MoldovaAirQuality[];
  earthquakes: MoldovaEarthquake[];
  borderCrossings: MoldovaBorderCrossing[];
  airports: MoldovaAirport[];
  datasets: MoldovaDataset[];
  statistics: MoldovaStatisticItem[];
  telegramChannels: MoldovaTelegramChannel[];
  sourcesHealth: SourceHealth[];
}
