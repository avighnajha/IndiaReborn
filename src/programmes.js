import { World } from "./scenario.js";
import { bombaySuccessor, campaignEnd, madrasSuccessor, punjabSuccessor, reorganization, settlement } from "./journey.js";
import { departmentProgrammes } from "./department-content.js";
import { mayurbhanjProgrammes } from "./mayurbhanj-programmes.js";
import { mahanadiAgreements, orissaProgrammes } from "./orissa-programmes.js";
import { bengalProgrammes, damodarAgreements } from "./west-bengal-programmes.js";
import { bombayBasinAgreements, bombayProgrammes } from "./bombay-programmes.js";
import { punjabBasinAgreements, punjabProgrammes } from "./punjab-programmes.js";
import { andhraBasinAgreements, madrasBasinAgreements, madrasProgrammes } from "./madras-programmes.js";
import { assamBasinAgreements, assamProgrammes } from "./assam-programmes.js";
import { centralBasinAgreements, centralProgrammes } from "./central-programmes.js";
import { campaignPriceYear, openingPriceYear, periodAmount } from "./period-prices.js";
import { partnershipProgrammes, partnershipWindow } from "./partnerships.js";

const work = (kind, q, r, year) => ({ kind, hex: World.id(q, r), year });

const biharProgrammes = {
  food: {
    title: "Northern Food Security", district: "Muzaffarpur and the northern plains", theme: "Food and water", color: 0x9fc783,
    cost: 29, layer: "terrain", opening: true,
    pitch: "Put reliable grain ahead of rapid industrial growth.", outcome: "Expands harvest in two areas and adds storage for 10 more grain. The first fields enter production this year.",
    next: "Opens negotiations for a Kosi flood programme.",
    works: [work("irrigation", 5, 4, 1), work("granary", 6, 4, 2), work("irrigation", 7, 3, 2)],
  },
  trade: {
    title: "Ganga Market Corridor", district: "Patna, Muzaffarpur and Darbhanga", theme: "Transport and industry", color: 0xe7bc73,
    cost: 32, layer: "access", opening: true,
    pitch: "Link the northern towns to Patna, then put a workshop on the new corridor.", outcome: "The first crossing opens Muzaffarpur to trade. The full corridor links Darbhanga and brings its workshop online.",
    next: "Opens a proposal for a southern industrial belt.",
    works: [work("road", 6, 5, 1), work("road", 7, 4, 2), work("road", 8, 4, 2), work("mill", 8, 3, 3)],
  },
  skills: {
    title: "Technical Education Network", district: "Patna, Gaya and Ranchi", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 31, layer: "terrain", opening: true,
    pitch: "Invest in workers now to make later industry more productive.", outcome: "Three schools open over three years. The first two open in year two, and skills accumulate after opening.",
    next: "A trained workforce attracts an applied industry partnership.",
    works: [work("school", 6, 6, 2), work("school", 6, 7, 2), work("school", 8, 11, 3)],
  },
  kosi: {
    title: "Kosi Flood Compact", district: "Saharsa and the Kosi basin", theme: "Food and water", color: 0x9fc783,
    layer: "weather", requires: "food",
    pitch: "Choose how much of the basin to protect and how to finance the works.", outcome: "Compare local financing with a wider agreement backed by the Union.",
    next: "Finished flood works strengthen your case for Union matching funds.",
    works: [work("granary", 11, 4, 1), work("levee", 10, 4, 2), work("irrigation", 10, 3, 2), work("levee", 11, 3, 3), work("irrigation", 11, 2, 3)],
  },
  industry: {
    title: "Southern Industrial Belt", district: "Jamshedpur, Dhanbad and Hazaribagh", theme: "Transport and industry", color: 0xe7bc73,
    cost: 64, layer: "access", requires: "trade",
    pitch: "Put the mineral belt and southern towns at the centre of development.", outcome: "Connects Dhanbad to the Jamshedpur hub and builds workshops across three towns. Capital is tied up for three years.",
    next: "More industry increases recurring revenue and rewards a trained workforce.",
    works: [work("road", 11, 11, 1), work("road", 12, 10, 2), work("mill", 11, 12, 2), work("mill", 12, 9, 3), work("mill", 8, 9, 3)],
  },
  applied: {
    title: "Applied Industry Partnership", district: "Patna, Gaya and Muzaffarpur", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 55, layer: "terrain", requires: "skills",
    pitch: "Give trained workers places to put their skills to use.", outcome: "Builds three workshops. Their returns are strongest if you also connect the northern towns to market.",
    next: "Stronger workshop income funds the next regional commitment.",
    works: [work("mill", 6, 6, 2), work("mill", 6, 7, 2), work("mill", 6, 4, 3)],
  },
};

