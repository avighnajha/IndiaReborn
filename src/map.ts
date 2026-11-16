import { Application, Assets, Container, Graphics, type Texture, type Ticker } from 'pixi.js';
import { Campaign } from './campaign.js';
import { geography, loadGeography, terrainImage } from './geography';
import { campaignBoundary, type Jurisdiction } from './journey-map';
import { World } from './scenario.js';
import { building, center, drawLandscape, elevation, height, riverChannels, tiles, width, type Point, type Tile } from './landscape';

type Asset = { hex: string; kind: string; remaining: number };
type FloodSite = { hex: string; lost: number; protected: number };
type Season = { monsoon: string; year: number; completed: Asset[]; attribution?: { food?: { floodSites?: FloodSite[] } } };
type State = { year: number; owners: Record<string, string>; assets: Asset[]; reports: Season[]; journey?: { jurisdiction?: Jurisdiction } };
type SelectSite = (id: string, fromMap?: boolean) => void;
type ProgrammePreview = { cells: string[]; color: number; coverage?: string[] };

const host = document.querySelector<HTMLDivElement>('#map')!;
const zoomLabel = document.querySelector<HTMLSpanElement>('#zoom-level')!;
const allTiles = Object.values(tiles);
let sites: { tile: Tile; point: Point }[] = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const maxZoom = 2.65;
const app = new Application();
const board = new Container();
const overlays = new Container();
const effects = new Container();
const surfaceTints = new Container();
const surfaceEffects = new Container();
const boundaryLines = new Graphics();
let roadLayer: Container;
let reservoirLayer: Container;
let labelLayer: Container;
let phasedTowns: ReturnType<typeof drawLandscape>['phasedTowns'] = [];
let selectedId = '';
let keyboardId = '';
let onSelect: SelectSite;
let currentGame: State;
let zoomLevel = 1;
let viewCenter: Point = [width / 2, height / 2];
let activeEffect: (() => void) | undefined;
let ready = false;

function redraw() {
  if (ready) app.render();
}

function clampView() {
  if (!ready) return;
  const horizontal = width / zoomLevel / 2;
  const vertical = height / zoomLevel / 2;
  viewCenter = [Math.max(horizontal, Math.min(width - horizontal, viewCenter[0])), Math.max(vertical, Math.min(height - vertical, viewCenter[1]))];
  const scale = Math.min(app.screen.width / width, app.screen.height / height) * zoomLevel;
  board.scale.set(scale);
  const labelScale = Math.min(1.28, zoomLevel) / zoomLevel;
  for (const label of labelLayer.children) label.scale.set(labelScale);
  board.position.set(app.screen.width / 2 - viewCenter[0] * scale, app.screen.height / 2 - viewCenter[1] * scale);
  zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  redraw();
}

function pointInWorld(event: MouseEvent): Point {
  const bounds = host.getBoundingClientRect();
  return [(event.clientX - bounds.left - board.x) / board.scale.x, (event.clientY - bounds.top - board.y) / board.scale.y];
}

function hit(event: PointerEvent) {
  const [x, y] = pointInWorld(event);
  let best = 15;
  let match: Tile | undefined;
  for (const { tile, point: [sx, sy] } of sites) {
    const distance = Math.hypot(x - sx, y - sy);
    if (distance >= best) continue;
    best = distance;
    match = tile;
  }
  return match;
}

