/**
 * OSIRIS — Moldova Event Classifier
 * Identifies incidents, road blocks, emergencies, weather alerts from unstructured news and notices.
 */

import type { EventSeverity, MoldovaCategory } from '../types';

interface ClassificationResult {
  category: MoldovaCategory;
  severity: EventSeverity;
  tags: string[];
  isIncident: boolean;
}

const KEYWORDS_CRITICAL = [
  'accident grav', 'decedat', 'victime', 'incendiu masiv', 'explozie', 'evacuare',
  'stare de urgenta', 'alerta rosie', 'cutremur puternic', 'inundatie grava',
  'тяжелое дтп', 'погибшие', 'масштабный пожар', 'взрыв', 'чрезвычайная ситуация',
];

const KEYWORDS_HIGH = [
  'accident', 'carambol', 'drum blocat', 'traseu blocat', 'polei', 'viscol',
  'alerta portocalie', 'sistare energie', 'avarie majora', 'granita aglomerata',
  'дтп', 'перекрыта трасса', 'гололед', 'штормовое предупреждение', 'авария',
];

const KEYWORDS_MEDIUM = [
  'lucrari drum', 'ambuteiaj', 'trafic ingreunat', 'ceata', 'ploaie torentiala',
  'alerta galbena', 'reparatii pod', 'control vamal',
  'дорожные работы', 'пробка', 'туман', 'ливень', 'желтый код',
];

export function classifyMoldovaText(text: string): ClassificationResult {
  if (!text) {
    return { category: 'NEWS', severity: 'INFO', tags: [], isIncident: false };
  }

  const lower = text.toLowerCase();
  const tags: string[] = [];

  // Check critical keywords
  for (const kw of KEYWORDS_CRITICAL) {
    if (lower.includes(kw)) {
      tags.push(kw);
      return {
        category: lower.includes('incendiu') || lower.includes('пожар') ? 'EMERGENCY' :
                  lower.includes('cutremur') ? 'SEISMIC' :
                  lower.includes('inundatie') ? 'WEATHER_ALERT' : 'TRAFFIC_INCIDENT',
        severity: 'CRITICAL',
        tags,
        isIncident: true,
      };
    }
  }

  // Check high severity keywords
  for (const kw of KEYWORDS_HIGH) {
    if (lower.includes(kw)) {
      tags.push(kw);
      return {
        category: lower.includes('viscol') || lower.includes('polei') || lower.includes('штормовое') ? 'WEATHER_ALERT' :
                  lower.includes('drum blocat') || lower.includes('traseu blocat') || lower.includes('перекрыта трасса') ? 'ROAD_CLOSURE' :
                  lower.includes('granita') || lower.includes('vama') ? 'BORDER_STATUS' : 'TRAFFIC_INCIDENT',
        severity: 'HIGH',
        tags,
        isIncident: true,
      };
    }
  }

  // Check medium severity keywords
  for (const kw of KEYWORDS_MEDIUM) {
    if (lower.includes(kw)) {
      tags.push(kw);
      return {
        category: lower.includes('lucrari') || lower.includes('дорожные работы') ? 'ROAD_CLOSURE' :
                  lower.includes('ceata') || lower.includes('туман') ? 'WEATHER_ALERT' : 'TRAFFIC_INCIDENT',
        severity: 'MEDIUM',
        tags,
        isIncident: true,
      };
    }
  }

  return {
    category: 'NEWS',
    severity: 'INFO',
    tags,
    isIncident: false,
  };
}
