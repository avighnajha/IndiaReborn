import { geography, northernBihar, outlineFor, type Outline } from './geography';
import { World } from './scenario.js';

export type Jurisdiction = { settlement?: string; reorganization?: string; bengalPartition?: boolean; coochBehar?: boolean; bengalTransfer?: string;
  bombayEarlyIntegration?: boolean; bombayEnlarged?: boolean; bombaySuccessor?: string;
  punjabPartition?: boolean; punjabEnlarged?: boolean; punjabSuccessor?: string;
  madrasIntegrated?: boolean; madrasReorganized?: boolean; madrasSuccessor?: string;
  assamPartition?: boolean; assamNagaHills?: boolean; assamNagaland?: boolean; assamReorganized?: boolean;
  centralIntegrated?: boolean; centralReorganized?: boolean };
export function campaignBoundary(year: number, jurisdiction?: Jurisdiction): Outline {
  if (World.key === 'central') return outlineFor(jurisdiction?.centralReorganized ? 1956 : jurisdiction?.centralIntegrated ? Math.min(1950, year) : 1946);
  if (World.key === 'assam') return outlineFor(jurisdiction?.assamReorganized ? 1972 : jurisdiction?.assamNagaland ? 1963
    : jurisdiction?.assamNagaHills ? 1958 : jurisdiction?.assamPartition ? 1947 : 1946);
  const successor = northernBihar;
  if (successor && jurisdiction?.reorganization === 'split') {
    const neighbors = [...successor.neighbors, ...successor.successor.flatMap((polygon) => polygon.map((ring) => {
      const points: [number, number][] = [];
      for (let i = 0; i < ring.length; i += 2) points.push([ring[i], ring[i + 1]]);
      return points;
    }))];
    return { ...successor, neighbors };
  }
  if (World.key === 'orissa' && year >= 1949 && jurisdiction?.settlement === 'compact') return outlineFor(1948);
  if (World.key === 'orissa' && jurisdiction?.settlement === 'merger') return outlineFor(Math.max(1949, year));
  if (World.key === 'west-bengal' && jurisdiction) {
    if (!jurisdiction.bengalPartition) return outlineFor(1946);
    if (jurisdiction.bengalTransfer === 'receiveDistricts') return outlineFor(Math.max(1957, year));
    return outlineFor(Math.min(year, jurisdiction.coochBehar ? 1956 : 1949));
  }
  if (World.key === 'bombay' && jurisdiction) {
    const successor = jurisdiction.bombaySuccessor && geography.successors?.[jurisdiction.bombaySuccessor];
    if (successor) return successor;
    return outlineFor(jurisdiction.bombayEnlarged ? year : Math.min(year, jurisdiction.bombayEarlyIntegration ? 1955 : 1948));
  }
  if (World.key === 'punjab') {
    const successor = jurisdiction?.punjabSuccessor && geography.successors?.[jurisdiction.punjabSuccessor];
    if (successor) return successor;
    return outlineFor(jurisdiction?.punjabEnlarged ? 1956 : jurisdiction?.punjabPartition ? 1947 : 1946);
  }
  if (World.key === 'madras') {
    const current = jurisdiction?.madrasSuccessor;
    if (current) {
      const key = jurisdiction.madrasReorganized ? (current === 'andhra' ? 'andhra-pradesh' : 'tamil-nadu') : current;
      const outline = geography.successors?.[key];
      if (outline) return outline;
    }
    return outlineFor(jurisdiction?.madrasIntegrated ? 1948 : 1946);
  }
  return outlineFor(year, jurisdiction?.settlement);
}

function ringsPath(polygons: number[][][]) {
  return polygons.flatMap((polygon) => polygon.map((ring) => {
    const points: string[] = [];
    for (let i = 0; i < ring.length; i += 2) points.push(`${ring[i]},${ring[i + 1]}`);
    return `M${points.join('L')}Z`;
  })).join('');
}

export function boundaryPreview(year: number, jurisdiction?: Jurisdiction) {
  const outline = campaignBoundary(year, jurisdiction);
  if (!outline.polygons.length) return '<p>Historical outlines are unavailable in this build.</p>';
  const secondary = northernBihar && jurisdiction?.reorganization === 'autonomy'
    ? `<path d="${ringsPath(northernBihar.successor)}" fill="#b88e57" fill-opacity=".45" stroke="#c2ac84" stroke-width="5"/>` : '';
  return `<svg class="jurisdiction-mini" viewBox="0 0 920 570" aria-hidden="true">
    <path d="${ringsPath(outline.polygons)}" fill="#918353" fill-rule="evenodd" stroke="#f9dfa1" stroke-width="7"/>${secondary}</svg>`;
}
