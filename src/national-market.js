export const inlandActors = {
  delhi: { name: "Delhi", harvest: 5, demand: 8, flood: 1, dry: 2, seed: 196 },
  punjab: { name: "Punjab", harvest: 12, demand: 8, flood: 2, dry: 3, seed: 623 },
  haryana: { name: "Haryana", harvest: 10, demand: 8, flood: 2, dry: 4, seed: 726 },
  bombay: { name: "Bombay", harvest: 12, demand: 13, flood: 2, dry: 2, seed: 772 },
  madras: { name: "Madras", later: "Tamil Nadu", renamed: 1969, harvest: 10, demand: 10, flood: 2, dry: 4, seed: 491 },
  andhra: { name: "Andhra State", later: "Andhra Pradesh", renamed: 1956, harvest: 12, demand: 9, flood: 3, dry: 3, seed: 378 },
  kerala: { name: "Kerala", harvest: 7, demand: 9, flood: 2, dry: 1, seed: 592 },
  assam: { name: "Assam", harvest: 9, demand: 8, flood: 5, dry: 1, seed: 343 },
  nagaland: { name: "Naga Hills–Tuensang Area", later: "Nagaland", renamed: 1963, harvest: 6, demand: 6, flood: 2, dry: 2, seed: 967 },
  meghalaya: { name: "Meghalaya", harvest: 6, demand: 6, flood: 2, dry: 1, seed: 583 },
  mizoram: { name: "Mizoram", harvest: 5, demand: 5, flood: 2, dry: 2, seed: 913 },
  travancore: { name: "Travancore and Cochin markets", later: "Travancore–Cochin", renamed: 1949, harvest: 7, demand: 8, flood: 2, dry: 1, seed: 312 },
};

export const marketHubs = {
  punjab: "Ludhiana", haryana: "Ambala", delhi: "Delhi", up: "Allahabad", bihar: "Patna", bengal: "Calcutta", assam: "Gauhati",
  rajasthan: "Jaipur", central: "Jabalpur", orissa: "Cuttack", andhra: "Vijayawada", madras: "Madras",
  mysore: "Bangalore", kerala: "Ernakulam", bombay: "Bombay", maharashtra: "Bombay", gujarat: "Ahmedabad",
  travancore: "Ernakulam", hyderabad: "Secunderabad",
  nagaland: "Dimapur", meghalaya: "Shillong", mizoram: "Aijal",
};

const corridors = [
  ["punjab", "delhi", 4], ["delhi", "up", 3], ["delhi", "rajasthan", 2],
  ["up", "bihar", 3], ["up", "central", 2], ["bihar", "bengal", 3],
  ["bengal", "orissa", 3], ["orissa", "central", 2], ["madras", "mysore", 3],
];
const southBeforeDivision = [["orissa", "madras", 3], ["central", "madras", 2], ["hyderabad", "madras", 2]];
const southAfterDivision = [["orissa", "andhra", 3], ["central", "andhra", 2], ["andhra", "madras", 3]];
const westBeforeDivision = [
  ["bombay", "central", 3], ["bombay", "rajasthan", 2], ["bombay", "mysore", 3],
];
const westAfterDivision = [
  ["maharashtra", "central", 3], ["gujarat", "rajasthan", 2],
  ["maharashtra", "mysore", 3], ["gujarat", "maharashtra", 3],
];
const northAfterDivision = [["punjab", "haryana", 3], ["haryana", "delhi", 3], ["haryana", "rajasthan", 2]];

function domesticLinks(year) {
  const west = year < 1960 ? westBeforeDivision : westAfterDivision;
  const north = year < 1966 ? [] : northAfterDivision;
  const south = year < 1953 ? southBeforeDivision : southAfterDivision;
  const coast = year < 1956 ? ["madras", "travancore", 2] : ["madras", "kerala", 3];
  const assam = year >= 1950 ? [["bengal", "assam", 2], ["bihar", "assam", 1]]
    : year === 1946 ? [["bengal", "assam", 2]] : [];
  if (year >= 1958) assam.push(["assam", "nagaland", 2]);
  if (year >= 1972) assam.push(["assam", "meghalaya", 2], ["assam", "mizoram", 1]);
  const hyderabad = year >= 1953 && year < 1956 ? [["hyderabad", "andhra", 2], ["hyderabad", "central", 2]] : [];
  const central = year >= 1956 ? [["central", "rajasthan", 2]] : [];
  return [...corridors, ...west, ...north, ...south, coast, ...assam, ...hyderabad, ...central].map(([from, to, capacity]) => {
    const southernPool = year >= 1965 && (from === "andhra" || from === "madras");
    const northernDispatch = year >= 1968 && (from === "punjab" || from === "haryana");
    return [from, to, capacity + Number(southernPool || northernDispatch)];
  });
}

export function nationalMarketActive(game) {
  return game.journey?.preset === "standard";
}

export function nationalMarketActors(game, world) {
  const played = world.key === "west-bengal" ? "bengal"
    : world.key === "mayurbhanj" && game.journey.jurisdiction?.settlement === "merger" ? "orissa"
      : world.key === "bombay" ? game.journey.jurisdiction?.bombaySuccessor ?? "bombay" : world.key;
  const playerMarket = world.key === "punjab" ? game.journey.jurisdiction?.punjabSuccessor ?? "punjab"
    : world.key === "madras" ? game.journey.jurisdiction?.madrasSuccessor ?? "madras" : played;
  return [...new Set(["assam", ...domesticLinks(game.year).flatMap(([from, to]) => [from, to])])].filter((id) => id !== playerMarket);
}

