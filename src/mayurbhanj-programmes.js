const work = (kind, q, r, year) => ({ kind, hex: `hex-${q}-${r}`, year });

export const mayurbhanjProgrammes = {
  food: {
    title: "Tanks and Grain Stores", district: "Baripada and the eastern lowlands", theme: "Food and water", color: 0x9fc783,
    cost: 7, layer: "terrain", opening: true,
    pitch: "Improve tank-fed fields and keep a reserve of grain close to Baripada.",
    outcome: "The fields enter production first. An embankment and a store follow, reducing losses and holding more grain for a dry year.",
    next: "Opens a second round of tank improvements near Karanjia and Udala.",
    works: [work("irrigation", 13, 2, 1), work("levee", 13, 1, 2), work("granary", 12, 1, 2)],
  },
  trade: {
    title: "Baripada Market Roads", district: "Baripada, Jashipur, Karanjia and Udala", theme: "Transport and industry", color: 0xe7bc73,
    cost: 8, layer: "access", opening: true,
    pitch: "Give growers and workshops in the interior access to the Baripada market.",
    outcome: "Two staged road links bring Jashipur and Karanjia into the network. A workshop opens in Udala.",
    next: "Opens the Similipal Workshops programme.",
    works: [work("road", 11, 1, 1), work("road", 11, 2, 2), work("mill", 12, 2, 3)],
  },
  skills: {
    title: "Baripada and Karanjia Schools", district: "Baripada and the interior", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 8, layer: "terrain", opening: true,
    pitch: "Train skilled workers in the capital and build a second centre in the interior.",
    outcome: "Both schools add skills after opening. Mature schools can meet the state's training goal and raise workshop productivity.",
    next: "Opens the Baripada Trades Partnership.",
    works: [work("school", 12, 1, 2), work("school", 10, 2, 3)],
  },
  tanks: {
    title: "Karanjia Tank Renewal", district: "Karanjia and Udala", theme: "Food and water", color: 0x9fc783,
    cost: 11, layer: "weather", requires: "food",
    pitch: "Extend storage and water works beyond the capital.",
    outcome: "Develops a second growing area, adds storage at Karanjia and protects lowland works around Udala.",
    next: "Two growing areas and more storage make successive lean seasons easier to manage.",
    works: [work("irrigation", 10, 3, 1), work("granary", 10, 2, 2), work("levee", 12, 2, 2)],
  },
  industry: {
    title: "Similipal Workshops", district: "Jashipur and Karanjia", theme: "Transport and industry", color: 0xe7bc73,
    cost: 14, layer: "access", requires: "trade",
    pitch: "Put small workshops on the interior roads, close to workers and ore.",
    outcome: "Three workshops come online as the new market routes begin to pay off. Their output raises recurring revenue.",
    next: "Technical schooling can raise output without opening more sites.",
    works: [work("mill", 10, 1, 2), work("mill", 10, 2, 2), work("mill", 11, 2, 3)],
  },
  applied: {
    title: "Baripada Trades Partnership", district: "Baripada and Udala", theme: "Skills and prosperity", color: 0x8fcac0,
    cost: 12, layer: "terrain", requires: "skills",
    pitch: "Link the schools to practical work in the market towns.",
    outcome: "Adds a Baripada workshop and a third school at Udala. Workers gain skills while the workshop begins generating revenue.",
    next: "Combine training with transport investment to raise returns from the wider workshop network.",
    works: [work("mill", 12, 1, 2), work("school", 12, 2, 2)],
  },
};
