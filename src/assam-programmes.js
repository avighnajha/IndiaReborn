const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const floodplain = [
  work("levee", 10, 4, 1),
  work("levee", 14, 3, 2),
  work("irrigation", 14, 3, 2),
  work("irrigation", 15, 4, 3),
];

export const assamBasinAgreements = {
  focused: {
    title: "Protect the floodplain",
    funding: "Assam funds",
    area: "Tezpur and the upper Brahmaputra",
    detail: "Protect two stretches of river and irrigate two growing areas. The first embankment opens this year.",
    total: 43,
    union: 0,
    works: floodplain,
  },
  union: {
    title: "Keep river freight moving",
    funding: "Union co-funding",
    area: "Pandu, Tezpur and the western valley",
    detail: "Add a reserve store and a Pandu terminal. The terminal increases food purchase capacity by 3 and earns market receipts.",
    total: 64,
    union: 20,
    works: [work("road", 6, 4, 1), work("granary", 9, 4, 2), work("freightTerminal", 5, 5, 3)],
  },
};

const fields = {
  food: { theme: "Food and water", color: 0x9fc783, layer: "weather" },
  trade: { theme: "Transport and industry", color: 0xe7bc73, layer: "access" },
  education: { theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain" },
};

const programme = (department, tier, title, district, details) => ({ ...fields[department], department, tier, title, district, ...details });

export const assamProgrammes = {
  food: programme("food", 1, "Valley Food Security", "Goalpara, Nowgong and the lower Brahmaputra", {
    opening: true,
    cost: 24,
    works: [work("irrigation", 7, 5, 1), work("granary", 3, 6, 1), work("irrigation", 8, 4, 2), work("granary", 9, 5, 2)],
    pitch: "Build up local harvests and reserves before supply routes tighten.",
    outcome: "Irrigates two growing areas and opens two stores for 20 food units.",
    next: "Opens the Brahmaputra investment choice from 1954.",
  }),
  trade: programme("trade", 1, "Tea and River Market Links", "Gauhati, Pandu, Jorhat and Dibrugarh", {
    opening: true,
    teaFreight: true,
    cost: 28,
    works: [work("road", 5, 5, 1), work("road", 12, 4, 1), work("road", 14, 3, 2), work("mill", 13, 4, 2)],
    pitch: "Connect tea and river markets before committing to a larger freight network.",
    outcome: "Improves three market links and opens a tea processing workshop in Jorhat.",
    next: "Unlocks valley processing and the rail feeder programme.",
  }),
  skills: programme("education", 1, "Assam Technical Schools", "Gauhati, Jorhat and Silchar", {
    opening: true,
    cost: 22,
    works: [work("school", 6, 5, 1), work("school", 13, 4, 2), work("school", 10, 9, 3)],
    pitch: "Train workers for workshops and agricultural services across both valleys.",
    outcome: "Opens three technical schools. Each builds skills as it operates.",
    next: "Unlocks degree colleges and machine repair workshops.",
  }),
  brahmaputra: programme("food", 2, "Brahmaputra Investment Agreement", "The Brahmaputra valley", {
    era: 1954,
    requires: "food",
    works: floodplain,
    pitch: "Commit to direct flood protection or keep food moving through the river markets.",
    outcome: "Compare quicker embankments and irrigation with Union-backed storage and freight handling.",
    next: "Either commitment supports a larger regional food reserve.",
  }),
  assamRailLink: programme("trade", 2, "Assam Rail Link Feeders", "Fakiragram, Bongaigaon and Pandu", {
    era: 1948,
    requires: "trade",
    cost: 34,
    works: [work("road", 2, 5, 1), work("road", 3, 5, 1), work("road", 4, 5, 2), work("mill", 5, 5, 3)],
    pitch: "Connect local markets to the domestic rail route opening in 1950.",
    outcome: "Builds three feeder links and a Pandu workshop. From 1950, the completed feeders let Assam buy up to 2 more food units and add 2 output per connected tea workshop.",
    next: "The rail works qualify the trade network for a freight terminal.",
  }),
  industry: programme("trade", 2, "Upper Valley Tea Processing", "Sibsagar, Dibrugarh and Tinsukia", {
    requires: "trade",
    teaFreight: true,
    cost: 41,
    works: [work("road", 15, 4, 1), work("mill", 14, 4, 2), work("mill", 15, 3, 2), work("mill", 16, 3, 3)],
    pitch: "Expand tea processing near the upper valley’s freight markets.",
    outcome: "Opens three workshops and improves the upper valley corridor.",
    next: "Rail feeders raise output at connected tea workshops. This network also supports a freight terminal.",
  }),
  applied: programme("trade", 2, "Valley Machine Repair", "Gauhati, Nowgong and Digboi", {
    requires: "skills",
    cost: 35,
    works: [work("road", 8, 4, 1), work("mill", 6, 5, 2), work("mill", 9, 5, 2), work("mill", 17, 3, 3)],
    pitch: "Put technical training to work repairing farm, tea and transport machinery.",
    outcome: "Opens three workshops. Connected markets raise their output.",
    next: "Apprenticeships can help the workshops produce more.",
  }),
  assamBarakStores: programme("food", 2, "Barak Valley Reserve Works", "Silchar and the Barak plain", {
    era: 1966,
    requires: "food",
    cost: 53,
    works: [work("irrigation", 10, 10, 1), work("granary", 10, 9, 2), work("levee", 11, 9, 3)],
    pitch: "Give the Barak valley its own buffer against poor harvests.",
    outcome: "Adds a growing area, storage for 10 food units and local flood protection.",
    next: "The larger reserve helps cover a sequence of poor monsoons.",
  }),
};
