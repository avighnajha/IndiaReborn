import { competitiveFreight, contractPlayerBid, contractRivalBid, domesticContractRival, freightCompetitionOpening, maxFreightCapacity, resolveFreightContract, upcomingFreightContract } from "./neighbor-competition.js";
import { clearNationalMarket, inlandActors, marketConnection, marketHubs, nationalMarketActive, nationalMarketActors, playerMarketId, seedBombayDivision, seedPunjabDivision, seedSouthernTransitions } from "./national-market.js";
import { marketFunding } from "./market-finance.js";
import { openingPriceYear, periodAmount } from "./period-prices.js";
import { marketDroughtLoss } from "./food-crisis.js";
import { bayOpening, bayPorts, islandMarket, settleBayCharter } from "./bay-shipping.js";
import { goaMarket, westernExportRival, westernIslands, westernShipping } from "./western-shipping.js";

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
const islandUnionFood = 1;
const workPlans = {
  storage: { title: "Reserve depots", department: "food", cost: 7, years: 2, effect: "Holds 6 more food units and can offer one more unit to a priority buyer." },
  freight: { title: "Freight exchange", department: "trade", cost: 10, years: 2, effect: "Handles more food trade and adds ₹1 lakh for each side when a signed corridor is open." },
  loadingYard: { title: "Freight loading yards", department: "trade", cost: 14, priceYear: 1957, years: 2, effect: "Adds capacity for 3 competitive freight loads each year while the route is open." },
  protection: { title: "Water and crop protection", department: "food", cost: 9, priceYear: 1956, years: 2, effect: "Prevents up to 2 food units of flood or dry-season losses each year." },
  trainingSchool: { title: "Technical school", department: "education", cost: 12, priceYear: 1956, years: 2, effect: "After a year of teaching, earns annual receipts and adds 1 freight bid capacity at an operating exchange." },
  processing: { title: "Food processing workshops", department: "trade", cost: 16, priceYear: 1960, years: 3, effect: "With a trained workforce, earns annual receipts and adds 1 freight bid capacity at an operating exchange." },
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
    const northern = game.journey?.preset === "standard" && jurisdiction?.punjabSuccessor !== "haryana"
      ? [...(game.year >= 1948 ? ["himachal"] : []), ...(game.year >= 1949 ? ["jammu"] : [])] : [];
    if (jurisdiction?.punjabSuccessor) return [jurisdiction.punjabSuccessor === "punjab" ? "haryana" : "punjab", "delhi", "rajasthan", ...northern];
    if (jurisdiction?.punjabEnlarged) return ["delhi", "rajasthan", "up", ...northern];
    return [...(jurisdiction?.punjabPartition ? ["delhi", "rajasthan", "pepsu"] : ["westPunjab", "delhi", "pepsu"]), ...northern];
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
    const roads = game.journey?.preset === "standard" ? [
      ...(game.year >= 1950 ? ["manipur"] : []), ...(game.year >= 1955 ? ["tripura"] : []),
      ...(game.year >= 1972 ? ["arunachal"] : []),
    ] : [];
    return [game.year >= 1947 && game.year < 1950 ? "eastBengal" : "bengal",
      ...(assamNagaHills ? ["nagaland"] : []), ...(assamReorganized ? ["meghalaya", "mizoram"] : []), ...roads];
  }
  if (world.key === "central") return [game.year >= 1960 ? "maharashtra" : "bombay", "up", "orissa",
    game.journey?.jurisdiction?.centralReorganized ? "rajasthan" : "hyderabad"];
  if (world.key === "west-bengal") return ["bihar", "orissa", "eastBengal", ...(game.journey?.preset === "standard" && game.year >= 1975 ? ["sikkim"] : [])];
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

function marketRoadConnection(game, id) {
  return game.journey?.preset === "standard" ? marketConnection(id, game.year) : {};
}

function roadConnection(world, game, id) {
  return ["assam", "punjab", "west-bengal"].includes(world.key) ? marketRoadConnection(game, id) : {};
}

