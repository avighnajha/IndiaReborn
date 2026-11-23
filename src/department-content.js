const departments = {
  education: { label: "Education", theme: "Skills and prosperity", color: 0x8fcac0, layer: "terrain",
    description: "Teach the workforce, build higher education, then specialize in engineering or agricultural research." },
  food: { label: "Food & Water", theme: "Food and water", color: 0x9fc783, layer: "weather",
    description: "Stabilize harvests, protect growing areas, and invest in reserves and shared water works." },
  trade: { label: "Trade & Industry", theme: "Transport and industry", color: 0xe7bc73, layer: "access",
    description: "Connect towns, grow workshops, and open a freight terminal before building an industrial park." },
};

// Authored capital amounts have a separate price vintage from unlock rules.
const departmentPriceYears = {
  educationColleges: 1956, educationUniversity: 1961, educationTechnology: 1966, educationAgriculture: 1966,
  foodDepot: 1961, foodWaterNetwork: 1966, tradeFreightTerminal: 1961, tradeIndustrialPark: 1966,
};

const tracks = {
  bihar: { food: ["kosi"], trade: ["industry", "applied", "northIndustry"] },
  orissa: { food: ["mahanadi"], trade: ["industry", "applied"] },
  mayurbhanj: { food: ["tanks", "orissa_mahanadi"], trade: ["industry", "applied", "orissa_industry", "orissa_applied"] },
  "west-bengal": { food: ["damodar"], trade: ["industry", "applied"] },
  bombay: { food: ["bombayWater", "mh_water"], trade: ["industry", "applied", "mh_industry", "mh_applied"] },
  punjab: { food: ["bhakra", "pb_water"], trade: ["industry", "applied", "pb_industry", "pb_applied"] },
  madras: { food: ["madrasDeltaBanks", "cauvery"], trade: ["industry", "applied", "tn_industry", "tn_applied", "tn_southMarkets"] },
  assam: { food: ["brahmaputra", "assamBarakStores"], trade: ["assamRailLink", "industry", "applied"] },
  central: { food: ["centralTandula", "chambal"], trade: ["industry", "applied", "centralBastarMarkets", "centralMalwaMarkets"] },
};