function wireInput() {
  let drag: { id: number; x: number; y: number; view: Point; moved: boolean } | undefined;
  host.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || drag) return;
    const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 120 : 1);
    const next = Math.max(1, Math.min(maxZoom, zoomLevel * Math.exp(-Math.max(-140, Math.min(140, delta)) * .0026)));
    if (next === zoomLevel) return;
    event.preventDefault();
    const bounds = host.getBoundingClientRect();
    const [x, y] = pointInWorld(event);
    const scale = board.scale.x * next / zoomLevel;
    viewCenter = [
      x - (event.clientX - bounds.left - app.screen.width / 2) / scale,
      y - (event.clientY - bounds.top - app.screen.height / 2) / scale,
    ];
    zoomLevel = next;
    clampView();
  }, { passive: false });
  host.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, view: [...viewCenter], moved: false };
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) {
      host.style.cursor = hit(event) ? 'pointer' : 'default';
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    drag.moved = true;
    if (zoomLevel === 1) return;
    host.style.cursor = 'grabbing';
    viewCenter = [drag.view[0] - dx / board.scale.x, drag.view[1] - dy / board.scale.y];
    clampView();
  });
  host.addEventListener('pointerup', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const tile = !drag.moved && hit(event);
    drag = undefined;
    host.style.cursor = tile ? 'pointer' : 'default';
    if (tile) onSelect?.(tile.id, true);
  });
  host.addEventListener('pointercancel', () => { drag = undefined; });
  host.addEventListener('keydown', (event) => {
    const tile = tiles[keyboardId || selectedId];
    if (!tile) return;
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      ReliefMap.zoom(event.key === '-' ? 1.28 : .78, tile.id);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(tile.id, true);
      return;
    }
    const steps: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const [dx, dy] = step;
    const [x, y] = center(tile);
    let candidate: Tile | undefined;
    let best = Infinity;
    for (const { tile: next, point: [nx, ny] } of sites) {
      const along = dx * (nx - x) + dy * (ny - y);
      if (along < 4) continue;
      const across = dy * (nx - x) - dx * (ny - y);
      const score = Math.hypot(along, across * 2.3);
      if (score >= best) continue;
      best = score;
      candidate = next;
    }
    if (!candidate) return;
    onSelect(candidate.id, true);
    if (zoomLevel > 1) {
      viewCenter = center(candidate);
      clampView();
    }
  });
}

async function init() {
  const [, texture] = await Promise.all([loadGeography(), terrainImage().then((image) => Assets.load<Texture>(image))]);
  sites = allTiles.map((tile) => ({ tile, point: center(tile) }));
  const channels = riverChannels();
  channelSegments = channels.flatMap(({ points, size }) => points.slice(1).map(([x, y], index) => {
    const start = points[index];
    return { start, delta: [x - start[0], y - start[1]], size };
  }));
  await app.init({ preference: 'webgl', width: Math.max(host.clientWidth, 1), height: Math.max(host.clientHeight, 1),
    background: World.mapKey === "orissa" ? 0x254448 : 0x283b34, antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, autoStart: false });
  app.canvas.setAttribute('aria-hidden', 'true');
  host.replaceChildren(app.canvas);
  const landscape = drawLandscape(texture, channels);
  roadLayer = landscape.roads;
  reservoirLayer = landscape.reservoirs;
  labelLayer = landscape.notes;
  phasedTowns = landscape.phasedTowns;
  const reservoir = new Graphics();
  for (const [outline, ...holes] of geography.reservoir) {
    reservoir.poly(outline).fill(0x467b82);
    for (const hole of holes) reservoir.poly(hole).cut();
    reservoir.poly(outline).stroke({ color: 0x7fa49a, width: 1, alpha: .72 });
  }
  reservoirLayer.addChild(reservoir);
  reservoirLayer.visible = false;
  landscape.surface.addChild(surfaceTints, surfaceEffects, boundaryLines);
  landscape.works.addChild(overlays);
  board.addChild(landscape.layer, effects);
  app.stage.addChild(board);
  ready = true;
  wireInput();
  new ResizeObserver(() => {
    if (!host.clientWidth || !host.clientHeight) return;
    app.renderer.resize(host.clientWidth, host.clientHeight);
    clampView();
  }).observe(host);
  clampView();
}

type ChannelSegment = { start: Point; delta: Point; size: number };
type Bridge = { center: Point; heading: Point; span: number };
type RoadPath = { points: Point[]; bridges: Bridge[]; upland: boolean };

let channelSegments: ChannelSegment[] = [];
const roadPaths = new Map<string, RoadPath>();
const roadPoints = new Map<string, Point>();

