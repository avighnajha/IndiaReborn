export const goaMarket = "goa";
export const westernIslands = "lakshadweep";
export const goaOpening = 1962;
export const islandsOpening = 1956;
export const westernExportOpening = 1973;

export function westernShipping(year, roughMonsoon = false) {
  const seasonal = year < 1970;
  const sailingCapacity = year < 1958 ? 0 : year < 1963 ? 1 : year < 1970 ? 2 : year < 1982 ? 3 : 4;
  const islandCapacity = Math.max(0, sailingCapacity - Number(seasonal && roughMonsoon));
  const administrationCargo = Math.min(islandCapacity, year < 1963 ? 1 : year < 1982 ? 2 : 3);
  const ore = year >= goaOpening ? { loads: year < 1979 ? 1 : 2, railCapacity: 3 } : null;
  return {
    ore: ore && { ...ore, foodCapacity: ore.railCapacity - ore.loads },
    islands: year >= islandsOpening ? { capacity: islandCapacity, sailingCapacity, seasonal, base: "Calicut",
      administrationCargo, provisioned: 1 + administrationCargo } : null,
  };
}

export function westernLinks(year, shipping) {
  const links = [];
  if (shipping.ore) links.push(["mysore", goaMarket, shipping.ore.foodCapacity, "rail"]);
  // The coastal service calls at Panjim. It does not use the Mormugao ore railway.
  if (year >= 1963) links.push(["maharashtra", goaMarket, 1, "sea"]);
  if (year >= 1958 && shipping.islands) links.push(["kerala", westernIslands, shipping.islands.capacity - shipping.islands.administrationCargo, "sea"]);
  return links;
}

export function westernLinkMarkets(from, to) {
  const markets = [from, to].includes(westernIslands) ? { kerala: "Calicut" }
    : [from, to].includes(goaMarket) ? (from === "mysore" || to === "mysore"
      ? { mysore: "Hospet–Bellary" } : { [goaMarket]: "Panjim" }) : {};
  return { ...(markets[from] ? { fromMarket: markets[from] } : {}), ...(markets[to] ? { toMarket: markets[to] } : {}) };
}

export function westernExportRival(year, administration) {
  if (administration !== "maharashtra" || year < westernExportOpening) return null;
  // Southern Maharashtra shippers could bypass Bombay. The port's own receipts
  // are separate from the Union territory's public works allocation.
  return { id: "mormugao-exporters", name: "Mormugao exporters", capacity: year === westernExportOpening ? 2 : year < 1985 ? 4 : 5 };
}
