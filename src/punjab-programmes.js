const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const doabFood = [work("irrigation", 4, 5, 1), work("irrigation", 7, 7, 2), work("granary", 6, 5, 2)];
const easternFood = [work("irrigation", 11, 9, 1), work("granary", 12, 10, 2)];
const doabTrade = [work("road", 5, 6, 1), work("road", 4, 6, 2), work("road", 8, 6, 2), work("mill", 7, 6, 3)];
const easternTrade = [work("road", 11, 9, 1), work("road", 11, 10, 2), work("mill", 12, 10, 3)];
const doabSchools = [work("school", 6, 5, 1), work("school", 7, 6, 2)];
const easternSchools = [work("school", 11, 8, 2), work("school", 12, 10, 3)];
const doabIndustry = [work("mill", 6, 5, 2), work("mill", 3, 6, 2)];
const easternIndustry = [work("mill", 11, 8, 2), work("mill", 12, 11, 3)];
const doabEngineering = [work("mill", 7, 4, 2), work("mill", 6, 6, 2)];
const easternEngineering = [work("mill", 13, 8, 2), work("mill", 12, 9, 2)];
const cottonWorks = [work("mill", 5, 9, 1), work("mill", 6, 8, 2)];
const canalBelt = [work("irrigation", 5, 11, 1), work("irrigation", 6, 11, 2), work("granary", 9, 11, 2)];

export const punjabBasinAgreements = {
  focused: {
    title: "Canals first", funding: "Union co-funding", area: "Sutlej and eastern growing areas",
    detail: "Open three irrigated areas before Nangal power comes online. Pumps add 4 food per year, or 2 after the power split.",
    total: 71, union: 24, allocation: "irrigation",
    works: [work("irrigation", 8, 6, 2), work("irrigation", 11, 11, 2), work("irrigation", 9, 12, 2), work("power", 9, 4, 3)],
  },
  union: {
    title: "Power first", funding: "Union co-funding", area: "Nangal, Ropar and the eastern plain",
    detail: "Open Nangal power and an engineering shop first. Each linked workshop gains 2 output, or 1 after the power split. Two irrigated areas follow.",
    total: 86, union: 34, allocation: "industry",
    works: [work("power", 9, 4, 2), work("mill", 9, 6, 2), work("irrigation", 8, 6, 4), work("irrigation", 11, 11, 4)],
  },
};

