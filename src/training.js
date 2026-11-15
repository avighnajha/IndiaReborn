import { campaignEnd, settlement } from "./journey.js";
import { Fiscal } from "./fiscal.js";
import { World } from "./scenario.js";

export const charterOpening = 1953;
export const apprenticeshipOutput = 3;
export const extensionYield = 1;
export const extensionFloodRecovery = 2;
export const extensionDryRecovery = 1;
const requiredSchools = 2;

const paths = {
  apprenticeships: {
    title: "Industrial Apprenticeships",
    requirement: "Connect an operating workshop to a market.",
    effects: [`+${apprenticeshipOutput} output per served workshop each year.`, "Workshop output raises local receipts."],
  },
  extension: {
    title: "Agricultural Extension",
    requirement: "Open at least one irrigated growing area.",
    effects: [`+${extensionYield} food per served growing area each year.`,
      `Recovers up to ${extensionDryRecovery} dry-season loss or ${extensionFloodRecovery} uncovered flood losses per area.`],
  },
};

function fees(game) {
  if (World.key === "bihar") return { cost: 18, upkeep: 4 };
  if (World.key === "west-bengal") return { cost: 17, upkeep: 4 };
  if (World.key === "bombay") return game.journey?.jurisdiction?.bombaySuccessor === "gujarat" ? { cost: 14, upkeep: 3 } : { cost: 19, upkeep: 4 };
  if (World.key === "mayurbhanj" && settlement(game) !== "merger") return { cost: 8, upkeep: 2 };
  return { cost: 13, upkeep: 3 };
}

function siteLabel({ hex }) {
  const tile = World.tiles[hex];
  return { id: hex, name: tile.town?.name ?? World.districts[tile.district] };
}

export function trainingModel(game, schools = [], works = {}) {
  if (!game.journey) return { available: false, status: "closed", message: "", charter: null, options: [], capacity: 0 };
  const charter = game.journey.training;
  const end = campaignEnd(game);
  const capacity = schools.length;
  const schoolSites = schools.map(siteLabel);
  const territoryReason = capacity < requiredSchools ? "Two schools must each have a full year of teaching behind them." : null;
  const adoptionReason = game.year >= end ? "A new charter needs a year to prepare."
    : game.year < charterOpening ? `Charters open in ${charterOpening}.`
      : territoryReason;
  const price = fees(game);
  const options = Object.entries(paths).map(([id, path]) => {
    const selected = charter?.id === id;
    const terms = selected ? { cost: charter.cost, upkeep: charter.upkeep } : price;
    const sites = (works[id] ?? []).slice(0, capacity).map(siteLabel);
    const reason = charter ? (selected ? "Charter adopted." : "The teaching network is committed to the other charter.")
      : adoptionReason ?? (!sites.length ? path.requirement : game.cash < terms.cost ? "The treasury cannot cover the setup cost." : null);
    return { id, selected, title: path.title, effects: path.effects, ...terms, sites, reason };
  });
  const selected = options.find((option) => option.selected);
  let status = "locked";
  let message = adoptionReason ?? "Prepare a workshop or an irrigated growing area to unlock a charter.";
  if (game.year > end) {
    status = "closed";
    message = selected ? `${selected.title} was adopted in ${charter.authorized}.` : "The campaign has ended.";
  } else if (selected) {
    const pause = territoryReason ?? (!selected.sites.length ? paths[selected.id].requirement
      : game.cash < selected.upkeep ? `Set aside ${Fiscal.lakh(selected.upkeep)} before advancing to fund this year’s service.` : null);
    status = game.year < charter.opens ? "preparing" : pause ? "paused" : "operating";
    message = status === "preparing" ? `Preparing to open in ${charter.opens}.`
      : pause ?? `${selected.sites.length} of ${capacity} teaching teams assigned.`;
  } else if (options.some(({ reason }) => !reason)) {
    status = "ready";
    message = "Choose where to send the network’s teaching teams.";
  } else if (!adoptionReason && options.some(({ sites }) => sites.length)) {
    message = "Build up the treasury to cover the charter setup cost.";
  }
  return { available: true, status, message, charter: charter?.id ?? null, options, capacity, schoolSites };
}
