export const pondicherryMarket = "pondicherry";
export const pondicherryOpening = 1955;
export const pondicherryCession = 1962;
export const pondicherryDecisionId = "madras-pondicherry-rail";
export const transitionNote = "https://nehruarchive.in/documents/economic-and-cultural-issues-in-pondicherry-26-august-1955-25x8g";

const railSlots = 3;
const textileSlots = 2;
const textileRate = 4;
const supportFee = 10;

export function pondicherryDecision(game) {
  if (game.year !== pondicherryOpening || game.journey.jurisdiction?.madrasSuccessor !== "madras" || game.journey.events[pondicherryDecisionId]) return null;
  return {
    id: pondicherryDecisionId, title: "Share the Pondicherry railway",
    description: "Two Pondicherry mills have closed after losing access to their old export markets. Agree with the Chief Commissioner on how to use the Villupuram rail link through 1956.",
    source: transitionNote,
    options: {
      pondicherryFood: { label: "Share food reserves by rail",
        effect: ["Keep all 3 slots for food and emergency deliveries.", "Help cover each other’s shortfalls after protecting six months of food at home."] },
      pondicherryTextiles: { label: "Restart textile freight", price: supportFee,
        effect: ["Reserve 2 slots for cloth and leave 1 for food.", `Earn ₹${textileRate} lakh per load. Floods can cut deliveries.`] },
    },
  };
}

export function pondicherryRail(year, compact = null) {
  if (year < pondicherryOpening) return null;
  const reservedForTextiles = compact === "textiles" ? textileSlots : 0;
  return { phase: year < pondicherryCession ? "transition" : "union", railCapacity: railSlots,
    foodCapacity: railSlots - reservedForTextiles, textileLoads: 0, compact, closure: year === pondicherryOpening };
}

export function pondicherryTerms(game) {
  const event = game.journey.events?.[pondicherryDecisionId];
  if (game.year < pondicherryOpening || game.year > pondicherryOpening + 1 || event?.year !== pondicherryOpening) return null;
  return event.choice === "pondicherryTextiles" ? "textiles" : event.choice === "pondicherryFood" ? "food" : null;
}

export function pondicherryShipment(game, monsoon) {
  const compact = pondicherryTerms(game);
  const rail = pondicherryRail(game.year, compact);
  const textileLoads = compact === "textiles" ? textileSlots - Number(monsoon === "Severe flood") : 0;
  return { ...rail, textileLoads, receipt: textileLoads * textileRate, fee: compact === "textiles" && game.year === pondicherryOpening ? supportFee : 0 };
}

export function sharePondicherryReserves(regional, { foodOnHand, demand, shortage }) {
  const rail = regional?.report.coromandel;
  if (rail?.compact !== "food" || shortage) return regional;
  const neighbor = regional.report.partners.find(({ id }) => id === pondicherryMarket);
  const { foodBought, foodSold, relief } = rail.settlement;
  const capacity = Math.max(0, rail.foodCapacity - foodBought - foodSold - relief);
  const surplus = Math.max(0, foodOnHand - Math.ceil(demand / 2));
  const sent = Math.min(capacity, surplus, neighbor.shortage);
  if (!sent) return regional;
  const remaining = neighbor.shortage - sent;
  return { ...regional, partners: { ...regional.partners, [pondicherryMarket]: { ...regional.partners[pondicherryMarket], shortage: remaining } },
    report: { ...regional.report, coromandel: { ...rail, settlement: { ...rail.settlement, aidSent: sent } },
      partners: regional.report.partners.map((row) => row.id === pondicherryMarket ? { ...row, shortage: remaining } : row) },
  };
}
