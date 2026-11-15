const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

export const centralBasinAgreements = {
  focused: {
    title: "Chambal canals first",
    funding: "State development funds",
    area: "Morena, Bhind and the Chambal command",
    detail: "Open field channels and two reserve stores. The completed distribution works add 4 food to every harvest.",
    total: 62,
    union: 0,
    allocation: "irrigation",
    works: [work("irrigation", 9, 3, 2), work("granary", 8, 1, 3), work("granary", 9, 2, 4)],
  },
  union: {
    title: "Chambal industrial power first",
    funding: "Union co-funding",
    area: "Gwalior, Bhind and Datia",
    detail: "Build feeder links and workshops. The completed grid connection adds 2 output per market-connected workshop.",
    total: 104,
    union: 35,
    allocation: "industry",
    works: [work("road", 9, 2, 1), work("mill", 8, 2, 2), work("road", 9, 3, 3), work("mill", 9, 2, 5)],
  },
};

const fields = {
  food: { theme: "Food and water", color: 0x9fc783, layer: "weather" },
  trade: { theme: "Transport and industry", color: 0xe7bc73, layer: "access" },
  education: { theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain" },
};

const programme = (department, tier, title, district, details) =>
  ({ ...fields[department], department, tier, title, district, ...details });

export const centralProgrammes = {
  food: programme("food", 1, "Nerbudda and Mahanadi Food Security", "Hoshangabad and Raipur", {
    opening: true,
    cost: 30,
    works: [work("irrigation", 8, 9, 1), work("granary", 7, 8, 1), work("irrigation", 15, 12, 2), work("granary", 14, 10, 2)],
    pitch: "Strengthen harvests in two basins and keep reserves near the growing areas.",
    outcome: "Irrigates two growing areas and adds storage for 20 food units.",
    next: "Unlocks Tandula field channels and qualifies for Chambal distribution after reorganization.",
  }),
  trade: programme("trade", 1, "Nerbudda and Chhattisgarh Market Links", "Narsinghpur, Durg and Ratanpur", {
    opening: true,
    cost: 34,
    works: [work("road", 9, 8, 1), work("road", 13, 10, 1), work("road", 15, 8, 2), work("mill", 13, 10, 2)],
    pitch: "Connect the grain and timber markets to inland rail towns.",
    outcome: "Links Pendra and Balaghat to inland markets and opens a Durg workshop.",
    next: "Unlocks processing in the districts the state will retain, as well as Berar cotton and Bastar market projects.",
  }),
  skills: programme("education", 1, "Central Technical Schools", "Itarsi, Jubbulpore and Raipur", {
    opening: true,
    cost: 29,
    works: [work("school", 8, 8, 1), work("school", 11, 7, 2), work("school", 14, 10, 2)],
    pitch: "Train technicians for agricultural services and the inland workshop towns.",
    outcome: "Opens three technical schools that build Skills over time.",
    next: "Operating schools unlock engineering workshops and degree colleges.",
  }),
  industry: programme("trade", 2, "Inland Processing Workshops", "Khandwa, Bilaspur and Bhatapara", {
    requires: "trade",
    cost: 48,
    works: [work("road", 15, 10, 1), work("mill", 5, 9, 2), work("mill", 15, 9, 3)],
    pitch: "Process grain, oilseeds and timber near the towns that collect them.",
    outcome: "Links Rajim through Bhatapara and opens workshops in Khandwa and Bilaspur.",
    next: "The retained works qualify the state for a freight terminal.",
  }),
  applied: programme("trade", 2, "Central Engineering Workshops", "Jubbulpore, Mandla and Hoshangabad", {
    requires: "skills",
    cost: 46,
    works: [work("mill", 11, 7, 1), work("mill", 12, 8, 2), work("mill", 7, 8, 3)],
    pitch: "Use the school network to support equipment repairs and machinery production.",
    outcome: "Opens three engineering workshops. Market access and apprenticeships raise their output.",
    next: "An operating workshop network qualifies the state for a freight terminal once market links are ready.",
  }),
  centralBerarCotton: programme("trade", 2, "Berar Cotton Workshops", "Akola, Buldana and Yeotmal", {
    centralBeforeReorganization: true,
    requires: "trade",
    cost: 39,
    works: [work("road", 5, 11, 1), work("mill", 5, 11, 2), work("mill", 7, 12, 2)],
    pitch: "Earn early revenue by expanding cotton processing in the western districts.",
    outcome: "Links Buldana to market through Akola and opens two cotton workshops.",
    next: "Bombay inherits these sites and works in the 1956 reorganization.",
  }),
  centralBastarMarkets: programme("trade", 2, "Bastar Cooperative Markets", "Kanker, Kondagaon and Jagdalpur", {
    era: 1949,
    requires: "trade",
    cost: 43,
    works: [work("road", 14, 13, 1), work("road", 14, 12, 2), work("mill", 14, 12, 3)],
    pitch: "Give district cooperatives places to collect and process local produce.",
    outcome: "Extends Jagdalpur's market through Kondagaon to Kanker and opens a processing workshop.",
    next: "The new corridor can qualify for a freight terminal.",
  }),
  centralTandula: programme("food", 2, "Tandula and Mahanadi Field Channels", "Tandula, Durg and the eastern Mahanadi plain", {
    requires: "food",
    cost: 48,
    works: [work("irrigation", 13, 12, 1), work("granary", 13, 10, 2), work("irrigation", 16, 10, 3)],
    pitch: "Extend the existing irrigation systems and add an inland reserve.",
    outcome: "Irrigates two growing areas and opens a Durg reserve for 10 food units.",
    next: "Qualifies the state for a larger cooperative food depot.",
  }),
  centralMalwaMarkets: programme("trade", 2, "Malwa Market Links", "Indore, Dhar and Ujjain", {
    era: 1956,
    centralReorganized: true,
    requires: "trade",
    cost: 52,
    works: [work("road", 3, 7, 1), work("road", 4, 6, 2), work("mill", 4, 6, 3)],
    pitch: "Use the new western districts to broaden the state's market and industrial base.",
    outcome: "Expands Indore’s market toward Jhabua and Ratlam and opens an Ujjain workshop.",
    next: "The western corridor can qualify for a freight terminal.",
  }),
  chambal: programme("food", 2, "Chambal Distribution Agreement", "The Chambal valley and Gwalior", {
    era: 1957,
    centralReorganized: true,
    requires: "food",
    works: centralBasinAgreements.focused.works,
    pitch: "Choose whether Madhya Pradesh's share of Chambal development serves farms or workshops first.",
    outcome: "Choose earlier irrigation and food storage or a longer industrial power connection.",
    next: "Either commitment qualifies the state for a larger cooperative food depot.",
  }),
};