// These upper-tier sites remain within the player's administration after the
// supported border changes. In Mayurbhanj they continue the home district's
// investment even when the player takes responsibility for the rest of Orissa.
const sites = {
  central: {
    educationColleges: { title: "Mahakoshal and Raipur Degree Colleges", district: "Jubbulpore and Raipur", cost: 48, locations: [[11, 7, 1], [14, 10, 2]] },
    educationUniversity: { title: "University of Saugor Expansion", district: "Saugor", cost: 69, locations: [[9, 6, 2]] },
    educationTechnology: { title: "Jubbulpore Engineering Laboratories", district: "Jubbulpore", cost: 83, locations: [[11, 7, 3]] },
    educationAgriculture: { title: "Jubbulpore Agricultural Research Centre", district: "Jubbulpore", cost: 73, locations: [[11, 7, 2]] },
    foodDepot: { title: "Itarsi Cooperative Reserve Depot", district: "Itarsi", cost: 41, locations: [[8, 8, 2]] },
    foodWaterNetwork: { title: "Nerbudda Water Network", district: "The Narsinghpur plain", cost: 74, locations: [[10, 8, 3]] },
    tradeFreightTerminal: { title: "Itarsi Inland Freight Terminal", district: "Itarsi", cost: 58, locations: [[8, 8, 2]] },
    tradeIndustrialPark: { title: "Raipur Industrial Park", district: "Raipur", cost: 89, locations: [[14, 10, 3]] },
  },
  assam: {
    educationColleges: { title: "Valley Degree Colleges", district: "Gauhati and Silchar", cost: 33, locations: [[6, 5, 1], [10, 9, 2]] },
    educationUniversity: { title: "Gauhati University Expansion", district: "Gauhati", cost: 46, locations: [[6, 5, 2]] },
    educationTechnology: { title: "Upper Assam Engineering Institute", district: "Dibrugarh", cost: 59, locations: [[15, 3, 2]] },
    educationAgriculture: { title: "Jorhat Agricultural Research Centre", district: "Jorhat", cost: 54, locations: [[13, 4, 2]] },
    foodDepot: { title: "Nowgong Cooperative Reserve", district: "Nowgong", cost: 32, locations: [[9, 5, 2]] },
    foodWaterNetwork: { title: "Central Valley Drainage Network", district: "Tezpur and Nowgong", cost: 61, locations: [[10, 4, 3]] },
    tradeFreightTerminal: { title: "Dibrugarh Freight Terminal", district: "Dibrugarh", cost: 47, locations: [[15, 3, 2]] },
    tradeIndustrialPark: { title: "Jorhat Processing Park", district: "Jorhat", cost: 69, locations: [[13, 4, 3]] },
  },
  madras: {
    educationColleges: { title: "Madras and Coimbatore Degree Colleges", district: "Madras and Coimbatore", cost: 52, locations: [[10, 9, 1], [5, 12, 2]] },
    educationUniversity: { title: "Madras University Expansion", district: "Madras", cost: 78, locations: [[10, 9, 2]] },
    educationTechnology: { title: "Coimbatore Engineering Institute", district: "Coimbatore", cost: 97, locations: [[5, 12, 3]] },
    educationAgriculture: { title: "Tanjore Agricultural Research Centre", district: "Tanjore", cost: 87, locations: [[9, 12, 2]] },
    foodDepot: { title: "Tanjore Cooperative Reserve", district: "Tanjore", cost: 42, locations: [[9, 12, 2]] },
    foodWaterNetwork: { title: "Lower Cauvery Water Network", district: "The Tanjore delta", cost: 76, locations: [[9, 13, 3]] },
    tradeFreightTerminal: { title: "Madras Port Freight Terminal", district: "Madras", cost: 63, locations: [[10, 9, 2]] },
    tradeIndustrialPark: { title: "Cuddalore Industrial Park", district: "Cuddalore", cost: 99, locations: [[10, 11, 3]] },
  },
  punjab: {
    educationColleges: { title: "Jullundur and Amritsar Degree Colleges", district: "Jullundur and Amritsar", cost: 44, locations: [[6, 5, 1], [3, 3, 2]] },
    educationUniversity: { title: "Ludhiana University Campus", district: "Ludhiana", cost: 63, locations: [[7, 6, 2]] },
    educationTechnology: { title: "Ropar Engineering Institute", district: "Ropar", cost: 77, locations: [[9, 6, 2]] },
    educationAgriculture: { title: "Ludhiana Agricultural Research Centre", district: "Ludhiana", cost: 67, locations: [[7, 6, 2]] },
    foodDepot: { title: "Ferozepore Cooperative Reserve", district: "Ferozepore", cost: 38, locations: [[3, 6, 2]] },
    foodWaterNetwork: { title: "Sutlej Plains Water Network", district: "Moga and the Sutlej plain", cost: 67, locations: [[5, 7, 2]] },
    tradeFreightTerminal: { title: "Ludhiana Freight Terminal", district: "Ludhiana", cost: 51, locations: [[7, 6, 2]] },
    tradeIndustrialPark: { title: "Jullundur Industrial Park", district: "Jullundur", cost: 81, locations: [[6, 5, 2]] },
  },
  bombay: {
    educationColleges: { title: "Bombay and Poona Degree Colleges", district: "Bombay and Poona", cost: 59, locations: [[6, 9, 2], [8, 10, 3]] },
    educationUniversity: { title: "Bombay University Expansion", district: "Bombay", cost: 86, locations: [[6, 9, 3]] },
    educationTechnology: { title: "Poona Engineering Institute", district: "Poona", cost: 107, locations: [[8, 10, 3]] },
    educationAgriculture: { title: "Deccan Agricultural Research Centre", district: "Ahmednagar", cost: 91, locations: [[10, 9, 3]] },
    foodDepot: { title: "Sholapur Cooperative Reserve", district: "Sholapur", cost: 48, locations: [[11, 12, 2]] },
    foodWaterNetwork: { title: "Bhima Irrigation Network", district: "The Bhima basin", cost: 91, locations: [[10, 10, 3]] },
    tradeFreightTerminal: { title: "Bombay Dock Freight Terminal", district: "Bombay", cost: 74, locations: [[6, 9, 2]] },
    tradeIndustrialPark: { title: "Poona Industrial Park", district: "Poona", cost: 116, locations: [[8, 10, 3]] },
  },
  "west-bengal": {
    educationColleges: { title: "Calcutta and Bardhaman Degree Colleges", district: "Calcutta and Bardhaman", cost: 54, locations: [[10, 9, 2], [7, 7, 3]] },
    educationUniversity: { title: "Calcutta University Expansion", district: "Calcutta", cost: 82, locations: [[10, 9, 3]] },
    educationTechnology: { title: "Kharagpur Engineering Campus", district: "Kharagpur", cost: 109, locations: [[7, 11, 3]] },
    educationAgriculture: { title: "Nadia Agricultural Research Institute", district: "Krishnanagar", cost: 94, locations: [[9, 7, 3]] },
    foodDepot: { title: "Bardhaman Cooperative Reserve", district: "Bardhaman", cost: 52, locations: [[7, 7, 2]] },
    foodWaterNetwork: { title: "Lower Damodar Canal and Drainage Network", district: "Lower Damodar", cost: 92, locations: [[7, 8, 3]] },
    tradeFreightTerminal: { title: "Calcutta Dock Freight Terminal", district: "Calcutta", cost: 69, locations: [[10, 9, 2]] },
    tradeIndustrialPark: { title: "Durgapur Industrial Park", district: "Durgapur", cost: 110, locations: [[5, 7, 3]] },
  },
  bihar: {
    educationColleges: { title: "Ganga Provincial Colleges", district: "Patna and Muzaffarpur", cost: 54, locations: [[6, 6, 2], [6, 4, 3]] },
    educationUniversity: { title: "Patna University Expansion", district: "Patna", cost: 82, locations: [[6, 6, 3]] },
    educationTechnology: { title: "Patna Engineering Institute", district: "Patna", cost: 104, locations: [[6, 6, 3]] },
    educationAgriculture: { title: "Tirhut Agricultural Research Institute", district: "Darbhanga", cost: 99, locations: [[8, 3, 3]] },
    foodDepot: { title: "Kosi Reserve Depot", district: "Saharsa", cost: 49, locations: [[11, 4, 2]] },
    foodWaterNetwork: { title: "Kosi Canal and Drainage Network", district: "Eastern floodplain", cost: 88, locations: [[11, 5, 3]] },
    tradeFreightTerminal: { title: "Patna Freight Terminal", district: "Patna", cost: 61, locations: [[6, 6, 2]] },
    tradeIndustrialPark: { title: "Muzaffarpur Industrial Park", district: "Muzaffarpur", cost: 96, locations: [[6, 4, 2]] },
  },
  orissa: {
    educationColleges: { title: "Delta and Interior Colleges", district: "Cuttack and Sambalpur", cost: 32, locations: [[11, 6, 2], [3, 5, 2]] },
    educationUniversity: { title: "Utkal University Expansion", district: "Bhubaneswar", cost: 52, locations: [[10, 7, 3]] },
    educationTechnology: { title: "Cuttack Engineering Institute", district: "Cuttack", cost: 63, locations: [[11, 6, 3]] },
    educationAgriculture: { title: "Mahanadi Agricultural Research Institute", district: "Cuttack", cost: 59, locations: [[11, 6, 3]] },
    foodDepot: { title: "Coastal Reserve Depot", district: "Puri", cost: 30, locations: [[11, 8, 2]] },
    foodWaterNetwork: { title: "Mahanadi Delta Water Network", district: "Lower Mahanadi", cost: 55, locations: [[13, 6, 3]] },
    tradeFreightTerminal: { title: "Cuttack Freight Terminal", district: "Cuttack", cost: 38, locations: [[11, 6, 2]] },
    tradeIndustrialPark: { title: "Dhenkanal Industrial Park", district: "Dhenkanal", cost: 65, locations: [[9, 5, 3]] },
  },
  mayurbhanj: {
    educationColleges: { title: "Mayurbhanj District Colleges", district: "Baripada and Karanjia", cost: 14, locations: [[12, 1, 2], [10, 2, 2]] },
    educationUniversity: { title: "Baripada Regional University", district: "Baripada", cost: 20, locations: [[12, 1, 3]] },
    educationTechnology: { title: "Similipal Engineering Institute", district: "Jashipur", cost: 26, locations: [[10, 1, 3]] },
    educationAgriculture: { title: "Udala Agricultural Research Institute", district: "Udala", cost: 18, locations: [[12, 2, 3]] },
    foodDepot: { title: "Karanjia Reserve Depot", district: "Karanjia", cost: 13, locations: [[10, 2, 2]] },
    foodWaterNetwork: { title: "Baripada Water Network", district: "Eastern lowlands", cost: 22, locations: [[13, 2, 3]] },
    tradeFreightTerminal: { title: "Baripada Freight Terminal", district: "Baripada", cost: 16, locations: [[12, 1, 2]] },
    tradeIndustrialPark: { title: "Jashipur Industrial Park", district: "Jashipur", cost: 28, locations: [[10, 1, 3]] },
  },
};