function roadPoint(tile: Tile): Point {
  const existing = roadPoints.get(tile.id);
  if (existing) return existing;
  const [x, y] = center(tile);
  const offset = tile.town ? 0 : ((tile.q * 3 + tile.r * 5) % 9) - 4;
  let point: Point = [x + offset, y + (tile.town ? 4 : 3)];
  // Junctions sit on the bank. A link across the channel supplies the crossing.
  for (const { start: [sx, sy], delta: [dx, dy], size } of channelSegments) {
    if (Math.abs(sx - point[0]) > 25 || Math.abs(sy - point[1]) > 25) continue;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const along = ((point[0] - sx) * dx + (point[1] - sy) * dy) / length;
    const lateral = (-(point[0] - sx) * dy + (point[1] - sy) * dx) / length;
    const clearance = size * 1.4 + 2.5;
    if (along < 0 || along > length || Math.abs(lateral) >= clearance) continue;
    const side = Math.sign(lateral) || 1;
    const correction = side * clearance - lateral;
    point = [point[0] - dy / length * correction, point[1] + dx / length * correction];
  }
  roadPoints.set(tile.id, point);
  return point;
}

function roadPath(from: Tile, to: Tile): RoadPath {
  const key = `${from.id}:${to.id}`;
  const cached = roadPaths.get(key);
  if (cached) return cached;
  const [x, y] = roadPoint(from);
  const [ex, ey] = roadPoint(to);
  const dx = ex - x;
  const dy = ey - y;
  const length = Math.hypot(dx, dy) || 1;
  const upland = elevation(from) + elevation(to) > 600;
  const bend = Math.min(length * .11, upland ? 7 : 3.8) * ((from.q + to.r) % 2 ? 1 : -1);
  const points: Point[] = Array.from({ length: 13 }, (_, index) => {
    const t = index / 12;
    const curve = Math.sin(Math.PI * t) * (0.68 + t * 0.38) * bend;
    return [x + dx * t - dy / length * curve, y + dy * t + dx / length * curve];
  });
  const bridges: Bridge[] = [];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [rx, ry] = [points[i][0] - ax, points[i][1] - ay];
    const segmentLength = Math.hypot(rx, ry);
    for (const { start: [sx, sy], delta: [wx, wy], size } of channelSegments) {
      if (size < 1.4 || Math.abs(sx - ax) > 25 || Math.abs(sy - ay) > 25) continue;
      const cross = rx * wy - ry * wx;
      if (Math.abs(cross) < 0.01) continue;
      const alongRoad = ((sx - ax) * wy - (sy - ay) * wx) / cross;
      const alongRiver = ((sx - ax) * ry - (sy - ay) * rx) / cross;
      if (alongRoad < 0 || alongRoad > 1 || alongRiver < 0 || alongRiver > 1) continue;
      const px = ax + rx * alongRoad;
      const py = ay + ry * alongRoad;
      if (bridges.some(({ center: [bx, by] }) => Math.hypot(bx - px, by - py) < 8)) continue;
      const angle = Math.abs(cross) / (segmentLength * Math.hypot(wx, wy));
      const span = Math.min(20, (size * 2 + 4) / Math.max(0.5, angle));
      bridges.push({ center: [px, py], heading: [rx / segmentLength, ry / segmentLength], span });
    }
  }
  const result = { points, bridges, upland };
  roadPaths.set(key, result);
  return result;
}

function pathStroke(graphics: Graphics, points: Point[], color: number, width: number, alpha = 1) {
  graphics.moveTo(...points[0]);
  for (const point of points.slice(1)) graphics.lineTo(...point);
  graphics.stroke({ color, width, alpha, cap: 'round', join: 'round' });
}

