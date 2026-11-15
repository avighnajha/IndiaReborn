const sources = {
  partition: "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/3/enacted",
  earthquake: "https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/view/4854",
  nagaHills: "https://nla.nagaland.gov.in/history/",
  nagaland: "https://www.indiacode.nic.in/indiacode/handle/123456789/1384?view_type=browse",
  northeast: "https://www.indiacode.nic.in/bitstream/123456789/1534/1/197181.pdf",
  dispur: "https://censusindia.gov.in/nada/index.php/catalog/224/download/546/DH_2011_1823_PART_A_DCHB_KAMRUP_METROPOLITAN.pdf",
};

function partition(game, world) {
  const sites = world.assamTransition.sylhet;
  const works = game.assets.filter(({ hex }) => sites.includes(hex)).length;
  const displacedStocks = Math.min(1, game.reserve);
  const transfer = { transfer: sites, owner: "eastBengal", jurisdictionChanges: { assamPartition: true },
    partnerTransfers: { eastBengal: { reserve: displacedStocks } } };
  const effects = ["Transfer most of Sylhet. Karimganj remains in Assam.", "Through freight to Bengal is disrupted until a domestic route opens."];
  return {
    id: "partition", title: "Keep Assam supplied after Partition",
    description: "Most of Sylhet passes to East Bengal. The new border interrupts Assam’s established rail routes. Choose how to supply the remaining districts during the disruption.",
    source: sources.partition,
    options: {
      assamRiverRelief: { ...transfer, label: "Charter river relief boats", price: 5, reserve: 5 - displacedStocks, population: -3,
        effect: [...effects, `Receive 5 food units before the handover. ${works} funded works pass to East Bengal.`] },
      assamDistrictRelief: { ...transfer, label: "Keep relief in the districts", reserve: -displacedStocks, population: -3,
        effect: [...effects, `Transfer ${displacedStocks} food units and ${works} funded works. Keep the treasury available.`] },
    },
  };
}

function earthquake() {
  return {
    id: "assam-earthquake", title: "Recover from the Assam earthquake",
    description: "The August 1950 earthquake damages the upper valley and worsens flooding. Choose immediate repairs or emergency supplies.",
    source: sources.earthquake,
    options: {
      assamRepairBanks: { label: "Repair drainage and riverbanks", price: 7,
        effect: ["Prevent 4 of this year’s earthquake-related harvest losses.", "Keep those growing areas in production this year."] },
      assamFoodRelief: { label: "Release emergency food", reserve: 5,
        effect: ["Gain 5 food units for immediate relief.", "The harvest absorbs the full earthquake loss."] },
    },
  };
}

function reorganization(game, world, nagaland) {
  const territories = world.assamTransition;
  const changes = nagaland ? [["nagaland", territories.nagaland]] : [["meghalaya", territories.meghalaya], ["mizoram", territories.mizoram]];
  const ownerChanges = Object.fromEntries(changes.flatMap(([owner, sites]) => sites.map((hex) => [hex, owner])));
  const departing = new Set(Object.keys(ownerChanges));
  const works = game.assets.filter(({ hex }) => departing.has(hex)).length;
  const reserve = nagaland ? 0 : Math.min(game.reserve, 3);
  const transfers = { ownerChanges, reserve: -reserve, population: nagaland ? 0 : -6,
    partnerTransfers: nagaland ? undefined : { meghalaya: { reserve: Math.ceil(reserve * 2 / 3) }, mizoram: { reserve: Math.floor(reserve / 3) } },
    jurisdictionChanges: nagaland ? { assamNagaland: true } : { assamReorganized: true } };
  const first = nagaland ? "Nagaland takes over the former Naga Hills–Tuensang Area." : "Meghalaya and the new Mizoram Union Territory take over their sites.";
  const effects = nagaland ? [first] : [first, `Transfer ${works} works and ${reserve} food units with the territory.`];
  const tradePartner = nagaland ? "nagaland" : "meghalaya";
  const contribution = nagaland ? 7 : 10;
  return {
    id: nagaland ? "assam-nagaland" : "assam-northeast",
    title: nagaland ? "Nagaland becomes a state" : "Reorganize Assam and the hill districts",
    description: nagaland ? "Nagaland becomes a state in 1963. Decide whether to co-fund market access as the new administration takes over local services."
      : "Meghalaya becomes a state and Mizoram becomes a Union Territory in 1972. Shillong leaves Assam’s jurisdiction. Decide whether to fund a continuing market connection.",
    source: nagaland ? sources.nagaland : sources.northeast,
    options: {
      assamCrossBorder: { ...transfers, label: "Fund a cross-border market corridor", price: contribution,
        agreement: { partner: tradePartner, title: "Cross-border market corridor", kind: "corridor", cost: contribution },
        effect: [...effects, "Both administrations earn freight while the corridor is open."] },
      assamSeparateServices: { ...transfers, label: "Keep services separate", effect: [...effects, "Keep the remaining treasury for Assam’s works."] },
    },
  };
}

function nagaHills(game, world) {
  const transfer = world.assamTransition.nagaland;
  const reserve = Math.min(1, game.reserve);
  const terms = { transfer, owner: "nagaHills", reserve: -reserve, population: -2,
    partnerTransfers: { nagaland: { reserve } }, jurisdictionChanges: { assamNagaHills: true } };
  return {
    id: "assam-naga-hills", title: "The Naga Hills–Tuensang Area",
    description: "The Naga Hills are administered with Tuensang from December 1957. Transfer services in the first full planning year.",
    source: sources.nagaHills,
    options: {
      assamNagaTransition: { ...terms, label: "Transfer district services", effect: ["The Naga Hills leave Assam’s works office.", `Transfer ${reserve} food units with the district.`] },
    },
  };
}

function capital(game, world) {
  const hex = world.assamTransition.dispur;
  const work = game.assets.some(({ id }) => id === `${hex}:school`) ? null
    : { id: `${hex}:school`, hex, kind: "school", started: game.year, remaining: 2 };
  const jurisdictionChanges = { assamDispur: true };
  return {
    id: "assam-dispur", title: "Move Assam’s capital to Dispur",
    description: "After the hill reorganization, Assam holds its first budget session at Dispur in 1973. Decide whether the new capital should also host a technical school.",
    source: sources.dispur,
    options: {
      ...(work ? { assamDispurSchool: { label: "Fund a technical school", price: 12, work, jurisdictionChanges,
        effect: ["Move the capital to Dispur.", "Open a technical school in two years."] } } : {}),
      assamMoveOffice: { label: "Move the administration", jurisdictionChanges,
        effect: ["Move the capital to Dispur.", "Keep the works budget available."] },
    },
  };
}

export function assamDecision(game, world) {
  const { events } = game.journey;
  switch (game.year) {
    case 1947: return events.independence && !events.partition ? partition(game, world) : null;
    case 1950: return events.constitution && !events["assam-earthquake"] ? earthquake() : null;
    case 1958: return events["assam-naga-hills"] ? null : nagaHills(game, world);
    case 1963: return events["assam-nagaland"] ? null : reorganization(game, world, true);
    case 1972: return events["assam-northeast"] ? null : reorganization(game, world, false);
    case 1973: return events["assam-dispur"] ? null : capital(game, world);
    default: return null;
  }
}
