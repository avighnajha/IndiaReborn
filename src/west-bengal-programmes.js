const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const localDefences = [work("levee", 6, 8, 1), work("granary", 5, 7, 2), work("irrigation", 8, 8, 2)];
const valleyWorks = [...localDefences, work("levee", 8, 8, 2), work("irrigation", 8, 9, 3)];

export const damodarAgreements = {
  focused: {
    title: "Bardhaman embankments", funding: "West Bengal funds", area: "The lower Damodar near Bardhaman",
    detail: "Build the first embankment this year and open a growing area and storage in year two.",
    total: 33, union: 0, works: localDefences,
  },
  basin: {
    title: "Lower Damodar works", funding: "West Bengal funds", area: "The lower Damodar and adjoining plains",
    detail: "Fund two embankments and a wider irrigation service. The state pays the full cost for delivery in three years.",
    total: 54, union: 0, works: valleyWorks,
  },
  union: {
    title: "Joint valley works agreement", funding: "Union co-funding", area: "The Damodar floodplain and downstream fields",
    detail: "Share the cost of wider protection and another growing area. Joint review moves the embankments back a year.",
    total: 72, union: 24,
    works: [
      ...valleyWorks.map((site) => site.kind === "levee" ? { ...site, year: site.year + 1 } : site),
      work("levee", 7, 8, 3), work("irrigation", 7, 10, 4),
    ],
  },
};

export const bengalProgrammes = {
  food: {
    title: "Bardhaman Rice and Reserves", district: "Bardhaman and the lower Damodar", theme: "Food and water", color: 0x9fc783,
    cost: 24, layer: "weather", opening: true,
    pitch: "Grow more rice close to inland markets and build up reserves for poor monsoons.",
    outcome: "Opens two growing areas and adds storage at Bardhaman. The floodplain fields remain exposed until embankments open.",
    next: "Opens negotiations for the Damodar Valley Programme.",
    works: [work("irrigation", 7, 8, 1), work("irrigation", 7, 9, 2), work("granary", 7, 7, 2)],
  },
  trade: {
    title: "Hooghly Port and Mill Corridor", district: "Calcutta, Howrah, Hooghly and the inland markets", theme: "Transport and industry", color: 0xe7bc73,
    cost: 27, layer: "access", opening: true, rawJute: true,
    pitch: "Build on Calcutta's port and link the Hooghly mills to inland markets.",
    outcome: "Roads connect Hooghly, Krishnanagar and Bardhaman. A jute mill opens in year three and needs a steady supply of raw fibre.",
    next: "Improve domestic jute supply or diversify production in the Damodar coal belt.",
    works: [work("road", 10, 8, 1), work("road", 9, 8, 2), work("road", 8, 7, 2), work("mill", 9, 8, 3)],
  },
  skills: {
    title: "Calcutta and Kharagpur Technical Schools", district: "Calcutta, Howrah and Kharagpur", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 23, layer: "terrain", opening: true,
    pitch: "Train workers where the port, engineering shops and rail workshops can use their skills.",
    outcome: "Opens technical schools in Calcutta and Howrah, then Kharagpur. Each operating school raises the supply of skilled workers.",
    next: "Opens the Rail and Engineering Workshops programme.",
    works: [work("school", 10, 9, 2), work("school", 9, 9, 2), work("school", 7, 11, 3)],
  },
  damodar: {
    title: "Damodar Valley Programme", district: "The lower Damodar and its growing areas", theme: "Food and water", color: 0x9fc783,
    layer: "weather", requires: "food",
    pitch: "Choose between early local protection and wider flood and water works.",
    outcome: "Embankments protect growing areas in severe monsoons. The wider plans irrigate more land but take longer to complete.",
    next: "Completed valley works unlock a larger cooperative food reserve.",
    works: damodarAgreements.union.works,
  },
  industry: {
    title: "Damodar Industrial Belt", district: "Asansol, Raniganj and Durgapur", theme: "Transport and industry", color: 0xe7bc73,
    cost: 60, layer: "access", requires: "trade",
    pitch: "Use the Raniganj coal belt and inland routes to build an industrial base away from the jute mills.",
    outcome: "Links Durgapur to Asansol through Raniganj and opens three workshops on the route.",
    next: "The larger workshop network can support a freight terminal.",
    works: [work("road", 4, 7, 1), work("road", 5, 7, 2), work("mill", 3, 7, 2), work("mill", 4, 7, 3), work("mill", 5, 7, 3)],
  },
  applied: {
    title: "Rail and Engineering Workshops", district: "Howrah, Calcutta and Kharagpur", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 47, layer: "access", requires: "skills",
    pitch: "Put technical graduates to work making and maintaining equipment for the port and railways.",
    outcome: "Adds three workshops that benefit from the trained workforce and existing market hubs.",
    next: "Combine this industry with the Hooghly corridor to unlock a freight terminal.",
    works: [work("mill", 9, 9, 2), work("mill", 10, 9, 2), work("mill", 7, 11, 3)],
  },
  juteSupply: {
    title: "Nadia Jute Supply Programme", district: "Krishnanagar and the Nadia plains", theme: "Transport and industry", color: 0xe7bc73,
    cost: 25, layer: "access", requires: "trade",
    pitch: "Grow and collect raw jute within West Bengal so the Hooghly mill has a second source of fibre.",
    outcome: "Opens two jute growing areas and connects collection points to Krishnanagar. The completed programme supplies the jute mill.",
    next: "Domestic inputs keep the mill supplied during cross-border trade interruptions.",
    works: [work("juteFarm", 10, 6, 1), work("juteFarm", 11, 7, 2), work("road", 9, 7, 2), work("road", 10, 7, 3)],
  },
  puruliaIndustry: {
    title: "Purulia Industrial Links", district: "Purulia and the western plateau", theme: "Transport and industry", color: 0xe7bc73,
    era: 1957, cost: 57, layer: "access", requires: "industry", bengalTransfer: true,
    pitch: "Extend the Asansol market into the districts gained in the 1956 settlement.",
    outcome: "Links Purulia to Asansol and opens two plateau workshops.",
    next: "Schools and connected markets raise workshop production.",
    works: [work("road", 2, 7, 1), work("road", 2, 8, 2), work("mill", 2, 8, 2), work("mill", 1, 8, 3)],
  },
  bengalDeltaRenewal: {
    title: "Lower Delta Food Security", district: "Basirhat and the lower river plains", theme: "Food and water", color: 0x9fc783,
    era: 1966, cost: 96, layer: "weather",
    pitch: "Build reserves and protect more lowland fields as demand grows.",
    outcome: "Adds storage at Basirhat and opens two irrigated growing areas. The second phase includes a new embankment.",
    next: "The new growing areas benefit from agricultural extension and regional water works.",
    works: [work("irrigation", 11, 10, 1), work("granary", 12, 9, 2), work("levee", 12, 10, 2), work("irrigation", 11, 11, 3)],
  },
};