const basin = biharProgrammes.kosi.works;
const kosiAgreements = {
  focused: {
    title: "Saharsa protection", funding: "Bihar funds", area: "Saharsa and one growing area",
    detail: "The quickest route to protection. The second growing area stays exposed.", total: 39, union: 0, works: basin.slice(0, 3),
  },
  basin: {
    title: "Bihar basin plan", funding: "Bihar funds", area: "Saharsa and two growing areas",
    detail: "Bihar covers the full cost to bring the second set of defences online sooner.", total: 65, union: 0, works: basin,
  },
  union: {
    title: "Union basin agreement", funding: "Union co-funding", area: "Saharsa and two growing areas",
    detail: "The Union pays part of the cost. A joint review adds a year before the defences open and sets the delivery timetable.", total: 70, union: 24,
    works: basin.map((item) => item.kind === "granary" ? item : { ...item, year: item.year + 1 }),
  },
};

const northSkills = {
  title: "Ganga Polytechnic Network", district: "Patna, Muzaffarpur and Darbhanga", theme: "Skills and prosperity", color: 0x8fcac0,
  cost: 37, layer: "terrain", split: true,
  pitch: "Give the northern administration its own technical colleges.", outcome: "Build three schools on the Ganga corridor.",
  next: "The colleges support a northern workshop network.",
  works: [work("school", 6, 6, 1), work("school", 6, 4, 2), work("school", 8, 3, 3)],
};
const northIndustry = {
  title: "Northern Industrial Cooperatives", district: "Patna, Gaya and the northern market towns", theme: "Transport and industry", color: 0xe7bc73,
  cost: 48, layer: "access", split: true, requires: "northSkills",
  pitch: "Build a manufacturing base inside the new border.", outcome: "Connected northern towns host three workshops.",
  next: "Training and trade access determine how much they produce.",
  works: [work("mill", 6, 6, 1), work("mill", 6, 7, 2), work("mill", 6, 4, 3)],
};

