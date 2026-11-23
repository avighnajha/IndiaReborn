const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const deccanFood = [work("irrigation", 10, 10, 1), work("irrigation", 9, 11, 2), work("granary", 8, 10, 2)];
const narmadaFood = [work("irrigation", 7, 5, 1), work("irrigation", 9, 5, 2), work("granary", 8, 5, 2)];
const deccanWater = [work("levee", 9, 11, 1), work("granary", 11, 12, 2), work("irrigation", 10, 12, 2)];
const narmadaWater = [work("levee", 8, 5, 2), work("irrigation", 8, 6, 3)];
const wideWater = [...deccanWater, ...narmadaWater];

const bombayLinks = [work("road", 7, 9, 1), work("road", 7, 10, 2), work("mill", 6, 9, 3)];
const gujaratLinks = [work("road", 8, 4, 1), work("road", 8, 5, 2), work("road", 8, 6, 2), work("mill", 8, 3, 3)];
const maharashtraSchools = [work("school", 6, 9, 2), work("school", 8, 10, 2)];
const gujaratSchools = [work("school", 8, 3, 2), work("school", 7, 6, 3)];
const maharashtraMills = [work("mill", 7, 9, 2), work("mill", 8, 10, 3)];
const gujaratMills = [work("mill", 8, 4, 2), work("mill", 8, 5, 3)];
const maharashtraApplied = [work("road", 8, 8, 1), work("mill", 9, 8, 2), work("mill", 11, 12, 2)];
const gujaratApplied = [work("mill", 7, 6, 2), work("mill", 7, 7, 2)];
const vidarbhaLinks = [work("road", 14, 7, 1), work("road", 14, 8, 2), work("mill", 15, 7, 2)];
const kutchLinks = [work("road", 4, 2, 1), work("road", 4, 3, 2), work("mill", 3, 2, 2)];

export const bombayBasinAgreements = {
  focused: {
    title: "Bhima local works", funding: "Bombay funds", area: "The Bhima plain and Sholapur",
    detail: "Protect the Bhima growing areas first, then add irrigation and storage near Sholapur.",
    total: 41, union: 0, works: deccanWater,
  },
  basin: {
    title: "Bhima and Narmada works", funding: "Bombay funds", area: "The Bhima and lower Narmada valleys",
    detail: "Add an embankment and another growing area in the lower Narmada, with state funding and a three-year schedule.",
    total: 66, union: 0, works: wideWater,
  },
  union: {
    title: "Joint river works agreement", funding: "Union co-funding", area: "The Bhima and lower Narmada valleys",
    detail: "Share the cost of wider protection and an additional embankment. Joint review delays the defences by one year.",
    total: 84, union: 26, works: [
      ...wideWater.map((item) => item.kind === "levee" ? { ...item, year: item.year + 1 } : item),
      work("levee", 9, 5, 4),
    ],
  },
};

