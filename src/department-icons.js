const facilities = {
  skills: { label: "Technical Schools", icon: "school" },
  northSkills: { label: "Technical Schools", icon: "school" },
  educationColleges: { label: "Degree Colleges", icon: "college" },
  educationUniversity: { label: "University", icon: "university" },
  educationTechnology: { label: "Engineering Institute", icon: "engineering" },
  educationAgriculture: { label: "Agricultural Research Institute", icon: "research" },
  "charter:apprenticeships": { label: "Apprenticeships", icon: "apprenticeships" },
  "charter:extension": { label: "Agricultural Extension", icon: "extension" },
  food: { label: "Irrigation & Grain Stores", icon: "irrigation" },
  kosi: { label: "Basin Flood Defences", icon: "flood" },
  mahanadi: { label: "Basin Flood Defences", icon: "flood" },
  damodar: { label: "Basin Flood Defences", icon: "flood" },
  bombayWater: { label: "Basin Flood Defences", icon: "flood" },
  bhakra: { label: "Basin Water & Power", icon: "flood" },
  cauvery: { label: "Water & Power Allocation", icon: "canals" },
  krishna: { label: "Water & Power Allocation", icon: "canals" },
  madrasDeltaBanks: { label: "Delta Drainage & Reserves", icon: "flood" },
  brahmaputra: { label: "Flood Defences or River Freight", icon: "flood" },
  assamBarakStores: { label: "Canal & Reserve Works", icon: "irrigation" },
  centralTandula: { label: "Canal & Reserve Works", icon: "irrigation" },
  chambal: { label: "Canals or Industrial Power", icon: "canals", metric: "+4 food or +2 output per linked workshop" },
  ap_nagarjunaCanals: { label: "Canal Distribution", icon: "canals" },
  water: { label: "Regional Water Works", icon: "canals" },
  pb_water: { label: "Canal & Reserve Works", icon: "irrigation" },
  hr_water: { label: "Canal & Reserve Works", icon: "irrigation" },
  punjabCanalBelt: { label: "Canal & Reserve Works", icon: "irrigation" },
  tanks: { label: "Irrigation Tanks", icon: "tank" },
  foodDepot: { label: "Food Reserve Depot", icon: "depot" },
  foodWaterNetwork: { label: "Canal & Drainage Network", icon: "canals" },
  trade: { label: "Market Roads", icon: "road" },
  assamRailLink: { label: "Rail Market Feeders", icon: "road" },
  centralBastarMarkets: { label: "Market Roads & Workshop", icon: "road" },
  centralMalwaMarkets: { label: "Market Roads & Workshop", icon: "road" },
  tn_southMarkets: { label: "Market Roads & Workshop", icon: "road" },
  ap_telanganaLinks: { label: "Market Roads & Workshop", icon: "road" },
  industry: { label: "Industrial Workshops", icon: "workshop" },
  pb_cotton: { label: "Cotton Processing Workshops", icon: "workshop" },
  punjabCotton: { label: "Cotton Processing Workshops", icon: "workshop" },
  centralBerarCotton: { label: "Cotton Processing Workshops", icon: "workshop" },
  juteSupply: { label: "Domestic Jute Supply", icon: "jute" },
  northIndustry: { label: "Industrial Workshops", icon: "workshop" },
  applied: { label: "Training Workshops", icon: "trainingWorkshop" },
  planFoodReserve: { label: "Protected Farms & Reserves", icon: "flood", metric: "2 protected growing areas · +18 food storage" },
  planSuppliers: { label: "College & Supplier Workshops", icon: "trainingWorkshop", metric: "2 workshops · +6 Skills from the college" },
  tradeFreightTerminal: { label: "Freight Terminal", icon: "freight" },
  tradeIndustrialPark: { label: "Industrial Park", icon: "industrialPark" },
};

