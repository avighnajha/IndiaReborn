import { Fiscal } from "./fiscal.js";
import { madrasDecision } from "./madras-politics.js";
import { assamDecision } from "./assam-politics.js";
import { centralDecision } from "./central-politics.js";

const sources = {
  independence: "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/1/enacted",
  partition: "https://lalib.wb.gov.in/showOverview",
  merger: "https://en.wikisource.org/wiki/Page%3AWhite_Paper_on_Indian_States_%281950%29.pdf/51",
  constitution: "https://www.legislative.gov.in/static/uploads/2025/07/88cca69e868e50b217f855be2fb8bdba.pdf",
  reorganization: "https://www.indiacode.nic.in/bitstream/123456789/1636/1/195640.pdf",
  coochBehar: "https://coochbehar.gov.in/about-district/history/",
  bombayAccession: "https://en.wikisource.org/wiki/White_Paper_on_Indian_States_(1950)",
  bombayEnlargement: "https://www.indiacode.nic.in/bitstream/123456789/1680/1/a1956-37.pdf",
  bombaySuccessors: "https://www.indiacode.nic.in/indiacode/handle/123456789/1535?view_type=browse",
  punjabPartition: "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/4/enacted",
  punjabCapital: "https://censusindia.gov.in/nada/index.php/catalog/324/download/946/DH_2011_0401_PART_A_DCHB_CHANDIGARH.pdf",
  punjabSuccessors: "https://www.indiacode.nic.in/bitstream/123456789/1645/1/196631.pdf",
  seeds: "https://www.icar.gov.in/sites/default/files/2022-12/Indian-Agriculture-after-Independence.pdf",
  drought: "https://digitallibrary.niti.gov.in/items/4e710904-80f7-475c-b34c-e697ab98a726",
};

function publicWork(game, world, kind, eligible, years) {
  const sites = Object.values(world.tiles).filter((tile) => game.owners[tile.id] === world.key && (tile.town?.era ?? world.start) <= game.year && eligible(tile) &&
    !game.assets.some((asset) => asset.hex === tile.id && asset.kind === kind));
  const site = sites.find(({ id }) => id === world.capital) ?? sites[0];
  if (!site) return null;
  return { id: `${site.id}:${kind}`, hex: site.id, kind, started: game.year, remaining: years };
}

function workEffect(world, work, name) {
  if (!work) return "";
  const tile = world.tiles[work.hex];
  return `Start a ${name} at ${tile.town?.name ?? world.districts[tile.district]}.`;
}

function independenceDecision(world) {
  const princely = world.key === "mayurbhanj";
  return {
    id: "independence", title: "The first budget of independent India",
    description: princely
      ? "On 15 August 1947, the British Crown's paramountcy over Mayurbhanj ends. While discussions with the Dominion proceed, favor one group of new development programmes through 1951. Works already funded keep their contracts."
      : "On 15 August 1947, India and Pakistan become independent dominions. Your cabinet can favor one group of new development programmes through 1951. Works already funded keep their contracts.",
    source: princely ? "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/7/enacted" : sources.independence,
    options: {
      food: { label: "Food and water", effect: ["Save ₹3 lakh per new food and water programme through 1951."] },
      roads: { label: "Transport and industry", effect: ["Save ₹3 lakh per new transport and industry programme through 1951."] },
      skills: { label: "Skills and prosperity", effect: ["Save ₹3 lakh per new education programme through 1951."] },
    },
  };
}