export function neighborsFor(world, game) {
  if (!game.journey) return [];
  return activeActors(world, game).map((id) => {
    const previous = game.journey.partners?.[id];
    const connection = roadConnection(world, game, id);
    return {
      id, name: actorName(id, game.year),
      ...connection,
      funding: marketFunding(id, game.year),
      status: previous?.status ?? "First harvest pending",
      access: previous?.access ?? "Local trade",
      offer: previous?.offer ?? null, request: previous?.request ?? null,
      reserve: previous?.reserve ?? null, cash: previous?.cash ?? null, population: previous?.population ?? null,
      agreement: game.journey.agreements?.[id] ?? null,
      inherited: previous?.inherited ?? null,
      national: previous?.national ?? null,
      works: Object.keys(workPlans).filter((kind) => previous?.works?.[kind])
        .map((kind) => workSummary(kind, previous.works[kind], connection.routeCapacity, connection.mode)),
      development: previous?.development ?? null,
      jointProject: jointProjectStatus(game, id),
    };
  });
}

export function partnerOffers(game, world) {
  const smallState = world.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger";
  const hasRoute = (game.reports?.at(-1)?.towns ?? 0) >= 3 ||
    (game.assets ?? []).some((asset) => asset.kind === "road" && asset.remaining === 0 && game.owners[asset.hex] === world.key);
  return neighborsFor(world, game).flatMap(({ id: partner, name, agreement, works, routeCapacity, mode }) => {
    const depot = works.some((work) => work.id === "storage" && work.status === "open");
    const exchange = works.some((work) => work.id === "freight" && work.status === "open");
    const freightRange = exchange ? "₹2–3 lakh" : "₹1–2 lakh";
    const offers = [
      { kind: "supply", title: "Food supply compact", cost: smallState ? 4 : 7, detail: `Secures priority access to available stocks when your harvest falls short. Set food policy to buy in a shortage to use it.${depot && !routeCapacity ? " Open reserve depots can offer one extra food unit." : ""}` },
      { kind: "corridor", title: "Market corridor agreement", cost: smallState ? 6 : 11, detail: `Funds market access and earns ${freightRange} in freight revenue while the route stays open.${partner === "eastBengal" ? " It also supplies raw jute to Hooghly mills." : " The partner can buy more of your surplus."}` },
    ];
    return offers.map((offer) => ({
      ...offer, id: `${partner}:${offer.kind}`, partner, name,
      ...(routeCapacity ? { detail: offer.kind === "supply"
        ? `Priority access to spare food. Use Buy in a shortage. ${mode === "rail" ? "Rail" : "Road"} limit: ${routeCapacity} ${routeCapacity === 1 ? "unit" : "units"} a year including emergency releases.`
        : `Earn ${freightRange} yearly while open and trade spare food. ${mode === "rail" ? "Rail" : "Road"} limit: ${routeCapacity} ${routeCapacity === 1 ? "unit" : "units"} a year.` } : {}),
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
      completionYear, detail: plan.detail,
      effect: neighbor.routeCapacity ? plan.kind === "reserve"
        ? `Adds 6 units to the partner's reserve capacity. Releases up to ${Math.min(2, neighbor.routeCapacity)} available food ${neighbor.routeCapacity === 1 ? "unit" : "units"} when needed, sharing the ${neighbor.mode === "rail" ? "rail" : "road"} route's annual limit with purchases and sales.`
        : `Earns each government an extra ₹2 lakh per year while the corridor is open. ${neighbor.mode === "rail" ? "Rail" : "Road"} food capacity remains ${neighbor.routeCapacity} ${neighbor.routeCapacity === 1 ? "unit" : "units"} per year.`
        : plan.effect,
      reason,
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

function workSummary(kind, work, routeCapacity, mode = "road") {
  const { title, effect, department } = workPlans[kind];
  const transport = mode === "rail" ? "Rail" : "Road";
  const boundedEffects = routeCapacity ? {
    storage: `Holds 6 more food units. Food ${mode} limit: ${routeCapacity} ${routeCapacity === 1 ? "unit" : "units"}/year.`,
    freight: `Adds ₹1 lakh yearly for each side of an open signed corridor. ${transport} freight limit: ${routeCapacity} ${routeCapacity === 1 ? "load" : "loads"}/year.`,
    loadingYard: `Loading yards operate within the ${mode} freight limit of ${routeCapacity} ${routeCapacity === 1 ? "load" : "loads"}/year.`,
    trainingSchool: `After a year of teaching, earns annual receipts. ${transport} freight limit: ${routeCapacity} ${routeCapacity === 1 ? "load" : "loads"}/year.`,
    processing: `With a trained workforce, earns annual receipts. ${transport} freight limit: ${routeCapacity} ${routeCapacity === 1 ? "load" : "loads"}/year.`,
  } : {};
  return { id: kind, title, effect: boundedEffects[kind] ?? effect, department, status: work.opened ? "open" : "building",
    started: work.started, completionYear: work.completionYear, cost: work.cost, reason: work.reason ?? null };
}

function developmentEffects(prior, year, shock) {
  const opening = (kind) => prior?.works?.[kind]?.opened ?? prior?.works?.[kind]?.completionYear;
  const operates = (kind) => opening(kind) <= year;
  const trained = opening("trainingSchool") < year;
  const processing = trained && operates("processing");
  return {
    harvestSaved: operates("protection") ? Math.min(2, shock) : 0,
    workforceCapacity: Number(trained) + Number(processing),
    trainingReceipts: trained ? periodAmount(1, openingPriceYear, year) : 0,
    processingReceipts: processing ? periodAmount(2, openingPriceYear, year) : 0,
  };
}

function developNeighbor(game, actor, prior, { shortage, balance, towns, agreement, standard, nearbyId, routeCapacity, allocation = 1 }) {
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
    const reasons = {
      storage: foodPressure ? "Recent food shortages." : agreement?.kind === "supply" ? "A signed food supply compact." : "Reserves nearing existing storage capacity.",
      freight: corridor ? "A signed market corridor." : "Surplus food and access to trading towns.",
      loadingYard: "Freight orders and the next contract award.",
      protection: "Recent shortages expose the harvest to weather losses.",
      trainingSchool: "Secure food stocks and an operating freight exchange.",
      processing: "A trained workforce and surplus food to process.",
    };
    if (standard && game.year >= 1956) {
      if (foodPressure && Math.max(actor.flood, actor.dry) >= 2) {
        priorities.unshift("protection");
        justified.protection = true;
      }
      const stable = !foodPressure && balance >= 4 && works.freight?.opened;
      if (stable) {
        priorities.push("trainingSchool");
        justified.trainingSchool = true;
        if (works.trainingSchool?.opened < game.year && game.year >= 1960) {
          priorities.unshift("processing");
          justified.processing = true;
        }
      }
    }
    const tender = nearbyId && domesticContractRival(nearbyId) && upcomingFreightContract(game);
    const canBid = tender && tender.start >= game.year + workPlans.loadingYard.years;
    if (standard && (routeCapacity ?? maxFreightCapacity) > 3 && game.year >= freightCompetitionOpening && freightEligible && !foodPressure && works.freight?.opened &&
      (canBid || prior?.competitionLoads >= 2) && game.year + workPlans.loadingYard.years + 2 <= game.journey.end) {
      priorities.unshift("loadingYard");
      justified.loadingYard = true;
    }
    const uncommittedCash = openingCash + allocation - (standard ? 3 + Math.min(2, shortage) : 3);
    for (const kind of priorities) {
      const plan = workPlans[kind];
      if (works[kind] || !justified[kind] || game.year + plan.years > game.journey.end) continue;
      const cost = periodAmount(plan.cost, plan.priceYear ?? openingPriceYear, game.year);
      if (uncommittedCash < cost) continue;
      works[kind] = { started: game.year, completionYear: game.year + plan.years, cost, reason: reasons[kind] };
      developmentSpend = cost;
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
  const northernTransfer = world.key === "punjab" && id === "himachal";
  if (!world.successors?.[id] && !southernTransfer && !assamTransfer && !centralTransfer && !northernTransfer) return null;
  const owner = world.key === id ? `${id}State`
    : world.key === "assam" && id === "nagaland" && !game.journey?.jurisdiction?.assamNagaland ? "nagaHills" : id;
  const operating = game.assets.filter(({ hex, remaining }) => !remaining && game.owners[hex] === owner);
  if (!operating.length) return null;
  const count = (kind) => operating.filter((asset) => asset.kind === kind).length;
  const campuses = new Set(operating.filter(({ kind }) => ["school", "college", "university", "technicalInstitute", "agriculturalInstitute"].includes(kind)).map(({ hex }) => hex));
  const trainedCohorts = [...campuses].reduce((sum, hex) => sum + Math.floor((game.journey?.cabinet?.education?.[hex]?.years ?? 0) / 5), 0);
  const workforceOutput = count("mill") * trainedCohorts;
  const upkeep = periodAmount(Math.ceil(operating.length / 4), openingPriceYear, game.year);
  return { workshops: count("mill"), storage: count("granary"), irrigation: count("irrigation"), terminals: count("freightTerminal"), upkeep,
    trainedCohorts, workforceOutput, workforceReceipts: periodAmount(workforceOutput * .8, openingPriceYear, game.year, Math.floor) };
}

function inheritedOperatingReceipts(inherited, year) {
  return inherited ? periodAmount(inherited.workshops, openingPriceYear, year) + inherited.workforceReceipts : 0;
}

export function settleNationalTrade(regional, game, world, shipping) {
  if (!game.journey) return regional;
  const standard = nationalMarketActive(game);
  const portId = playerMarketId(game, world);
  const nearbyIsland = game.year >= bayOpening && (Object.hasOwn(bayPorts, portId) || game.journey.bayCharter?.end >= game.year);
  if (!standard && !nearbyIsland) return regional;
  const partners = { ...regional.partners };
  const localIds = regional.report.partners.map(({ id }) => id);
  const local = new Set(localIds);
  const developments = [...(regional.report.developments ?? [])];
  const western = westernShipping(game.year, yearlyRoll(game, actors.kerala.seed + 1925) < 0.16);
  const marketIds = standard ? nationalMarketActors(game, world) : [islandMarket];
  const marketActors = marketIds.map((id) => {
    const actor = actors[id];
    const connection = marketRoadConnection(game, id);
    const funding = marketFunding(id, game.year);
    if (!local.has(id)) {
      const prior = partners[id];
      const inherited = inheritedSuccessorWorks(game, world, id);
      const weather = yearlyRoll(game, actor.seed + 1925);
      const harvest = actor.harvest + Math.floor(yearlyRoll(game, actor.seed) * 6) - 2;
      const shock = marketDroughtLoss(game, id, harvest, weather < 0.16 ? actor.flood : weather > 0.75 ? actor.dry : 0);
      const expandedWheatHarvest = (id === "punjab" || id === "haryana") && game.year >= 1968 ? 2 : 0;
      const development = developmentEffects(prior, game.year, shock);
      const provisions = id === islandMarket ? islandUnionFood : id === westernIslands ? western.islands.provisioned : 0;
      const balance = harvest + expandedWheatHarvest - shock + development.harvestSaved + (inherited?.irrigation ?? 0) + provisions +
        (prior?.reserve ?? 3) - actor.demand;
      const shortage = Math.max(0, -balance);
      const { works, openingCash, developmentSpend, changed } = developNeighbor(game, actor, prior, {
        shortage, balance, towns: 3, standard: true, routeCapacity: connection.routeCapacity, allocation: funding.allocation,
      });
      const inheritedReceipts = inheritedOperatingReceipts(inherited, game.year);
      const cashBeforeUpkeep = openingCash + funding.allocation + development.trainingReceipts + development.processingReceipts + inheritedReceipts - developmentSpend;
      const inheritedUpkeep = Math.min(inherited?.upkeep ?? 0, cashBeforeUpkeep);
      partners[id] = {
        ...prior, ...connection, works, shortage, competitionLoads: 0, population: prior?.population ?? actor.demand,
        reserve: clamp(balance, 0, reserveLimit + (works.storage?.opened ? 6 : 0) + (inherited?.storage ?? 0) * 3),
        cash: cashBeforeUpkeep - inheritedUpkeep,
        development, openingCash, developmentSpend, funding,
        inherited: inherited ? { ...inherited, receipts: inheritedReceipts, upkeepPaid: inheritedUpkeep } : null,
      };
      for (const kind of changed) developments.push({ partner: id, name: actorName(id, game.year), year: game.year, ...workSummary(kind, works[kind], partners[id].routeCapacity, partners[id].mode) });
    }
    const name = game.year === 1946 && id === "madras" ? "Madras Province" : actorName(id, game.year);
    return { id, name, market: marketHubs[id] };
  });
  const island = partners[islandMarket];
  const resolution = island && shipping && settleBayCharter(game, portId, island, shipping);
  let maritime;
  if (resolution) {
    const { island: supplied, ...manifest } = resolution;
    partners[islandMarket] = supplied;
    maritime = manifest;
  }
  if (!standard) return { ...regional, partners, report: { ...regional.report,
    ...(maritime ? { maritime: { ...maritime, islandShortage: partners[islandMarket].shortage, islandReserve: partners[islandMarket].reserve } } : {}),
  } };
  const { market, flows } = clearNationalMarket(game, partners, marketActors, localIds, western);
  for (const node of market.nodes) {
    const partner = partners[node.id];
    node.works = Object.keys(workPlans).filter((kind) => partner.works?.[kind]).map((kind) => workSummary(kind, partner.works[kind], partner.routeCapacity, partner.mode));
    node.development = partner.development;
    node.funding = partner.funding;
    if (node.id === islandMarket) node.unionFood = islandUnionFood;
    if (node.id === westernIslands) node.unionFood = western.islands.provisioned;
    if (partner.inherited) node.inherited = partner.inherited;
    const yard = partners[node.id].works?.loadingYard;
    if (yard) node.loadingYard = { completionYear: yard.completionYear, open: Boolean(yard.opened) };
  }
  for (const { id, cash, reserve, shortage } of market.nodes) {
    partners[id] = { ...partners[id], cash, reserve, shortage, national: flows[id] ?? null };
  }
  const rows = regional.report.partners.map((row) => flows[row.id]
    ? { ...row, cash: partners[row.id].cash, reserve: partners[row.id].reserve, shortage: partners[row.id].shortage, national: flows[row.id] }
    : row);
  if (maritime) {
    const { shortage, reserve } = partners[islandMarket];
    Object.assign(maritime, { islandShortage: shortage, islandReserve: reserve });
    if (maritime.status === "operating") market.charter = maritime;
  }
  const exportRival = westernExportRival(game.year, portId);
  return { ...regional, partners, ...(exportRival && regional.freight ? { freight: { ...regional.freight, exportRival } } : {}),
    report: { ...regional.report, partners: rows, developments, nationalMarket: market,
    ...(maritime ? { maritime } : {}),
  } };
}

function inlandCarriers(market, partners, nearby) {
  if (!market) return [];
  const gateways = new Map(nearby.filter(({ capacity }) => capacity > 0).map((row) => [row.id, row]));
  const nodes = new Map(market.nodes.map((node) => [node.id, node]));
  const carriers = new Map();
  for (const { from, to, capacity: routeLimit, mode } of market.links) {
    if (mode === "sea") continue;
    const gateway = gateways.get(from) ?? gateways.get(to);
    if (!gateway) continue;
    const id = gateway.id === from ? to : from;
    const node = nodes.get(id);
    const { works } = partners[id];
    if (id === goaMarket || node.local || node.shortage || !works?.freight?.opened) continue;
    const development = partners[id].development;
    const workforce = development?.workforceCapacity ?? 0;
    const capacity = Math.min(routeLimit, gateway.capacity, (works.loadingYard?.opened ? 4 : 2) + workforce);
    if ((carriers.get(id)?.capacity ?? 0) >= capacity) continue;
    carriers.set(id, { id, name: node.name, via: gateway.name, capacity });
  }
  return [...carriers.values()];
}

export function settleFreight(regional, game, reliefLoads = 0) {
  const { freight, report } = regional;
  if (!freight) return regional;
  const inland = inlandCarriers(report.nationalMarket, regional.partners, freight.partners);
  const competition = competitiveFreight(game, { ...freight, inland, reliefLoads });
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
  const nationalMarket = market && { ...market,
    ...(competition?.exportRival ? { western: { ...market.western, rival: competition.exportRival } } : {}),
    nodes: market.nodes.map((node) => {
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
  for (const { id, name, agreement, jointProject, routeCapacity, mode, funding } of neighborsFor(world, game)) {
    const actor = actors[id];
    const prior = partners[id];
    const inherited = inheritedSuccessorWorks(game, world, id);
    const roll = yearlyRoll(game, actor.seed);
    const harvest = actor.harvest + Math.floor(roll * 6) - 2;
    const shock = marketDroughtLoss(game, id, harvest, monsoon === "Severe flood" ? actor.flood : monsoon === "Dry monsoon" ? actor.dry : 0);
    const development = developmentEffects(prior, game.year, shock);
    const supply = harvest - shock + development.harvestSaved + (inherited?.irrigation ?? 0);
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
      shortage, balance, towns, agreement, standard, nearbyId: id, routeCapacity, allocation: funding.allocation,
    });
    const depotOpen = Boolean(works.storage?.opened);
    const exchangeOpen = Boolean(works.freight?.opened);
    const jointProjectOpen = jointProject && game.year >= jointProject.completionYear;
    const sharedReserve = jointProjectOpen && jointProject.kind === "reserve";
    const jointFreight = jointProjectOpen && jointProject.kind === "freight" && corridor;
    const reserveCapacity = reserveLimit + (depotOpen ? 6 : 0) + (sharedReserve ? 6 : 0) + (inherited?.storage ?? 0) * 3;
    const reserveBeforeRelease = clamp(balance, 0, reserveCapacity);
    const emergencyFood = sharedReserve && priority && !restricted
      ? Math.min(2, routeCapacity ?? 2, Math.max(0, -localBalance - report.emergencyFood), Math.max(0, reserveBeforeRelease - 3)) : 0;
    const remainingRoadCapacity = (routeCapacity ?? Infinity) - emergencyFood;
    const reserve = reserveBeforeRelease - emergencyFood;
    const reserveTarget = priority ? 1 : standard ? 4 : 3;
    const hasFreightFacility = exchangeOpen || Boolean(inherited?.terminals);
    const localExchange = hasFreightFacility && (towns >= 3 || corridor);
    if (standard && game.year >= freightCompetitionOpening) {
      const reason = restricted ? "Route restricted after a shortfall."
        : !hasFreightFacility ? "Freight exchange has yet to open."
          : !localExchange ? "Needs a connection to your market." : null;
      const addedCapacity = (inherited?.workshops ?? 0) + (inherited?.terminals ?? 0) * 3 + development.workforceCapacity;
      freightRivals.push({ id, name, reason, ...(routeCapacity ? { routeCapacity, mode } : {}),
        capacity: reason ? 0 : Math.min(maxFreightCapacity, routeCapacity ?? maxFreightCapacity, 3 + (works.loadingYard?.opened ? 3 : 0) + addedCapacity) });
    }
    const extraHandling = jointFreight ? 1 : 0;
    const baselineCapacity = Math.min(remainingRoadCapacity, disrupted ? 1 : (towns >= 3 ? 2 : 1) + (localExchange ? 1 : 0) + extraHandling + (transit ? 1 : 0));
    const compactCapacity = priority ? 3 + (depotOpen ? 1 : 0) : corridor ? 1 : 0;
    const offer = restricted ? 0 : clamp(reserve - reserveTarget, 0, Math.min(remainingRoadCapacity, baselineCapacity + compactCapacity));
    const jointFreightCash = jointFreight ? 2 : 0;
    const freight = corridor ? (towns >= 5 ? 2 : 1) + (exchangeOpen ? 1 : 0) + jointFreightCash : 0;
    const inheritedReceipts = inheritedOperatingReceipts(inherited, game.year);
    const cashBeforeUpkeep = openingCash + funding.allocation + freight + inheritedReceipts + development.trainingReceipts + development.processingReceipts - developmentSpend;
    const inheritedUpkeep = Math.min(inherited?.upkeep ?? 0, cashBeforeUpkeep);
    const cash = cashBeforeUpkeep - inheritedUpkeep;
    const tradeAccess = !restricted && (corridor || localExchange);
    const storageDemand = (tradeAccess || sharedReserve) && localBalance > 0 && reserve < reserveCapacity / 2
      ? (localExchange && corridor ? 2 : 1) + extraHandling : 0;
    const request = Math.min(remainingRoadCapacity, 3 + extraHandling, shortage + storageDemand, cash, shortage + reserveCapacity - reserve);
    let migration = 0;
    if (towns >= 2 && shortage && localBalance >= 0) migration = standard ? 0.12 : 0.06;
    if (towns >= 2 && localBalance < 0 && reserve >= 5) migration = standard ? -0.1 : -0.04;
    if (migration > 0) migration = Math.min(migration, Math.max(0, priorPopulation - 1));
    const population = populationUnits(priorPopulation - migration);
    const status = shortage ? "Buying" : offer ? "Food available" : "Holding stocks";
    const access = restricted ? "Restricted" : disrupted ? "Limited river trade" : corridor ? "Open corridor" : priority && offer ? "Priority supply" : "Local trade";
    partners[id] = { status, access, offer, request, reserve, cash, population, shortage, works, development, funding,
      ...(routeCapacity ? { routeCapacity, mode } : {}),
      ...(inherited ? { inherited: { ...inherited, receipts: inheritedReceipts, upkeepPaid: inheritedUpkeep } } : {}) };
    report.partners.push({ id, name, ...partners[id], bought: 0, sold: 0, migration, freight, openingCash, developmentSpend, reserveCapacity, emergencyFood, jointFreightCash });
    for (const kind of changed) {
      report.developments.push({ partner: id, name, year: game.year, ...workSummary(kind, works[kind], routeCapacity, mode) });
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
    if (jointFreight && offer > 0 && !routeCapacity) marketCapacity += extraHandling;
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
    const remainingCapacity = Math.max(0, (row.routeCapacity ?? Infinity) - (row.emergencyFood ?? 0));
    const fromPartner = Math.min(imports, row.offer, remainingCapacity);
    const toPartner = Math.min(exports, row.request, remainingCapacity - fromPartner);
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
