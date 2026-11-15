const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const cauveryFood = [work("irrigation", 9, 13, 1), work("granary", 9, 12, 2)];
const krishnaFood = [work("irrigation", 11, 5, 1), work("granary", 11, 4, 2)];
const madrasTrade = [work("road", 9, 9, 1), work("road", 8, 9, 2), work("mill", 10, 9, 3)];
const andhraTrade = [work("road", 10, 4, 1), work("road", 11, 3, 2), work("mill", 11, 4, 3)];
const madrasSchools = [work("school", 10, 9, 1), work("school", 8, 12, 2)];
const andhraSchools = [work("school", 10, 5, 2), work("school", 15, 3, 3)];
const madrasWorkshops = [work("mill", 8, 10, 2), work("mill", 5, 12, 3)];
const andhraWorkshops = [work("mill", 10, 5, 2), work("mill", 12, 3, 3)];
const madrasEngineering = [work("mill", 7, 11, 2), work("mill", 8, 12, 3)];
const andhraEngineering = [work("mill", 7, 5, 2), work("mill", 15, 3, 3)];

// The plans represent state distribution works alongside existing reservoirs
// and wider projects. Their allocation continues after construction ends.
export const madrasBasinAgreements = {
  focused: {
    title: "Cauvery canals first", funding: "State water budget", area: "Mettur and the Tanjore delta",
    detail: "Open delta drainage and field channels first. Once Mettur power is connected, pumps add 4 food to each harvest.",
    total: 68, union: 0, allocation: "irrigation",
    works: [work("levee", 10, 13, 1), work("irrigation", 8, 13, 2), work("irrigation", 10, 13, 2), work("power", 6, 11, 3)],
  },
  union: {
    title: "Neyveli industrial power", funding: "Union co-funding", area: "Neyveli, Cuddalore and the textile towns",
    detail: "Open workshops early. Once Neyveli power arrives, each connected workshop gains 2 output. One delta channel opens in the final phase.",
    total: 116, union: 42, allocation: "industry",
    works: [work("road", 8, 11, 1), work("mill", 10, 11, 2), work("mill", 6, 12, 3), work("irrigation", 8, 13, 5), work("power", 9, 11, 6)],
  },
};

export const andhraBasinAgreements = {
  focused: {
    title: "Delta canals first", funding: "State water budget", area: "The Krishna and Godavari deltas",
    detail: "Protect delta crops and open feeder channels. Once power is connected, pumps add 4 food to each harvest.",
    total: 63, union: 0, allocation: "irrigation",
    works: [work("levee", 13, 5, 1), work("irrigation", 12, 5, 2), work("irrigation", 13, 5, 2), work("power", 12, 4, 3)],
  },
  union: {
    title: "Rayalaseema workshops first", funding: "Union co-funding", area: "Kurnool, Cuddapah and the coastal supply routes",
    detail: "Connect inland repair shops. Once power is connected, each connected workshop gains 2 output. A coastal reserve opens in the final phase.",
    total: 99, union: 31, allocation: "industry",
    works: [work("road", 7, 6, 1), work("road", 8, 6, 2), work("mill", 8, 7, 2), work("power", 7, 5, 3), work("granary", 12, 4, 4)],
  },
};