const gujaratSites = {
  educationColleges: { title: "Ahmedabad and Surat Degree Colleges", district: "Ahmedabad and Surat", cost: 44, locations: [[8, 3, 1], [7, 6, 2]] },
  educationUniversity: { title: "Gujarat University Expansion", district: "Ahmedabad", cost: 65, locations: [[8, 3, 2]] },
  educationTechnology: { title: "Surat Engineering Institute", district: "Surat", cost: 84, locations: [[7, 6, 2]] },
  educationAgriculture: { title: "Anand Agricultural Research Centre", district: "Anand", cost: 70, locations: [[8, 4, 2]] },
  foodDepot: { title: "Bharuch Cooperative Reserve", district: "Bharuch", cost: 35, locations: [[8, 5, 2]] },
  foodWaterNetwork: { title: "Narmada Plain Water Network", district: "The lower Narmada plain", cost: 67, locations: [[9, 5, 2]] },
  tradeFreightTerminal: { title: "Surat Freight Terminal", district: "Surat", cost: 54, locations: [[7, 6, 2]] },
  tradeIndustrialPark: { title: "Ahmedabad Industrial Park", district: "Ahmedabad", cost: 89, locations: [[8, 3, 2]] },
};

const haryanaSites = {
  educationColleges: { title: "Ambala and Karnal Degree Colleges", district: "Ambala and Karnal", cost: 37, locations: [[11, 8, 1], [12, 10, 2]] },
  educationUniversity: { title: "Hissar University Campus", district: "Hissar", cost: 54, locations: [[7, 12, 2]] },
  educationTechnology: { title: "Ambala Engineering Institute", district: "Ambala", cost: 64, locations: [[11, 8, 2]] },
  educationAgriculture: { title: "Hissar Agricultural Research Centre", district: "Hissar", cost: 58, locations: [[7, 12, 2]] },
  foodDepot: { title: "Hissar Cooperative Reserve", district: "Hissar", cost: 33, locations: [[7, 12, 2]] },
  foodWaterNetwork: { title: "Western Haryana Water Network", district: "Fatehabad and the western plain", cost: 57, locations: [[6, 11, 2]] },
  tradeFreightTerminal: { title: "Karnal Freight Terminal", district: "Karnal", cost: 46, locations: [[12, 10, 2]] },
  tradeIndustrialPark: { title: "Panipat Industrial Park", district: "Panipat", cost: 73, locations: [[12, 11, 2]] },
};

