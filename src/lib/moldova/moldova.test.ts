import { describe, it, expect } from 'vitest';
import {
  extractMoldovaLocation,
  normalizeText,
  MOLDOVA_GAZETTEER,
} from './geocoding/moldova-gazetteer';
import { parseMoldpresRss, parseGenericRssFeed } from './normalizers/news-normalizer';
import { extractEntities } from './normalizers/entity-extractor';
import { classifyMoldovaText } from './events/event-classifier';
import { correlateEvents } from './events/event-correlator';
import { createMoldovaEvent } from './normalizers/events-normalizer';
import { normalizeWeatherStation, mapWeatherConditionCode } from './normalizers/weather-normalizer';
import { normalizeBorderCrossing } from './normalizers/border-normalizer';
import { normalizeAirport } from './normalizers/aviation-normalizer';
import { getSourcesHealth, getMasterSourcesRegistry } from './sources/source-registry';
import { validateUrlSafety } from './security/safe-fetch';

describe('Moldova Intelligence Layer', () => {
  describe('SSRF Protection & Security Validation', () => {
    it('allows verified Moldova intelligence domains', () => {
      expect(validateUrlSafety('https://newsmaker.md/ro/feed').safe).toBe(true);
      expect(validateUrlSafety('https://www.zdg.md/feed/').safe).toBe(true);
      expect(validateUrlSafety('https://dataset.gov.md/api/3/action/package_search').safe).toBe(true);
      expect(validateUrlSafety('https://statbank.statistica.md/pxweb/api/v1/ro/').safe).toBe(true);
      expect(validateUrlSafety('https://air-quality-api.open-meteo.com/v1/air-quality').safe).toBe(true);
      expect(validateUrlSafety('https://aviationweather.gov/api/data/metar').safe).toBe(true);
    });

    it('blocks internal, private IPs, loopback, and metadata endpoints', () => {
      expect(validateUrlSafety('http://127.0.0.1:8080/').safe).toBe(false);
      expect(validateUrlSafety('http://localhost:3000/api').safe).toBe(false);
      expect(validateUrlSafety('http://169.254.169.254/latest/meta-data').safe).toBe(false);
      expect(validateUrlSafety('http://192.168.1.1/admin').safe).toBe(false);
      expect(validateUrlSafety('http://10.0.0.5/').safe).toBe(false);
      expect(validateUrlSafety('ftp://gov.md/data').safe).toBe(false);
    });

    it('blocks unlisted unknown external domains', () => {
      expect(validateUrlSafety('https://evil-attacker.com/rss').safe).toBe(false);
    });
  });

  describe('Offline Gazetteer & Geocoding', () => {
    it('contains major municipalities, borders, and airports', () => {
      expect(MOLDOVA_GAZETTEER.length).toBeGreaterThan(30);
      const chisinau = MOLDOVA_GAZETTEER.find(g => g.nameRo === 'Chișinău');
      expect(chisinau).toBeDefined();
      expect(chisinau?.lat).toBeCloseTo(47.0105, 3);
      expect(chisinau?.lng).toBeCloseTo(28.8638, 3);
    });

    it('normalizes diacritics and Cyrillic properly', () => {
      expect(normalizeText('Chișinău și Bălți')).toBe('chisinau si balti');
      expect(normalizeText('Кишинёв и Бельцы')).toBe('кишинев и бельцы');
    });

    it('extracts location from Romanian news title', () => {
      const loc = extractMoldovaLocation('Lucrări de reparație a carosabilului pe traseul M1 spre Chișinău');
      expect(loc).toBeDefined();
      expect(loc?.nameRo).toBe('Chișinău');
      expect(loc?.confidence).toBeGreaterThan(0.8);
    });

    it('extracts location from Russian news title', () => {
      const loc = extractMoldovaLocation('В муниципии Бельцы завершился ремонт центральной площади');
      expect(loc).toBeDefined();
      expect(loc?.nameRo).toBe('Bălți');
    });

    it('extracts border crossing locations', () => {
      const loc = extractMoldovaLocation('Flux sporit de camioane la PTF Leușeni spre România');
      expect(loc).toBeDefined();
      expect(loc?.name).toBe('Leușeni-Albița');
      expect(loc?.regionType).toBe('BORDER_CROSSING');
    });
  });

  describe('Entity Extraction & Resolution', () => {
    it('extracts government institutions and infrastructure from Romanian text', () => {
      const text = 'Poliția de Frontieră și Serviciul Vamal au anunțat controale sporite la Aeroportul Internațional Chișinău.';
      const entities = extractEntities(text);
      expect(entities.length).toBeGreaterThanOrEqual(2);
      expect(entities.some(e => e.name === 'Poliția de Frontieră')).toBe(true);
      expect(entities.some(e => e.name === 'Aeroportul Internațional Chișinău (RMO / LUKK)')).toBe(true);
    });

    it('extracts entities from Russian news text', () => {
      const text = 'Правительство Молдовы и Пограничная полиция утвердили план действий на КПП Леушены.';
      const entities = extractEntities(text);
      expect(entities.some(e => e.name === 'Guvernul Republicii Moldova')).toBe(true);
      expect(entities.some(e => e.name === 'PTF Leușeni - Albița')).toBe(true);
    });
  });

  describe('Multi-Source News Normalizer', () => {
    const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0">
        <channel>
          <title>NewsMaker Moldova</title>
          <item>
            <title><![CDATA[Lucrări pe traseul Chișinău - Leușeni]]></title>
            <link>https://newsmaker.md/ro/lucrari-leuseni</link>
            <description><![CDATA[ASD a demarat reparația pe traseul M1 spre vama Leușeni.]]></description>
            <pubDate>Sat, 26 Sep 2026 10:00:00 +0300</pubDate>
            <category>Infrastructură</category>
          </item>
        </channel>
      </rss>`;

    it('parses generic RSS items with entity linking', () => {
      const articles = parseGenericRssFeed(sampleXml, {
        sourceId: 'newsmaker-ro',
        sourceName: 'NewsMaker (RO)',
        agency: 'NewsMaker',
        defaultLanguage: 'ro',
      });
      expect(articles.length).toBe(1);
      expect(articles[0].title).toBe('Lucrări pe traseul Chișinău - Leușeni');
      expect(articles[0].agency).toBe('NewsMaker');
      expect(articles[0].location?.nameRo).toBe('Chișinău');
      expect(articles[0].entities?.length).toBeGreaterThan(0);
    });
  });

  describe('Event Classifier & Correlator', () => {
    it('classifies critical incidents properly', () => {
      const res = classifyMoldovaText('Accident grav cu victime pe traseul M2');
      expect(res.isIncident).toBe(true);
      expect(res.severity).toBe('CRITICAL');
      expect(res.category).toBe('TRAFFIC_INCIDENT');
    });

    it('classifies weather alerts and warnings', () => {
      const res = classifyMoldovaText('Polei și viscol pe drumurile naționale din nord');
      expect(res.isIncident).toBe(true);
      expect(res.severity).toBe('HIGH');
      expect(res.category).toBe('WEATHER_ALERT');
    });

    it('correlates proximate events into composite incidents', () => {
      const ev1 = createMoldovaEvent({
        id: 'ev-1',
        sourceId: 'src-1',
        sourceName: 'ASD',
        category: 'TRAFFIC_INCIDENT',
        title: 'Accident rutier M1 km 15',
        summary: 'Trafic blocat',
        url: 'https://asd.md',
        severity: 'HIGH',
        coordinates: [47.050, 28.700],
        startTime: new Date().toISOString(),
      });

      const ev2 = createMoldovaEvent({
        id: 'ev-2',
        sourceId: 'src-2',
        sourceName: 'Politia',
        category: 'TRAFFIC_INCIDENT',
        title: 'Carambol pe traseul M1',
        summary: 'Echipaje la fata locului',
        url: 'https://politia.md',
        severity: 'CRITICAL',
        coordinates: [47.052, 28.702],
        startTime: new Date().toISOString(),
      });

      const correlated = correlateEvents([ev1, ev2]);
      expect(correlated.length).toBe(1);
      expect(correlated[0].correlatedRecordIds.length).toBe(2);
      expect(correlated[0].severity).toBe('CRITICAL');
    });
  });

  describe('Weather & Domain Normalizers', () => {
    it('maps WMO condition codes accurately', () => {
      expect(mapWeatherConditionCode(0)).toBe('Clear sky');
      expect(mapWeatherConditionCode(61)).toContain('Rain');
      expect(mapWeatherConditionCode(95)).toContain('Thunderstorm');
    });

    it('normalizes weather stations', () => {
      const st = normalizeWeatherStation({
        id: 'test-st',
        name: 'Stația Chișinău',
        district: 'Chișinău',
        lat: 47.01,
        lng: 28.86,
        current: {
          temperature_2m: 18.4,
          apparent_temperature: 17.8,
          relative_humidity_2m: 55,
          wind_speed_10m: 12.3,
          surface_pressure: 1015.2,
          weather_code: 1,
        },
      });

      expect(st.tempC).toBe(18.4);
      expect(st.feelsLikeC).toBe(17.8);
      expect(st.pressureHpa).toBe(1015);
      expect(st.condition).toBe('Mainly clear');
    });

    it('normalizes border crossing schema', () => {
      const ptf = normalizeBorderCrossing({
        id: 'ptf-test',
        name: 'Leușeni',
        counterpartName: 'Albița',
        lat: 46.829,
        lng: 28.163,
        waitTimeCarsMinutes: 20,
      });

      expect(ptf.name).toBe('Leușeni');
      expect(ptf.isOpen24h).toBe(true);
      expect(ptf.waitTimeCarsMinutes).toBe(20);
    });

    it('normalizes airports', () => {
      const ap = normalizeAirport({
        icao: 'LUKK',
        iata: 'RMO',
        name: 'Aeroportul Internațional Chișinău',
        lat: 47.027,
        lng: 28.931,
      });

      expect(ap.iata).toBe('RMO');
      expect(ap.status).toBe('OPEN');
    });
  });

  describe('Master Source Registry', () => {
    it('contains verified sources with full metadata schema', () => {
      const masterRegistry = getMasterSourcesRegistry();
      expect(masterRegistry.length).toBeGreaterThanOrEqual(10);
      for (const item of masterRegistry) {
        expect(item.sourceId).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.status).toBe('VERIFIED');
        expect(item.attribution).toBeDefined();
        expect(item.updateFrequency).toBeDefined();
      }
    });

    it('tracks active health across all domains', () => {
      const health = getSourcesHealth();
      expect(health.length).toBeGreaterThanOrEqual(10);
      expect(health.some(h => h.id === 'date-gov-md-ckan')).toBe(true);
      expect(health.some(h => h.id === 'open-meteo-weather')).toBe(true);
    });
  });
});
