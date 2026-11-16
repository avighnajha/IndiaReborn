export const reserveStart = 1957;
const noticeYear = reserveStart - 1;
const reserveEnd = 1960;
const price = 2;
const openingStock = 4;

const terms = {
  supply: { title: "Supply agreement", floor: 4, quota: 6 },
  buffer: { title: "Protected reserve", floor: 9, quota: 3 },
};

function agreement(game) {
  const id = game.journey?.unionReserve?.choice;
  return Object.hasOwn(terms, id) ? terms[id] : null;
}

export function reserveStatus(game) {
  if (!game.journey || game.year < noticeYear || game.year > reserveEnd) return "closed";
  if (game.year < reserveStart) return "notice";
  if (agreement(game)) return "signed";
  return game.year === reserveStart ? "open" : "closed";
}

export function reserveWindow(game) {
  return Boolean(game.journey) && game.year >= noticeYear && game.year <= reserveEnd;
}

function deliveries(option, capacity, available) {
  return Math.max(0, Math.min(capacity, option.quota, available - option.floor));
}

export function reservePlan(game, { capacity, depotNames, storage }, food) {
  const status = reserveStatus(game);
  const cases = (reserveWindow(game) ? food.cases : []).map(({ name, harvest }) => ({ name, harvest,
    demand: food.demand, available: Math.max(0, food.reserve + harvest - food.demand),
  }));
  const offers = Object.entries(terms).map(([id, option]) => ({
    id, ...option, rate: price,
    reason: (status === "notice" || status === "open") && !capacity ? "Requires a market-connected food store and two linked towns." : null,
    projections: cases.map(({ name, available }) => {
      const shipped = deliveries(option, capacity, available);
      return { name, shipped, proceeds: shipped * price, reserve: Math.min(storage, available - shipped) };
    }),
  }));
  return { year: game.year, status, start: reserveStart, end: reserveEnd, floor: agreement(game)?.floor ?? null,
    depotNames, capacity, stock: game.journey?.unionReserve?.stock ?? openingStock, outlook: food.outlook, cases, offers,
    last: game.reports.findLast((report) => report.unionReserve)?.unionReserve ?? null };
}

export function signReserve(game, id, capacity) {
  if (!Object.hasOwn(terms, id) || reserveStatus(game) !== "open" || !capacity) return game;
  return { ...game, journey: { ...game.journey, unionReserve: { ...game.journey.unionReserve, choice: id } } };
}

export function resolveReserve(game, capacity, available, deficit) {
  if (game.year < reserveStart || !reserveWindow(game)) return null;
  const option = agreement(game);
  const opening = game.journey.unionReserve?.stock ?? openingStock;
  const shipped = option && !deficit ? deliveries(option, capacity, available) : 0;
  const released = game.year > reserveStart ? Math.min(3, capacity, opening, deficit) : 0;
  if (!option && !released) return null;
  return { year: game.year, floor: option?.floor ?? null, capacity, opening, shipped, released,
    proceeds: shipped * price, closing: opening + shipped - released };
}
