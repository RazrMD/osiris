/**
 * OSIRIS — Moldova Entity Extractor & Resolution
 * Extracts real persons, institutions, locations, and infrastructure from Romanian and Russian texts.
 */

import type { ExtractedEntity } from '../types';
import { normalizeText } from '../geocoding/moldova-gazetteer';

interface KnownEntity {
  name: string;
  type: ExtractedEntity['type'];
  aliases: string[];
}

const KNOWN_ENTITIES: KnownEntity[] = [
  // Government Institutions
  { name: 'Guvernul Republicii Moldova', type: 'GOVERNMENT_INSTITUTION', aliases: ['guvernul republicii moldova', 'guvernul r moldova', 'guvernul md', 'guvernul', 'правительство молдовы', 'правительство рм'] },
  { name: 'Președinția Republicii Moldova', type: 'GOVERNMENT_INSTITUTION', aliases: ['presedintia', 'presedintele', 'presedinte', 'presedintiei', 'administrația prezidențială', 'президентура', 'администрация президента'] },
  { name: 'Parlamentul Republicii Moldova', type: 'GOVERNMENT_INSTITUTION', aliases: ['parlamentul', 'parlamentului', 'parlament', 'парламент молдовы', 'депутаты парламента'] },
  { name: 'Ministerul Afacerilor Interne', type: 'GOVERNMENT_INSTITUTION', aliases: ['mai', 'ministerul afacerilor interne', 'ministerul de interne', 'мвд', 'министерство внутренних дел'] },
  { name: 'Poliția Republicii Moldova (IGP)', type: 'GOVERNMENT_INSTITUTION', aliases: ['igp', 'inspectoratul general al politiei', 'politia', 'полиция молдовы', 'генеральный инспекторат полиции'] },
  { name: 'Inspectoratul General pentru Situații de Urgență (IGSU)', type: 'GOVERNMENT_INSTITUTION', aliases: ['igsu', 'situatii de urgenta', 'pompieri', 'salvatori', 'генеральный инспекторат по чрезвычайным ситуациям', 'гичс', 'мчс'] },
  { name: 'Poliția de Frontieră', type: 'GOVERNMENT_INSTITUTION', aliases: ['politia de frontiera', 'inspectoratul general al politiei de frontiera', 'frontiera', 'пограничная полиция'] },
  { name: 'Serviciul Vamal', type: 'GOVERNMENT_INSTITUTION', aliases: ['serviciul vamal', 'vama', 'таможенная служба', 'таможня'] },
  { name: 'Autoritatea Aeronautică Civilă (AAC)', type: 'GOVERNMENT_INSTITUTION', aliases: ['aac', 'autoritatea aeronautica civila', 'орган гражданской авиации'] },
  { name: 'Administrația de Stat a Drumurilor (ASD)', type: 'GOVERNMENT_INSTITUTION', aliases: ['asd', 'administrația de stat a drumurilor', 'andsa', 'госадминистрация дорог'] },
  { name: 'Banca Națională a Moldovei (BNM)', type: 'ORGANIZATION', aliases: ['bnm', 'banca nationala a moldovei', 'banca nationala', 'национальный банк молдовы', 'нбм'] },
  { name: 'Biroul Național de Statistică (BNS)', type: 'ORGANIZATION', aliases: ['bns', 'biroul national de statistica', 'национальное бюро статистики'] },

  // Key Infrastructure & Airports
  { name: 'Aeroportul Internațional Chișinău (RMO / LUKK)', type: 'AIRPORT', aliases: ['aeroportul international chisinau', 'aeroportul chisinau', 'aeroportul rmo', 'lukk', 'rmo', 'кишиневский аэропорт', 'аэропорт кишинева', 'аэропорт кишинэу'] },
  { name: 'Aeroportul Internațional Bălți-Leadoveni (LUBL)', type: 'AIRPORT', aliases: ['aeroportul international balti', 'aeroportul balti', 'lubl', 'bzy', 'бельцкий аэропорт'] },
  { name: 'Aeroportul Internațional Mărculești (LUBM)', type: 'AIRPORT', aliases: ['aeroportul marculesti', 'lubm', 'mld', 'аэропорт маркулешты'] },
  { name: 'Portul Internațional Liber Giurgiulești (PILG)', type: 'ORGANIZATION', aliases: ['portul giurgiulesti', 'pilg', 'порт джурджулешты', 'джурджулештский порт'] },
  { name: 'Centrala Electrică de la Cuciurgan (MGRES)', type: 'ORGANIZATION', aliases: ['mgres', 'centrala de la cuciurgan', 'молдавская грэс', 'грэс кучурган'] },
  { name: 'Nodul Hidroenergetic Costești-Stânca', type: 'ORGANIZATION', aliases: ['costesti-stanca', 'costesti stanca', 'гидроузел костешты-стынка'] },

  // Key Border Points
  { name: 'PTF Leușeni - Albița', type: 'BORDER_POINT', aliases: ['leuseni', 'albita', 'ptf leuseni', 'леушень', 'леушены', 'кпп леушены', 'албица'] },
  { name: 'PTF Sculeni', type: 'BORDER_POINT', aliases: ['sculeni', 'ptf sculeni', 'скулень', 'скуляны'] },
  { name: 'PTF Giurgiulești - Galați / Reni', type: 'BORDER_POINT', aliases: ['giurgiulesti', 'ptf giurgiulesti', 'джурджулешть', 'джурджулешты'] },
  { name: 'PTF Otaci - Moghiliov-Podolsk', type: 'BORDER_POINT', aliases: ['otaci', 'ptf otaci', 'отачь', 'отаки', 'могилев-подольский'] },
  { name: 'PTF Criva - Mămăliga', type: 'BORDER_POINT', aliases: ['criva', 'ptf criva', 'крива', 'мамалыга'] },
  { name: 'PTF Palanca - Maiaki-Udobnoe', type: 'BORDER_POINT', aliases: ['palanca', 'ptf palanca', 'паланка', 'маяки-удобное'] },
  { name: 'PTF Tudora - Starokazacie', type: 'BORDER_POINT', aliases: ['tudora', 'ptf tudora', 'тудора', 'староказачье'] },
  { name: 'PTF Costești - Stânca', type: 'BORDER_POINT', aliases: ['costesti', 'ptf costesti', 'костешты'] },

  // Key Highways
  { name: 'Traseul Național M1 (Chișinău - Leușeni)', type: 'ROAD', aliases: ['m1', 'traseul m1', 'traseul chisinau - leuseni', 'трасса м1'] },
  { name: 'Traseul Național M2 (Chișinău - Soroca)', type: 'ROAD', aliases: ['m2', 'traseul m2', 'трасса м2'] },
  { name: 'Traseul Național M3 (Chișinău - Comrat - Giurgiulești)', type: 'ROAD', aliases: ['m3', 'traseul m3', 'трасса м3'] },
  { name: 'Traseul Național M5 (Criva - Bălți - Chișinău - Tiraspol)', type: 'ROAD', aliases: ['m5', 'traseul m5', 'traseul criva', 'betonka', 'трасса м5'] },
  { name: 'Traseul Național R1 (Chișinău - Ungheni - Sculeni)', type: 'ROAD', aliases: ['r1', 'traseul r1', 'traseul chisinau - ungheni', 'трасса р1'] },
  { name: 'Traseul Național R6 (Chișinău - Orhei - Bălți)', type: 'ROAD', aliases: ['r6', 'traseul r6', 'трасса р6'] },
];

/**
 * Extracts entities from raw text based on taxonomy and normalized keyword analysis.
 */
export function extractEntities(text: string): ExtractedEntity[] {
  if (!text) return [];

  const normalized = ' ' + normalizeText(text).replace(/[^a-z0-9а-яё]/gi, ' ') + ' ';
  const extractedMap = new Map<string, ExtractedEntity>();

  for (const item of KNOWN_ENTITIES) {
    let count = 0;
    for (const alias of item.aliases) {
      const aliasNorm = ' ' + normalizeText(alias).replace(/[^a-z0-9а-яё]/gi, ' ') + ' ';
      let pos = 0;
      while ((pos = normalized.indexOf(aliasNorm, pos)) !== -1) {
        count++;
        pos += aliasNorm.length;
      }
    }

    if (count > 0) {
      extractedMap.set(item.name, {
        type: item.type,
        name: item.name,
        mentions: count,
      });
    }
  }

  return Array.from(extractedMap.values()).sort((a, b) => b.mentions - a.mentions);
}