const andhraSites = {
  educationColleges: { title: "Coastal Andhra Degree Colleges", district: "Vijayawada and Visakhapatnam", cost: 45, locations: [[11, 4, 1], [15, 3, 2]] },
  educationUniversity: { title: "Andhra University Expansion", district: "Visakhapatnam", cost: 67, locations: [[15, 3, 2]] },
  educationTechnology: { title: "Guntur Engineering Institute", district: "Guntur", cost: 79, locations: [[10, 5, 2]] },
  educationAgriculture: { title: "Godavari Agricultural Research Centre", district: "Rajahmundry", cost: 69, locations: [[12, 4, 2]] },
  foodDepot: { title: "Vijayawada Cooperative Reserve", district: "Vijayawada", cost: 37, locations: [[11, 4, 2]] },
  foodWaterNetwork: { title: "Lower Godavari Water Network", district: "The Godavari delta", cost: 69, locations: [[13, 5, 3]] },
  tradeFreightTerminal: { title: "Visakhapatnam Port Freight Terminal", district: "Visakhapatnam", cost: 56, locations: [[15, 3, 2]] },
  tradeIndustrialPark: { title: "Vijayawada Industrial Park", district: "Vijayawada", cost: 87, locations: [[11, 4, 3]] },
};

const plans = {
  educationColleges: {
    department: "education", tier: 2, kind: "college", minimumSchools: 2,
    pitch: "Give students a path into higher education after the school network.",
    effect: "The two colleges add 12 Skills and 2 output per market-connected workshop. Each college provides half of that benefit.",
    next: "The completed colleges unlock a university.",
  },
  educationUniversity: {
    department: "education", tier: 3, kind: "university", requires: "educationColleges",
    pitch: "Concentrate advanced teaching and research at a university campus.",
    effect: "Adds 8 Skills and 1 output per market-connected workshop.",
    next: "Your teaching charter determines which research institute you can build.",
  },
  educationTechnology: {
    department: "education", tier: 4, kind: "technicalInstitute",
    requires: "educationUniversity", charter: "apprenticeships",
    pitch: "Build a research institute that can help workshops put new techniques into practice.",
    effect: "Adds 4 Skills and 2 output per market-connected workshop.",
    next: "Keep workshops connected to market to use the engineering network.",
  },
  educationAgriculture: {
    department: "education", tier: 4, kind: "agriculturalInstitute",
    requires: "educationUniversity", charter: "extension",
    pitch: "Use field trials and crop research to expand the work of agricultural extension teams.",
    effect: "Adds 4 Skills and 3 food each year through agricultural research.",
    next: "Open more irrigated growing areas to give extension teams places to work.",
  },
  foodDepot: {
    department: "food", tier: 3, kind: "foodDepot",
    pitch: "Build a larger reserve so a good harvest can carry the region through a poor one.",
    effect: "Stores 18 more units of food between years.",
    next: "The completed depot unlocks a regional water network.",
  },
  foodWaterNetwork: {
    department: "food", tier: 4, kind: "waterNetwork", requires: "foodDepot",
    pitch: "Manage water across multiple growing areas through a shared system.",
    effect: "Adds 2 food each year and recovers up to 4 weather losses that remain after existing protection.",
    next: "Pair the network with reserves to prepare for successive lean years.",
  },
  tradeFreightTerminal: {
    department: "trade", tier: 3, kind: "freightTerminal",
    pitch: "Give the workshop network a place to consolidate freight and reach larger markets.",
    effect: "Earns market receipts for up to 8 towns beyond the first two. The terminal also adds capacity to buy 3 more food units when supplies are available.",
    next: "The terminal unlocks an industrial park.",
  },
  tradeIndustrialPark: {
    department: "trade", tier: 4, kind: "industrialPark", requires: "tradeFreightTerminal",
    pitch: "Build a manufacturing centre near markets and the regional freight network.",
    effect: "Adds 3 output per market-connected workshop.",
    next: "Invest in skills and market access to build on the new industrial base.",
  },
};

