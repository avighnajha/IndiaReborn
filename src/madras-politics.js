import { Fiscal } from "./fiscal.js";

const sources = {
  transition: "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/1/enacted",
  pudukkottai: "https://pudukkottai.nic.in/history/",
  division: "https://www.indiacode.nic.in/bitstream/123456789/2176/1/A1953-30.pdf",
  reorganization: "https://www.indiacode.nic.in/bitstream/123456789/1680/1/a1956-37.pdf",
};

function openingFoodDecision(game) {
  const stocks = Math.min(2, game.reserve);
  return {
    id: "partition", title: "Food supplies at independence",
    description: "The new Dominion needs reliable food distribution. Madras can strengthen district stocks or move supplies through its ports and markets.",
    source: sources.transition,
    options: {
      portSupplies: { label: "Purchase and distribute supplies", price: 7, reserve: 4, marketStock: 2,
        effect: ["Add 4 food units to the reserve and 2 to the regional market."] },
      districtRations: { label: "Release district stocks", reserve: -stocks, marketStock: stocks + 1,
        effect: [`Move ${stocks} food units from reserves into local distribution.`, "Keep the works budget available."] },
    },
  };
}

function schoolAt(game, world, sites, town) {
  const hex = sites.find((site) => world.tiles[site]?.town?.name === town && !game.assets.some(({ id }) => id === `${site}:school`));
  return hex ? { id: `${hex}:school`, hex, kind: "school", started: game.year, remaining: 2 } : null;
}

function pudukkottaiDecision(game, world) {
  const transfer = world.madrasTransition.pudukkottai;
  const work = schoolAt(game, world, transfer, "Pudukkottai");
  return {
    id: "madras-pudukkottai", title: "Integrate Pudukkottai",
    description: "The princely state joins Madras in 1948. Decide how to extend public services as it enters the province.",
    source: sources.pudukkottai,
    options: {
      ...(work ? { pudukkottaiSchool: { label: "Fund a district school", price: 9, transfer, work, population: 1, jurisdictionChanges: { madrasIntegrated: true },
        effect: ["Bring Pudukkottai under the works office.", "Open a technical school in two years."] } } : {}),
      integratePudukkottai: { label: "Continue existing services", transfer, population: 1, jurisdictionChanges: { madrasIntegrated: true },
        effect: ["Bring Pudukkottai under the works office.", "Keep the works budget available."] },
    },
  };
}

function divisionDecision(game, world) {
  const andhra = { cash: Math.floor(game.cash * 27 / 75), reserve: Math.floor(game.reserve * .36), population: Math.round(game.population * .36) };
  const mysore = { cash: Math.floor(game.cash / 75), reserve: Math.floor(game.reserve / 75), population: Math.floor(game.population / 75) };
  const madras = { cash: game.cash - andhra.cash - mysore.cash, reserve: game.reserve - andhra.reserve - mysore.reserve,
    population: game.population - andhra.population - mysore.population };
  const balances = { madras, andhra };
  const options = {};
  for (const [key, region] of Object.entries(world.successors)) {
    const other = key === "madras" ? "andhra" : "madras";
    const retained = balances[key];
    const departing = balances[other];
    const owner = other === "madras" ? "madrasState" : other;
    const ownerChanges = Object.fromEntries([
      ...world.successors[other].sites.map((hex) => [hex, owner]),
      ...world.madrasTransition.bellary.map((hex) => [hex, "mysore"]),
    ]);
    const works = game.assets.filter(({ hex }) => ownerChanges[hex] === owner).length;
    options[key] = {
      label: `Govern ${region.name}`, price: game.cash - retained.cash, reserve: retained.reserve - game.reserve,
      population: retained.population - game.population, ownerChanges, jurisdictionChanges: { madrasSuccessor: key },
      counterpart: { id: other, ...departing }, partnerTransfers: { mysore },
      effect: [`Govern from ${world.tiles[region.capital].town.name}. Keep ${Fiscal.lakh(retained.cash)} and the works on your side of the border.`,
        `${world.successors[other].name} receives ${Fiscal.lakh(departing.cash)} and ${works} works.`,
        `Mysore receives ${Fiscal.lakh(mysore.cash)} and part of Bellary.`],
    };
  }
  return {
    id: "madras-division", title: "Choose Madras or Andhra",
    description: "Andhra State forms in 1953, with Kurnool as its capital. Continue with either administration. The Act apportions the treasury, and projects stay at their sites.",
    source: sources.division, options,
  };
}

function reorganizationDecision(game, world) {
  const andhra = game.journey.jurisdiction?.madrasSuccessor === "andhra";
  const territories = world.madrasTransition;
  const incoming = andhra ? territories.telangana : territories.kanyakumari;
  const ownerChanges = Object.fromEntries([
    ...territories.kerala.map((hex) => [hex, "kerala"]), ...territories.mysore.map((hex) => [hex, "mysore"]),
    ...(andhra ? territories.kanyakumari.map((hex) => [hex, "madrasState"]) : territories.telangana.map((hex) => [hex, "andhra"])),
  ]);
  const town = andhra ? "Hyderabad" : "Nagercoil";
  const work = schoolAt(game, world, incoming, town);
  const terms = {
    transfer: incoming, ownerChanges, population: andhra ? 11 : -5, reserve: andhra ? 3 : -Math.min(2, game.reserve),
    jurisdictionChanges: { madrasReorganized: true },
  };
  const first = andhra ? "Integrate Telangana and move the capital to Hyderabad." : "Gain Kanyakumari. Malabar and the western districts pass to Kerala and Mysore.";
  return {
    id: "madras-reorganization", title: andhra ? "Form Andhra Pradesh" : "Reorganize Madras State",
    description: andhra ? "The 1956 reorganization brings Telangana into Andhra Pradesh. Extend state services into the new districts."
      : "The 1956 reorganization changes the western and southern borders. Extend state services into the Tamil districts that join Madras.",
    source: sources.reorganization,
    options: {
      ...(work ? { southernSchool: { label: `Fund a technical school in ${town}`, ...terms, work, price: 13,
        effect: [first, "Open a technical school in two years."] } } : {}),
      southernServices: { label: "Continue existing district services", ...terms, effect: [first, "Keep the works budget available."] },
    },
  };
}

export function madrasDecision(game, world) {
  const events = game.journey.events;
  if (game.year === 1947 && events.independence && !events.partition) return openingFoodDecision(game);
  if (game.year === 1948 && !events["madras-pudukkottai"]) return pudukkottaiDecision(game, world);
  if (game.year === 1953 && !events["madras-division"]) return divisionDecision(game, world);
  if (game.year === 1956 && !events["madras-reorganization"]) return reorganizationDecision(game, world);
  return null;
}
