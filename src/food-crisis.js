import { openingPriceYear, periodAmount } from "./period-prices.js";

export const crisisYears = [1965, 1966];
export const crisisSource = "https://thedocs.worldbank.org/en/doc/658351619025491246-0240021967/original/WorldBankGroupArchivesFolder1844626.pdf";
export const dispatchSource = "https://apfinance.gov.in/pbs-1967-middle.html";
export const distributionOpening = 1982;
export const distributionSource = "https://www.indiabudget.gov.in/budget_archive/es1982-83/5%20Prices%20and%20Price%20Policy.pdf";

// Model crop losses, rather than copying rainfall deficits into yield. Smaller
// values cover affected parts of larger markets (western Rajasthan, Vidarbha and Rayalaseema).
const lateDrought = {
  bihar: .22, madras: .22, gujarat: .20, himachal: .24, jammu: .24,
  rajasthan: .12, maharashtra: .10, andhra: .08, up: .06,
};

export function lateDroughtSeverity(game, market) {
  return game.journey && game.year === distributionOpening ? lateDrought[market] ?? 0 : 0;
}

export function crisisSeverity(game, region) {
  if (!game.journey || !crisisYears.includes(game.year)) return 0;
  if (region === "bihar") return game.year === 1965 ? .37 : .48;
  if (region === "orissa" || (region === "mayurbhanj" && game.journey.jurisdiction?.settlement === "merger")) {
    return game.year === 1965 ? .31 : .37;
  }
  return 0;
}

export function crisisDelivery(game, { harvest, demand, towns, terminals, cash }) {
  const rate = periodAmount(3, openingPriceYear, game.year);
  const gap = Math.max(0, demand - harvest);
  const capacity = Math.min(8, Math.max(1, towns - 1) + terminals * 2);
  const possible = Math.min(capacity, gap, Math.floor(cash / rate));
  const ordered = game.crisisOrder?.year === game.year;
  const delivered = ordered ? possible : 0;
  const loading = game.journey.preset === "standard";
  return { ordered, rate, capacity, possible, delivered, cost: delivered * rate,
    freightCapacityUsed: loading ? Math.ceil(delivered / 2) : 0, loading };
}

export function marketDroughtLoss(game, id, harvest, seasonalLoss) {
  const severity = id === "up" && crisisYears.includes(game.year)
    ? (game.year === 1965 ? .18 : .25) : crisisSeverity(game, id) || lateDroughtSeverity(game, id);
  return severity ? Math.round(harvest * severity) : seasonalLoss;
}