const longBihar = {
  floodplainRenewal: {
    title: "Eastern Floodplain Renewal", district: "Saharsa, Purnea and the Ganga plain", theme: "Food and water", color: 0x9fc783, layer: "weather",
    era: 1966, priceYear: 1966, cost: 112, pitch: "Reinforce the eastern food supply as demand grows.",
    outcome: "Add two growing areas and reserve storage in Purnea, with further flood protection.",
    next: "The added capacity helps preserve reserves between poor monsoons.",
    works: [work("irrigation", 8, 5, 1), work("granary", 14, 3, 2), work("levee", 12, 5, 3), work("irrigation", 9, 6, 4)],
  },
  apprenticeshipNetwork: {
    title: "Provincial Apprenticeship Network", district: "Motihari, Darbhanga and Bhagalpur", theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain",
    era: 1973, priceYear: 1973, cost: 154, pitch: "Spread industrial training to three more centres.",
    outcome: "Add three technical schools and place a second industrial centre in the east.",
    next: "This is a longer investment in skills and production capacity.",
    works: [work("school", 3, 4, 2), work("school", 8, 3, 3), work("school", 13, 6, 4), work("mill", 13, 6, 4)],
  },
};
const longOrissa = {
  deltaRenewal: {
    title: "Delta Water Security", district: "Lower Mahanadi and Bhadrak", theme: "Food and water", color: 0x9fc783, layer: "weather",
    era: 1966, priceYear: 1966, cost: 96, pitch: "Strengthen the delta harvest and increase emergency storage.",
    outcome: "Extend flood defences and irrigated land, with reserve capacity at Bhadrak.",
    next: "Reserve capacity helps during successive bad seasons.",
    works: [work("irrigation", 13, 5, 1), work("granary", 12, 4, 2), work("levee", 13, 6, 3), work("irrigation", 12, 7, 4)],
  },
  coastalApprenticeships: {
    title: "Coastal Apprenticeship Network", district: "Balasore, Bhadrak and Bhubaneswar", theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain",
    era: 1973, priceYear: 1973, cost: 147, pitch: "Train coastal workers as industry spreads beyond Cuttack.",
    outcome: "Open three schools and a workshop in Balasore.",
    next: "A connected workshop can benefit from Hirakud power.",
    works: [work("school", 10, 7, 2), work("school", 12, 4, 3), work("school", 14, 2, 4), work("mill", 14, 2, 4)],
  },
};
const localRenewal = {
  title: "Similipal Rural Services", district: "Jashipur and Udala", theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain",
  era: 1966, priceYear: 1966, cost: 28, pitch: "Use local revenues to reach settlements beyond Baripada.",
  outcome: "Add training at Jashipur and storage at Udala.",
  next: "Food and workforce capacity support continued local autonomy.",
  works: [work("granary", 12, 2, 1), work("school", 10, 1, 3)],
};

const expandedOrissa = Object.fromEntries(Object.entries({ ...orissaProgrammes, ...longOrissa }).map(([key, plan]) => [
  `orissa_${key}`, { ...plan, requires: plan.requires ? `orissa_${plan.requires}` : undefined, opening: false, merger: true },
]));
const regionalProgrammes = World.key === "mayurbhanj"
  ? { ...mayurbhanjProgrammes, localRenewal, ...expandedOrissa }
  : World.key === "orissa" ? { ...orissaProgrammes, ...longOrissa }
  : World.key === "west-bengal" ? bengalProgrammes
  : World.key === "bombay" ? Object.fromEntries(Object.entries(bombayProgrammes).map(([id, plan]) =>
    [id, plan.bombaySuccessor ? plan : { ...plan, bombayBeforeSplit: true }]))
  : World.key === "punjab" ? Object.fromEntries(Object.entries(punjabProgrammes).map(([id, plan]) =>
    [id, plan.punjabSuccessor ? plan : { ...plan, punjabBeforeSplit: true }]))
  : World.key === "madras" ? Object.fromEntries(Object.entries(madrasProgrammes).map(([id, plan]) =>
    [id, plan.madrasSuccessor ? plan : { ...plan, madrasBeforeSplit: true }]))
  : World.key === "central" ? centralProgrammes
  : World.key === "assam" ? assamProgrammes : { ...biharProgrammes, northSkills, northIndustry, ...longBihar };
function regionalPriceYear(plan) {
  if (plan.priceYear) return plan.priceYear;
  if (plan.punjabSuccessor) return 1966;
  if (plan.bombaySuccessor) return 1960;
  if (plan.split || plan.bombayEnlarged || plan.punjabEnlarged || plan.madrasReorganized || plan.centralReorganized) return 1956;
  if (plan.madrasSuccessor) return 1953;
  return openingPriceYear;
}

export const programmes = {
  ...Object.fromEntries(Object.entries(regionalProgrammes).map(([id, plan]) => [id, { ...plan, priceYear: regionalPriceYear(plan) }])),
  ...departmentProgrammes(World),
  ...partnershipProgrammes(World.key),
};
export { partnershipWindow };
const regionalAgreements = World.key === "bihar" ? kosiAgreements : World.key === "west-bengal" ? damodarAgreements
  : World.key === "bombay" ? bombayBasinAgreements : World.key === "punjab" ? punjabBasinAgreements
    : World.key === "central" ? centralBasinAgreements : World.key === "assam" ? assamBasinAgreements : mahanadiAgreements;