export function departmentFacility(id) {
  const key = Object.hasOwn(facilities, id) ? id : id.replace(/^(orissa|mh|gj|pb|hr|tn|ap)_/, "");
  return Object.hasOwn(facilities, key) ? facilities[key] : null;
}

const icons = {
  school: "M3 21h18M5 21V10l7-4 7 4v11M3 11l9-5 9 5M12 6V2h5l-2 2 2 2h-5M10 21v-5h4v5m-7-8h2m6 0h2",
  college: "m2 9 10-5 10 5-10 5-10-5Zm4 2v5c2 3 10 3 12 0v-5m4-2v6m0 0v2",
  university: "M3 8h18l-9-5-9 5Zm1 13h16M3 18h18M6 8v10m4-10v10m4-10v10m4-10v10",
  engineering: "M6 21h12M12 3a3 3 0 0 1 3 3c0 2-1 3-3 4v4M12 10c-2-1-3-2-3-4a3 3 0 0 1 3-3Zm0 11v-7m-7 5 7-9 7 9M7 16h10",
  research: "M8 3h8m-6 0v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 14h8m-4 4v-2m0 0c1-2 3-2 4-2m-4 2c-1-2-3-2-4-2",
  apprenticeships: "m4 19 9-9m-9 9 2 2 9-9m-2-2-3-3 5-5 4 1-3 3 2 2 3-3 1 4-5 5-3-3m-9 1 6-6m-4-4 4 4m-6-2 4 4",
  extension: "M12 17V5m0 6C8 11 5 8 5 4c4 0 7 3 7 7Zm0 2c0-4 3-7 7-7 0 4-3 7-7 7ZM3 20c2-2 5-3 9-3s7 1 9 3M7 22h10",
  irrigation: "M3 20h18m-16 0v-9l5-4 5 4v9m-8-6h6m-4 6v-4h2v4m7-2v-8m0 3c-2 0-3-1-3-3 2 0 3 1 3 3Zm0 1c0-2 1-3 3-3 0 2-1 3-3 3",
  flood: "M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 22c2-2 4-2 6 0s4 2 6 0 4-2 6 0m-18-8h4l3-7h4l3 7h4M12 3v4",
  tank: "M3 11h18m-16 0 2 9h10l2-9M8 15c2-1 3-1 4 0s2 1 4 0m-5-4V4m0 4c-3 0-5-2-5-4 3 0 5 2 5 4Zm0 1c0-3 2-5 5-5 0 3-2 5-5 5",
  depot: "M3 21h18M5 21V9l7-5 7 5v12M3 10l9-6 9 6m-13 4h8m-8 3h8m-8 3h8",
  canals: "M4 3v6a3 3 0 0 0 3 3h10a3 3 0 0 1 3 3v6M9 3v5m6 13v-5M3 5h7m4 14h7m-7-9h2m-7 4h2",
  road: "M3 21 9 4h6l6 17M12 5v3m0 4v3m0 4v2M3 21h18",
  workshop: "M3 21V12l6 4v-4l6 4V8h4l2 13H3Zm14-13V4m-8 14v1m4-1v1m4-1v1",
  jute: "M7 21h10m-5 0V5m0 5L6 7m6 7 6-4M9 20 7 9m8 11 3-9M6 7V4l3 2 1 3m8 1 1-4-4 2-1 3M8 17h8",
  trainingWorkshop: "M3 20h18M6 20v-5h12v5M5 13h14l-3 2H8l-3-2Zm4-4 5-5 3 3-5 5m2-8 2-2 5 5-2 2",
  freight: "M3 6h11v10H3V6Zm11 4h4l3 3v3h-7m-11 0v3h18v-3M6 19v2m12-2v2M7 6v4m3-4v4",
  industrialPark: "M3 21v-9l5 3v-5l6 4V9h5l2 12H3Zm7-13V3h3v6m4 0V4h3v5M6 18h2m3 0h2m3 0h2",
};

export function departmentIcon(name) {
  const path = Object.hasOwn(icons, name) ? icons[name] : icons.school;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
}