function partitionDecision(game, world) {
  const rations = Math.min(2, game.reserve);
  if (world.key === "punjab") {
    const reliefStock = Math.min(3, game.marketStock);
    const granary = publicWork(game, world, "granary", ({ town }) => Boolean(town), 2);
    return {
      id: "partition", title: "Resettle families in East Punjab",
      description: "Partition places Lahore across the new border. Trade through western Punjab is interrupted and displaced households arrive in the eastern districts. Set your first relief priority.",
      source: sources.punjabPartition,
      options: {
        ...(granary ? { resettlementStores: { label: "Build resettlement stores", price: 10, reserve: 2, marketStock: -reliefStock, population: 4,
          work: granary, effect: ["Shelter families and add 4 population units.", "Gain 2 food units. A new store opens in two years."] } } : {}),
        reliefConvoys: { label: "Purchase food for relief convoys", price: 6, reserve: 5, marketStock: -reliefStock, population: 3,
          effect: ["Add 3 population units.", "Gain 5 food units for the coming harvest season."] },
        districtRelief: { label: "Use district stocks", reserve: -rations, marketStock: -reliefStock, population: 3,
          effect: ["Add 3 population units.", `Release ${rations} food units for immediate relief and keep the development budget.`] },
      },
    };
  }
  return {
    id: "partition", title: "Relief after Partition",
    description: world.key === "west-bengal"
      ? "The western districts become West Bengal. Displaced families need relief, and the new border cuts access to raw jute. Choose how to support displaced households first."
      : "Bengal is divided between India and Pakistan. People displaced across the new borders need shelter, food and safe onward travel. Decide what your administration can provide.",
    source: sources.partition,
    options: {
      depots: {
        label: "District relief depots",
        effect: [`Release ${rations} food units from reserves.`, "Add 4 food units to the regional market."],
        reserve: -rations, marketStock: 4,
      },
      convoys: {
        label: "Relief convoys",
        effect: ["Add 4 food units to reserves.", "Add 2 food units to the regional market."],
        price: 5, reserve: 4, marketStock: 2,
      },
      settlement: {
        label: "Joint resettlement",
        effect: ["Add 3 food units to reserves.", "Population grows by 2 units, raising future food needs."],
        reserve: 3, population: 2,
      },
    },
  };
}

function coochBeharDecision(world) {
  const transfer = world.coochBeharSites;
  const town = transfer.find((hex) => world.tiles[hex].town?.name === "Cooch Behar");
  const work = { id: `${town}:school`, hex: town, kind: "school", remaining: 2, started: 1950 };
  return {
    id: "cooch-behar-integration", title: "Integrate Cooch Behar",
    description: "Cooch Behar joins West Bengal in 1950. Decide how much to commit to its public services in the first budget.",
    source: sources.coochBehar,
    options: {
      coochSchools: { label: "Fund district schooling", effect: ["Add Cooch Behar and 2 population units.", "Open a technical school in two years."], price: 9, transfer, population: 2, work },
      coochStandard: { label: "Use the existing district budget", effect: ["Add Cooch Behar and 2 population units.", "Keep capital available for other works."], transfer, population: 2 },
    },
  };
}

function bengalTransferDecision(world) {
  return {
    id: "bengal-territorial-settlement", title: "Purulia and the northern link",
    description: "Parliament transferred Purulia and parts of the northern corridor from Bihar in 1956. Follow the transfer or negotiate an alternate transit agreement.",
    source: sources.reorganization,
    options: {
      receiveDistricts: { label: "Accept the territorial transfer", effect: ["Gain Purulia and the northern link.", "Add 3 population units and unlock western plateau works."], population: 3, transfer: world.bengalTransferSites },
      transitCompact: { label: "Negotiate transit across Bihar", effect: ["Keep the existing border.", "Receive ₹8 lakh and add capacity for 1 more food import when Bihar has supplies."], cash: 8 },
    },
  };
}

function mergerDecision(world) {
  const local = world.key === "mayurbhanj";
  const sites = local ? world.mergerSites : world.accessionSites ?? world.mergerSites;
  return {
    id: "mayurbhanj-merger", title: "Terms of the Mayurbhanj merger",
    description: local
      ? "The Dominion took over Mayurbhanj in November 1948. Orissa historically assumed its administration on 1 January 1949. In this campaign, the delegation can also seek a compact that keeps district works under local control."
      : "Orissa historically took over administration of Mayurbhanj on 1 January 1949. Extend the provincial works service there, or negotiate an alternate compact under which Mayurbhanj keeps its own works office.",
    source: sources.merger,
    options: {
      merger: {
        label: "Merge administrations",
        effect: local
          ? ["Govern Orissa and unlock its programmes.", "Take on 16 more population units and their food needs."]
          : ["Bring Mayurbhanj’s works sites under Orissa.", "Take on 1 more population unit and its food needs."],
        price: 6, population: local ? 16 : 1, transfer: sites ?? [],
      },
      compact: {
        label: "Keep separate works offices",
        effect: ["Keep your current project area.", "Receive ₹5 lakh in transition support."],
        cash: 5,
      },
    },
  };
}

