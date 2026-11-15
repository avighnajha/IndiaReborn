import { competitiveFreight, contractPlayerBid, contractRivalBid, domesticContractRival, freightCompetitionOpening, maxFreightCapacity, resolveFreightContract, upcomingFreightContract } from "./neighbor-competition.js";
import { clearNationalMarket, inlandActors, marketHubs, nationalMarketActive, nationalMarketActors, seedBombayDivision, seedPunjabDivision, seedSouthernTransitions } from "./national-market.js";

const actors = {
  ...inlandActors,
  up: { name: "United Provinces", later: "Uttar Pradesh", renamed: 1950, harvest: 9, demand: 7, flood: 1, dry: 2, seed: 64 },
  bengal: { name: "Bengal", later: "West Bengal", renamed: 1947, harvest: 8, demand: 7, flood: 2, dry: 1, seed: 133 },
  bihar: { name: "Bihar", harvest: 9, demand: 8, flood: 3, dry: 2, seed: 184 },
  eastBengal: { name: "Eastern Bengal markets", later: "East Pakistan", renamed: 1947, harvest: 11, demand: 8, flood: 3, dry: 1, seed: 237 },
  central: { name: "Central Provinces and Berar", later: "Madhya Pradesh", renamed: 1950, harvest: 8, demand: 7, flood: 1, dry: 3, seed: 291 },
  orissa: { name: "Orissa", harvest: 8, demand: 7, flood: 3, dry: 1, seed: 405 },
  mayurbhanj: { name: "Mayurbhanj", harvest: 5, demand: 5, flood: 1, dry: 2, seed: 529 },
  council: { name: "Southern district council", harvest: 6, demand: 6, flood: 1, dry: 2, seed: 839 },
  saurashtra: { name: "Kathiawar markets", later: "Saurashtra", renamed: 1948, harvest: 9, demand: 7, flood: 1, dry: 3, seed: 217 },
  rajasthan: { name: "Rajputana markets", later: "Rajasthan", renamed: 1950, harvest: 8, demand: 7, flood: 1, dry: 4, seed: 403 },
  hyderabad: { name: "Hyderabad State", harvest: 10, demand: 8, flood: 2, dry: 3, seed: 516 },
  mysore: { name: "Mysore", later: "Karnataka", renamed: 1973, harvest: 10, demand: 8, flood: 2, dry: 2, seed: 627 },
  maharashtra: { name: "Maharashtra", harvest: 14, demand: 10, flood: 2, dry: 3, seed: 733 },
  gujarat: { name: "Gujarat", harvest: 12, demand: 9, flood: 1, dry: 3, seed: 851 },
  westPunjab: { name: "Lahore markets", harvest: 11, demand: 8, flood: 1, dry: 4, seed: 327 },
  pepsu: { name: "Patiala and the princely districts", later: "PEPSU", renamed: 1948, harvest: 7, demand: 6, flood: 1, dry: 3, seed: 610 },
};

const reserveLimit = 12;
const workPlans = {
  storage: { title: "Reserve depots", cost: 7, years: 2, effect: "Holds 6 more food units and can offer one more unit to a priority buyer." },
  freight: { title: "Freight exchange", cost: 10, years: 2, effect: "Handles more food trade and adds ₹1 lakh for each side when a signed corridor is open." },
  loadingYard: { title: "Freight loading yards", cost: 14, years: 2, effect: "Adds capacity for 3 competitive freight loads each year while the route is open." },
};
const jointProjectPlans = {
  supply: {
    kind: "reserve", title: "Shared emergency reserve", playerCost: 12, smallStateCost: 8, partnerCost: 6, years: 2,
    requiredWork: "storage",
    detail: "The partner gains more space for food reserves. Your administration gains emergency access to available stocks.",
    effect: "Adds 6 units to the partner's reserve capacity. When your harvest and reserves fall short, it releases up to 2 units if the partner can spare them.",
  },
  corridor: {
    kind: "freight", title: "Shared freight connection", playerCost: 18, smallStateCost: 12, partnerCost: 10, years: 3,
    requiredWork: "freight",
    detail: "Both governments expand the freight exchange and its links to your markets.",
    effect: "Earns each government an extra ₹2 lakh per year and handles up to one more unit of food trade while the corridor is open.",
  },
};
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const populationUnits = (value) => Math.round(value * 100) / 100;

