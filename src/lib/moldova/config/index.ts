/**
 * OSIRIS — Moldova Intelligence Layer Configuration
 */

export const MOLDOVA_CONFIG = {
  enabled: process.env.MOLDOVA_DATA_ENABLED !== 'false',
  
  // Geopolitical Bounding Box for Republic of Moldova (including Transnistria region)
  bounds: {
    minLat: 45.45,
    maxLat: 48.50,
    minLng: 26.60,
    maxLng: 30.20,
    centerLat: 47.0105,
    centerLng: 28.8638,
    defaultZoom: 8,
  },

  // Extended Seismic Zone for Vrancea / SE Europe impacting Moldova
  seismicBounds: {
    minLat: 45.0,
    maxLat: 49.0,
    minLng: 26.0,
    maxLng: 31.0,
  },

  // Cache TTLs in milliseconds
  cacheTtl: {
    news: 10 * 60 * 1000,          // 10 mins
    events: 5 * 60 * 1000,         // 5 mins
    cameras: 15 * 60 * 1000,       // 15 mins
    weather: 15 * 60 * 1000,       // 15 mins
    earthquakes: 5 * 60 * 1000,    // 5 mins
    borders: 5 * 60 * 1000,        // 5 mins
    airports: 5 * 60 * 1000,       // 5 mins
    gis: 60 * 60 * 1000,           // 1 hour
    health: 60 * 1000,             // 1 minute
  },

  // Feed Endpoints (100% Real Live Verified Sources)
  endpoints: {
    moldpres: {
      ro: 'https://www.moldpres.md/config/rss.php?lang=rom',
      ru: 'https://www.moldpres.md/config/rss.php?lang=rus',
      en: 'https://www.moldpres.md/config/rss.php?lang=eng',
      synthesisRo: 'https://www.moldpres.md/config/rssSinteza.php?lang=rom',
    },
    infpEarthquakes: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=45.0&maxlatitude=49.0&minlongitude=26.0&maxlongitude=31.0&limit=30',
    openMeteo: 'https://api.open-meteo.com/v1/forecast',
  },

  // Confidence thresholds for text entity linking and geocoding
  confidence: {
    exactMatch: 0.95,
    aliasMatch: 0.85,
    districtMatch: 0.70,
    fuzzyThreshold: 0.60,
  },
};
