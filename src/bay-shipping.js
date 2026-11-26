import { periodAmount } from "./period-prices.js";

export const bayOpening = 1950;
export const bayDeadline = 1952;
export const bayShippingSource = "https://www.mha.gov.in/files/annual_reports_documents/REPORT_1950_51_12022021.pdf#page=41";
export const islandMarket = "andamans";
export const bayPorts = {
  bengal: { name: "Calcutta", capacity: 3 },
  madras: { name: "Madras", capacity: 1 },
};
const terms = {
  food: { title: "Protect island food supplies", handling: 6, slot: 2, rate: 3 },
  trade: { title: "Carry commercial timber", handling: 9, slot: 3, rate: 7 },
};
const years = 3;
const foodBuffer = 2;

export function bayShippingPlan(game, portId, { towns, stores, workshops }) {
  if (!game.journey || game.year < bayOpening || game.year > game.journey.end) return null;
  const contract = game.journey.bayCharter;
  const port = bayPorts[portId];
  if (contract && game.year <= contract.end) {
    const status = contract.port === portId ? "operating" : "transferred";
    return { status, contract, port: bayPorts[contract.port], title: terms[contract.id].title };
  }
  if (contract || !port || game.year > bayDeadline || game.year + years - 1 > game.journey.end) return null;
  const options = Object.entries(terms).map(([id, { title, handling, slot, rate }]) => {
    const cost = periodAmount(handling + slot * port.capacity, bayOpening, game.year);
    const reason = towns < 2 ? "Connect another market town."
      : id === "food" && !stores ? "Connect an operating food store."
        : id === "trade" && !workshops ? "Connect an operating workshop."
          : game.cash < cost ? "Treasury cannot cover the charter." : null;
    return { id, title, cost, reason, rate: periodAmount(rate, bayOpening, game.year) };
  });
  return { status: "open", port, options, start: game.year, end: game.year + years - 1,
    capacity: Math.min(port.capacity, Math.max(0, towns - 1)), island: game.journey.partners[islandMarket] };
}

export function acceptBayCharter(game, plan, portId, id) {
  const option = plan?.status === "open" && plan.options.find((offer) => offer.id === id && !offer.reason);
  if (!option) return game;
  return { ...game, cash: game.cash - option.cost, journey: { ...game.journey,
    bayCharter: { id, port: portId, start: plan.start, end: plan.end, fee: option.cost },
  } };
}

export function settleBayCharter(game, portId, island, { stock, demand, shortage, towns, stores, workshops }) {
  const plan = bayShippingPlan(game, portId, { towns, stores, workshops });
  if (!plan?.contract) return null;
  const { contract, port, status, title } = plan;
  const localFloor = Math.ceil(demand / 3);
  const ready = status === "operating" && towns >= 2;
  const capacity = Math.min(port.capacity, Math.max(0, towns - 1));
  const needed = island.shortage + Math.max(0, foodBuffer - island.reserve);
  const supplies = contract.id === "food";
  const food = ready && supplies && stores && !shortage
    ? Math.min(capacity, needed, Math.max(0, stock - localFloor)) : 0;
  const timber = ready && !supplies && workshops ? capacity : 0;
  const covered = Math.min(food, island.shortage);
  const receipt = (food + timber) * periodAmount(terms[contract.id].rate, bayOpening, game.year);
  const reason = status === "transferred" || food || timber ? null : !ready ? "The port needs another linked town."
    : supplies ? !stores ? "No connected store was in service." : !needed ? "Island supplies met demand and filled the reserve."
      : "Home demand and reserves took priority." : "No connected workshop was in service.";
  return { id: contract.id, title, status, port: port.name, portId: contract.port, end: contract.end, food, timber, capacity: port.capacity,
    covered, receipt, fee: game.year === contract.start ? contract.fee : 0, localFloor, reason,
    island: { ...island, shortage: island.shortage - covered, reserve: island.reserve + food - covered } };
}
