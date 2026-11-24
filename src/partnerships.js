export const partnershipWindow = { notice: 1953, opens: 1957, closes: 1960 };

const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const partners = {
  bihar: {
    planFoodReserve: {
      title: "Eastern Kosi Reserve District", district: "Saharsa and Purnea", requires: "kosi",
      cost: 78, partnership: 32,
      outcome: "Protect two growing areas near Saharsa and add storage for 18 food at Purnea.",
      works: [work("foodDepot", 14, 3, 1), work("levee", 12, 4, 2), work("irrigation", 12, 4, 2), work("irrigation", 12, 3, 3)],
    },
    planSuppliers: {
      title: "Darbhanga Suppliers District", district: "Darbhanga and the Ganga corridor",
      cost: 82, partnership: 36,
      outcome: "Build a college and two supplier workshops on the Darbhanga side of the market corridor.",
      works: [work("college", 8, 3, 2), work("mill", 7, 3, 2), work("mill", 9, 3, 3)],
    },
  },
  orissa: {
    planFoodReserve: {
      title: "Bhadrak Reserve District", district: "Bhadrak and the lower Mahanadi", requires: "mahanadi",
      cost: 48, partnership: 20,
      outcome: "Protect two growing areas near Bhadrak and add storage for 18 food in town.",
      works: [work("foodDepot", 12, 4, 1), work("levee", 12, 4, 2), work("irrigation", 12, 4, 2), work("irrigation", 12, 3, 3)],
    },
    planSuppliers: {
      title: "Dhenkanal Suppliers District", district: "Dhenkanal and the Cuttack market route",
      cost: 53, partnership: 25,
      outcome: "Build a college and two supplier workshops near Dhenkanal’s mineral and market links.",
      works: [work("college", 9, 5, 2), work("mill", 9, 4, 2), work("mill", 9, 6, 3)],
    },
  },
};

const shared = {
  planFoodReserve: {
    department: "food", layer: "weather",
    pitch: "Use earlier basin defences to develop protected farms and reserves.",
    next: "The new farms and depot help the region carry food through bad monsoons.",
  },
  planSuppliers: {
    department: "trade", layer: "access", requires: "trade", minimumSchools: 2,
    pitch: "Turn existing schools and market access into a cluster of suppliers.",
    next: "The college adds 6 Skills and 1 output per linked workshop. The new suppliers earn receipts as they produce.",
  },
};

export function partnershipProgrammes(region) {
  return Object.fromEntries(Object.entries(partners[region] ?? {}).map(([id, plan]) => [id, {
    ...shared[id], ...plan, era: partnershipWindow.notice, priceYear: partnershipWindow.opens,
  }]));
}

// Measure actual output from the retained project sites using the same figures
// as the map. These are site totals, including contributions from later policy.
export function partnershipActivity(record, assets, owners, region, sites, floodSites, connected) {
  const operating = assets.filter(({ programme, remaining, hex }) => programme === record.id && !remaining && owners[hex] === region);
  const farms = new Set(operating.filter(({ kind }) => kind === "irrigation").map(({ hex }) => hex));
  const workshops = new Set(operating.filter(({ kind }) => kind === "mill").map(({ hex }) => hex));
  return {
    id: record.id,
    food: sites.irrigation.filter(({ hex }) => farms.has(hex)).reduce((sum, { food }) => sum + food, 0),
    protectedFood: floodSites.filter(({ hex }) => farms.has(hex)).reduce((sum, site) => sum + site.protected, 0),
    storage: operating.filter(({ kind }) => kind === "foodDepot").length * 18,
    output: sites.workshops.filter(({ hex }) => workshops.has(hex)).reduce((sum, { output }) => sum + output, 0),
    linkedWorkshops: [...workshops].filter(connected).length,
  };
}