const basinProgrammes = World.key === "madras" ? { cauvery: madrasBasinAgreements, krishna: andhraBasinAgreements }
  : { [World.basinProgramme]: regionalAgreements };
export const basinAgreementsFor = (id) => basinProgrammes[id];
export const basinNameFor = (id) => id === "krishna" ? "Krishna" : World.basinName;

function availablePlan(game, plan) {
  return (!plan.treeOnly || game.journey) && (!plan.split || reorganization(game) === "split") && (!plan.merger || settlement(game) === "merger") &&
    (!plan.bombaySuccessor || bombaySuccessor(game) === plan.bombaySuccessor) &&
    (!plan.bombayExcludes || bombaySuccessor(game) !== plan.bombayExcludes) &&
    (!plan.bombayBeforeSplit || !bombaySuccessor(game)) && (!plan.bombayEnlarged || game.journey?.jurisdiction?.bombayEnlarged) &&
    (!plan.punjabSuccessor || punjabSuccessor(game) === plan.punjabSuccessor) &&
    (!plan.punjabExcludes || punjabSuccessor(game) !== plan.punjabExcludes) &&
    (!plan.punjabBeforeSplit || !punjabSuccessor(game)) && (!plan.punjabEnlarged || game.journey?.jurisdiction?.punjabEnlarged) &&
    (!plan.madrasSuccessor || madrasSuccessor(game) === plan.madrasSuccessor) &&
    (!plan.madrasExcludes || madrasSuccessor(game) !== plan.madrasExcludes) &&
    (!plan.madrasBeforeSplit || !madrasSuccessor(game)) && (!plan.madrasReorganized || game.journey?.jurisdiction?.madrasReorganized) &&
    (!plan.centralReorganized || game.journey?.jurisdiction?.centralReorganized) &&
    (!plan.centralBeforeReorganization || !game.journey?.jurisdiction?.centralReorganized) &&
    (!plan.bengalTransfer || game.journey?.jurisdiction?.bengalTransfer === "receiveDistricts") &&
    (!plan.era || (game.journey && game.year >= plan.era && campaignEnd(game) >= plan.era));
}

export function visibleProgrammes(game) {
  return Object.fromEntries(Object.entries(programmes).filter(([id, plan]) =>
    (availablePlan(game, plan) && (!plan.partnership || game.year <= partnershipWindow.closes && !partnershipRecord(game))) ||
    records(game).some((record) => record.id === id)));
}

const worksFor = (game, footprint) => footprint.filter(({ kind, hex }) => !game.assets.some((asset) => asset.kind === kind && asset.hex === hex));
const length = (works) => Math.max(0, ...works.map(({ year }) => year));

function records(game) {
  return game.programmes ?? [];
}

export function partnershipRecord(game) {
  return records(game).find(({ partnership }) => partnership);
}

export function planningPartnership(game) {
  const record = partnershipRecord(game);
  if (!game.journey || (!record && (game.year < partnershipWindow.notice || game.year > partnershipWindow.closes))) return null;
  const options = Object.entries(programmes).filter(([id, plan]) => plan.partnership && (!record || record.id === id))
    .map(([id, plan]) => ({ id, plan, quote: programmeQuote(game, id), requirements: programmeRequirements(game, id) }));
  return options.length ? { record, options } : null;
}

function remainingWorks(game, id) {
  return game.assets.filter((asset) => asset.programme === id && asset.remaining > 0 && game.owners[asset.hex] === World.key);
}

export function activeProgramme(game) {
  return records(game).find(({ id, finish }) => finish >= game.year && remainingWorks(game, id).length);
}

export function programmeCommissioned(game, id) {
  return Boolean(programmes[id]) && programmeFootprint(game, id).every(({ kind, hex }) => game.owners[hex] === World.key && game.assets.some((asset) => asset.kind === kind && asset.hex === hex && asset.remaining === 0));
}

