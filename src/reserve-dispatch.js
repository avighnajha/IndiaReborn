import { crisisYears, distributionOpening, lateDroughtSeverity } from "./food-crisis.js";
import { domesticLinks, marketHubs, nationalMarketActive, playerMarketId } from "./national-market.js";
import { westernIslands, westernLinkMarkets } from "./western-shipping.js";

export function distributionWindow(game) {
  return Boolean(game.journey && game.year >= distributionOpening && game.year <= game.journey.end);
}

export function dispatchWindow(game) {
  return distributionWindow(game) || Boolean(game.journey && crisisYears.includes(game.year) && game.year <= game.journey.end);
}

export function dispatchOffer(game, demand, { capacity: handling, storage, distribution, depotNames }) {
  if (!dispatchWindow(game)) return null;
  const late = distributionWindow(game);
  const network = late && Boolean(distribution);
  const floor = Math.ceil(demand / 2);
  const limit = network && storage >= floor ? Math.min(8, handling + 3)
    : Math.min(handling, Math.max(0, Math.min(game.reserve, storage) - floor));
  return { floor, limit, pledged: game.reserveDispatch?.year === game.year, orderPlaced: game.crisisOrder?.year === game.year,
    ...(late ? { late, network, dispatchStore: depotNames?.[0] } : {}) };
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
  const { floor, limit, orderPlaced, late, network } = offer;
  const reserve = Math.min(facilities.storage, foodOnHand);
  const openingSpare = network ? limit : game.reserve - fromReserve - floor;
  const available = shortage || orderPlaced ? 0 : Math.max(0, Math.min(limit, openingSpare, reserve - floor));
  const report = regional.report;
  const market = report.nationalMarket;
  const source = playerMarketId(game, world);
  const dispatch = { floor, limit, available, sent: 0, reserve, freightCapacityUsed: 0, deliveries: [],
    ...(late ? { late, network, dispatchStore: offer.dispatchStore, covered: 0, restocked: 0 } : {}) };
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
    const capacity = late && neighbor?.routeCapacity && gateway ? Math.min(neighbor.routeCapacity, gateway.capacity)
      : neighbor?.routeCapacity ?? gateway?.capacity ?? Math.max(0, Math.min(3, towns - 1));
    const used = neighbor ? neighbor.bought + neighbor.sold + neighbor.emergencyFood : 0;
    links.push({ from: source, to: node.id, capacity, remaining: Math.max(0, capacity - used), mode: neighbor?.mode ?? gateway?.mode });
  }

  const received = new Map();
  const routes = new Map();
  function send({ id, name, shortage }, need, use) {
    if (need <= 0 || dispatch.sent >= available) return;
    const delivery = received.get(id) ?? { id, name, units: 0, covered: 0, restocked: 0, remaining: shortage };
    while (need > 0 && dispatch.sent < available) {
      const path = shortestRoute(links, source, id);
      if (!path?.length) break;
      const amount = Math.min(available - dispatch.sent, need, ...path.map(({ link }) => link.remaining));
      need -= amount;
      dispatch.sent += amount;
      delivery.units += amount;
      delivery[use] += amount;
      for (const { link, from, to } of path) {
        link.remaining -= amount;
        const key = `${from}-${to}`;
        const route = routes.get(key) ?? { from, to, capacity: link.capacity, units: 0, ...(link.mode ? { mode: link.mode } : {}), ...westernLinkMarkets(from, to) };
        route.units += amount;
        routes.set(key, route);
      }
    }
    if (delivery.units) {
      delivery.remaining = shortage - delivery.covered;
      received.set(id, delivery);
    }
  }
  const shortages = [...nodes].filter(({ shortage }) => shortage > 0).sort((a, b) => b.shortage - a.shortage);
  for (const node of shortages) send(node, node.shortage, "covered");
  if (network) {
    const restock = nodes.filter(({ id, shortage }) => shortage === (received.get(id)?.covered ?? 0))
      .map((node) => {
        const share = lateDroughtSeverity(game, node.id) ? .5 : .25;
        return { node, need: Math.ceil((regional.partners[node.id].population ?? 0) * share) - node.reserve };
      })
      .filter(({ need }) => need > 0).sort((a, b) => b.need - a.need);
    for (const { node, need } of restock) send(node, need, "restocked");
  }
  if (!dispatch.sent) return { regional, dispatch };
  for (const delivery of received.values()) {
    const { id, name, units, remaining, covered, restocked } = delivery;
    dispatch.deliveries.push(late ? delivery : { id, name, units, remaining });
    if (late) {
      dispatch.covered += covered;
      dispatch.restocked += restocked;
    }
  }
  dispatch.reserve = Math.min(facilities.storage, foodOnHand - dispatch.sent);
  dispatch.freightCapacityUsed = nationalMarketActive(game) ? Math.ceil(dispatch.sent / 2) : 0;

  const withDelivery = (row, id) => {
    const delivery = received.get(id);
    return delivery ? { ...row, shortage: row.shortage - delivery.covered, reliefReceived: delivery.units,
      ...(delivery.restocked ? { reserve: row.reserve + delivery.restocked } : {}) } : row;
  };
  const partners = Object.fromEntries(Object.entries(regional.partners).map(([id, row]) => [id, withDelivery(row, id)]));
  const islandRelief = received.get(westernIslands);
  const nationalMarket = market && { ...market, nodes: market.nodes.map((node) => withDelivery(node, node.id)),
    ...(islandRelief && market.western?.islands ? { western: { ...market.western,
      islands: { ...market.western.islands, relief: islandRelief.units, shortage: partners[westernIslands].shortage },
    } } : {}),
    relief: { source: { id: source, name: stateName, market: marketHubs[source] ?? stateName }, routes: [...routes.values()],
      ...(late ? { distribution: true } : {}) } };
  return { regional: { ...regional, partners, report: { ...report, partners: report.partners.map((row) => withDelivery(row, row.id)),
    ...(nationalMarket ? { nationalMarket } : {}) } }, dispatch };
}