export function departmentProgrammes(world) {
  const tradeRoots = {
    mayurbhanj: ["trade", "orissa_trade"], bombay: ["trade", "mh_trade"], punjab: ["trade", "pb_trade"], madras: ["trade", "tn_trade"],
  }[world.key] ?? ["trade"];
  function buildPortfolio(locationsByProgramme, prerequisites, prefix = "") {
    return Object.entries(plans).map(([id, plan]) => {
      const { kind, ...definition } = plan;
      const { title, district, cost, locations } = locationsByProgramme[id];
      const { theme, color, layer } = departments[plan.department];
      const works = locations.map(([q, r, year]) => ({ kind, hex: world.id(q, r), year }));
      return [prefix + id, {
        ...definition, title, district, theme, color, layer, cost, works, prerequisiteGroups: prerequisites[id], opening: false, treeOnly: true, outcome: plan.effect,
        priceYear: Math.max(departmentPriceYears[id], { gj_: 1960, hr_: 1966, ap_: 1953 }[prefix] ?? 1952),
        requires: plan.requires ? prefix + plan.requires : undefined,
        ...(world.key === "bombay" && (prefix ? { bombaySuccessor: "gujarat" } : { bombayExcludes: "gujarat" })),
        ...(world.key === "punjab" && (prefix ? { punjabSuccessor: "haryana" } : { punjabExcludes: "haryana" })),
        ...(world.key === "madras" && (prefix ? { madrasSuccessor: "andhra" } : { madrasExcludes: "andhra" })),
      }];
    });
  }
  const portfolio = buildPortfolio(sites[world.key], { foodDepot: [tracks[world.key].food], tradeFreightTerminal: [tradeRoots, tracks[world.key].trade] });
  if (world.key === "bombay") portfolio.push(...buildPortfolio(gujaratSites, { foodDepot: [["gj_water"]], tradeFreightTerminal: [["gj_trade"], ["gj_industry", "gj_applied"]] }, "gj_"));
  if (world.key === "punjab") portfolio.push(...buildPortfolio(haryanaSites, { foodDepot: [["hr_water"]], tradeFreightTerminal: [["hr_trade"], ["hr_industry", "hr_applied"]] }, "hr_"));
  if (world.key === "madras") portfolio.push(...buildPortfolio(andhraSites, { foodDepot: [["krishna"]], tradeFreightTerminal: [["ap_trade"], ["ap_industry", "ap_applied", "ap_telanganaLinks"]] }, "ap_"));
  return Object.fromEntries(portfolio);
}