function bridge(graphics: Graphics, crossing: Bridge, highlight: boolean) {
  const { center: [x, y], heading: [dx, dy], span } = crossing;
  const half = span / 2;
  const point = (along: number, across: number, drop = 0): Point => [x + dx * along - dy * across, y + dy * along + dx * across + drop];
  const deck = (halfWidth: number, drop = 0) => [point(-half, -halfWidth, drop), point(half, -halfWidth, drop), point(half, halfWidth, drop), point(-half, halfWidth, drop)].flat();
  graphics.poly(deck(3.2, 2)).fill({ color: 0x20362e, alpha: 0.57 });
  graphics.poly(deck(2.75)).fill(0x685847);
  graphics.poly(deck(1.8)).fill(highlight ? 0xf3cd80 : 0xc2ac80);
  for (const side of [-1, 1]) {
    pathStroke(graphics, [point(-half, side * 2.15), point(half, side * 2.15)], 0xf0ddac, 0.55, 0.88);
  }
  for (const end of [-half, half]) {
    pathStroke(graphics, [point(end, -3.15), point(end, 3.15)], 0x65584c, 1.7);
    pathStroke(graphics, [point(end, -3.05, -0.55), point(end, 3.05, -0.55)], 0xd1c4a0, 0.65);
  }
}

function paintRoad(graphics: Graphics, path: RoadPath, highlight: boolean) {
  const { points, bridges, upland } = path;
  pathStroke(graphics, points, 0x4d4934, 3.8, 0.58);
  pathStroke(graphics, points, upland ? 0xa39675 : 0xc0a16d, 2.7);
  pathStroke(graphics, points, highlight ? 0xffd781 : upland ? 0xc8b892 : 0xd6b882, highlight ? 1.75 : 1.25);
  for (const crossing of bridges) bridge(graphics, crossing, highlight);
}