export function seedSouthernTransitions(partners, game, world) {
  if (game.year === 1953 && world.key !== "madras" && partners.madras && !partners.andhra) {
    const { cash, reserve, works = {} } = partners.madras;
    const andhraCash = Math.floor(cash * 27 / 75);
    const mysoreCash = Math.floor(cash / 75);
    const andhraReserve = Math.floor(reserve * .36);
    const { storage, protection, ...madrasWorks } = works;
    return { ...partners,
      madras: { ...partners.madras, cash: cash - andhraCash - mysoreCash, reserve: reserve - andhraReserve, works: madrasWorks },
      andhra: { cash: andhraCash, reserve: andhraReserve, works: { ...(storage ? { storage } : {}), ...(protection ? { protection } : {}) } },
      mysore: { ...partners.mysore, cash: (partners.mysore?.cash ?? 0) + mysoreCash },
    };
  }
  if (game.year === 1956 && partners.travancore && !partners.kerala) {
    const { travancore, ...remaining } = partners;
    return { ...remaining, kerala: travancore };
  }
  return partners;
}

const marketChapters = {
  1947: "Partition interrupts the Bengal–Assam route.",
  1950: "Assam reconnects to the domestic rail network.",
  1953: "Andhra opens a separate market after the division of Madras.",
  1956: "Andhra Pradesh and Kerala enter the reorganized network. Madhya Pradesh gains a route to Rajasthan.",
  1960: "Bombay’s markets divide between Maharashtra and Gujarat.",
  1963: "Nagaland becomes a separate state.",
  1966: "Haryana opens a separate market from Punjab.",
  1972: "Meghalaya and Mizoram enter as separate markets.",
};

export function seedBombayDivision(partners, game, world) {
  const previous = partners.bombay;
  if (world.key === "bombay" || game.year !== 1960 || !previous || partners.maharashtra || partners.gujarat) return partners;
  const gujaratCash = Math.floor(previous.cash * 0.3369);
  const gujaratReserve = Math.floor(previous.reserve / 3);
  const { storage, protection, ...freightWorks } = previous.works ?? {};
  const { bombay, ...successors } = partners;
  return {
    ...successors,
    maharashtra: { cash: previous.cash - gujaratCash, reserve: previous.reserve - gujaratReserve, works: freightWorks },
    gujarat: { cash: gujaratCash, reserve: gujaratReserve, works: { ...(storage ? { storage } : {}), ...(protection ? { protection } : {}) } },
  };
}

export function seedPunjabDivision(partners, game, world) {
  const previous = partners.punjab;
  if (world.key === "punjab" || game.year !== 1966 || !previous || partners.haryana) return partners;
  const { storage, protection, ...freightWorks } = previous.works ?? {};
  return {
    ...partners,
    punjab: { cash: Math.floor(previous.cash * 0.5484), reserve: Math.floor(previous.reserve * 0.55), works: freightWorks },
    haryana: { cash: Math.floor(previous.cash * 0.3738), reserve: Math.floor(previous.reserve * 0.37), works: { ...(storage ? { storage } : {}), ...(protection ? { protection } : {}) } },
  };
}

// Clear each link once per year. Immediate shortages take priority over restocking.
// Local governments have already settled their commitments to the player.
export function clearNationalMarket(game, partners, actors, localIds) {
  const local = new Set(localIds);
  const nodes = Object.fromEntries(actors.map(({ id, name, market }) => [id, {
    id, name, market, local: local.has(id), cash: partners[id].cash,
    reserve: partners[id].reserve, shortage: partners[id].shortage,
  }]));
  const links = domesticLinks(game.year).filter(([from, to]) => nodes[from] && nodes[to])
    .map(([from, to, capacity]) => ({ from, to, capacity, units: 0 }));

  const first = (game.year - 1946) % Math.max(1, links.length);
  const rotation = [...links.slice(first), ...links.slice(0, first)];
  const demand = (node, restock) => restock ? Math.max(0, 5 - node.reserve) : node.shortage;
  for (const restock of [false, true]) {
    // A year-based rotation gives equal claims a changing priority.
    const ordered = rotation.map((link) => ({ link, need: Math.max(demand(nodes[link.from], restock), demand(nodes[link.to], restock)) }))
      .sort((a, b) => b.need - a.need);
    for (const { link } of ordered) {
      let seller = nodes[link.from];
      let buyer = nodes[link.to];
      if (!link.units && seller.reserve < buyer.reserve) [seller, buyer] = [buyer, seller];
      const units = Math.min(demand(buyer, restock), Math.max(0, buyer.cash - 2),
        Math.max(0, seller.reserve - 5), link.capacity - link.units);
      if (!units || seller.shortage) continue;
      seller.reserve -= units;
      seller.cash += units;
      buyer.cash -= units;
      const relief = Math.min(buyer.shortage, units);
      buyer.shortage -= relief;
      buyer.reserve += units - relief;
      Object.assign(link, { from: seller.id, to: buyer.id, units: link.units + units });
    }
  }

  const flows = {};
  let units = 0;
  let localUnits = 0;
  for (const link of links) {
    if (!link.units) continue;
    flows[link.from] ??= { bought: 0, sold: 0 };
    flows[link.to] ??= { bought: 0, sold: 0 };
    flows[link.from].sold += link.units;
    flows[link.to].bought += link.units;
    units += link.units;
    if (local.has(link.from) || local.has(link.to)) localUnits += link.units;
  }
  const chapter = marketChapters[game.year];
  return { market: { year: game.year, ...(chapter ? { chapter } : {}), nodes: Object.values(nodes), links, units, localUnits }, flows };
}
