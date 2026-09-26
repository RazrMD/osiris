import { describe, it, expect } from 'vitest';
import {
  extractMoldovaLocation,
  normalizeText,
  MOLDOVA_GAZETTEER,
} from './geocoding/moldova-gazetteer';
import { parseMoldpresRss } from './normalizers/news-normalizer';
import { classifyMoldovaText } from './events/event-classifier';
import { correlateEvents } from './events/event-correlator';
import { createMoldovaEvent } from './normalizers/events-normalizer';
import { normalizeWeatherStation, mapWeatherConditionCode } from './normalizers/weather-normalizer';
import { normalizeBorderCrossing } from './normalizers/border-normalizer';
import { normalizeAirport } from './normalizers/aviation-normalizer';
import { getSourcesHealth } from './sources/source-registry';

describe('Moldova Intelligence Layer', () => {
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

  describe('Moldpres RSS Normalizer', () => {
    const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0">
        <channel>
          <title>MOLDPRES News</title>
          <item>
            <title><![CDATA[Premierul a vizitat noul pod de la Ungheni]]></title>
            <link>https://www.moldpres.md/news/2026/09/26/26001234</link>
            <description><![CDATA[Prim-ministrul a inspectat infrastructura transfrontalieră la Ungheni.]]></description>
            <pubDate>Sat, 26 Sep 2026 10:00:00 +0300</pubDate>
            <category>Social</category>
          </item>
          <item>
            <title>Avertizare meteo de ploi torențiale în centrul țării</title>
            <link>https://www.moldpres.md/news/2026/09/26/26001235</link>
            <description>Serviciul Hidrometeorologic de Stat a emis cod galben de ploi la Chișinău.</description>
            <pubDate>Sat, 26 Sep 2026 11:30:00 +0300</pubDate>
            <category>Meteo</category>
          </item>
        </channel>
      </rss>`;

    it('parses XML items cleanly without HTML or CDATA tags', () => {
      const articles = parseMoldpresRss(sampleXml, 'ro');
      expect(articles.length).toBe(2);
      expect(articles[0].title).toBe('Premierul a vizitat noul pod de la Ungheni');
      expect(articles[0].location?.nameRo).toBe('Ungheni');
      expect(articles[1].title).toBe('Avertizare meteo de ploi torențiale în centrul țării');
      expect(articles[1].location?.nameRo).toBe('Chișinău');
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
        coordinates: [47.052, 28.702], // ~250m away
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
        iata: 'KIV',
        name: 'Chișinău International Airport',
        lat: 47.027,
        lng: 28.931,
      });

      expect(ap.iata).toBe('KIV');
      expect(ap.status).toBe('OPEN');
    });
  });

  describe('Source Registry & Telemetry', () => {
    it('returns healthy status items for all configured sources', () => {
      const health = getSourcesHealth();
      expect(health.length).toBeGreaterThanOrEqual(6);
      expect(health.some(h => h.id === 'moldpres-news')).toBe(true);
      expect(health.some(h => h.id === 'open-meteo-md')).toBe(true);
      expect(health.some(h => h.id === 'usgs-infp-quakes')).toBe(true);
    });
  });
});