function constitutionDecision(game, world) {
  const granary = publicWork(game, world, "granary", ({ town }) => Boolean(town), 1);
  const school = publicWork(game, world, "school", ({ town }) => Boolean(town), 2);
  return {
    id: "constitution", title: "The republic takes effect",
    description: "The Constitution comes into force on 26 January 1950. It establishes how the Union and the states share powers and provides for grants to states. Choose how your administration will put the new arrangements to work.",
    source: sources.constitution,
    options: {
      matching: {
        label: "Union grants office",
        effect: ["Receive a one-time ₹8 lakh development allocation."],
        cash: 8,
      },
      cooperatives: {
        label: "Food cooperatives",
        effect: ["Add 6 food units to reserves.", workEffect(world, granary, "grain store")],
        price: 4, reserve: 6, work: granary,
      },
      district: {
        label: "District services",
        effect: ["Receive ₹2 lakh for district services.", workEffect(world, school, "technical school")],
        cash: 2, work: school,
      },
    },
  };
}

function reorganizationDecision(game, world) {
  const southern = (tile) => tile?.district === "south";
  const works = game.assets.filter(({ hex }) => game.owners[hex] === world.key);
  const southernWorks = works.filter(({ hex }) => southern(world.tiles[hex])).length;
  if (southernWorks * 3 >= Math.max(1, works.length)) return null;

  const southSites = Object.values(world.tiles).filter((tile) => southern(tile) && game.owners[tile.id] === world.key);
  if (!southSites.length) return null;
  const southHubs = southSites.filter(({ town }) => town?.hub);
  const nearHubs = new Set(southHubs.flatMap(({ id }) => world.neighbors(id)));
  const road = publicWork(game, world, "road", (tile) => southern(tile) && !tile.town?.hub && nearHubs.has(tile.id), 1)
    ?? publicWork(game, world, "road", (tile) => southern(tile) && !tile.town?.hub, 1);
  const school = publicWork(game, world, "school", (tile) => southern(tile) && Boolean(tile.town), 2);
  const cashShare = Math.floor(game.cash / 4);
  const reserveShare = Math.floor(game.reserve / 4);
  const autonomyGrain = Math.floor(game.reserve / 8);
  return {
    id: "bihar-reorganization", title: "The southern plateau petitions for a settlement",
    description: `The plateau received ${southernWorks} of ${works.length} construction starts. As Bihar and West Bengal renegotiate their boundary in 1956, the southern districts press their own case. A southern split here is an alternate outcome.`,
    source: sources.reorganization,
    options: {
      unified: {
        label: "One Bihar",
        effect: ["Keep all territory and works.", "Add 3 food units to reserves.", workEffect(world, road, "road link")],
        price: 10, reserve: 3, work: road,
      },
      autonomy: {
        label: "Southern council",
        effect: ["Keep all territory and works under Bihar.", `Set aside ${autonomyGrain} food units for district stores.`, workEffect(world, school, "technical school")],
        reserve: -autonomyGrain, work: school,
      },
      split: {
        label: "Govern Northern Bihar",
        effect: ["Keep the north and govern from Patna.", `Transfer ${reserveShare} food units and ${southernWorks} works to the south.`],
        price: cashShare, reserve: -reserveShare, transfer: southSites.map(({ id }) => id), owner: "council",
      },
    },
  };
}