export function programmeRequirements(game, id) {
  const plan = programmes[id];
  const requirements = [];
  if (plan.requires) requirements.push({
    ids: [plan.requires], text: programmes[plan.requires].title, met: programmeCommissioned(game, plan.requires),
  });
  for (const group of plan.prerequisiteGroups ?? []) {
    const alternatives = group.filter((key) => availablePlan(game, programmes[key]) || programmeCommissioned(game, key));
    requirements.push({ ids: alternatives, text: alternatives.map((key) => programmes[key].title).join(" or "),
      met: alternatives.some((key) => programmeCommissioned(game, key)) });
  }
  if (plan.minimumSchools) requirements.push({
    ids: ["skills", "northSkills", "orissa_skills", "mh_skills", "gj_skills", "pb_skills", "hr_skills", "tn_skills", "ap_skills"], text: `${plan.minimumSchools} operating schools`,
    met: game.assets.filter(({ kind, hex, remaining }) => kind === "school" && !remaining && game.owners[hex] === World.key).length >= plan.minimumSchools,
  });
  if (plan.charter) requirements.push({
    ids: [`charter:${plan.charter}`], text: plan.charter === "apprenticeships" ? "Industrial Apprenticeships charter" : "Agricultural Extension charter",
    met: game.journey?.training?.id === plan.charter,
  });
  return requirements;
}

export function programmeFootprint(game, id, agreement = "focused") {
  const agreements = basinAgreementsFor(id);
  if (!agreements) return programmes[id].works;
  const approved = records(game).find((record) => record.id === id);
  if (approved) return approved.terms?.footprint ?? agreements[approved.terms?.agreement]?.works ?? programmes[id].works;
  return agreements[agreement].works;
}

export function programmeQuote(game, id, agreement = "focused") {
  const plan = programmes[id];
  if (!plan) return { reason: "Unknown programme." };
  if (plan.treeOnly && !game.journey) return { reason: "Available in a founding campaign." };
  if (!availablePlan(game, plan)) return { reason: "This programme requires a different territorial settlement." };
  const agreements = basinAgreementsFor(id);
  const terms = agreements?.[agreement];
  if (agreements && !terms) return { reason: "Unknown basin agreement." };
  const footprint = terms?.works ?? plan.works;
  const works = worksFor(game, footprint);
  const duration = length(works);
  const priority = game.decisions[1947];
  const category = (plan.requires ?? id).replace("orissa_", "");
  const preferred = category === (priority === "roads" ? "trade" : priority);
  const proportion = works.length / footprint.length;
  const priceYear = terms?.priceYear ?? plan.priceYear;
  const year = campaignPriceYear(game);
  const subsidy = game.year <= 1951 && preferred ? 3 : 0;
  const financed = (terms?.total ?? plan.cost) * proportion;
  const unionShare = (terms?.union ?? plan.partnership ?? 0) * proportion;
  const union = periodAmount(unionShare, priceYear, year, Math.floor);
  const cost = Math.max(0, periodAmount(financed, priceYear, year, Math.ceil) - union - subsidy);
  const pricing = game.journey ? {
    year, priceYear, baseCost: Math.max(0, Math.ceil(financed) - Math.floor(unionShare) - subsidy),
  } : null;
  const missing = programmeRequirements(game, id).find(({ met }) => !met);
  let reason;
  if (game.year > campaignEnd(game)) reason = "Campaign complete.";
  else if (records(game).some((record) => record.id === id)) reason = "Already commissioned.";
  else if (plan.partnership && partnershipRecord(game)) reason = "The other partnership has the Union allocation.";
  else if (plan.partnership && game.year < partnershipWindow.opens) reason = `Applications open in ${partnershipWindow.opens}.`;
  else if (plan.partnership && game.year > partnershipWindow.closes) reason = "The Union offer has closed.";
  else if (!works.length) reason = footprint.some(({ kind, hex }) => game.assets.some((asset) => asset.kind === kind && asset.hex === hex && asset.remaining > 0))
    ? "These works are already under construction." : "Already commissioned.";
  else if (missing) reason = plan.requires && !plan.treeOnly && !plan.partnership ? `Unlocks when ${missing.text} is complete.` : `Requires ${missing.text}.`;
  else if (footprint.some(({ hex }) => game.owners[hex] !== World.key)) reason = "Part of this programme lies outside your administration.";
  else if (activeProgramme(game)) reason = "The works office is delivering another programme.";
  else if (game.year + duration - 1 > campaignEnd(game)) reason = "This programme would finish after the campaign.";
  else if (World.mapKey === "orissa" && id === World.basinProgramme && agreement === "union" &&
    game.decisions[World.key === "mayurbhanj" ? 1951 : 1948] !== "survey") reason = "The basin and resettlement survey is required.";
  else if (game.cash < cost) reason = "The treasury cannot cover this commitment yet.";
  return { works, duration, cost, union, pricing, reason };
}