const fields = {
  food: { theme: "Food and water", color: 0x9fc783, layer: "weather" },
  trade: { theme: "Transport and industry", color: 0xe7bc73, layer: "access" },
  education: { theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain" },
};
const programme = (department, tier, title, district, details) => ({ ...fields[department], department, tier, title, district, ...details });
const successor = (name, plans) => Object.fromEntries(Object.entries(plans).map(([id, plan]) => [id, { ...plan, punjabSuccessor: name }]));
const localSchedule = (works) => works.map((item) => ({ ...item, year: Math.min(2, item.year) }));

export const punjabProgrammes = {
  food: programme("food", 1, "Sutlej Plain Food Security", "Jullundur, Ludhiana and Karnal", {
    opening: true, cost: 31, works: [...doabFood, ...easternFood],
    pitch: "Build a harvest buffer before resettlement strains supplies.",
    outcome: "Irrigates three growing areas and opens two grain stores.",
    next: "Unlocks the Bhakra–Nangal agreement from 1953.",
  }),
  trade: programme("trade", 1, "Punjab Market Recovery", "Ferozepore, Ludhiana and Karnal", {
    opening: true, cost: 35, works: [...doabTrade, ...easternTrade],
    pitch: "Build inland alternatives to the western market routes threatened by Partition.",
    outcome: "Opens links on the Sutlej and eastern corridors, with workshops in Ludhiana and Karnal.",
    next: "The corridor supports a wider programme of processing workshops.",
  }),
  skills: programme("education", 1, "Punjab Technical Schools", "Jullundur, Ludhiana, Ambala and Karnal", {
    opening: true, cost: 29, works: [...doabSchools, ...easternSchools],
    pitch: "Prepare workers for agriculture, engineering and trade.",
    outcome: "Opens four schools across both sides of the province.",
    next: "Operating schools support degree colleges and engineering workshops.",
  }),
  bhakra: programme("food", 2, "Bhakra–Nangal Distribution Agreement", "Nangal and the Sutlej plain", {
    era: 1953, priceYear: 1953, requires: "food", works: punjabBasinAgreements.focused.works,
    pitch: "Commit Punjab's share of the distribution works.",
    outcome: "Compare early canal distribution and powered pumps with earlier industrial power.",
    next: "The distribution works support a larger food reserve.",
  }),
  industry: programme("trade", 2, "Punjab Processing Districts", "Jullundur, Ferozepore, Ambala and Panipat", {
    cost: 56, requires: "trade", works: [...doabIndustry, ...easternIndustry],
    pitch: "Build workshops beside the recovering markets.",
    outcome: "Opens four workshops for processing and light manufacturing.",
    next: "A freight terminal can carry more orders from the national market.",
  }),
  applied: programme("trade", 2, "Punjab Engineering Workshops", "Hoshiarpur, Phillaur, Jagadhri and Kurukshetra", {
    cost: 49, requires: "skills", works: [...doabEngineering, ...easternEngineering],
    pitch: "Use technical training to support tools and farm equipment.",
    outcome: "Opens four workshops. Connected towns get the highest returns.",
    next: "Apprenticeships can raise workshop output further.",
  }),
  punjabCotton: programme("trade", 2, "Bhatinda Cotton Workshops", "Bhatinda and Barnala", {
    era: 1956, priceYear: 1956, punjabEnlarged: true, requires: "trade", cost: 41, works: cottonWorks,
    pitch: "Invest in the cotton markets of the former PEPSU districts.",
    outcome: "Opens two processing workshops. Both pass to Punjab in 1966.",
    next: "Punjab can expand the cotton belt after reorganization.",
  }),
  punjabCanalBelt: programme("food", 2, "Western Canal and Reserve Works", "Sirsa, Fatehabad and Jind", {
    era: 1956, priceYear: 1956, punjabEnlarged: true, requires: "food", cost: 38, works: canalBelt,
    pitch: "Strengthen food supplies in the dry western districts.",
    outcome: "Adds two irrigated areas and a store in Jind. Haryana inherits all three works.",
    next: "The works count toward Haryana's local canal programme.",
  }),
  ...successor("punjab", {
    pb_food: programme("food", 1, "Doab Food Security", "Jullundur and the Sutlej plain", {
      opening: true, cost: 23, works: doabFood,
      pitch: "Protect the harvest in Punjab's central plains.",
      outcome: "Irrigates two growing areas and adds a grain store in Jullundur.",
      next: "Canal extensions open a larger state reserve.",
    }),
    pb_trade: programme("trade", 1, "Ludhiana and Ferozepore Market Links", "Ludhiana, Ferozepore and Ropar", {
      opening: true, cost: 26, works: localSchedule(doabTrade),
      pitch: "Give Punjab's inland workshops access to more markets.",
      outcome: "Opens three road links and a workshop. Earlier works count toward delivery.",
      next: "Expand processing in Jullundur and Ferozepore.",
    }),
    pb_skills: programme("education", 1, "Doab Technical Schools", "Jullundur and Ludhiana", {
      opening: true, cost: 23, works: doabSchools,
      pitch: "Train technicians for the plains' workshops and farms.",
      outcome: "Opens schools in Jullundur and Ludhiana.",
      next: "Both schools support degree colleges and the teaching charter.",
    }),
    pb_water: programme("food", 2, "Sutlej Canal Extension", "Moga, Tarn Taran and Ferozepore", {
      cost: 42, requires: "pb_food", works: [work("irrigation", 5, 7, 1), work("irrigation", 3, 4, 2), work("granary", 3, 6, 2)],
      pitch: "Broaden canal access along the western plain.",
      outcome: "Irrigates two growing areas and opens a grain store in Ferozepore.",
      next: "Unlocks a larger Punjab cooperative reserve.",
    }),
    pb_industry: programme("trade", 2, "Doab Processing Workshops", "Jullundur and Ferozepore", {
      cost: 39, requires: "pb_trade", works: doabIndustry,
      pitch: "Build up processing around the established markets.",
      outcome: "Opens two workshops. Existing provincial workshops count toward delivery.",
      next: "Pair production with a terminal in Ludhiana.",
    }),
    pb_applied: programme("trade", 2, "Doab Engineering Workshops", "Hoshiarpur and Phillaur", {
      cost: 37, requires: "pb_skills", works: doabEngineering,
      pitch: "Use the skills network to build workshops for tools and machine parts.",
      outcome: "Opens workshops in Hoshiarpur and Phillaur.",
      next: "Connections and apprenticeships increase workshop output.",
    }),
    pb_cotton: programme("trade", 2, "Bhatinda and Malwa Processing Belt", "Bhatinda, Barnala and Faridkot", {
      cost: 61, requires: "pb_industry", works: [...cottonWorks, work("mill", 4, 8, 3)],
      pitch: "Expand cotton processing in the former PEPSU districts.",
      outcome: "Opens three workshops. Bhatinda and Barnala count if already built.",
      next: "A freight terminal can carry the output to wider markets.",
    }),
  }),
  ...successor("haryana", {
    hr_food: programme("food", 1, "Karnal Food Security", "Karnal and the eastern canal plain", {
      opening: true, cost: 21, works: easternFood,
      pitch: "Give the new state an early harvest and reserve buffer.",
      outcome: "Irrigates one growing area and opens a grain store in Karnal.",
      next: "Extend irrigation to the dry western canal belt.",
    }),
    hr_trade: programme("trade", 1, "Ambala and Karnal Market Links", "Ambala, Kaithal and Karnal", {
      opening: true, cost: 25, works: localSchedule(easternTrade),
      pitch: "Connect the eastern plain to its processing markets.",
      outcome: "Opens two road links and a workshop. Earlier works count toward delivery.",
      next: "Expand into workshops at Ambala and Panipat.",
    }),
    hr_skills: programme("education", 1, "Ambala and Karnal Technical Schools", "Ambala and Karnal", {
      opening: true, cost: 22, works: localSchedule(easternSchools),
      pitch: "Build a local skills base for farms and workshops.",
      outcome: "Opens two technical schools.",
      next: "Both schools support degree colleges and the teaching charter.",
    }),
    hr_water: programme("food", 2, "Haryana Western Canal Belt", "Sirsa, Fatehabad and Jind", {
      cost: 37, requires: "hr_food", works: canalBelt,
      pitch: "Reduce dry-season pressure on the west.",
      outcome: "Adds two irrigated areas and a grain store in Jind. Earlier works count toward delivery.",
      next: "Unlocks a larger food reserve near Hissar.",
    }),
    hr_industry: programme("trade", 2, "Ambala and Panipat Workshops", "Ambala and Panipat", {
      cost: 36, requires: "hr_trade", works: localSchedule(easternIndustry),
      pitch: "Expand light manufacturing along the eastern route.",
      outcome: "Opens two workshops. Earlier provincial works count toward delivery.",
      next: "A freight terminal can carry more orders.",
    }),
    hr_applied: programme("trade", 2, "Haryana Farm Equipment Workshops", "Jagadhri and Kurukshetra", {
      cost: 34, requires: "hr_skills", works: easternEngineering,
      pitch: "Apply technical training to farm equipment and repair.",
      outcome: "Opens two workshops in the eastern plain.",
      next: "More links and apprenticeships raise workshop output.",
    }),
  }),
};