function seedsDecision(game, world) {
  const irrigation = publicWork(game, world, "irrigation", ({ kind, town, flood }) => kind !== "r" && !town && flood < 2, 1);
  return {
    id: "high-yield-seeds", title: "Seed trials and water",
    description: "India launches its High Yielding Variety Programme in 1966. Decide how much to invest locally in the irrigation and inputs needed to put new seed varieties to work.",
    source: sources.seeds,
    options: {
      demonstration: irrigation ? {
        label: "Irrigated seed trials",
        effect: ["Add 4 food units to reserves.", workEffect(world, irrigation, "new irrigation scheme")],
        price: 12, reserve: 4, work: irrigation,
      } : {
        label: "Stock seed stations",
        effect: ["Use existing irrigation.", "Add 4 food units to reserves."],
        price: 6, reserve: 4,
      },
      extension: {
        label: "Agricultural extension",
        effect: ["Add 3 food units to the regional market."],
        marketStock: 3,
      },
    },
  };
}

function droughtDecision(game, world) {
  const granary = publicWork(game, world, "granary", ({ town }) => Boolean(town), 1);
  const redirected = Math.min(3, game.marketStock);
  return {
    id: "drought-relief", title: "A nationwide grain squeeze",
    description: "India's 1972–73 drought puts pressure on grain prices and supply. Emergency grain can cover this year's shortfall. Warehouse capacity determines how much unused stock carries forward.",
    source: sources.drought,
    options: {
      stocks: { label: "Emergency purchase", effect: ["Add 8 food units to reserves."], price: 10, reserve: 8 },
      ...(granary ? { storage: {
        label: "District storage",
        effect: ["Add 3 food units to reserves.", workEffect(world, granary, "grain store")],
        price: 8, reserve: 3, work: granary,
      } } : {}),
      ration: {
        label: redirected ? "Redirect local grain" : "Keep funds for existing works",
        effect: redirected
          ? [`Move ${redirected} food units from the market to reserves.`]
          : ["Keep funds available for existing works."],
        reserve: redirected, marketStock: -redirected,
      },
    },
  };
}

function bombayAccessionDecision(game, world, enlarged) {
  const transfer = enlarged ? world.bombayAccessionSites : world.bombayEarlySites;
  const departures = enlarged ? world.bombayDepartureSites : [];
  const population = enlarged ? 7 : 2;
  const district = transfer.find((hex) => world.tiles[hex].town && !game.assets.some((asset) => asset.hex === hex && asset.kind === "school"));
  const work = district ? { id: `${district}:school`, hex: district, kind: "school", started: game.year, remaining: 2 } : undefined;
  const transferEffect = enlarged ? "Add Saurashtra, Kutch and inland districts. Southern districts pass to Mysore."
    : "Bring former Baroda and Deccan princely sites into Bombay's works programme.";
  return {
    id: enlarged ? "bombay-enlargement" : "bombay-early-integration",
    title: enlarged ? "An enlarged Bombay State" : "Integrate former princely districts",
    description: enlarged ? "The 1956 reorganization expands Bombay and transfers part of its south to Mysore. Decide how to fund services in the incoming districts."
      : "Former princely territories join Bombay in the first years of independence. Decide how to extend public services to the districts joining in this planning year.",
    source: enlarged ? sources.bombayEnlargement : sources.bombayAccession,
    options: {
      ...(work ? { districtSchools: { label: "Fund a new district school", price: enlarged ? 13 : 9, transfer, departures, population, work,
        effect: [transferEffect, `Add ${population} population units.`, `Open a technical school in ${world.tiles[district].town.name} in two years.`] } } : {}),
      regularIntegration: { label: "Use existing district services", transfer, departures, population,
        effect: [transferEffect, `Add ${population} population units.`, "Keep the current development budget available."] },
    },
  };
}