function activeActors(world, game) {
  if (world.key === "bombay") {
    const jurisdiction = game.journey?.jurisdiction;
    if (jurisdiction?.bombaySuccessor === "gujarat") return ["maharashtra", "rajasthan", "central"];
    if (jurisdiction?.bombaySuccessor === "maharashtra") return ["gujarat", "central", "mysore"];
    return jurisdiction?.bombayEnlarged ? ["rajasthan", "central", "mysore"] : ["saurashtra", "hyderabad", "central"];
  }
  if (world.key === "punjab") {
    const jurisdiction = game.journey?.jurisdiction;
    if (jurisdiction?.punjabSuccessor) return [jurisdiction.punjabSuccessor === "punjab" ? "haryana" : "punjab", "delhi", "rajasthan"];
    if (jurisdiction?.punjabEnlarged) return ["delhi", "rajasthan", "up"];
    return jurisdiction?.punjabPartition ? ["delhi", "rajasthan", "pepsu"] : ["westPunjab", "delhi", "pepsu"];
  }
  if (world.key === "madras") {
    const jurisdiction = game.journey?.jurisdiction;
    if (jurisdiction?.madrasSuccessor === "andhra") return jurisdiction.madrasReorganized
      ? ["madras", "orissa", "central", "mysore"] : ["madras", "orissa", "hyderabad"];
    if (jurisdiction?.madrasSuccessor === "madras") return ["andhra", "mysore", jurisdiction.madrasReorganized ? "kerala" : "travancore"];
    return ["hyderabad", "mysore", "travancore"];
  }
  if (world.key === "assam") {
    const { assamNagaHills, assamReorganized } = game.journey?.jurisdiction ?? {};
    return [game.year >= 1947 && game.year < 1950 ? "eastBengal" : "bengal",
      ...(assamNagaHills ? ["nagaland"] : []), ...(assamReorganized ? ["meghalaya", "mizoram"] : [])];
  }
  if (world.key === "central") return [game.year >= 1960 ? "maharashtra" : "bombay", "up", "orissa",
    game.journey?.jurisdiction?.centralReorganized ? "rajasthan" : "hyderabad"];
  if (world.key === "west-bengal") return ["bihar", "orissa", "eastBengal"];
  if (world.key === "bihar") return Object.values(game.owners ?? {}).includes("council") ? ["up", "bengal", "council"] : ["up", "bengal"];
  if (world.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger") return ["orissa", "bengal"];
  return world.key === "orissa" && Object.values(game.owners ?? {}).includes("mayurbhanj")
    ? ["bengal", "central", "mayurbhanj"] : ["bengal", "central"];
}

function actorName(id, year) {
  if (id === "eastBengal" && year >= 1972) return "Bangladesh";
  const actor = actors[id];
  return year >= actor.renamed ? actor.later : actor.name;
}

function yearlyRoll(game, salt) {
  let hash = Math.imul(game.seed ^ (game.year * 307 + salt), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

export function neighborsFor(world, game) {
  if (!game.journey) return [];
  return activeActors(world, game).map((id) => {
    const previous = game.journey.partners?.[id];
    return {
      id, name: actorName(id, game.year),
      status: previous?.status ?? "First harvest pending",
      access: previous?.access ?? "Local trade",
      offer: previous?.offer ?? null, request: previous?.request ?? null,
      reserve: previous?.reserve ?? null, cash: previous?.cash ?? null, population: previous?.population ?? null,
      agreement: game.journey.agreements?.[id] ?? null,
      inherited: previous?.inherited ?? null,
      national: previous?.national ?? null,
      works: Object.keys(workPlans).filter((kind) => previous?.works?.[kind])
        .map((kind) => workSummary(kind, previous.works[kind])),
      jointProject: jointProjectStatus(game, id),
    };
  });
}

export function partnerOffers(game, world) {
  const smallState = world.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger";
  const hasRoute = (game.reports?.at(-1)?.towns ?? 0) >= 3 ||
    (game.assets ?? []).some((asset) => asset.kind === "road" && asset.remaining === 0 && game.owners[asset.hex] === world.key);
  return neighborsFor(world, game).flatMap(({ id: partner, name, agreement, works }) => {
    const depot = works.some((work) => work.id === "storage" && work.status === "open");
    const exchange = works.some((work) => work.id === "freight" && work.status === "open");
    const freightRange = exchange ? "₹2–3 lakh" : "₹1–2 lakh";
    const offers = [
      { kind: "supply", title: "Food supply compact", cost: smallState ? 4 : 7, detail: `Secures priority access to available stocks when your harvest falls short. Set food policy to buy in a shortage to use it.${depot ? " Open reserve depots can offer one extra food unit." : ""}` },
      { kind: "corridor", title: "Market corridor agreement", cost: smallState ? 6 : 11, detail: `Funds market access and earns ${freightRange} in freight revenue while the route stays open.${partner === "eastBengal" ? " It also supplies raw jute to Hooghly mills." : " The partner can buy more of your surplus."}` },
    ];
    return offers.map((offer) => ({
      ...offer, id: `${partner}:${offer.kind}`, partner, name,
      reason: agreement ? "An agreement with this administration is already in place."
        : game.year > game.journey.end ? "Campaign complete."
          : game.year < 1948 ? "Negotiations open in 1948."
            : offer.kind === "corridor" && !hasRoute ? "Connect three towns or complete a road link first."
              : game.cash < offer.cost ? "Insufficient treasury." : null,
    }));
  });
}

export function signPartnerOffer(game, world, id) {
  const offer = partnerOffers(game, world).find((candidate) => candidate.id === id);
  if (!offer || offer.reason) return game;
  const { partner, title, kind, cost } = offer;
  const agreement = { id, partner, title, kind, cost, year: game.year };
  return {
    ...game, cash: game.cash - cost,
    journey: { ...game.journey, agreements: { ...game.journey.agreements, [partner]: agreement } },
  };
}

function jointProjectStatus(game, partner) {
  const project = game.journey?.jointProjects?.[partner];
  if (!project) return null;
  return { ...project, status: game.year > project.completionYear ? "open" : "building" };
}

export function jointProjectOffers(game, world) {
  const smallState = world.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger";
  const offers = [];
  for (const neighbor of neighborsFor(world, game)) {
    const plan = jointProjectPlans[neighbor.agreement?.kind];
    if (!plan || neighbor.jointProject) continue;
    const playerCost = smallState ? plan.smallStateCost : plan.playerCost;
    const completionYear = game.year + plan.years - 1;
    const hasWork = neighbor.works.some(({ id, status }) => id === plan.requiredWork && status === "open");
    const reason = completionYear > game.journey.end ? "The project needs more time than the campaign allows."
      : !hasWork ? `Requires the partner's ${workPlans[plan.requiredWork].title.toLowerCase()} to open.`
        : game.cash < playerCost ? "Your treasury cannot cover its share."
          : (neighbor.cash ?? 0) < plan.partnerCost + 2 ? "The partner needs more cash to pay its share and keep money for food purchases." : null;
    offers.push({
      id: `${neighbor.id}:joint-${plan.kind}`, partner: neighbor.id, name: neighbor.name,
      kind: plan.kind, title: plan.title, playerCost, partnerCost: plan.partnerCost, years: plan.years,
      completionYear, detail: plan.detail, effect: plan.effect, reason,
    });
  }
  return offers;
}

export function fundJointProject(game, world, id) {
  const offer = jointProjectOffers(game, world).find((candidate) => candidate.id === id);
  if (!offer || offer.reason) return game;
  const { partner, kind, title, effect, playerCost, partnerCost, completionYear } = offer;
  const project = { id, partner, kind, title, effect, playerCost, partnerCost, started: game.year, completionYear };
  const actor = game.journey.partners[partner];
  return {
    ...game, cash: game.cash - playerCost,
    journey: {
      ...game.journey,
      partners: { ...game.journey.partners, [partner]: { ...actor, cash: actor.cash - partnerCost } },
      jointProjects: { ...game.journey.jointProjects, [partner]: project },
    },
  };
}

function workSummary(kind, work) {
  const { title, effect } = workPlans[kind];
  return { id: kind, title, effect, status: work.opened ? "open" : "building",
    started: work.started, completionYear: work.completionYear, cost: work.cost };
}

function developNeighbor(game, actor, prior, { shortage, balance, towns, agreement, standard, nearbyId }) {
  const works = { ...prior?.works };
  const changed = [];
  for (const [kind, work] of Object.entries(works)) {
    if (work.opened || work.completionYear > game.year) continue;
    works[kind] = { ...work, opened: game.year };
    changed.push(kind);
  }
  const openingCash = prior?.cash ?? 8;
  let developmentSpend = 0;
  const building = Object.values(works).some((work) => !work.opened);
  if (!building && !changed.length && game.year >= 1949 + actor.seed % 4) {
    const corridor = agreement?.kind === "corridor";
    const freightEligible = towns >= 3 || corridor || (standard && nearbyId);
    const foodPressure = shortage > 0 || (prior?.shortage ?? 0) > 0;
    const storageNeed = foodPressure || balance >= reserveLimit - 2 || agreement?.kind === "supply";
    const freightOpportunity = freightEligible && (corridor || balance > 0);
    const preferStorage = standard ? foodPressure || agreement?.kind === "supply" : !freightEligible;
    const priorities = preferStorage ? ["storage", "freight"] : ["freight", "storage"];
    const justified = { storage: !standard || storageNeed, freight: standard ? freightOpportunity : freightEligible };
    const tender = nearbyId && domesticContractRival(nearbyId) && upcomingFreightContract(game);
    const canBid = tender && tender.start >= game.year + workPlans.loadingYard.years;
    if (standard && game.year >= freightCompetitionOpening && freightEligible && !foodPressure && works.freight?.opened &&
      (canBid || prior?.competitionLoads >= 2) && game.year + workPlans.loadingYard.years + 2 <= game.journey.end) {
      priorities.unshift("loadingYard");
      justified.loadingYard = true;
    }
    const uncommittedCash = openingCash + 1 - (standard ? 3 + Math.min(2, shortage) : 3);
    for (const kind of priorities) {
      const plan = workPlans[kind];
      if (works[kind] || !justified[kind] || uncommittedCash < plan.cost || game.year + plan.years > game.journey.end) continue;
      works[kind] = { started: game.year, completionYear: game.year + plan.years, cost: plan.cost };
      developmentSpend = plan.cost;
      changed.push(kind);
      break;
    }
  }
  return { works, openingCash, developmentSpend, changed };
}

function inheritedSuccessorWorks(game, world, id) {
  const southernTransfer = world.key === "madras" && (id === "mysore" || id === "kerala");
  const assamTransfer = world.key === "assam" && (id === "eastBengal" || Object.hasOwn(world.assamTransition, id));
  const centralTransfer = world.key === "central" && game.journey?.jurisdiction?.centralReorganized &&
    (id === "bombay" || id === "maharashtra");
  if (!world.successors?.[id] && !southernTransfer && !assamTransfer && !centralTransfer) return null;
  const owner = world.key === id ? `${id}State`
    : world.key === "assam" && id === "nagaland" && !game.journey?.jurisdiction?.assamNagaland ? "nagaHills" : id;
  const operating = game.assets.filter(({ hex, remaining }) => !remaining && game.owners[hex] === owner);
  if (!operating.length) return null;
  const count = (kind) => operating.filter((asset) => asset.kind === kind).length;
  return { workshops: count("mill"), storage: count("granary"), irrigation: count("irrigation"), terminals: count("freightTerminal"), upkeep: Math.ceil(operating.length / 4) };
}

export function settleNationalTrade(regional, game, world) {
  if (!nationalMarketActive(game)) return regional;
  const partners = { ...regional.partners };
  const localIds = regional.report.partners.map(({ id }) => id);
  const local = new Set(localIds);
  const marketActors = nationalMarketActors(game, world).map((id) => {
    const actor = actors[id];
    if (!local.has(id)) {
      const prior = partners[id];
      const weather = yearlyRoll(game, actor.seed + 1925);
      const shock = weather < 0.16 ? actor.flood : weather > 0.75 ? actor.dry : 0;
      const expandedWheatHarvest = (id === "punjab" || id === "haryana") && game.year >= 1968 ? 2 : 0;
      const balance = actor.harvest + expandedWheatHarvest + Math.floor(yearlyRoll(game, actor.seed) * 6) - 2 - shock +
        (prior?.reserve ?? 3) - actor.demand;
      const shortage = Math.max(0, -balance);
      const { works, openingCash, developmentSpend } = developNeighbor(game, actor, prior, {
        shortage, balance, towns: 3, standard: true,
      });
      partners[id] = {
        ...prior, works, shortage, competitionLoads: 0, population: prior?.population ?? actor.demand,
        reserve: clamp(balance, 0, reserveLimit + (works.storage?.opened ? 6 : 0)),
        cash: openingCash + 1 - developmentSpend,
      };
    }
    const name = game.year === 1946 && id === "madras" ? "Madras Province" : actorName(id, game.year);
    return { id, name, market: marketHubs[id] };
  });
  const { market, flows } = clearNationalMarket(game, partners, marketActors, localIds);
  for (const node of market.nodes) {
    const yard = partners[node.id].works?.loadingYard;
    if (yard) node.loadingYard = { completionYear: yard.completionYear, open: Boolean(yard.opened) };
  }
  for (const { id, cash, reserve, shortage } of market.nodes) {
    partners[id] = { ...partners[id], cash, reserve, shortage, national: flows[id] ?? null };
  }
  const rows = regional.report.partners.map((row) => flows[row.id]
    ? { ...row, cash: partners[row.id].cash, reserve: partners[row.id].reserve, shortage: partners[row.id].shortage, national: flows[row.id] }
    : row);
  return { ...regional, partners, report: { ...regional.report, partners: rows, nationalMarket: market } };
}

function inlandCarriers(market, partners, nearby) {
  if (!market) return [];
  const gateways = new Map(nearby.filter(({ capacity }) => capacity > 0).map((row) => [row.id, row]));
  const nodes = new Map(market.nodes.map((node) => [node.id, node]));
  const carriers = new Map();
  for (const { from, to, capacity: routeLimit } of market.links) {
    const gateway = gateways.get(from) ?? gateways.get(to);
    if (!gateway) continue;
    const id = gateway.id === from ? to : from;
    const node = nodes.get(id);
    const { works } = partners[id];
    if (node.local || node.shortage || !works?.freight?.opened) continue;
    const capacity = Math.min(routeLimit, gateway.capacity, works.loadingYard?.opened ? 4 : 2);
    if ((carriers.get(id)?.capacity ?? 0) >= capacity) continue;
    carriers.set(id, { id, name: node.name, via: gateway.name, capacity });
  }
  return [...carriers.values()];
}

export function settleFreight(regional, game) {
  const { freight, report } = regional;
  if (!freight) return regional;
  const inland = inlandCarriers(report.nationalMarket, regional.partners, freight.partners);
  const competition = competitiveFreight(game, { ...freight, inland });
  const contract = resolveFreightContract(game, contractPlayerBid(freight), report.partners.map((row) => contractRivalBid(row)));
  if (!competition && !contract) return regional;

  const partners = { ...regional.partners };
  const carriers = new Map([...(competition?.partners ?? []), ...(competition?.inland ?? [])].map((row) => [row.id, row]));
  for (const [id, carrier] of carriers) {
    const partner = partners[id];
    partners[id] = { ...partner, cash: partner.cash + carrier.earnings, competitionLoads: carrier.loads };
  }
  const holder = contract?.winner?.id;
  const contractReceipts = (id) => holder === id ? contract.payment : 0;
  if (holder && holder !== "player" && contract.payment) {
    partners[holder] = { ...partners[holder], cash: partners[holder].cash + contract.payment };
  }
  const local = report.partners.map((row) => ({
    ...row, cash: partners[row.id].cash, competitionCash: carriers.get(row.id)?.earnings ?? 0,
    ...(contractReceipts(row.id) ? { contractCash: contractReceipts(row.id) } : {}),
  }));
  const market = report.nationalMarket;
  const nationalMarket = market && { ...market, nodes: market.nodes.map((node) => {
    const carrier = carriers.get(node.id);
    const payment = contractReceipts(node.id);
    return carrier || payment ? { ...node, cash: partners[node.id].cash,
      ...(carrier ? { freight: carrier.earnings } : {}), ...(payment ? { freightContract: payment } : {}) } : node;
  }) };
  return { ...regional, partners, report: { ...report, partners: local, ...(nationalMarket ? { nationalMarket } : {}),
    ...(competition ? { freightCompetition: competition } : {}), ...(contract ? { freightContract: contract } : {}) } };
}

export function resolveNeighbors(game, world, { harvest, demand, towns, monsoon, connectedWorkshops = 0, freightTerminals = 0 }) {
  const savedPartners = { ...game.journey?.partners };
  const westernPartners = nationalMarketActive(game) || world.key === "central" ? seedBombayDivision(savedPartners, game, world) : savedPartners;
  const partners = nationalMarketActive(game)
    ? seedSouthernTransitions(seedPunjabDivision(westernPartners, game, world), game, world) : westernPartners;
  const report = { partners: [], importUnits: 0, exportUnits: 0, migration: 0, cash: 0, agreements: [], developments: [], jointProjects: [], emergencyFood: 0, jointFreightCash: 0 };
  if (!game.journey) return { partners, report, marketStockAdjustment: 0, marketCapacity: 0, migration: 0, cash: 0, emergencyFood: 0 };
  const standard = game.journey.preset === "standard";
  const localBalance = harvest + game.reserve - demand;
  const freightRivals = [];
  let marketStockAdjustment = 0;
  let marketCapacity = 0;
  for (const { id, name, agreement, jointProject } of neighborsFor(world, game)) {
    const actor = actors[id];
    const prior = partners[id];
    const inherited = inheritedSuccessorWorks(game, world, id);
    const roll = yearlyRoll(game, actor.seed);
    const shock = monsoon === "Severe flood" ? actor.flood : monsoon === "Dry monsoon" ? actor.dry : 0;
    const supply = actor.harvest + Math.floor(roll * 6) - 2 - shock + (inherited?.irrigation ?? 0);
    const priorPopulation = prior?.population ?? actor.demand;
    const actorDemand = clamp(Math.round(priorPopulation), actor.demand - 2, actor.demand + 2);
    const balance = supply + (prior?.reserve ?? 3) - actorDemand;
    const shortage = Math.max(0, -balance);
    const restricted = standard && shortage > 0;
    const disrupted = world.key === "assam" && id === "eastBengal" && game.year >= 1947 && game.year < 1950;
    const transit = id === "bihar" && !restricted && game.journey?.jurisdiction?.bengalTransfer === "transitCompact";
    const priority = agreement?.kind === "supply" && localBalance < 0;
    const corridor = agreement?.kind === "corridor" && !restricted && !disrupted;
    const { works, openingCash, developmentSpend, changed } = developNeighbor(game, actor, prior, {
      shortage, balance, towns, agreement, standard, nearbyId: id,
    });
    const depotOpen = Boolean(works.storage?.opened);
    const exchangeOpen = Boolean(works.freight?.opened);
    const jointProjectOpen = jointProject && game.year >= jointProject.completionYear;
    const sharedReserve = jointProjectOpen && jointProject.kind === "reserve";
    const jointFreight = jointProjectOpen && jointProject.kind === "freight" && corridor;
    const reserveCapacity = reserveLimit + (depotOpen ? 6 : 0) + (sharedReserve ? 6 : 0) + (inherited?.storage ?? 0) * 3;
    const reserveBeforeRelease = clamp(balance, 0, reserveCapacity);
    const emergencyFood = sharedReserve && priority && !restricted
      ? Math.min(2, Math.max(0, -localBalance - report.emergencyFood), Math.max(0, reserveBeforeRelease - 3)) : 0;
    const reserve = reserveBeforeRelease - emergencyFood;
    const reserveTarget = priority ? 1 : standard ? 4 : 3;
    const hasFreightFacility = exchangeOpen || Boolean(inherited?.terminals);
    const localExchange = hasFreightFacility && (towns >= 3 || corridor);
    if (standard && game.year >= freightCompetitionOpening) {
      const reason = restricted ? "Route restricted after a shortfall."
        : !hasFreightFacility ? "Freight exchange has yet to open."
          : !localExchange ? "Needs a connection to your market." : null;
      const addedCapacity = (inherited?.workshops ?? 0) + (inherited?.terminals ?? 0) * 3;
      freightRivals.push({ id, name, reason, capacity: reason ? 0 : Math.min(maxFreightCapacity, 3 + (works.loadingYard?.opened ? 3 : 0) + addedCapacity) });
    }
    const extraHandling = jointFreight ? 1 : 0;
    const baselineCapacity = disrupted ? 1 : (towns >= 3 ? 2 : 1) + (localExchange ? 1 : 0) + extraHandling + (transit ? 1 : 0);
    const compactCapacity = priority ? 3 + (depotOpen ? 1 : 0) : corridor ? 1 : 0;
    const offer = restricted ? 0 : clamp(reserve - reserveTarget, 0, baselineCapacity + compactCapacity);
    const jointFreightCash = jointFreight ? 2 : 0;
    const freight = corridor ? (towns >= 5 ? 2 : 1) + (exchangeOpen ? 1 : 0) + jointFreightCash : 0;
    const inheritedReceipts = inherited?.workshops ?? 0;
    const cashBeforeUpkeep = openingCash + 1 + freight + inheritedReceipts - developmentSpend;
    const inheritedUpkeep = Math.min(inherited?.upkeep ?? 0, cashBeforeUpkeep);
    const cash = cashBeforeUpkeep - inheritedUpkeep;
    const tradeAccess = !restricted && (corridor || localExchange);
    const storageDemand = (tradeAccess || sharedReserve) && localBalance > 0 && reserve < reserveCapacity / 2
      ? (localExchange && corridor ? 2 : 1) + extraHandling : 0;
    const request = Math.min(3 + extraHandling, shortage + storageDemand, cash, shortage + reserveCapacity - reserve);
    let migration = 0;
    if (towns >= 2 && shortage && localBalance >= 0) migration = standard ? 0.12 : 0.06;
    if (towns >= 2 && localBalance < 0 && reserve >= 5) migration = standard ? -0.1 : -0.04;
    if (migration > 0) migration = Math.min(migration, Math.max(0, priorPopulation - 1));
    const population = populationUnits(priorPopulation - migration);
    const status = shortage ? "Buying" : offer ? "Food available" : "Holding stocks";
    const access = restricted ? "Restricted" : disrupted ? "Limited river trade" : corridor ? "Open corridor" : priority && offer ? "Priority supply" : "Local trade";
    partners[id] = { status, access, offer, request, reserve, cash, population, shortage, works, ...(inherited ? { inherited: { ...inherited, receipts: inheritedReceipts, upkeepPaid: inheritedUpkeep } } : {}) };
    report.partners.push({ id, name, ...partners[id], bought: 0, sold: 0, migration, freight, openingCash, developmentSpend, reserveCapacity, emergencyFood, jointFreightCash });
    for (const kind of changed) {
      report.developments.push({ partner: id, name, year: game.year, ...workSummary(kind, works[kind]) });
    }
    if (jointProject?.started === game.year || jointProject?.completionYear === game.year) {
      const status = jointProjectOpen ? "open" : "funded";
      report.jointProjects.push({ ...jointProject, name, status, year: game.year });
    }
    report.migration += migration;
    report.cash += freight;
    report.emergencyFood += emergencyFood;
    report.jointFreightCash += jointFreightCash;
    if (agreement) report.agreements.push(`${name} · ${agreement.title}`);
    marketStockAdjustment += offer - request;
    if (priority) marketCapacity += Math.max(0, offer - baselineCapacity);
    if (jointFreight && offer > 0) marketCapacity += extraHandling;
    if (transit && offer > 0) marketCapacity += 1;
  }
  const linkedLoads = game.reports?.at(-1)?.regional?.nationalMarket?.localUnits ?? 0;
  const freight = standard && game.year >= freightCompetitionOpening ? {
    towns, workshops: connectedWorkshops, terminals: freightTerminals, monsoon, partners: freightRivals, linkedLoads,
  } : null;
  report.migration = populationUnits(report.migration);
  return {
    partners, report, freight, marketStockAdjustment: clamp(marketStockAdjustment, -3, 6), marketCapacity: Math.min(5, marketCapacity),
    migration: report.migration, cash: report.cash, emergencyFood: report.emergencyFood,
  };
}

// Attribute actual player transactions after the annual food policy has run.
export function settleNeighborTrade(regional, { bought, sold, buyPrice }) {
  const partners = { ...regional.partners };
  let imports = bought;
  let exports = sold;
  const rows = regional.report.partners.map((row) => {
    const fromPartner = Math.min(imports, row.offer);
    const toPartner = Math.min(exports, row.request);
    imports -= fromPartner;
    exports -= toPartner;
    const reserve = clamp(row.reserve - fromPartner + Math.max(0, toPartner - row.shortage), 0, row.reserveCapacity ?? reserveLimit);
    const cash = row.cash + fromPartner * buyPrice - toPartner;
    const shortage = Math.max(0, row.shortage - toPartner);
    partners[row.id] = { ...partners[row.id], reserve, cash, shortage };
    return { ...row, reserve, cash, shortage, bought: toPartner, sold: fromPartner };
  });
  return {
    ...regional, partners,
    report: { ...regional.report, partners: rows, importUnits: bought - imports, exportUnits: sold - exports },
  };
}