function works(g: Graphics, tile: Tile, asset: Asset, index: number) {
  const [tx, ty] = center(tile);
  const x = tx + (tile.town ? 13 : -6) + (index % 3) * 7;
  const y = ty + 11 + Math.floor(index / 3) * 5 - (index % 2) * 4;
  if (asset.kind === 'road') {
    if (asset.remaining) {
      const [rx, ry] = roadPoint(tile);
      for (const [dx, dy] of [[-5, 2], [5, 0]]) {
        const [px, py] = [rx + dx, ry + dy];
        g.moveTo(px, py).lineTo(px, py - 6).stroke({ color: 0x624a32, width: 1.1 });
        g.poly([px, py - 6, px + 4, py - 5, px, py - 3]).fill(0xffd686);
      }
    }
    return;
  }
  if (asset.remaining) {
    g.ellipse(x, y + 1, 8, 3).fill({ color: 0x4b3c2c, alpha: 0.6 });
    g.poly([x - 6, y - 2, x, y - 6, x + 7, y - 3, x, y + 1]).fill(0xbd9b59);
    g.moveTo(x - 4, y).lineTo(x - 4, y - 12).lineTo(x + 5, y - 12).lineTo(x + 5, y - 1).moveTo(x - 4, y - 10).lineTo(x + 5, y - 4).stroke({ color: 0xffda88, width: 1.2 });
    return;
  }
  switch (asset.kind) {
    case 'juteFarm':
    case 'irrigation':
      for (let i = 0; i < 4; i++) {
        g.moveTo(x - 10 + i, y - 7 + i * 2).lineTo(x + 6 + i, y - 10 + i * 2)
          .stroke({ color: i === 0 ? 0x68c3c0 : asset.kind === 'juteFarm' ? 0x8eb56b : 0xd4cb66, width: i === 0 ? 1.6 : 1.8 });
      }
      break;
    case 'levee':
      g.moveTo(x - 10, y - 2).quadraticCurveTo(x, y - 11, x + 9, y - 9).stroke({ color: 0x665239, width: 4, cap: 'round' });
      g.moveTo(x - 10, y - 3).quadraticCurveTo(x, y - 12, x + 9, y - 10).stroke({ color: 0xd8c08a, width: 2, cap: 'round' });
      break;
    case 'mill':
      building(g, x, y, 6, 0x935641, 0xd1a77c);
      g.rect(x + 6, y - 16, 3, 13).fill(0x7e5540).rect(x + 5.5, y - 17, 4, 2).fill(0xb68564);
      g.ellipse(x + 9, y - 19, 4, 2).fill({ color: 0xded1a8, alpha: 0.48 });
      break;
    case 'school':
      building(g, x - 4, y, 4.8, 0x557d74, 0xf3dbaa);
      building(g, x + 4, y, 5.4, 0x659087, 0xf3dbaa);
      break;
    case 'college':
    case 'university':
      g.ellipse(x, y + 1, 10, 4).fill({ color: 0x33463b, alpha: .62 });
      building(g, x - 5, y - 1, 5, 0x668685, 0xdcd09e);
      building(g, x + 5, y, 5, 0x557574, 0xdcd09e);
      if (asset.kind === 'university') {
        g.rect(x - 3, y - 11, 6, 10).fill(0xddd09d);
        g.arc(x, y - 11, 3.8, Math.PI, 2 * Math.PI).closePath().fill(0x7caaa3);
      }
      break;
    case 'technicalInstitute':
    case 'agriculturalInstitute': {
      const agriculture = asset.kind === 'agriculturalInstitute';
      building(g, x - 3, y - 2, 6, agriculture ? 0x75883e : 0x45667e, 0xe4ce91);
      building(g, x + 6, y + 1, 4, agriculture ? 0x9aab52 : 0x769eae, 0xf0dbad);
      g.moveTo(x - 3, y - 9).lineTo(x - 3, y - 15).stroke({ color: 0xf0dcad, width: 1 });
      g.poly([x - 3, y - 15, x + 3, y - 14, x - 3, y - 11]).fill(agriculture ? 0xbbd885 : 0x95d4dc);
      break;
    }
    case 'granary':
      g.roundRect(x - 5, y - 10, 10, 12, 2).fill(0xd5b873);
      g.ellipse(x, y - 10, 5, 3).fill(0xe6d494).ellipse(x, y + 1, 5, 1.5).fill(0xb89a5c);
      break;
    case 'foodDepot':
      building(g, x + 4, y - 1, 6, 0x9b7041, 0xe4bc71);
      for (const dx of [-7, -1]) {
        g.roundRect(x + dx - 3, y - 9, 6, 11, 2).fill(0xcead68);
        g.ellipse(x + dx, y - 9, 3, 2).fill(0xf0d591);
      }
      break;
    case 'waterNetwork':
      g.poly([x - 12, y - 4, x + 4, y - 11, x + 13, y - 6, x - 4, y + 2]).fill(0x73b4bb);
      g.moveTo(x - 6, y + 1).lineTo(x + 7, y - 6).moveTo(x - 4, y + 3).lineTo(x + 9, y - 4).stroke({ color: 0xd5c597, width: 1.5 });
      break;
    case 'freightTerminal':
      g.poly([x - 11, y - 1, x + 1, y - 7, x + 12, y - 1, x, y + 5]).fill(0x827660);
      building(g, x - 2, y - 1, 6, 0x8e6242, 0xe6c488);
      g.rect(x + 4, y - 5, 6, 3).fill(0xc99853).rect(x + 3, y - 1, 6, 3).fill(0x9bc0aa);
      break;
    case 'industrialPark':
      building(g, x - 6, y - 1, 6, 0x8a563f, 0xd1a581);
      building(g, x + 5, y, 6, 0x9b6347, 0xe6ba83);
      g.rect(x + 4, y - 16, 2.5, 12).fill(0x775142).rect(x + 8, y - 13, 2.5, 9).fill(0x775142);
      break;
    case 'power':
      g.poly([x - 12, y - 5, x + 6, y - 12, x + 11, y - 4, x - 7, y + 3]).fill(0x79b5b7);
      g.moveTo(x - 9, y + 2).lineTo(x + 11, y - 7).stroke({ color: 0xdbc796, width: 3 });
      building(g, x + 4, y - 3, 4.5, 0x6d8a80, 0xe6dbba);
      break;
  }
}