function bombaySuccessorDecision(game, world) {
  const options = {};
  for (const [key, region] of Object.entries(world.successors)) {
    const other = key === "maharashtra" ? "gujarat" : "maharashtra";
    const foreignShare = other === "gujarat" ? 0.3369 : 0.6631;
    const retained = new Set(region.sites);
    const transfer = Object.keys(game.owners).filter((hex) => game.owners[hex] === world.key && !retained.has(hex));
    const transferred = new Set(transfer);
    const works = game.assets.filter(({ hex }) => transferred.has(hex)).length;
    const price = Math.floor(game.cash * foreignShare);
    const reserve = Math.floor(game.reserve * foreignShare);
    const population = Math.round(game.population * foreignShare);
    options[key] = {
      label: `Govern ${region.name}`, owner: other, transfer, price, reserve: -reserve, population: -population,
      counterpart: { id: other, cash: price, reserve, population },
      effect: [`Continue from ${world.tiles[region.capital].town.name} and keep works inside ${region.name}.`,
        `${world.successors[other].name} receives ${population} population units, ${reserve} food units and ${works} works.`,
        `Keep ${Fiscal.lakh(game.cash - price)} and take up ${region.name}'s development programmes.`],
    };
  }
  return {
    id: "bombay-reorganization", title: "Choose your successor state",
    description: "Bombay divides into Maharashtra and Gujarat in 1960. Choose which administration to lead. Works follow their sites, and both governments receive a share of the treasury and reserves.",
    source: sources.bombaySuccessors, options,
  };
}

function punjabCapitalDecision(game, world) {
  const hex = world.punjabCapital;
  const work = { id: `${hex}:school`, hex, kind: "school", started: game.year, remaining: 2 };
  const hasSchool = game.assets.some((asset) => asset.id === work.id);
  return {
    id: "punjab-capital", title: "Open the new capital at Chandigarh",
    description: "Chandigarh is formally inaugurated in 1953. Government moves from its temporary seats. Decide how the first development budget should serve the new capital and the districts.",
    source: sources.punjabCapital,
    options: {
      ...(!hasSchool ? { capitalSchool: { label: "Fund a technical school", price: 12, work,
        effect: ["Move the administrative seat to Chandigarh.", "Open a technical school there in two years."] } } : {}),
      districtServices: { label: "Keep funds available to districts", effect: ["Move the administrative seat to Chandigarh.", "Keep funds available for provincial programmes."] },
    },
  };
}

function punjabEnlargementDecision(game, world) {
  const transfer = world.punjabAccessionSites;
  const hex = transfer.find((id) => world.tiles[id].town?.name === "Patiala" && !game.assets.some((asset) => asset.id === `${id}:school`));
  const work = hex ? { id: `${hex}:school`, hex, kind: "school", started: game.year, remaining: 2 } : null;
  return {
    id: "punjab-enlargement", title: "Integrate Patiala and the eastern princely districts",
    description: "The States Reorganisation Act merges PEPSU into Punjab in 1956. Incoming districts need food and public services. Decide whether to fund a new training centre alongside the merger.",
    source: sources.bombayEnlargement,
    options: {
      ...(work ? { patialaSchool: { label: "Open a Patiala technical school", price: 13, transfer, population: 7, reserve: 3, work,
        effect: ["Add PEPSU’s districts, 7 population units and 3 food units.", "Open a technical school in Patiala in two years."] } } : {}),
      integratePepsu: { label: "Continue existing services", transfer, population: 7, reserve: 3,
        effect: ["Add PEPSU’s districts, 7 population units and 3 food units.", "Keep the existing development budget available."] },
    },
  };
}

function punjabSuccessorDecision(game, world) {
  const cashShare = { punjab: 0.5484, haryana: 0.3738 };
  const foodShare = { punjab: 0.55, haryana: 0.37 };
  const unionTransfer = { cash: Math.floor(game.cash * 0.0778), reserve: Math.floor(game.reserve * 0.08), population: Math.floor(game.population * 0.08) };
  const options = {};
  for (const [key, region] of Object.entries(world.successors)) {
    const other = key === "punjab" ? "haryana" : "punjab";
    const foreignSites = world.successors[other].sites;
    const foreignOwner = other === "punjab" ? "punjabState" : "haryana";
    const ownerChanges = Object.fromEntries([
      ...foreignSites.map((hex) => [hex, foreignOwner]),
      ...world.punjabUnionSites.map((hex) => [hex, "chandigarh"]),
      ...world.punjabHimachalSites.map((hex) => [hex, "himachal"]),
    ]);
    const counterpart = { id: other, cash: Math.floor(game.cash * cashShare[other]), reserve: Math.floor(game.reserve * foodShare[other]), population: Math.round(game.population * foodShare[other]) };
    const price = counterpart.cash + unionTransfer.cash;
    const works = game.assets.filter(({ hex }) => ownerChanges[hex] === foreignOwner).length;
    options[key] = {
      label: `Govern ${region.name}`, ownerChanges, price, counterpart, unionTransfer,
      reserve: -counterpart.reserve - unionTransfer.reserve, population: -counterpart.population - unionTransfer.population,
      effect: [`Keep ${Fiscal.lakh(game.cash - price)}. ${world.successors[other].name} takes ${Fiscal.lakh(counterpart.cash)} and ${works} works.`,
        `Transfer ${Fiscal.lakh(unionTransfer.cash)} to the Union. Chandigarh becomes the shared seat.`,
        "Retain works on your side of the border and share any operating Bhakra power."],
    };
  }
  return {
    id: "punjab-reorganization", title: "Choose which successor to govern",
    description: "Punjab and Haryana become separate states in 1966. Chandigarh passes to the Union and hill districts join Himachal Pradesh. Continue with one treasury and a new development portfolio.",
    source: sources.punjabSuccessors, options,
  };
}

