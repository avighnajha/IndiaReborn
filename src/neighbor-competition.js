export const freightCompetitionOpening = 1957;
export const maxFreightCapacity = 14;
const firstContract = 1961;
const contractYears = 5;
const minimumCapacity = 5;
const fee = 6;

function playerFreight({ towns, workshops, terminals }) {
  const reason = towns < 3 ? "Connect at least three market towns." : workshops < 1 ? "Open a market-connected workshop." : null;
  return {
    name: "Your administration", towns, workshops, terminals, reason,
    capacity: reason ? 0 : Math.min(maxFreightCapacity, towns - 2 + workshops + terminals * 3),
  };
}

export function contractPlayerBid(freight) {
  const { name, reason, towns, workshops, terminals } = playerFreight(freight);
  return { name, reason, capacity: reason ? 0 : Math.min(maxFreightCapacity, Math.min(2, towns - 2) + workshops + terminals * 3) };
}

export const domesticContractRival = (id) => id !== "eastBengal" && id !== "westPunjab";

export function contractRivalBid(row, byYear = 0) {
  const { id, name, access, works, inherited } = row;
  const willOperate = (kind) => works?.[kind]?.opened || (byYear && works?.[kind]?.completionYear <= byYear);
  const year = byYear || row.year || 0;
  const teachingYear = works?.trainingSchool?.opened ?? works?.trainingSchool?.completionYear;
  const trained = year ? teachingYear < year : Boolean(row.development?.trainingReceipts);
  const workforce = trained ? 1 + Number(Boolean(willOperate("processing"))) : 0;
  const reason = !domesticContractRival(id) ? "Outside the domestic contract area."
    : access === "Restricted" ? "Route restricted after a shortfall."
      : !(willOperate("freight") || inherited?.terminals) ? "Freight exchange has yet to open." : null;
  const capacity = reason ? 0 : Math.min(maxFreightCapacity, row.routeCapacity ?? maxFreightCapacity, 3 + (willOperate("loadingYard") ? 3 : 0) +
    (inherited?.workshops ?? 0) + (inherited?.terminals ?? 0) * 3 + workforce);
  return { id, name, capacity, reason, ...(row.routeCapacity ? { routeCapacity: row.routeCapacity, mode: row.mode } : {}) };
}

export function upcomingFreightContract(game) {
  if (game.journey?.preset !== "standard" || game.year < freightCompetitionOpening) return null;
  const round = Math.max(0, Math.ceil((game.year - firstContract) / contractYears));
  const start = firstContract + round * contractYears;
  const end = start + contractYears - 1;
  const noticeYear = start - (start === firstContract ? 4 : 3);
  return game.year >= noticeYear && end <= game.journey.end ? { noticeYear, start, end, fee, minimumCapacity } : null;
}

export function resolveFreightContract(game, player, rivals) {
  if (game.journey?.preset !== "standard") return null;
  const upcoming = upcomingFreightContract(game);
  const awarded = game.year === upcoming?.start;
  const previous = game.reports?.at(-1)?.regional?.freightContract;
  if (!awarded && (!previous || game.year > previous.end)) return null;
  const bidders = [{ id: "player", ...player }, ...rivals];
  const terms = awarded ? upcoming : previous;
  const { start, end, fee, minimumCapacity } = terms;
  let winner = previous?.winner ?? null;
  if (awarded) {
    const bestCapacity = Math.max(...bidders.map(({ capacity }) => capacity));
    const leads = bidders.filter((bid) => bid.capacity === bestCapacity).sort((a, b) => a.id.localeCompare(b.id, "en"));
    const round = (start - firstContract) / contractYears;
    const lead = leads[round % leads.length];
    winner = bestCapacity >= minimumCapacity ? { id: lead.id, name: lead.name, capacity: lead.capacity } : null;
  }
  const holder = winner && bidders.find(({ id }) => id === winner.id);
  const capacity = holder?.capacity ?? 0;
  const payment = capacity >= minimumCapacity ? fee : 0;
  const reason = !winner ? "No administration met the minimum capacity at the award."
    : !holder ? "The holder no longer has access to this market."
      : !payment ? holder.reason ?? "The holder’s operating capacity fell below the minimum." : null;
  return { start, end, fee, minimumCapacity, winner, capacity, payment, reason, awarded, playerCapacity: player.capacity };
}

export function competitiveFreight(game, { towns, workshops, terminals, monsoon, partners, inland = [], linkedLoads = 0 }) {
  if (game.journey?.preset !== "standard" || game.year < freightCompetitionOpening || ![...partners, ...inland].some(({ capacity }) => capacity)) return null;

  const player = playerFreight({ towns, workshops, terminals });
  const linkedDemand = Math.min(3, linkedLoads);
  const demand = 6 + partners.length + (game.year >= 1970 ? 2 : 0) - (monsoon === "Severe flood" ? 2 : 0) + linkedDemand;
  const competitors = [player, ...partners, ...inland];
  const capacity = competitors.reduce((total, row) => total + row.capacity, 0);
  const served = Math.min(demand, capacity);
  const rows = competitors.map((row) => ({ ...row, loads: Math.floor(served * row.capacity / capacity) }));
  let remaining = served - rows.reduce((total, row) => total + row.loads, 0);
  const first = (game.year - freightCompetitionOpening) % rows.length;
  // Allocate indivisible loads by largest remainder, rotating equal claims by year.
  const ranked = rows.map((row, index) => ({
    row, remainder: served * row.capacity % capacity, tie: (index - first + rows.length) % rows.length,
  })).sort((a, b) => b.remainder - a.remainder || a.tie - b.tie);
  for (const { row } of ranked) {
    if (!remaining) break;
    if (row.loads >= row.capacity) continue;
    row.loads++;
    remaining--;
  }
  for (const row of rows) row.earnings = row.loads;
  return { demand, linkedDemand, served, unserved: demand - served, player: rows[0],
    partners: rows.slice(1, 1 + partners.length), ...(inland.length ? { inland: rows.slice(1 + partners.length) } : {}) };
}