export function approveProgramme(game, id, agreement = "focused") {
  const quote = programmeQuote(game, id, agreement);
  if (quote.reason) return game;
  const assets = quote.works.map(({ kind, hex, year }) => ({ id: `${hex}:${kind}`, hex, kind, started: game.year, remaining: year, programme: id }));
  const record = { id, approved: game.year, finish: game.year + quote.duration - 1, cost: quote.cost };
  if (quote.pricing) record.pricing = quote.pricing;
  if (programmes[id].partnership) record.partnership = { union: quote.union };
  const agreementTerms = basinAgreementsFor(id)?.[agreement];
  if (agreementTerms) record.terms = {
    agreement, union: quote.union,
    footprint: agreementTerms.works.map(({ kind, hex }) => ({ kind, hex })),
  };
  return {
    ...game, cash: game.cash - quote.cost, assets: [...game.assets, ...assets],
    programmes: [...records(game), record],
  };
}

export function accelerationQuote(game, id) {
  const record = records(game).find((entry) => entry.id === id);
  if (!record || !remainingWorks(game, id).some(({ remaining }) => remaining > 1) || record.accelerated || record.finish <= game.year ||
    record.terms?.agreement === "union" || basinFloodDecision(game)?.id === id) return null;
  const cost = Math.ceil(record.cost / 4);
  return { cost, finish: record.finish - 1, affordable: game.cash >= cost };
}

export function basinFloodDecision(game) {
  const last = game.reports.at(-1);
  if (game.year > campaignEnd(game) || last?.monsoon !== "Severe flood") return null;
  const record = records(game).find(({ id, terms, floodResponse, approved }) => terms && !floodResponse && last.year >= approved &&
    remainingWorks(game, id).some(({ kind }) => kind === "levee"));
  if (!record) return null;
  const cost = periodAmount(World.key === "bihar" ? 8 : 6, openingPriceYear, campaignPriceYear(game));
  return { id: record.id, cost, finish: record.finish, delayedFinish: record.finish + 1 };
}

export function respondToBasinFlood(game, response) {
  const decision = basinFloodDecision(game);
  if (!decision || (response !== "repair" && response !== "delay")) return game;
  const cost = response === "repair" ? decision.cost : 0;
  if (game.cash < cost) return game;
  const delay = response === "delay" ? 1 : 0;
  return {
    ...game, cash: game.cash - cost,
    assets: game.assets.map((asset) => delay && asset.programme === decision.id && asset.remaining > 0 && game.owners[asset.hex] === World.key ? { ...asset, remaining: asset.remaining + delay } : asset),
    programmes: records(game).map((record) => record.id === decision.id ? {
      ...record, finish: record.finish + delay, floodResponse: { year: game.year, response, cost, finish: record.finish + delay },
    } : record),
  };
}

export function accelerateProgramme(game, id) {
  const quote = accelerationQuote(game, id);
  if (!quote?.affordable) return game;
  return {
    ...game, cash: game.cash - quote.cost,
    assets: game.assets.map((asset) => asset.programme === id && asset.remaining > 1 && game.owners[asset.hex] === World.key ? { ...asset, remaining: asset.remaining - 1 } : asset),
    programmes: records(game).map((record) => record.id === id ? { ...record, finish: quote.finish, accelerated: true } : record),
  };
}