function pending(game, world) {
  if (!game.journey || game.year > game.journey.end) return null;
  const southern = world.key === "madras" && madrasDecision(game, world);
  if (southern) return southern;
  const northeastern = world.key === "assam" && assamDecision(game, world);
  if (northeastern) return northeastern;
  const central = world.key === "central" && centralDecision(game, world);
  if (central) return central;
  const events = game.journey.events;
  switch (game.year) {
    case 1947:
      if (!events.independence) return independenceDecision(world);
      return events.partition ? null : partitionDecision(game, world);
    case 1949:
      if (world.key === "bombay" && !events["bombay-early-integration"]) return bombayAccessionDecision(game, world, false);
      return (world.key === "orissa" || world.key === "mayurbhanj") && !events["mayurbhanj-merger"] ? mergerDecision(world) : null;
    case 1950:
      if (world.key === "west-bengal" && !events["cooch-behar-integration"]) return coochBeharDecision(world);
      return events.constitution ? null : constitutionDecision(game, world);
    case 1953:
      return world.key === "punjab" && !events["punjab-capital"] ? punjabCapitalDecision(game, world) : null;
    case 1956:
      if (world.key === "punjab" && !events["punjab-enlargement"]) return punjabEnlargementDecision(game, world);
      if (world.key === "bombay" && !events["bombay-enlargement"]) return bombayAccessionDecision(game, world, true);
      if (world.key === "west-bengal" && !events["bengal-territorial-settlement"]) return bengalTransferDecision(world);
      return world.key === "bihar" && !events["bihar-reorganization"] ? reorganizationDecision(game, world) : null;
    case 1960:
      return world.key === "bombay" && !events["bombay-reorganization"] ? bombaySuccessorDecision(game, world) : null;
    case 1966:
      if (world.key === "punjab" && !events["punjab-reorganization"]) return punjabSuccessorDecision(game, world);
      return events["high-yield-seeds"] ? null : seedsDecision(game, world);
    case 1972:
      return events["drought-relief"] ? null : droughtDecision(game, world);
    default:
      return null;
  }
}

export function politicalDecision(game, world) {
  const decision = pending(game, world);
  if (!decision) return null;
  const { options, ...context } = decision;
  return {
    ...context,
    choices: Object.fromEntries(Object.entries(options).map(([key, { label }]) => [key, label])),
    details: Object.fromEntries(Object.entries(options).map(([key, { effect }]) => [key, effect.filter(Boolean)])),
    priced: Object.fromEntries(Object.entries(options).filter(([, option]) => option.price).map(([key, { price }]) => [key, price])),
  };
}

