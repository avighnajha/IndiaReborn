import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { geography, type Point } from './geography';
import { World } from './scenario.js';

export interface Tile {
  id: string; q: number; r: number; kind: string;
  flood: number; mineral: boolean; district: string;
  town?: { name: string; hub?: boolean; era?: number };
}

export type { Point } from './geography';
export const tiles = World.tiles as Record<string, Tile>;
export const width = 920;
export const height = 570;

export function center(tile: Tile): Point {
  const [x, y] = geography.points[tile.id];
  return [x, y];
}

export function elevation(tile: Tile): number {
  return geography.points[tile.id]?.[2] ?? 0;
}

export function vary(color: number, shift: number): number {
  const adjust = (part: number) => Math.round(Math.max(0, Math.min(255, part + shift)));
  return adjust(color >> 16) * 65536 + adjust((color >> 8) & 255) * 256 + adjust(color & 255);
}

function label(value: string, options: { color: number; size: number; italic?: boolean; spaced?: boolean }) {
  const text = new Text({ text: value, style: {
    fontFamily: options.italic ? 'Georgia' : 'system-ui', fontSize: options.size,
    fontStyle: options.italic ? 'italic' : 'normal', fontWeight: options.italic ? 'normal' : '700',
    letterSpacing: options.spaced ? 2.5 : 0.15,
    fill: options.color, stroke: { color: 0x202e24, width: 2.4, join: 'round' },
  }, resolution: 3 });
  text.anchor.set(0.5);
  return text;
}

function channelPoints(points: Point[]): Point[] {
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1];
    const dx = points[i][0] - x;
    const dy = points[i][1] - y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 7));
    for (let j = 1; j <= steps; j++) result.push([x + dx * j / steps, y + dy * j / steps]);
  }
  return result;
}

export const riverChannels = () => geography.rivers.map(({ size, points }) => ({ size, points: channelPoints(points) }));

function river(graphics: Graphics, { points, size }: ReturnType<typeof riverChannels>[number]) {
  const stroke = (color: number, width: number, alpha: number) => {
    graphics.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) graphics.lineTo(...points[i]);
    graphics.stroke({ color, width, alpha, cap: 'round', join: 'round' });
  };
  stroke(0x405e50, size * 2.2, .60);
  stroke(0x4c7a83, size * 1.65, 1);
  if (size >= 1.4) stroke(0x84b0ad, size * .72, .82);
}

export function building(g: Graphics, x: number, y: number, size: number, roof: number, wall: number) {
  g.ellipse(x + size * 0.4, y + 2, size * 1.25, size * 0.42).fill({ color: 0x283b2a, alpha: 0.35 });
  g.poly([x - size, y - size, x + 1, y - size * 0.55, x + 1, y + 2, x - size, y - 1]).fill(wall);
  g.poly([x + 1, y - size * 0.55, x + size, y - size, x + size, y - 1, x + 1, y + 2]).fill(vary(wall, -28));
  g.poly([x - size - 1, y - size, x, y - size * 1.65, x + size + 1, y - size, x, y - size * 0.44]).fill(roof);
  g.poly([x, y - size * 1.65, x + size + 1, y - size, x, y - size * 0.44]).fill(vary(roof, -19));
}

function placeLabel(notes: Container, text: Text, x: number, y: number, offsets: Point[]) {
  const halfW = text.width / 2 + 2;
  const halfH = text.height / 2;
  for (const [dx, dy] of offsets) {
    const px = x + dx;
    const py = y + dy;
    if (px < halfW || px > width - halfW || py < halfH || py > height - halfH) continue;
    const overlaps = notes.children.some((other) =>
      Math.abs(other.x - px) < halfW + other.width / 2 && Math.abs(other.y - py) < halfH + other.height / 2);
    if (overlaps) continue;
    text.position.set(px, py);
    notes.addChild(text);
    return;
  }
  text.destroy();
}

export function drawLandscape(texture: Texture, channels: ReturnType<typeof riverChannels>) {
  const layer = new Container();
  const terrain = new Sprite(texture);
  terrain.width = width;
  terrain.height = height;
  const surface = new Container();
  const water = new Graphics();
  const reservoirs = new Container();
  const roads = new Container();
  const settlements = new Container();
  const settlementMarks = new Graphics();
  const phasedTowns: { era: number; marks: Graphics; name: Text }[] = [];
  const works = new Container();
  const notes = new Container();
  layer.addChild(terrain, surface, water, reservoirs, roads, settlements, works, notes);
  settlements.addChild(settlementMarks);
  for (const channel of channels) river(water, channel);
  const towns = Object.values(tiles).filter((tile) => tile.town).sort((a, b) => Number(Boolean(b.town?.hub)) - Number(Boolean(a.town?.hub)));
  for (const tile of towns) {
    const [x, y] = center(tile);
    const { hub, era } = tile.town!;
    const marks = era ? new Graphics() : settlementMarks;
    const roof = hub ? 0xab6547 : 0x896d52;
    building(marks, x - 5, y + 3, 2.8, roof, 0xd0bd8a);
    building(marks, x + 5, y + 3, 3.2, roof, 0xd5c299);
    building(marks, x, y + 1, hub ? 4.8 : 3.6, roof, 0xe1cfa0);
    const name = label(tile.town!.name, { size: hub ? 13 : 10.5, color: hub ? 0xffe2a5 : 0xf3eacf });
    placeLabel(notes, name, x, y, [[0, -11], [0, 13], [-12, -15], [12, -15], [0, -24]]);
    if (era) {
      settlements.addChild(marks);
      phasedTowns.push({ era, marks, name });
    }
  }
  for (const { name, point: [x, y], water: isWater } of geography.labels) {
    const caption = label(name, { italic: isWater, spaced: !isWater, color: isWater ? 0xcce2d4 : 0xede3c4, size: isWater ? 12 : 10 });
    placeLabel(notes, caption, x, y, [[0, 0], [0, -15], [0, 15], [12, -24], [-12, 24]]);
  }
  return { layer, roads, surface, works, reservoirs, notes, phasedTowns };
}