function floodOverlay(g: Graphics, game: State, strong: boolean) {
  const levees = Campaign.active(game, 'levee') as Asset[];
  const protectedTiles = new Set(levees.flatMap(({ hex }) => [hex, ...World.neighbors(hex)]));
  const flooded = allTiles.filter((tile) => tile.flood >= 2 && !protectedTiles.has(tile.id));
  for (const tile of flooded) {
    const [x, y] = center(tile);
    g.ellipse(x, y, 18, 11).fill({ color: 0x4f969f, alpha: strong ? .33 : .23 });
    g.ellipse(x, y, 12, 7).fill({ color: 0x84b4b3, alpha: strong ? .30 : .15 });
  }
}

function floodResults(graphics: Graphics, report: Season) {
  for (const { hex, lost, protected: saved } of report.attribution?.food?.floodSites ?? []) {
    const [x, y] = center(tiles[hex]);
    if (lost) {
      graphics.ellipse(x, y, 17, 11).stroke({ color: 0x172b35, width: 4 })
        .ellipse(x, y, 17, 11).stroke({ color: 0x80d7f2, width: 2 });
    }
    if (saved) {
      graphics.circle(x + 12, y - 8, 4.5).fill(0x21352c)
        .circle(x + 12, y - 8, 2.9).fill(0xc9e78d);
    }
  }
}

function displayedBoundary(game: State) {
  const jurisdiction = game.journey && (game.journey.jurisdiction ?? { settlement: 'pending' });
  return campaignBoundary(game.year, jurisdiction);
}