export function applyPoliticalDecision(game, world, decision, choice) {
  const current = pending(game, world);
  if (!current || current.id !== decision?.id || !Object.hasOwn(current.options, choice)) return game;
  const { label, effect, price = 0, cash = 0, reserve = 0, marketStock = 0, population = 0, work, transfer, departures, ownerChanges,
    counterpart, unionTransfer, jurisdictionChanges, partnerTransfers, partnerSuccession, agreement, owner = world.key } = current.options[choice];
  if (game.cash < price) return game;

  const journey = {
    ...game.journey,
    events: { ...game.journey.events, [current.id]: {
      year: game.year, title: current.title, choice, label,
      effect: [...(price ? [`${choice === "split" || counterpart ? "Transferred" : "Spent"} ${Fiscal.lakh(price)}.`] : []), ...effect.filter(Boolean)].join(" "),
    } },
  };
  if (current.id === "constitution") journey.institution = choice;
  if (current.id === "mayurbhanj-merger") journey.jurisdiction = { ...journey.jurisdiction, settlement: choice };
  if (current.id === "bihar-reorganization") journey.jurisdiction = { ...journey.jurisdiction, reorganization: choice };
  if (world.key === "west-bengal" && current.id === "partition") journey.jurisdiction = { ...journey.jurisdiction, bengalPartition: true };
  if (world.key === "punjab" && current.id === "partition") journey.jurisdiction = { ...journey.jurisdiction, punjabPartition: true };
  if (current.id === "cooch-behar-integration") journey.jurisdiction = { ...journey.jurisdiction, coochBehar: true };
  if (current.id === "bengal-territorial-settlement") journey.jurisdiction = { ...journey.jurisdiction, bengalTransfer: choice };
  if (current.id === "bombay-early-integration") journey.jurisdiction = { ...journey.jurisdiction, bombayEarlyIntegration: true };
  if (current.id === "bombay-enlargement") journey.jurisdiction = { ...journey.jurisdiction, bombayEnlarged: true };
  if (current.id === "punjab-capital") journey.jurisdiction = { ...journey.jurisdiction, punjabCapital: true };
  if (current.id === "punjab-enlargement") journey.jurisdiction = { ...journey.jurisdiction, punjabEnlarged: true };
  if (counterpart) {
    const { id, ...balance } = counterpart;
    const field = { "punjab-reorganization": "punjabSuccessor", "bombay-reorganization": "bombaySuccessor" }[current.id];
    if (field) journey.jurisdiction = { ...journey.jurisdiction, [field]: choice };
    journey.partners = { ...journey.partners, [id]: { ...journey.partners[id], ...balance } };
  }
  if (jurisdictionChanges) journey.jurisdiction = { ...journey.jurisdiction, ...jurisdictionChanges };
  if (agreement) {
    const { partner, ...terms } = agreement;
    journey.agreements = { ...journey.agreements, [partner]: { ...terms, id: `${partner}:${terms.kind}`, year: game.year } };
  }
  for (const [id, balances] of Object.entries(partnerTransfers ?? {})) {
    const partner = journey.partners[id];
    const updated = Object.fromEntries(Object.entries(balances).map(([key, value]) => [key, (partner?.[key] ?? 0) + value]));
    journey.partners = { ...journey.partners, [id]: { ...partner, ...updated } };
  }
  if (partnerSuccession) {
    const { from, to } = partnerSuccession;
    const { [from]: inheritedAgreement, ...agreements } = journey.agreements;
    journey.agreements = inheritedAgreement ? { ...agreements, [to]: { ...inheritedAgreement, partner: to, id: `${to}:${inheritedAgreement.kind}` } } : agreements;
    const { [from]: inheritedProject, ...projects } = journey.jointProjects ?? {};
    if (inheritedProject) journey.jointProjects = { ...projects,
      [to]: { ...inheritedProject, partner: to, id: `${to}:joint-${inheritedProject.kind}` } };
  }
  if (unionTransfer) journey.punjabUnionTransfer = unionTransfer;
  const owners = transfer || ownerChanges ? { ...game.owners, ...Object.fromEntries((transfer ?? []).map((hex) => [hex, owner])), ...ownerChanges } : game.owners;
  for (const hex of departures ?? []) owners[hex] = "mysore";
  return {
    ...game,
    journey,
    cash: game.cash - price + cash,
    reserve: game.reserve + reserve,
    marketStock: game.marketStock + marketStock,
    population: game.population + population,
    assets: work ? [...game.assets, work] : game.assets,
    owners,
    decisions: current.id === "independence" ? { ...game.decisions, 1947: choice } : game.decisions,
  };
}