const fields = {
  food: { theme: "Food and water", color: 0x9fc783, layer: "weather" },
  trade: { theme: "Transport and industry", color: 0xe7bc73, layer: "access" },
  education: { theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain" },
};
const programme = (field, title, district, details) => ({ ...fields[field], title, district, ...details });
const successor = (name, programmes) => Object.fromEntries(Object.entries(programmes).map(([id, plan]) => [id, { ...plan, bombaySuccessor: name }]));
const localSchedule = (works) => works.map((item) => ({ ...item, year: Math.min(2, item.year) }));

export const bombayProgrammes = {
  bombayKutchLinks: programme("trade", "Kandla Port Links", "Kandla and the Gulf of Kutch", {
    era: 1956, priceYear: 1956, bombayEnlarged: true, requires: "trade", cost: 42, works: kutchLinks,
    pitch: "Commit the works office to a western port before the successor settlement.",
    outcome: "Open two links and a workshop around Kandla. Gujarat takes over these works after reorganization.",
    next: "These works reduce the cost of a larger port programme in a Gujarat campaign.",
  }),
  bombayVidarbhaLinks: programme("trade", "Nagpur Inland Links", "Nagpur, Wardha and Amravati", {
    era: 1956, priceYear: 1956, bombayEnlarged: true, requires: "trade", cost: 45, works: vidarbhaLinks,
    pitch: "Commit the works office to inland manufacturing before the successor settlement.",
    outcome: "Open two links and a workshop around Nagpur. Maharashtra takes over these works after reorganization.",
    next: "These works reduce the cost of a larger inland programme in a Maharashtra campaign.",
  }),
  food: programme("food", "Bhima and Narmada Food Security", "Poona and the lower Narmada", {
    cost: 34, opening: true, works: [...deccanFood, ...narmadaFood],
    pitch: "Expand food production in both valleys and build reserves close to growing areas.",
    outcome: "Irrigates four growing areas and adds grain stores in Poona and Bharuch.",
    next: "Open negotiations on local and regional water works.",
  }),
  trade: programme("trade", "Bombay Port and Cotton Corridor", "Bombay, Poona and central Gujarat", {
    cost: 38, opening: true, works: [...bombayLinks, ...gujaratLinks],
    pitch: "Connect inland markets to the port and back cotton processing on both sides of the province.",
    outcome: "Links Thana and Poona to Bombay, connects markets along the lower Narmada, and opens mills in Bombay and Ahmedabad.",
    next: "Once the links are operating, the cabinet can fund a wider network of textile mills.",
  }),
  skills: programme("education", "Bombay and Gujarat Technical Schools", "Bombay, Poona, Ahmedabad and Surat", {
    cost: 36, opening: true, works: [...maharashtraSchools, ...gujaratSchools],
    pitch: "Train workers for engineering shops, textile mills and agricultural services.",
    outcome: "Opens four technical schools. Operating schools build skills each year.",
    next: "A trained workforce can support a network of engineering and mill-service shops.",
  }),
  bombayWater: programme("food", "Bombay River Works", "The Bhima and lower Narmada valleys", {
    requires: "food", works: bombayBasinAgreements.union.works,
    pitch: "Choose where to reduce flood losses and how much protection the treasury can deliver.",
    outcome: "Compare early Bhima protection, a wider state-funded plan and a Union-backed programme.",
    next: "Completed works open a larger regional food reserve.",
  }),
  industry: programme("trade", "Western Textile Districts", "Thana, Poona, Anand and Bharuch", {
    cost: 74, requires: "trade", works: [...maharashtraMills, ...gujaratMills],
    pitch: "Use the new market links to expand textile production beyond Bombay and Ahmedabad.",
    outcome: "Adds four mills to the connected corridor across three years.",
    next: "The mills create demand for a dedicated freight terminal.",
  }),
  applied: programme("trade", "Engineering and Mill Services", "Nasik, Sholapur, Surat and Valsad", {
    cost: 61, requires: "skills", works: [...maharashtraApplied, ...gujaratApplied],
    pitch: "Put graduates to work maintaining machinery and processing goods for inland markets.",
    outcome: "Adds four workshops and a road link towards Nasik.",
    next: "Connected workshops can pursue freight orders and benefit from apprenticeships.",
  }),
  ...successor("maharashtra", {
    mh_food: programme("food", "Poona and Bhima Food Security", "Poona and the Bhima plain", {
      cost: 25, opening: true, works: deccanFood,
      pitch: "Build a food buffer close to the new administration's inland markets.",
      outcome: "Opens two irrigated growing areas and a grain store in Poona.",
      next: "The Bhima programme extends protection and irrigation around Sholapur.",
    }),
    mh_trade: programme("trade", "Bombay and Poona Market Corridor", "Bombay, Thana and Poona", {
      cost: 29, opening: true, works: localSchedule(bombayLinks),
      pitch: "Connect the port to the Deccan and build capacity for textile processing.",
      outcome: "Adds two road links and a mill. Earlier provincial investment on these sites counts toward completion.",
      next: "Extend industry into Thana and Poona.",
    }),
    mh_skills: programme("education", "Bombay and Poona Technical Schools", "Bombay and Poona", {
      cost: 28, opening: true, works: maharashtraSchools,
      pitch: "Teach trades for engineering and industry in the coastal and inland centres.",
      outcome: "Opens two technical schools in two years.",
      next: "Choose higher education or new engineering workshops when the schools open.",
    }),
    mh_water: programme("food", "Bhima Protection and Irrigation", "Poona and Sholapur", {
      cost: 41, requires: "mh_food", works: deccanWater,
      pitch: "Protect growing areas and strengthen reserves on the Deccan plain.",
      outcome: "An embankment protects nearby sites. Irrigation and the Sholapur grain store follow in year two.",
      next: "The completed scheme unlocks a larger cooperative reserve.",
    }),
    mh_industry: programme("trade", "Thana and Poona Textile Districts", "Thana and Poona", {
      cost: 46, requires: "mh_trade", works: localSchedule(maharashtraMills),
      pitch: "Move more textile processing into the Bombay hinterland.",
      outcome: "Adds two mills linked to the existing port corridor.",
      next: "Fund a freight terminal to compete for more orders.",
    }),
    mh_applied: programme("trade", "Deccan Engineering Workshops", "Nasik and Sholapur", {
      cost: 40, requires: "mh_skills", works: maharashtraApplied,
      pitch: "Use technical training to support inland manufacturing.",
      outcome: "Adds two workshops and a road link towards Nasik.",
      next: "Market links and apprenticeships can raise workshop output.",
    }),
    mh_inlandIndustry: programme("trade", "Vidarbha Cotton and Engineering", "Nagpur, Wardha and Amravati", {
      era: 1966, priceYear: 1966, cost: 78, requires: "mh_industry",
      works: [...vidarbhaLinks, work("mill", 14, 8, 3), work("mill", 14, 7, 3)],
      pitch: "Build an inland industrial base around Nagpur and its cotton-producing hinterland.",
      outcome: "Adds three mills and two road links in Vidarbha.",
      next: "Engineering training and connections raise returns from the inland mills.",
    }),
  }),
  ...successor("gujarat", {
    gj_food: programme("food", "Lower Narmada Food Security", "Bharuch and the lower Narmada", {
      cost: 24, opening: true, works: narmadaFood,
      pitch: "Expand food production beside the lower Narmada and build reserves inland from the coast.",
      outcome: "Irrigates two growing areas and opens a grain store in Bharuch.",
      next: "The state can protect more lowland crops through the Narmada programme.",
    }),
    gj_trade: programme("trade", "Ahmedabad and Surat Market Links", "Ahmedabad, Anand, Bharuch and Surat", {
      cost: 32, opening: true, works: localSchedule(gujaratLinks),
      pitch: "Link the cotton and workshop towns from the Gujarat plain to Surat.",
      outcome: "Completes three links and opens a mill in Ahmedabad. Earlier provincial works count towards delivery.",
      next: "Extend cotton processing into Anand and Bharuch.",
    }),
    gj_skills: programme("education", "Ahmedabad and Surat Technical Schools", "Ahmedabad and Surat", {
      cost: 27, opening: true, works: localSchedule(gujaratSchools),
      pitch: "Train engineers and industrial workers near Gujarat's mills.",
      outcome: "Opens technical schools in Ahmedabad and Surat.",
      next: "The new schools unlock degree colleges and mill-service workshops.",
    }),
    gj_water: programme("food", "Narmada Floodplain Works", "Bharuch and the lower Narmada", {
      cost: 35, requires: "gj_food", works: localSchedule(narmadaWater),
      pitch: "Protect crops beside the lower river and bring another growing area under irrigation.",
      outcome: "Completes an embankment and new irrigation in two years.",
      next: "The completed works unlock a larger regional food reserve.",
    }),
    gj_industry: programme("trade", "Anand and Bharuch Cotton Mills", "Anand and Bharuch", {
      cost: 43, requires: "gj_trade", works: localSchedule(gujaratMills),
      pitch: "Develop cotton processing along the route to Surat.",
      outcome: "Adds two mills to the Gujarat corridor.",
      next: "Combine market access and mill output with a freight terminal.",
    }),
    gj_applied: programme("trade", "Surat and Valsad Mill Services", "Surat and Valsad", {
      cost: 38, requires: "gj_skills", works: gujaratApplied,
      pitch: "Use technical training to improve workshop capacity along the south Gujarat coast.",
      outcome: "Adds two workshops near Surat's market.",
      next: "A freight terminal can help coastal workshops reach larger markets.",
    }),
    gj_coastalIndustry: programme("trade", "Kutch and Saurashtra Port Workshops", "Kandla, Bhuj and Jamnagar", {
      era: 1966, priceYear: 1966, cost: 72, requires: "gj_industry",
      works: [...kutchLinks, work("mill", 2, 1, 3), work("mill", 3, 3, 3)],
      pitch: "Create a coastal base for manufacturing and port services around the Gulf of Kutch.",
      outcome: "Adds three workshops and two road links near Kandla.",
      next: "Connected workshops increase the state's ability to win freight orders.",
    }),
  }),
};