function render(game: State, layer: string, selected: string, select: SelectSite, preview?: ProgrammePreview) {
  currentGame = game;
  selectedId = selected;
  keyboardId = selected;
  onSelect = select;
  host.setAttribute('aria-label', `${World.name} relief map. Selected ${tiles[selected].town?.name ?? 'works site'}`);
  if (!ready) return;
  overlays.removeChildren().forEach((child) => child.destroy());
  roadLayer.removeChildren().forEach((child) => child.destroy());
  surfaceTints.removeChildren().forEach((child) => child.destroy());
  const routes = new Graphics();
  const markers = new Graphics();
  const regions = new Graphics();
  const borders = layer === 'jurisdiction';
  const { polygons, neighbors } = displayedBoundary(game);
  boundaryLines.clear();
  for (const line of neighbors) {
    pathStroke(boundaryLines, line, 0x323d31, borders ? 3.7 : 2.9, .85);
    pathStroke(boundaryLines, line, 0xb7c0b2, borders ? 1.55 : 1.15, .84);
  }
  for (const [outline, ...holes] of polygons) {
    regions.poly(outline).fill({ color: 0xf0ca76, alpha: borders ? .21 : .12 });
    for (const hole of holes) regions.poly(hole).cut();
    for (const ring of [outline, ...holes]) {
      boundaryLines.poly(ring).stroke({ color: 0x342e23, width: borders ? 6.6 : 5.3, alpha: .90, join: 'round' });
      boundaryLines.poly(ring).stroke({ color: 0xf9dfa1, width: borders ? 3.5 : 2.7, alpha: .98, join: 'round' });
    }
  }
  reservoirLayer.visible = World.key === 'madras' || (World.key === 'central' ? game.year >= 1960 :
    World.key === 'punjab' ? game.year >= 1963 : Campaign.active(game, 'power').length > 0);
  for (const { era, marks, name } of phasedTowns) marks.visible = name.visible = game.year >= era;
  const { reached } = Campaign.access(game);
  const builtRoads = new Set(game.assets.filter((asset) => asset.kind === 'road' && asset.remaining === 0).map((asset) => asset.hex));
  const townSites = new Set(allTiles.filter(({ town }) => town && (town.era ?? World.start) <= game.year).map(({ id }) => id));
  const routeTiles = new Set([...builtRoads, ...townSites]);
  const drawnRoads = new Set<string>();
  for (const tile of allTiles) {
    if (borders && game.owners[tile.id] === 'council') {
      regions.ellipse(...center(tile), 15, 9).fill({ color: 0xc6753a, alpha: .47 });
    }
    if (!routeTiles.has(tile.id)) continue;
    for (const next of World.neighbors(tile.id)) {
      if (next <= tile.id || !routeTiles.has(next)) continue;
      const other = tiles[next];
      const existingLink = townSites.has(tile.id) && townSites.has(next) && (tile.town?.hub || other.town?.hub);
      if (!existingLink && !builtRoads.has(tile.id) && !builtRoads.has(next)) continue;
      const highlight = layer === 'access' && reached.has(next) && reached.has(tile.id);
      paintRoad(routes, roadPath(tile, other), highlight);
      drawnRoads.add(tile.id);
      drawnRoads.add(next);
    }
  }
  for (const id of builtRoads) {
    if (drawnRoads.has(id)) continue;
    const [x, y] = roadPoint(tiles[id]);
    paintRoad(routes, { points: [[x - 7, y + 2], [x - 3, y], [x + 2, y], [x + 7, y - 2]], bridges: [], upland: elevation(tiles[id]) > 300 }, false);
  }
  const stack = new Map<string, number>();
  const workStatus = new Map<string, { operating: boolean; building: boolean }>();
  for (const asset of game.assets) {
    works(markers, tiles[asset.hex], asset, stack.get(asset.hex) ?? 0);
    stack.set(asset.hex, (stack.get(asset.hex) ?? 0) + 1);
    if (layer === 'works') {
      const status = workStatus.get(asset.hex) ?? { operating: false, building: false };
      if (asset.remaining) status.building = true;
      else status.operating = true;
      workStatus.set(asset.hex, status);
    }
  }
  for (const [id, { operating, building }] of workStatus) {
    const [x, y] = center(tiles[id]);
    const color = operating ? 0x83cbbb : 0xefc377;
    markers.ellipse(x, y, 10, 7).stroke({ color: 0x283b32, width: 4 })
      .ellipse(x, y, 10, 7).stroke({ color, width: 2 });
    if (building && operating) {
      markers.circle(x + 8, y + 5, 3.1).fill(0x283b32).circle(x + 8, y + 5, 2).fill(0xefc377);
    }
  }
  const latest = game.reports.at(-1);
  if (layer === 'weather' && latest?.monsoon === 'Severe flood') {
    floodOverlay(regions, game, false);
    floodResults(markers, latest);
  }
  if (layer === 'weather' && game.reports.at(-1)?.monsoon === 'Dry monsoon') {
    for (const tile of allTiles) if (tile.kind === 'p') regions.ellipse(...center(tile), 17, 10).fill({ color: 0xd59f50, alpha: .24 });
  }
  for (const id of preview?.coverage ?? []) {
    regions.ellipse(...center(tiles[id]), 15, 10).fill({ color: 0xa8d8b4, alpha: .29 })
      .ellipse(...center(tiles[id]), 15, 10).stroke({ color: 0xbce5c4, alpha: .75, width: 1 });
  }
  const footprint = new Graphics();
  if (preview) {
    const [radiusX, radiusY] = layer === 'works' ? [15, 11] : [10, 7];
    for (const id of new Set(preview.cells)) {
      footprint.ellipse(...center(tiles[id]), radiusX, radiusY).stroke({ color: 0x27382c, width: 3.3, alpha: .80 });
      footprint.ellipse(...center(tiles[id]), radiusX, radiusY).stroke({ color: preview.color, width: 1.6, alpha: .97 });
    }
  }
  markers.ellipse(...center(tiles[selected]), 13, 9).stroke({ color: 0x473d25, width: 4, alpha: .8 })
    .ellipse(...center(tiles[selected]), 13, 9).stroke({ color: 0xffdb83, width: 2 });
  roadLayer.addChild(routes);
  surfaceTints.addChild(regions);
  overlays.addChild(footprint, markers);
  redraw();
}

