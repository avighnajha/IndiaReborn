const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

const basin = [work("granary", 11, 8, 1), work("levee", 10, 6, 2), work("irrigation", 10, 5, 2)];
export const mahanadiAgreements = {
  focused: {
    title: "Delta protection", funding: "Orissa funds", area: "Cuttack and the lower Mahanadi",
    detail: "Fund local embankments and storage. Protection comes sooner and the budget stays focused on the delta.",
    total: 24, union: 0, works: basin,
  },
  union: {
    title: "Hirakud works agreement", funding: "Union co-funding", area: "Upper Mahanadi and the coastal delta",
    detail: "Use the survey to negotiate shared funding for phased irrigation, flood protection and power. The power allocation opens a later cabinet choice.",
    total: 51, union: 19, works: [...basin, work("levee", 11, 5, 3), work("irrigation", 13, 4, 3), work("power", 2, 5, 4)],
  },
};

export const orissaProgrammes = {
  food: {
    title: "Delta Food Security", district: "Cuttack and the coastal plain", theme: "Food and water", color: 0x9fc783,
    cost: 15, layer: "terrain", opening: true,
    pitch: "Improve the coastal harvest before putting money into trade.", outcome: "Expands two growing areas and adds emergency storage. Early irrigation is exposed until flood works open.",
    next: "Opens the Mahanadi Basin Programme.",
    works: [work("irrigation", 12, 6, 1), work("irrigation", 11, 4, 1), work("levee", 12, 5, 2), work("granary", 11, 6, 2)],
  },
  trade: {
    title: "Coastal and Interior Markets", district: "Cuttack, Dhenkanal, Puri and Bargarh", theme: "Transport and industry", color: 0xe7bc73,
    cost: 17, layer: "access", opening: true,
    pitch: "Bring coastal towns and western producers into reach of existing hubs.", outcome: "Connects markets in stages, then puts a workshop in Dhenkanal on the network.",
    next: "Opens the Talcher Industrial Belt.",
    works: [work("road", 10, 5, 1), work("road", 3, 6, 2), work("road", 11, 7, 2), work("mill", 9, 5, 3)],
  },
  skills: {
    title: "Provincial Technical Schools", district: "Cuttack, Sambalpur and Puri", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 16, layer: "terrain", opening: true,
    pitch: "Train workers in three towns before investing in workshops.", outcome: "The first schools open in year two. Their skills grow over time and raise workshop productivity.",
    next: "Opens the Coastal Workshop Partnership.",
    works: [work("school", 11, 6, 2), work("school", 3, 5, 2), work("school", 11, 8, 3)],
  },
  mahanadi: {
    title: "Mahanadi Basin Programme", district: "The upper river and coastal delta", theme: "Food and water", color: 0x9fc783,
    layer: "weather", requires: "food",
    pitch: "Choose local protection or negotiate a wider works agreement with power generation.",
    outcome: "Compare the state-funded delta plan with a phased Hirakud agreement.",
    next: "Wider works can supply power to workshops or irrigation pumps.", works: mahanadiAgreements.union.works,
  },
  industry: {
    title: "Talcher Industrial Belt", district: "Talcher, Sambalpur and the northern ore belt", theme: "Transport and industry", color: 0xe7bc73,
    cost: 40, layer: "access", requires: "trade",
    pitch: "Build an industrial network around inland resources and connected towns.", outcome: "Extends the Cuttack market network to Talcher and opens workshops in the interior.",
    next: "Connected workshops can use power if the basin agreement delivers it.",
    works: [work("road", 9, 5, 1), work("road", 8, 5, 2), work("mill", 3, 5, 2), work("mill", 8, 5, 3), work("mill", 4, 1, 3)],
  },
  applied: {
    title: "Coastal Workshop Partnership", district: "Cuttack, Bhubaneswar and Puri", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 31, layer: "terrain", requires: "skills",
    pitch: "Put the trained workforce to use in the coastal towns.", outcome: "Adds three workshops. Market connections and power can raise their output further.",
    next: "Workshop income can fund further regional works.",
    works: [work("mill", 11, 6, 2), work("mill", 10, 7, 2), work("mill", 11, 8, 3)],
  },
};
