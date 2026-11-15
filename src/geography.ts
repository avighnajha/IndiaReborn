import { World } from './scenario.js';

export type Point = [number, number];

export interface Outline {
  year: number;
  label: string;
  polygons: number[][][];
  neighbors: Point[][];
}

interface Geography {
  points: Record<string, [number, number, number]>;
  boundaries: Outline[];
  rivers: { size: number; points: Point[] }[];
  labels: { name: string; point: Point; water: boolean }[];
  reservoir: number[][][];
  successors?: Record<string, Outline>;
}

const isOrissa = World.mapKey === 'orissa';
const isMayurbhanj = World.key === 'mayurbhanj';
const emptyOutline: Outline = { year: 1946, label: 'Map outline unavailable', polygons: [], neighbors: [] };
export let geography: Geography = { points: {}, boundaries: [], rivers: [], labels: [], reservoir: [] };
export let northernBihar: (Outline & { successor: number[][][] }) | undefined;
let localBoundary: Omit<Outline, 'neighbors'> | undefined;

export async function loadGeography() {
  if (geography.boundaries.length) return;
  const map = World.mapKey === 'central' ? import('./geography/central.json')
    : World.mapKey === 'assam' ? import('./geography/assam.json')
    : World.mapKey === 'madras' ? import('./geography/madras.json')
    : World.mapKey === 'punjab' ? import('./geography/punjab.json')
    : World.mapKey === 'bombay' ? import('./geography/bombay.json')
    : World.mapKey === 'west-bengal' ? import('./geography/west-bengal.json')
    : isOrissa ? import('./geography/orissa.json') : import('./geography/bihar.json');
  const local = isMayurbhanj ? import('./geography/mayurbhanj.json') : undefined;
  const successor = World.key === 'bihar' ? import('./geography/bihar-successor.json') : undefined;
  const [base, localData, successorData] = await Promise.all([map, local, successor]);
  const data = base.default as unknown as Geography;
  const points = localData ? { ...data.points, ...localData.default.points } as unknown as Geography['points'] : data.points;
  if (!Object.keys(World.tiles).every((id) => points[id])) throw new Error('The regional map is missing settlement or works locations.');
  localBoundary = localData?.default.boundary;
  northernBihar = successorData?.default as unknown as typeof northernBihar;
  geography = { ...data, points };
}

export async function terrainImage(): Promise<string> {
  const asset = World.mapKey === 'central' ? await import('./geography/central.webp?inline')
    : World.mapKey === 'assam' ? await import('./geography/assam.webp?inline')
    : World.mapKey === 'madras' ? await import('./geography/madras.webp?inline')
    : World.mapKey === 'punjab' ? await import('./geography/punjab.webp?inline')
    : World.mapKey === 'bombay' ? await import('./geography/bombay.webp?inline')
    : World.mapKey === 'west-bengal' ? await import('./geography/west-bengal.webp?inline')
    : isOrissa ? await import('./geography/orissa.webp?inline') : await import('./geography/bihar.webp?inline');
  return asset.default;
}

export function outlineFor(year: number, settlement?: string): Outline {
  if (localBoundary && settlement !== 'merger') {
    return { ...localBoundary, neighbors: geography.boundaries[year >= 1948 ? 1 : 0].neighbors };
  }
  const displayYear = isMayurbhanj ? Math.max(1949, year)
    : isOrissa && (settlement === 'compact' || settlement === 'pending') ? Math.min(1948, year) : year;
  return geography.boundaries.filter((outline) => outline.year <= displayYear).at(-1) ?? geography.boundaries[0] ?? emptyOutline;
}