function animate(graphics: Container, milliseconds: number, frame: (progress: number) => void, surface?: Graphics) {
  activeEffect?.();
  if (!ready || reducedMotion.matches) {
    graphics.destroy({ children: true });
    surface?.destroy();
    return Promise.resolve();
  }
  effects.addChild(graphics);
  if (surface) surfaceEffects.addChild(surface);
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = (_ticker: Ticker) => {
      const progress = Math.min(1, (performance.now() - start) / milliseconds);
      frame(progress);
      if (progress === 1) finish();
    };
    const timer = setTimeout(() => finish(), milliseconds + 60);
    function finish() {
      if (activeEffect !== finish) return;
      clearTimeout(timer);
      app.ticker.remove(tick);
      app.stop();
      graphics.destroy({ children: true });
      surface?.destroy();
      activeEffect = undefined;
      redraw();
      resolve();
    }
    activeEffect = finish;
    frame(0);
    app.ticker.add(tick);
    app.start();
  });
}

function construction(hexId: string) {
  const [x, y] = center(tiles[hexId]);
  const ring = new Graphics().ellipse(0, 0, 19, 10).stroke({ color: 0xffdf8e, width: 2 });
  ring.position.set(x, y);
  return animate(ring, 580, (t) => { ring.scale.set(0.45 + t * 1.2); ring.alpha = 1 - t; });
}

function season(report: Season) {
  if (report.monsoon === 'Typical monsoon' && !report.completed.length) return Promise.resolve();
  const scene = new Container();
  const haze = new Graphics();
  const rain = new Container();
  const completion = new Container();
  const flood = report.monsoon === 'Severe flood';
  const dry = report.monsoon === 'Dry monsoon';
  if (flood) floodOverlay(haze, currentGame, true);
  if (dry) {
    for (const tile of allTiles) if (tile.kind === 'p') haze.ellipse(...center(tile), 17, 10).fill({ color: 0xd6a860, alpha: .32 });
  } else {
    for (let i = 0; i < (flood ? 178 : 100); i++) {
      const drop = new Graphics().moveTo(0, 0).lineTo(-4, 10 + i % 8).stroke({ color: 0xe0f3e5, alpha: 0.55, width: 0.9, cap: 'round' });
      drop.position.set(79 + (i * 193 % 755), 80 + (i * 117 % 360));
      rain.addChild(drop);
    }
  }
  for (const { hex: id } of report.completed) {
    const [x, y] = center(tiles[id]);
    const ring = new Graphics().ellipse(0, 0, 20, 12).stroke({ color: 0xffdc85, width: 2.4 });
    ring.position.set(x, y);
    completion.addChild(ring);
  }
  scene.addChild(rain, completion);
  return animate(scene, 1820, (t) => {
    haze.alpha = Math.sin(t * Math.PI) ** 0.6;
    rain.alpha = Math.min(1, t * 9, (1 - t) * 4);
    for (const [i, drop] of rain.children.entries()) {
      const fall = t * (flood ? 605 : 470);
      drop.y = 78 + ((i * 117 + fall) % 360);
      drop.x = 79 + ((i * 193 + 755 - fall * 0.22) % 755);
    }
    const progress = Math.max(0, (t - 0.52) / 0.48);
    completion.alpha = Math.sin(progress * Math.PI);
    for (const ring of completion.children) ring.scale.set(0.72 + progress * 1.23);
  }, haze);
}

export const ReliefMap = {
  init, render, construction, season, skip: () => activeEffect?.(),
  boundary: (game: State) => displayedBoundary(game).label,
  elevation: (id: string) => geography.points[id]?.[2],
  focus: (id: string) => { keyboardId = id; host.focus({ preventScroll: true }); },
  zoom: (factor: number, hexId?: string) => {
    if (!ready) return;
    zoomLevel = Math.max(1, Math.min(maxZoom, zoomLevel / factor));
    if (hexId) viewCenter = center(tiles[hexId]);
    clampView();
  },
  reset: () => { zoomLevel = 1; viewCenter = [width / 2, height / 2]; clampView(); },
};