export function departmentTracks(world, game) {
  const jurisdiction = game.journey?.jurisdiction;
  const split = world.key === "bihar" && jurisdiction?.reorganization === "split";
  const merged = world.key === "mayurbhanj" && jurisdiction?.settlement === "merger";
  const enlargedPunjab = world.key === "punjab" && jurisdiction?.punjabEnlarged;
  const successor = { bombay: jurisdiction?.bombaySuccessor, punjab: jurisdiction?.punjabSuccessor, madras: jurisdiction?.madrasSuccessor }[world.key];
  const rootPrefix = { gujarat: "gj_", maharashtra: "mh_", punjab: "pb_", haryana: "hr_", madras: "tn_", andhra: "ap_" }[successor] ?? "";
  const advanced = (id) => ["gujarat", "haryana", "andhra"].includes(successor) ? rootPrefix + id : id;
  const educationRoots = split ? ["northSkills"] : merged ? ["skills", "orissa_skills"] : [`${rootPrefix}skills`];
  const foodRoots = merged ? ["food", "orissa_food"] : [`${rootPrefix}food`];
  const tradeRoots = merged ? ["trade", "orissa_trade"] : [`${rootPrefix}trade`];
  const foodProjects = world.key === "madras" ? successor === "andhra" ? ["krishna", ...(game.year >= 1967 ? ["ap_nagarjunaCanals"] : [])]
    : successor === "madras" ? ["cauvery"] : ["madrasDeltaBanks"]
    : successor ? [`${rootPrefix}water`] : world.key === "bombay" ? ["bombayWater"]
    : world.key === "punjab" ? ["bhakra", ...(enlargedPunjab ? ["punjabCanalBelt"] : [])]
    : world.key === "mayurbhanj" && !merged ? ["tanks"]
    : world.key === "central" ? ["centralTandula",
      ...(jurisdiction?.centralReorganized && game.year >= 1957 ? ["chambal"] : [])]
    : tracks[world.key].food;
  const tradeProjects = split ? ["northIndustry"] : merged ? tracks.mayurbhanj.trade : world.key === "west-bengal" ? ["industry", "applied", "juteSupply"] : [`${rootPrefix}industry`, `${rootPrefix}applied`];
  if (world.key === "assam") tradeProjects.unshift("assamRailLink");
  if (world.key === "central") {
    if (!jurisdiction?.centralReorganized) tradeProjects.push("centralBerarCotton");
    if (game.year >= 1949) tradeProjects.push("centralBastarMarkets");
    if (jurisdiction?.centralReorganized) tradeProjects.push("centralMalwaMarkets");
  }
  if (enlargedPunjab && !successor) tradeProjects.push("punjabCotton");
  if (successor === "punjab") tradeProjects.push("pb_cotton");
  if (world.key === "madras" && jurisdiction?.madrasReorganized) tradeProjects.push(successor === "andhra" ? "ap_telanganaLinks" : "tn_southMarkets");
  if (split && game.programmes?.some(({ id }) => id === "applied")) tradeProjects.push("applied");
  const tiers = {
    education: [educationRoots, [advanced("educationColleges"), "charter:apprenticeships", "charter:extension"], [advanced("educationUniversity")], [advanced("educationTechnology"), advanced("educationAgriculture")]],
    food: [foodRoots, foodProjects, [advanced("foodDepot")], [advanced("foodWaterNetwork")]],
    trade: [tradeRoots, tradeProjects, [advanced("tradeFreightTerminal")], [advanced("tradeIndustrialPark")]],
  };
  return Object.entries(tiers).map(([id, stages]) => ({
    id, label: departments[id].label, description: departments[id].description, tiers: stages,
  }));
}