const fields = {
  food: { theme: "Food and water", color: 0x9fc783, layer: "weather" },
  trade: { theme: "Transport and industry", color: 0xe7bc73, layer: "access" },
  education: { theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain" },
};
const programme = (department, tier, title, district, details) => ({ ...fields[department], department, tier, title, district, ...details });
const successor = (name, plans) => Object.fromEntries(Object.entries(plans).map(([id, plan]) => [id, { ...plan, madrasSuccessor: name }]));
const localSchedule = (works) => works.map((item) => ({ ...item, year: Math.min(2, item.year) }));

export const madrasProgrammes = {
  food: programme("food", 1, "Cauvery and Krishna Food Security", "Tanjore and Vijayawada", {
    opening: true, cost: 34, works: [...cauveryFood, ...krishnaFood],
    pitch: "Protect the province’s food supply from two growing regions.",
    outcome: "Irrigates two growing areas and opens two grain stores.",
    next: "Each successor inherits its local food works.",
  }),
  trade: programme("trade", 1, "East Coast Market Links", "Madras and Vijayawada", {
    opening: true, cost: 39, works: [...madrasTrade, ...andhraTrade],
    pitch: "Connect each commercial centre to more of its hinterland.",
    outcome: "Improves four market links and opens two workshops.",
    next: "The workshop network supports new processing districts.",
  }),
  skills: programme("education", 1, "Southern Technical Schools", "Madras, Trichinopoly, Guntur and Visakhapatnam", {
    opening: true, cost: 33, works: [...madrasSchools, ...andhraSchools],
    pitch: "Prepare workers for food processing, textile mills and engineering.",
    outcome: "Opens four schools in the northern and southern districts.",
    next: "Operating schools support engineering workshops and degree colleges.",
  }),
  industry: programme("trade", 2, "Textile and Food Processing Districts", "Vellore, Coimbatore, Guntur and Eluru", {
    cost: 68, requires: "trade", works: [...madrasWorkshops, ...andhraWorkshops],
    pitch: "Develop local processing around the established markets.",
    outcome: "Opens four workshops. Each successor keeps its local works.",
    next: "Larger freight facilities can carry the new output.",
  }),
  applied: programme("trade", 2, "Southern Engineering Workshops", "Salem, Trichinopoly, Kurnool and Visakhapatnam", {
    cost: 61, requires: "skills", works: [...madrasEngineering, ...andhraEngineering],
    pitch: "Turn technical training into machinery production and repair.",
    outcome: "Opens four engineering workshops. Connections improve their returns.",
    next: "Link the workshops to larger freight facilities.",
  }),
  madrasDeltaBanks: programme("food", 2, "Coastal Drainage and Reserves", "The Cauvery and Godavari deltas", {
    cost: 56, requires: "food",
    works: [work("levee", 8, 13, 1), work("levee", 12, 5, 2), work("granary", 10, 12, 2), work("granary", 13, 4, 3)],
    pitch: "Protect both deltas and move emergency storage closer to growing areas.",
    outcome: "Protects two growing areas and opens two local grain stores.",
    next: "Qualifies the province for a larger reserve depot.",
  }),
  ...successor("madras", {
    tn_food: programme("food", 1, "Cauvery Delta Food Security", "Tanjore and its growing areas", {
      opening: true, cost: 24, works: cauveryFood,
      pitch: "Keep rice supplies steady through poor monsoons.",
      outcome: "Irrigates a growing area and opens a Tanjore grain store.",
      next: "Opens the water and power commitment from 1957.",
    }),
    tn_trade: programme("trade", 1, "Madras Market Links", "Madras and the northern plain", {
      opening: true, cost: 29, works: localSchedule(madrasTrade),
      pitch: "Connect inland producers to the city market.",
      outcome: "Improves two market links and opens a workshop.",
      next: "Supports a second wave of textile workshops.",
    }),
    tn_skills: programme("education", 1, "Madras and Trichinopoly Technical Schools", "Madras and Trichinopoly", {
      opening: true, cost: 26, works: madrasSchools,
      pitch: "Train technicians for mills and growing towns.",
      outcome: "Opens two technical schools.",
      next: "The schools qualify the state for colleges and a teaching charter.",
    }),
    cauvery: programme("food", 2, "Madras Water and Power Commitment", "The Cauvery delta and Neyveli", {
      era: 1957, madrasReorganized: true, requires: "tn_food", works: madrasBasinAgreements.focused.works,
      pitch: "Commit the next development allocation to delta resilience or industrial electricity.",
      outcome: "Choose between early canal protection and a longer industrial power build.",
      next: "Either commitment unlocks a larger state food reserve.",
    }),
    tn_industry: programme("trade", 2, "Vellore and Coimbatore Textile Workshops", "Vellore and Coimbatore", {
      cost: 46, requires: "tn_trade", works: localSchedule(madrasWorkshops),
      pitch: "Grow textile processing around two inland markets.",
      outcome: "Opens two workshops. Provincial investment counts toward delivery.",
      next: "The workshops qualify the state for a freight terminal.",
    }),
    tn_applied: programme("trade", 2, "Salem and Trichinopoly Engineering", "Salem and Trichinopoly", {
      cost: 43, requires: "tn_skills", works: localSchedule(madrasEngineering),
      pitch: "Give the skilled workforce places to build and repair machinery.",
      outcome: "Opens two engineering workshops.",
      next: "Power and market access raise their output.",
    }),
    tn_southMarkets: programme("trade", 2, "Southern District Market Links", "Nagercoil and Kanyakumari", {
      era: 1956, madrasReorganized: true, requires: "tn_trade", cost: 44,
      works: [work("road", 6, 16, 1), work("road", 7, 16, 2), work("mill", 6, 16, 2)],
      pitch: "Link the new southern districts to their local market.",
      outcome: "Improves two market links and opens a Nagercoil workshop.",
      next: "Skills and power strengthen the new production base.",
    }),
  }),
  ...successor("andhra", {
    ap_food: programme("food", 1, "Krishna Delta Food Security", "Vijayawada and the lower Krishna", {
      opening: true, cost: 22, works: krishnaFood,
      pitch: "Secure the new state’s main food corridor.",
      outcome: "Irrigates one growing area and opens a Vijayawada grain store.",
      next: "Opens the delta and interior commitment from 1956.",
    }),
    ap_trade: programme("trade", 1, "Vijayawada Market Links", "Vijayawada, Guntur and the coastal route", {
      opening: true, cost: 25, works: localSchedule(andhraTrade),
      pitch: "Open a trade network centred on the lower Krishna.",
      outcome: "Improves two market links and opens a workshop.",
      next: "The market network supports coastal processing.",
    }),
    ap_skills: programme("education", 1, "Andhra Technical Schools", "Guntur and Visakhapatnam", {
      opening: true, cost: 24, works: localSchedule(andhraSchools),
      pitch: "Train workers for the coast and the interior.",
      outcome: "Opens two technical schools.",
      next: "The schools qualify the state for colleges and a teaching charter.",
    }),
    krishna: programme("food", 2, "Andhra Water and Power Commitment", "The Krishna–Godavari deltas and Rayalaseema", {
      era: 1956, madrasReorganized: true, requires: "ap_food", works: andhraBasinAgreements.focused.works,
      pitch: "Use the next development allocation to protect the deltas or grow the interior economy.",
      outcome: "Choose feeder canals and pumps or an inland industrial power link.",
      next: "Either commitment unlocks a larger state food reserve.",
    }),
    ap_industry: programme("trade", 2, "Krishna and Godavari Processing", "Guntur and Eluru", {
      cost: 43, requires: "ap_trade", works: localSchedule(andhraWorkshops),
      pitch: "Process more of the coast’s output near its main markets.",
      outcome: "Opens two workshops. Provincial investment counts toward delivery.",
      next: "The workshops qualify the state for a freight terminal.",
    }),
    ap_applied: programme("trade", 2, "Coastal and Interior Engineering", "Visakhapatnam and Kurnool", {
      cost: 41, requires: "ap_skills", works: localSchedule(andhraEngineering),
      pitch: "Use technical training to expand machine and equipment repairs.",
      outcome: "Opens two engineering workshops.",
      next: "Power and market access raise their output.",
    }),
    ap_telanganaLinks: programme("trade", 2, "Telangana Market Links", "Hyderabad and Nalgonda", {
      era: 1956, madrasReorganized: true, requires: "ap_trade", cost: 48,
      works: [work("road", 9, 3, 1), work("road", 9, 4, 2), work("mill", 8, 3, 2)],
      pitch: "Connect the incoming Telangana markets to the expanded economy.",
      outcome: "Improves two market links and opens a Hyderabad workshop.",
      next: "Skills and power strengthen the new production base.",
    }),
    ap_nagarjunaCanals: programme("food", 2, "Nagarjunasagar Canal Distribution", "Nalgonda and the Krishna right bank", {
      era: 1967, madrasReorganized: true, requires: "krishna", cost: 81,
      works: [work("irrigation", 9, 4, 2), work("irrigation", 10, 5, 3), work("granary", 9, 3, 3)],
      pitch: "Distribute new canal supplies beyond the established delta.",
      outcome: "Irrigates two growing areas and opens a reserve at Nalgonda.",
      next: "A larger water network can protect these gains in poor monsoons.",
    }),
  }),
};
