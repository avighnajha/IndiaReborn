import { crisisYears } from "./food-crisis.js";
import { domesticLinks, marketHubs, nationalMarketActive, playerMarketId } from "./national-market.js";
import { westernIslands, westernLinkMarkets } from "./western-shipping.js";

export function dispatchWindow(game) {
  return Boolean(game.journey && crisisYears.includes(game.year) && game.year <= game.journey.end);
}

export function dispatchOffer(game, demand, { capacity: handling, storage }) {
  if (!dispatchWindow(game)) return null;
  const floor = Math.ceil(demand / 2);
  const limit = Math.min(handling, Math.max(0, Math.min(game.reserve, storage) - floor));
  return { floor, limit, pledged: game.reserveDispatch?.year === game.year, orderPlaced: game.crisisOrder?.year === game.year };
}

function shortestRoute(links, source, destination) {
  const seen = new Set([source]);
  const queue = [{ id: source, path: [] }];
  for (const { id, path } of queue) {
    if (id === destination) return path;
    for (const link of links) {
      const next = link.from === id ? link.to : link.to === id ? link.from : null;
      if (!link.remaining || !next || seen.has(next)) continue;
      seen.add(next);
      queue.push({ id: next, path: [...path, { link, from: id, to: next }] });
    }
  }
  return null;
}

export function settleReserveDispatch(regional, game, world, { stateName, demand, facilities, towns, fromReserve, foodOnHand, shortage }) {
  const offer = dispatchOffer(game, demand, facilities);
  if (!offer?.pledged) return { regional, dispatch: null };
  const { floor, limit, orderPlaced } = offer;
  const reserve = Math.min(facilities.storage, foodOnHand);
  const available = shortage || orderPlaced ? 0 : Math.max(0, Math.min(limit, game.reserve - fromReserve - floor, reserve - floor));
  const report = regional.report;
  const market = report.nationalMarket;
  const source = playerMarketId(game, world);
  const dispatch = { floor, limit, available, sent: 0, reserve, freightCapacityUsed: 0, deliveries: [] };
  if (!available) return { regional, dispatch };

  const neighbors = new Map(report.partners.map((row) => [row.id, row]));
  const nodes = market?.nodes ?? report.partners.filter(({ id }) => !["eastBengal", "westPunjab"].includes(id));
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const links = (market?.links ?? []).map((link) => ({ ...link, remaining: link.capacity - link.units }));
  const gateways = new Map();
  for (const [from, to, capacity, mode] of domesticLinks(game.year)) {
    const id = from === source ? to : to === source ? from : null;
    if (id && nodesById.has(id)) gateways.set(id, { capacity, mode });
  }
  for (const node of nodes) {
    const neighbor = neighbors.get(node.id);
    const gateway = gateways.get(node.id);
    if (!gateway && !neighbor) continue;
    const capacity = neighbor?.routeCapacity ?? gateway?.capacity ?? Math.min(3, towns - 1);
    const used = neighbor ? neighbor.bought + neighbor.sold + neighbor.emergencyFood : 0;
    links.push({ from: source, to: node.id, capacity, remaining: Math.max(0, capacity - used), mode: neighbor?.mode ?? gateway?.mode });
  }

  const recipients = [...nodes].filter(({ shortage }) => shortage > 0).sort((a, b) => b.shortage - a.shortage);
  const received = new Map();
  const routes = new Map();
  for (const { id, name, shortage } of recipients) {
    while ((received.get(id) ?? 0) < shortage && dispatch.sent < available) {
      const path = shortestRoute(links, source, id);
      if (!path?.length) break;
      const amount = Math.min(available - dispatch.sent, shortage - (received.get(id) ?? 0), ...path.map(({ link }) => link.remaining));
      dispatch.sent += amount;
      received.set(id, (received.get(id) ?? 0) + amount);
      for (const { link, from, to } of path) {
        link.remaining -= amount;
        const key = `${from}-${to}`;
        const route = routes.get(key) ?? { from, to, capacity: link.capacity, units: 0, ...(link.mode ? { mode: link.mode } : {}), ...westernLinkMarkets(from, to) };
        route.units += amount;
        routes.set(key, route);
      }
    }
    if (received.has(id)) dispatch.deliveries.push({ id, name, units: received.get(id), remaining: shortage - received.get(id) });
  }
  if (!dispatch.sent) return { regional, dispatch };
  dispatch.reserve = Math.min(facilities.storage, foodOnHand - dispatch.sent);
  dispatch.freightCapacityUsed = nationalMarketActive(game) ? Math.ceil(dispatch.sent / 2) : 0;

  const withDelivery = (row, id) => received.has(id) ? { ...row, shortage: row.shortage - received.get(id), reliefReceived: received.get(id) } : row;
  const partners = Object.fromEntries(Object.entries(regional.partners).map(([id, row]) => [id, withDelivery(row, id)]));
  const islandRelief = received.get(westernIslands);
  const nationalMarket = market && { ...market, nodes: market.nodes.map((node) => withDelivery(node, node.id)),
    ...(islandRelief && market.western?.islands ? { western: { ...market.western,
      islands: { ...market.western.islands, relief: islandRelief, shortage: partners[westernIslands].shortage },
    } } : {}),
    relief: { source: { id: source, name: stateName, market: marketHubs[source] ?? stateName }, routes: [...routes.values()] } };
  return { regional: { ...regional, partners, report: { ...report, partners: report.partners.map((row) => withDelivery(row, row.id)),
    ...(nationalMarket ? { nationalMarket } : {}) } }, dispatch };
}
