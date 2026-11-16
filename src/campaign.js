import { campaignStorageKey, World } from "./scenario.js";
import { Fiscal } from "./fiscal.js";
import { campaignEnd, campaignLengths, campaignName, foundingSaveKey, journeySettings, settlement, successorKey, successorRegion, targets } from "./journey.js";
import { fundJointProject, jointProjectOffers, neighborsFor, partnerOffers, resolveNeighbors, settleFreight, settleNationalTrade, settleNeighborTrade, signPartnerOffer } from "./interregional.js";
import { contractPlayerBid, contractRivalBid, upcomingFreightContract } from "./neighbor-competition.js";
import { applyPoliticalDecision, politicalDecision } from "./politics.js";
import { activeProgramme, basinAgreementsFor, basinFloodDecision, programmeCommissioned, programmeRequirements, programmes, visibleProgrammes } from "./programmes.js";
import { apprenticeshipOutput, extensionDryRecovery, extensionFloodRecovery, extensionYield, trainingModel } from "./training.js";

export const Campaign = (() => {
  const projects = {
    irrigation: { name: "Irrigation", icon: "≈", cost: 13, years: 1, summary: "Adds harvest. Fertile land gives more, but exposed crops lose more in a flood." },
    juteFarm: { name: "Jute growing area", summary: "Supplies raw fibre to the Hooghly mill once the Nadia programme is complete." },
    levee: { name: "Embankment", icon: "≋", cost: 15, years: 2, summary: "Shields this hex and adjacent farms. Also reduces regional flood damage." },
    road: { name: "Road link", icon: "╍", cost: 7, years: 1, summary: "Extend a chain from an existing hub. Connected towns unlock trade and improve workshop output." },
    mill: { name: "Workshop", icon: "⚙", cost: 24, years: 2, summary: "Earns revenue. Nearby minerals improve output and a market road raises it further." },
    school: { name: "Technical school", icon: "◇", cost: 17, years: 2, summary: "Trains workers over seven years. Skills raise workshop output and count toward shared prosperity." },
    granary: { name: "Grain reserve", icon: "▣", cost: 12, years: 1, summary: "Stores 10 more units of surplus grain for lean years." },
    power: { name: "Hydropower station", icon: "ϟ", cost: 20, years: 3, summary: "Supplies connected industry or irrigation pumps through the Mahanadi agreement." },
    college: { name: "Degree college", summary: "Adds 6 Skills. Connected workshops gain 1 output when the college network is operating." },
    university: { name: "Regional university", summary: "Adds 8 Skills. Connected workshops gain 1 output from university research." },
    technicalInstitute: { name: "Technical institute", summary: "Adds 4 Skills and 2 output per market-connected workshop." },
    agriculturalInstitute: { name: "Agricultural institute", summary: "Adds 4 Skills and 3 food each year through agricultural research." },
    foodDepot: { name: "Cooperative food depot", summary: "Stores 18 more units of food for lean years." },
    waterNetwork: { name: "Regional water network", summary: "Adds 2 food each year and recovers up to 4 weather losses that remain after existing protection." },
    freightTerminal: { name: "Freight terminal", summary: "Adds ₹1 lakh per connected town beyond the first two, up to ₹8 lakh, and raises food purchase capacity by 3." },
    industrialPark: { name: "Industrial park", summary: "Adds 3 output per market-connected workshop through shared services." },
  };
  const policies = { hold: "Store surplus", import: "Buy in a shortage", export: "Sell surplus" };
  const version = 1;
  const defaultSeed = 1946;
  const saveKey = campaignStorageKey(World.key);

  function newGame(seed = defaultSeed, settings) {
    const state = {
      version, region: World.key, seed, year: World.start, cash: Fiscal.openingBalance(World.key, World.start), reserve: World.economy.reserve, population: World.economy.population, marketStock: World.economy.marketStock,
      policy: "hold", assets: [], programmes: [], owners: { ...World.startingOwners }, decisions: {}, grantAwards: {}, reports: [],
    };
    if (!settings) return state;
    for (const id of World.accessionSites ?? []) {
      if (World.key === "orissa" && state.owners[id] === World.key) state.owners[id] = "mayurbhanj";
    }
    return { ...state, journey: { ...journeySettings(settings.end, settings.preset), events: {}, agreements: {}, partners: {} } };
  }

  function active(game, kind) {
    return game.assets.filter((asset) => asset.kind === kind && asset.remaining === 0 && game.owners[asset.hex] === World.key);
  }

  function access(game) {
    const roads = new Set(active(game, "road").map((asset) => asset.hex));
    const towns = Object.values(World.tiles).filter((tile) => tile.town && (tile.town.era ?? World.start) <= game.year && game.owners[tile.id] === World.key);
    const hubs = towns.filter((tile) => tile.town.hub).map((tile) => tile.id);
    const allowed = new Set([...roads, ...hubs, ...towns.map((tile) => tile.id)]);
    const reached = new Set(hubs);
    const frontier = [...hubs];
    for (let i = 0; i < frontier.length; i++) {
      for (const next of World.neighbors(frontier[i])) {
        if (!allowed.has(next) || reached.has(next)) continue;
        // Towns can terminate a road chain. A road or hub must carry traffic onward.
        if (!roads.has(frontier[i]) && !hubs.includes(frontier[i])) continue;
        reached.add(next);
        frontier.push(next);
      }
    }
    return { reached, towns: towns.filter((tile) => reached.has(tile.id)).length };
  }

  function isConnected(reached, hex) {
    return reached.has(hex) || World.neighbors(hex).some((neighbor) => reached.has(neighbor));
  }

  function protectedSites(levees) {
    return new Set(levees.flatMap(({ hex }) => [hex, ...World.neighbors(hex)]));
  }

  function training(game) {
    if (!game.journey) return trainingModel(game);
    const schools = active(game, "school").filter(({ completed }) => completed <= game.year - 2);
    const reached = access(game).reached;
    const sheltered = protectedSites(active(game, "levee"));
    const exposure = ({ hex }) => sheltered.has(hex) ? 0 : World.tiles[hex].flood;
    return trainingModel(game, schools, {
      apprenticeships: active(game, "mill").filter(({ hex }) => isConnected(reached, hex)),
      extension: active(game, "irrigation").sort((a, b) => exposure(b) - exposure(a)),
    });
  }

  function adoptTraining(game, id) {
    const option = training(game).options.find((candidate) => candidate.id === id);
    if (!option || option.reason) return game;
    return {
      ...game,
      cash: game.cash - option.cost,
      journey: { ...game.journey, training: { id, cost: option.cost, upkeep: option.upkeep, authorized: game.year, opens: game.year + 1 } },
    };
  }

  function cost(game, kind) {
    const subsidy = game.decisions[1947];
    if (game.year <= 1951 && ((subsidy === "food" && kind === "irrigation") || (subsidy === "roads" && kind === "road"))) {
      return projects[kind].cost - 3;
    }
    return projects[kind].cost;
  }

  function buildStatus(game, hex, kind) {
    const tile = World.tiles[hex];
    const project = projects[kind];
    if (!tile || !project?.years) return "Select a site and project.";
    if (game.year > campaignEnd(game)) return "Campaign complete.";
    if (game.owners[hex] !== World.key) return "Outside your administration.";
    if (game.assets.some((asset) => asset.hex === hex && asset.kind === kind)) return "Already placed here.";
    if (game.assets.filter((asset) => asset.started === game.year).length >= 3) return "Three construction starts allowed each year.";
    if (game.year + project.years - 1 > campaignEnd(game)) return "Construction would finish after the campaign.";
    if (kind === "road" && tile.town?.hub) return "This hub already has market access. Extend into a neighboring hex.";
    if (kind === "irrigation" && (tile.kind === "r" || tile.town)) return "Needs cultivable land away from a town center.";
    if (kind === "levee" && tile.flood < 2) return "Needs a river corridor or flood basin.";
    if (["school", "granary"].includes(kind) && !tile.town) return "Build in a settlement.";
    if (kind === "mill" && !tile.town && !tile.mineral) return "Needs a town or nearby mineral deposits.";
    if (game.cash < cost(game, kind)) return "Insufficient treasury.";
    return null;
  }

  function build(game, hex, kind) {
    if (buildStatus(game, hex, kind)) return game;
    return {
      ...game,
      cash: game.cash - cost(game, kind),
      assets: [...game.assets, { id: `${hex}:${kind}`, hex, kind, started: game.year, remaining: projects[kind].years }],
    };
  }

  function roadForecast(game, hex) {
    const planned = game.assets.map((asset) => asset.kind === "road" && asset.remaining === 1 ? { ...asset, remaining: 0 } : asset);
    const next = { ...game, assets: [...planned, { hex, kind: "road", remaining: 0 }] };
    const after = access(next);
    return { connected: after.reached.has(hex), townsAdded: after.towns - access({ ...game, assets: planned }).towns };
  }

  function finance(game) {
    const reorganized = Object.values(game.owners).includes("council");
    const jurisdiction = game.journey?.jurisdiction;
    if (World.key === "central") {
      const profile = jurisdiction?.centralReorganized ? "central-reorganized" : "central";
      return Fiscal.envelope(profile, Math.min(game.year, campaignEnd(game)));
    }
    if (World.key === "assam") {
      const profile = jurisdiction?.assamReorganized ? "assam-reorganized" : jurisdiction?.assamNagaland ? "assam-post-nagaland"
        : jurisdiction?.assamPartition ? "assam-post-partition" : "assam";
      return Fiscal.envelope(profile, Math.min(game.year, campaignEnd(game)));
    }
    if (World.key === "madras") {
      const profile = jurisdiction?.madrasSuccessor === "andhra" ? jurisdiction.madrasReorganized ? "andhra-pradesh" : "andhra-state"
        : jurisdiction?.madrasSuccessor === "madras" ? jurisdiction.madrasReorganized ? "tamil-nadu" : "madras-residual" : "madras";
      return Fiscal.envelope(profile, Math.min(game.year, campaignEnd(game)));
    }
    const preDivisionPunjab = jurisdiction?.punjabEnlarged ? "punjab-enlarged" : game.journey?.events.partition ? "east-punjab" : "punjab-colonial";
    const region = World.key === "mayurbhanj" && settlement(game) === "merger" ? "orissa"
      : successorKey(game) ?? (World.key === "punjab" ? preDivisionPunjab : World.key);
    return Fiscal.envelope(region, Math.min(game.year, campaignEnd(game)), reorganized ? 0.75 : 1);
  }

  function grantWindow(game) {
    const years = [1952, 1957, 1962, ...(campaignEnd(game) > 1965 ? [1967, 1972, 1977, 1982] : [])];
    return { open: years.includes(game.year), next: years.find((year) => year > game.year), award: game.grantAwards?.[game.year] };
  }

  function grantOffers(game) {
    const { open, award } = grantWindow(game);
    if (!open || award) return [];
    const roads = active(game, "road").length;
    const levees = active(game, "levee").length;
    const farms = active(game, "irrigation").length;
    const base = Math.max(4, Math.round(finance(game).total / 3));
    return [
      { id: "standard", title: "General development grant", grant: base, match: 0, reason: null, detail: "A smaller allocation with no matching contribution." },
      { id: "transport", title: "Transport counteroffer", grant: base * 3, match: base, reason: roads < 2 ? "Requires two completed road links." : null, detail: "Commit local funds for survey, drainage and maintenance on the network." },
      { id: "flood", title: "Flood protection counteroffer", grant: base * 4, match: base * 2, reason: levees < 1 || farms < 1 ? "Requires a completed embankment and irrigation scheme." : null, detail: "Commit local funds for upkeep and protecting the cultivated floodplain." },
    ].map((offer) => ({ ...offer, reason: offer.reason ?? (game.cash < offer.match ? "Treasury cannot cover the local match." : null) }));
  }

  function acceptGrant(game, id) {
    const offer = grantOffers(game).find((candidate) => candidate.id === id);
    if (!offer || offer.reason) return game;
    const { title, grant, match } = offer;
    return { ...game, cash: game.cash + grant - match, grantAwards: { ...game.grantAwards, [game.year]: { title, grant, match } } };
  }

  function localReceipts(output, towns, terminalReceipts = 0) {
    return { workshops: Math.floor(output * 0.8), markets: Math.max(0, towns - 2) + terminalReceipts };
  }

  function earnedReceipts(report) {
    const { workshops, markets } = localReceipts(report.output, report.towns, report.development?.marketReceipts);
    const freight = (report.regionalCash ?? 0) + (report.regional?.freightCompetition?.player.earnings ?? 0);
    const contract = playerContractReceipts(report.regional?.freightContract);
    const sales = report.sold ?? 0;
    return { workshops, markets, freight, contract, sales, total: workshops + markets + freight + contract + sales };
  }

  function playerContractReceipts(contract) {
    return contract?.winner?.id === "player" ? contract.payment : 0;
  }

  function freightContract(game) {
    if (game.journey?.preset !== "standard") return null;
    const last = game.reports.at(-1)?.regional;
    const activeContract = last?.freightContract ?? null;
    const upcoming = upcomingFreightContract(game);
    if (!activeContract && !upcoming) return null;
    if (!upcoming) return { year: game.year, active: activeContract, upcoming: null, canDevelop: false };

    function bid(state) {
      const { reached, towns } = access(state);
      const linked = (kind) => active(state, kind).filter(({ hex }) => isConnected(reached, hex)).length;
      return contractPlayerBid({ towns, workshops: linked("mill"), terminals: linked("freightTerminal") }).capacity;
    }
    const yearsRemaining = upcoming.start - game.year + 1;
    const projected = {
      ...game, year: upcoming.start,
      assets: game.assets.map((asset) => asset.remaining && asset.remaining <= yearsRemaining ? { ...asset, remaining: 0 } : asset),
    };
    const candidates = new Set(neighborsFor(World, game).map(({ id }) => id));
    const rivals = (last?.partners ?? []).filter(({ id }) => candidates.has(id)).map((row) => contractRivalBid(row, upcoming.start));
    const leader = rivals.sort((a, b) => b.capacity - a.capacity)[0];
    const rival = leader?.capacity ? { name: leader.name, capacity: leader.capacity } : null;
    return { year: game.year, active: activeContract, canDevelop: true, upcoming: {
      ...upcoming, playerCapacity: bid(game), projectedCapacity: bid(projected), rival,
    } };
  }

  function workshopSkillBonus(skills) {
    return Math.min(3, Math.floor(skills / 6));
  }

  function capitalPlan(title, description) {
    return {
      title, description,
      choices: { food: "Food and water", roads: "Transport and industry", skills: "Skills and prosperity" },
      details: {
        food: ["Save ₹3 lakh per new food and water programme through 1951."],
        roads: ["Save ₹3 lakh per new transport and industry programme through 1951."],
        skills: ["Save ₹3 lakh per new education programme through 1951."],
      },
    };
  }

  function basinSurvey(description) {
    return {
      title: "Survey the upper Mahanadi", description,
      choices: { survey: "Fund the survey", local: "Keep funds for local works" },
      details: { survey: ["Qualify for the Union-backed Hirakud agreement."], local: ["Keep the state-funded delta plan available."] },
      priced: { survey: 4 },
    };
  }

  function nextDecision(game) {
    if (game.year > campaignEnd(game)) return null;
    const historical = politicalDecision(game, World);
    if (historical) return historical;
    if (Object.hasOwn(game.decisions, game.year)) return null;
    switch (game.year) {
      case 1947:
        if (game.journey) return null;
        return capitalPlan("The first capital plan", "Choose which sector gets cheaper procurement through 1951. Existing contracts keep their terms.");
      case 1948:
        if (World.key !== "orissa") return null;
        return basinSurvey("The Union wants a basin and resettlement survey before negotiating flood protection and power.");
      case 1952:
        if (game.journey) return null;
        return {
          title: "A standing food agreement", description: "Neighboring markets offer a larger supply contract.",
          choices: { contract: "Sign a supply contract", independent: "Keep the funds" },
          details: { contract: ["Import up to 4 more food units per year."], independent: ["Keep the existing market terms."] }, priced: { contract: 9 },
        };
      case 1951:
        if (World.key !== "mayurbhanj" || settlement(game) !== "merger") return null;
        return basinSurvey("Your expanded administration can seek Union support for flood protection and power.");
      case 1956: {
        if (World.key !== "bihar" || game.journey) return null;
        const southernInvestment = game.assets.filter((asset) => World.tiles[asset.hex].district === "south").length;
        const eligible = southernInvestment < Math.ceil(game.assets.length / 3);
        if (!eligible) return null;
        return {
          title: "A southern district petition", description: "The plateau received under a third of construction starts. A district council requests local administration.",
          choices: { council: "Recognize the council", unified: "Keep one administration" },
          details: { council: ["Transfer southern sites and their works.", "Transfer a quarter of food reserves."], unified: ["Retain all territory and works."] },
          priced: { council: Math.floor(game.cash / 4), unified: 10 },
        };
      }
      default:
        if (World.mapKey === "orissa" && active(game, "power").length &&
          !Object.values(game.decisions).some((choice) => choice === "gridIrrigation" || choice === "gridIndustry")) {
          return {
            title: "Where should the river power go?", description: "The Hirakud station is ready. Set the long-term priority for the grid.",
            choices: { gridIndustry: "Power the workshops", gridIrrigation: "Power irrigation pumps" },
            details: { gridIndustry: ["+2 output per connected workshop each year."], gridIrrigation: ["+3 food units per harvest."] },
          };
        }
        return null;
    }
  }

  function decide(game, choice) {
    const decision = nextDecision(game);
    if (!decision || !Object.hasOwn(decision.choices, choice)) return game;
    if (decision.id && game.journey) return applyPoliticalDecision(game, World, decision, choice);
    const price = choice === "council" ? Math.floor(game.cash / 4) : decision.priced?.[choice] ?? 0;
    if (game.cash < price) return game;
    const owners = { ...game.owners };
    if (choice === "council") {
      for (const tile of Object.values(World.tiles)) {
        if (tile.district === "south" && owners[tile.id] === World.key) owners[tile.id] = "council";
      }
    }
    const reserve = game.reserve - (choice === "council" ? Math.floor(game.reserve / 4) : 0);
    return { ...game, cash: game.cash - price, reserve, owners, decisions: { ...game.decisions, [game.year]: choice } };
  }

  function yearlyRoll(game, salt) {
    let value = Math.imul(game.seed ^ (game.year * 173 + salt), 0x45d9f3b);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

  function centralDrought(game) {
    return World.key === "central" && game.year === 1957;
  }

  function monsoonWarning(game) {
    if (centralDrought(game)) return "Dry monsoon";
    const forecast = yearlyRoll(game, 17) + (yearlyRoll(game, 382) - 0.5) * 0.34;
    if (forecast < 0.28) return "Severe flood";
    if (forecast > 0.77) return "Dry monsoon";
    return null;
  }

  function outlook(game) {
    const warning = monsoonWarning(game);
    return warning === "Severe flood" ? "Flood risk elevated" : warning === "Dry monsoon" ? "Dry-season risk elevated" : "No monsoon warning";
  }

  function authorizeRelief(game, budget) {
    if (!game.journey || game.year > campaignEnd(game) || ![0, 4, 8, 12].includes(budget) || budget > game.cash) return game;
    if (budget) return { ...game, relief: { year: game.year, budget } };
    const { relief, ...rest } = game;
    return relief ? rest : game;
  }

  function yearWorks(game) {
    const completed = [];
    const assets = game.assets.map((asset) => {
      if (asset.remaining === 0) return asset;
      if (asset.remaining === 1) {
        if (game.owners[asset.hex] === World.key) completed.push(asset);
        return { ...asset, remaining: 0, completed: game.year };
      }
      return { ...asset, remaining: asset.remaining - 1 };
    });
    return { assets, completed };
  }

  function powerEffects(game, state, successor) {
    const { assets } = state;
    const hasPower = active(state, "power").length > 0;
    const powerCommitment = game.programmes?.find(({ id, terms }) => {
      if (!basinAgreementsFor(id)?.[terms?.agreement]?.allocation) return false;
      if (id === "chambal") return programmeCommissioned(state, id);
      return assets.some(({ programme, kind, remaining, hex }) => programme === id && kind === "power" && !remaining &&
        (id === "bhakra" || game.owners[hex] === World.key));
    });
    const allocation = powerCommitment && basinAgreementsFor(powerCommitment.id)[powerCommitment.terms.agreement].allocation;
    const sharedPower = powerCommitment?.id === "bhakra" && Boolean(successor);
    const powerIrrigation = allocation === "irrigation" ? (sharedPower ? 2 : 4)
      : hasPower && Object.values(game.decisions).includes("gridIrrigation") ? 3 : 0;
    const industrialPower = allocation === "industry" ? (sharedPower ? 1 : 2)
      : hasPower && Object.values(game.decisions).includes("gridIndustry") ? 2 : 0;
    return { powerCommitment, allocation, sharedPower, powerIrrigation, industrialPower };
  }

  function harvestFor(game, state, monsoon, { successor, powerIrrigation, operating }) {
    const levees = active(state, "levee");
    const irrigated = active(state, "irrigation");
    const sheltered = protectedSites(levees);
    const hasCouncil = Object.values(game.owners).includes("council");
    const expanded = World.key === "mayurbhanj" && settlement(game) === "merger";
    const jurisdiction = game.journey?.jurisdiction;
    const economy = (jurisdiction?.madrasReorganized ? successor?.reorganizedEconomy : successor?.economy) ?? World.economy;
    const additions = successor ? 0 : (jurisdiction?.bombayEarlyIntegration ? 3 : 0) +
      (jurisdiction?.bombayEnlarged ? 8 : 0) + (jurisdiction?.punjabEnlarged ? 8 : 0) +
      (jurisdiction?.centralIntegrated ? 5 : 0) + (jurisdiction?.centralReorganized ? 9 : 0);
    const assamDepartures = (jurisdiction?.assamPartition ? 3 : 0) + (jurisdiction?.assamNagaHills ? 2 : 0) + (jurisdiction?.assamReorganized ? 5 : 0);
    const normalHarvest = hasCouncil ? 25 : expanded ? 24 : economy.harvest + additions - assamDepartures;
    const weatherLoss = monsoon === "Severe flood" ? (expanded ? 8 : economy.floodLoss) : monsoon === "Dry monsoon" ? Math.min(economy.dryLoss ?? 5, normalHarvest) : 0;
    const baselineProtection = monsoon === "Severe flood" ? Math.min(6, levees.length * 2) : 0;
    const earthquake = game.journey?.events["assam-earthquake"];
    const earthquakeLoss = earthquake?.year === game.year ? 6 : 0;
    const bankRepairs = earthquakeLoss && earthquake.choice === "assamRepairBanks" ? 4 : 0;
    const baseline = normalHarvest - weatherLoss + baselineProtection - earthquakeLoss + bankRepairs;
    const otherLevees = monsoon === "Severe flood" ? levees.filter((asset) => !basinAgreementsFor(asset.programme)) : levees;
    const otherShelter = protectedSites(otherLevees);
    const basinProtection = monsoon === "Severe flood" ? baselineProtection - Math.min(6, otherLevees.length * 2) : 0;
    const foodEffects = { normalHarvest, irrigationPotential: 0, weatherLoss, protection: baselineProtection, basinProtection, newIrrigation: 0, policy: game.policy };
    const servedSites = new Set(operating?.id === "extension" ? operating.sites.map(({ id }) => id) : []);
    const extension = servedSites.size > 0;
    const extraFood = extension ? servedSites.size * extensionYield : 0;
    let extensionRecovery = extension && monsoon === "Dry monsoon" ? Math.min(weatherLoss, servedSites.size * extensionDryRecovery) : 0;
    const floodSites = [];
    const irrigationSites = [];
    const farms = irrigated.reduce((total, { hex, completed }) => {
      const tile = World.tiles[hex];
      const potential = 2 + World.terrain[tile.kind].fertility;
      const exposedLoss = monsoon === "Severe flood" ? tile.flood * 2 : 0;
      const avoidedLoss = sheltered.has(hex) ? exposedLoss : 0;
      const produced = potential - exposedLoss + avoidedLoss;
      foodEffects.irrigationPotential += potential;
      foodEffects.weatherLoss += exposedLoss;
      foodEffects.protection += avoidedLoss;
      if (!otherShelter.has(hex)) foodEffects.basinProtection += avoidedLoss;
      if (completed === game.year) foodEffects.newIrrigation += produced;
      const recoveredHere = servedSites.has(hex) ? Math.min(extensionFloodRecovery, exposedLoss - avoidedLoss) : 0;
      extensionRecovery += recoveredHere;
      if (exposedLoss) floodSites.push({ hex, lost: exposedLoss - avoidedLoss - recoveredHere, protected: avoidedLoss + recoveredHere });
      irrigationSites.push({ hex, food: produced + (servedSites.has(hex) ? extensionYield : 0) + recoveredHere });
      return total + produced;
    }, 0);
    if (powerIrrigation) foodEffects.powerIrrigation = powerIrrigation;
    if (floodSites.length) foodEffects.floodSites = floodSites;
    const water = active(state, "waterNetwork").length;
    const waterRecovery = Math.min(water * 4, Math.max(0, foodEffects.weatherLoss - foodEffects.protection - extensionRecovery));
    const researchFood = active(state, "agriculturalInstitute").length * 3;
    const waterYield = water * 2;
    const harvest = baseline + farms + powerIrrigation + extraFood + extensionRecovery + researchFood + waterYield + waterRecovery;
    const demand = Math.max(expanded ? 18 : economy.demandFloor, Math.floor(game.population) - (hasCouncil ? 7 : 0));
    return { harvest, demand, baseline, farms, expanded, extraFood, extensionRecovery, waterRecovery,
      researchFood, waterYield, foodEffects, irrigationSites, earthquakeLoss, bankRepairs };
  }

  function foodPlan(game) {
    const { assets } = yearWorks(game);
    const state = { ...game, assets };
    const successor = successorRegion(game);
    const { powerIrrigation } = powerEffects(game, state, successor);
    const charter = game.journey?.training ? training(game) : null;
    const operating = charter?.status === "operating" ? charter.options.find(({ selected }) => selected) : null;
    const warning = monsoonWarning(game);
    const seasons = [["Typical monsoon", "Typical monsoon"]];
    if (warning) seasons.push([warning, warning === "Severe flood" ? "If flooding occurs" : "If the monsoon is dry"]);
    const scenarios = seasons.map(([monsoon, name]) => ({ name,
      ...harvestFor(game, state, monsoon, { successor, powerIrrigation, operating }),
    }));
    const { demand } = scenarios[0];
    const cases = scenarios.map(({ name, harvest, foodEffects, extensionRecovery, waterRecovery }) => {
      const needed = Math.max(0, demand - harvest);
      const reserveUsed = Math.min(game.reserve, needed);
      return { name, harvest, reserveUsed, gap: needed - reserveUsed, weatherLoss: foodEffects.weatherLoss,
        protectedFood: foodEffects.protection + extensionRecovery + waterRecovery };
    });
    const authorization = game.relief?.year === game.year ? game.relief.budget : 0;
    return { outlook: outlook(game), demand, reserve: game.reserve, cases, cash: game.cash, authorization };
  }

  function advance(game) {
    if (game.year > campaignEnd(game) || nextDecision(game) || basinFloodDecision(game)) return game;
    const charter = game.journey?.training ? training(game) : null;
    const service = charter?.options.find(({ selected }) => selected);
    const operating = charter?.status === "operating" ? service : null;
    const servedSites = new Set(operating?.sites.map(({ id }) => id));
    const charterUpkeep = operating?.upkeep ?? 0;
    const { assets, completed } = yearWorks(game);
    const { relief, ...planning } = game;
    const state = { ...planning, assets };
    const { reached, towns } = access(state);
    const roll = yearlyRoll(game, 17);
    const monsoon = centralDrought(game) ? "Dry monsoon" : roll < 0.2 ? "Severe flood" : roll > 0.83 ? "Dry monsoon" : "Typical monsoon";
    const successor = successorRegion(game);
    const { powerCommitment, allocation, sharedPower, powerIrrigation, industrialPower } = powerEffects(game, state, successor);
    const { harvest, demand, baseline, farms, expanded, extraFood, extensionRecovery, waterRecovery,
      researchFood, waterYield, foodEffects, irrigationSites, earthquakeLoss, bankRepairs } = harvestFor(game, state, monsoon, { successor, powerIrrigation, operating });
    const colleges = active(state, "college").length;
    const universities = active(state, "university").length;
    const technical = active(state, "technicalInstitute").length;
    const agricultural = active(state, "agriculturalInstitute").length;
    const depots = active(state, "foodDepot").length;
    const water = active(state, "waterNetwork").length;
    const freightTerminals = active(state, "freightTerminal");
    const terminals = freightTerminals.length;
    const parks = active(state, "industrialPark").length;
    const development = {
      skills: colleges * 6 + universities * 8 + (technical + agricultural) * 4,
      researchOutput: 0, parkOutput: 0, researchFood,
      waterYield, waterRecovery, storage: depots * 18, marketReceipts: terminals * Math.min(8, Math.max(0, towns - 2)), importCapacity: terminals * 3,
    };
    const mills = active(state, "mill");
    const regional = game.journey ? resolveNeighbors(state, World, {
      harvest, demand, towns, monsoon,
      connectedWorkshops: mills.filter(({ hex }) => isConnected(reached, hex)).length,
      freightTerminals: freightTerminals.filter(({ hex }) => isConnected(reached, hex)).length,
    }) : null;
    const juteMills = mills.filter(({ programme }) => programmes[programme]?.rawJute).length;
    const easternPartner = regional?.report.partners.find(({ id }) => id === "eastBengal");
    const juteSource = !juteMills ? null : !game.journey?.events.partition ? "Bengal market"
      : programmeCommissioned(state, "juteSupply") ? "Domestic supply"
        : easternPartner?.access === "Open corridor" ? `Corridor with ${easternPartner.name}` : "Supply disrupted";
    const juteLoss = juteSource === "Supply disrupted" ? 2 : 0;
    const skills = active(state, "school").reduce((total, asset) => total + Math.min(7, game.year - asset.completed + 1), 0) + development.skills;
    const industry = { workshops: 0, base: 0, minerals: 0, marketAccess: 0, skills: 0, power: 0, newWorkshops: 0 };
    const assamDisruption = World.key === "assam" && game.year >= 1947 && game.year < 1950;
    const assamRail = World.key === "assam" && game.year >= 1950 && programmeCommissioned(state, "assamRailLink");
    let teaOutput = 0;
    const bhilaiSuppliers = game.journey?.events["central-bhilai"]?.choice === "centralBhilaiSuppliers";
    let bhilaiOutput = 0;
    const skillBonus = workshopSkillBonus(skills);
    const apprenticeships = service?.id === "apprenticeships";
    const extraOutput = apprenticeships ? servedSites.size * apprenticeshipOutput : 0;
    const workshopSites = mills.map((asset) => {
      const tile = World.tiles[asset.hex];
      const minerals = tile.mineral ? 2 : 0;
      const accessBonus = isConnected(reached, asset.hex) ? 4 : 0;
      const powerBonus = accessBonus ? industrialPower : 0;
      const charterBonus = apprenticeships && servedSites.has(asset.hex) ? apprenticeshipOutput : 0;
      const research = accessBonus ? colleges + universities + technical * 2 : 0;
      const park = accessBonus ? parks * 3 : 0;
      const materialLoss = programmes[asset.programme]?.rawJute ? juteLoss : 0;
      const supplierOutput = bhilaiSuppliers && accessBonus && tile.district === "chhattisgarhPlain" ? 2 : 0;
      const rail = assamRail && accessBonus && programmes[asset.programme]?.teaFreight ? 2 : 0;
      const produced = 3 + minerals + accessBonus + skillBonus + powerBonus + charterBonus + research + park + supplierOutput - materialLoss;
      teaOutput += rail;
      bhilaiOutput += supplierOutput;
      industry.workshops++;
      industry.base += 3;
      industry.minerals += minerals;
      industry.marketAccess += accessBonus;
      industry.skills += skillBonus;
      industry.power += powerBonus;
      development.researchOutput += research;
      development.parkOutput += park;
      if (asset.completed === game.year) industry.newWorkshops += produced;
      return { hex: asset.hex, output: produced + rail, base: 3, market: accessBonus, skills: skillBonus, research,
        power: powerBonus, apprenticeship: charterBonus, minerals, park, supplier: supplierOutput, rail, materialLoss };
    });
    const output = workshopSites.reduce((total, site) => total + site.output, 0);
    const neighborHarvest = 3 + Math.floor(yearlyRoll(game, 911) * 8);
    const backgroundStock = Math.max(0, Math.min(18, game.marketStock + neighborHarvest - 6));
    const availableGrain = Math.max(0, Math.min(18, backgroundStock + (regional?.marketStockAdjustment ?? 0)));
    const market = availableGrain <= 5 ? "Tight" : "Open";
    const buyPrice = market === "Tight" ? 2 : 1;
    const railCapacity = assamRail ? 2 : assamDisruption ? -2 : 0;
    const supply = Math.max(0, (market === "Tight" ? 2 : 5) + Math.floor((towns - 1) / 2) + (game.decisions[1952] === "contract" ? 4 : 0) + (regional?.marketCapacity ?? 0) + railCapacity) + development.importCapacity;
    const fromReserve = Math.min(game.reserve, Math.max(0, demand - harvest));
    const fromPartnerReserve = regional?.emergencyFood ?? 0;
    const foodDeficit = Math.max(0, demand - harvest - fromReserve - fromPartnerReserve);
    const emergencyBudget = relief?.year === game.year ? relief.budget : null;
    const policy = emergencyBudget === null ? game.policy : "import";
    const purchaseFunds = Math.max(0, Math.min(game.cash - charterUpkeep, emergencyBudget ?? Infinity));
    const bought = policy === "import" ? Math.min(foodDeficit, availableGrain, supply, Math.floor(purchaseFunds / buyPrice)) : 0;
    const sold = policy === "export" ? Math.min(Math.max(0, harvest - demand), 18 - availableGrain, market === "Tight" ? towns * 2 : towns) : 0;
    const bilateral = regional && settleNeighborTrade(regional, { bought, sold, buyPrice });
    const regionalSettlement = bilateral && settleFreight(settleNationalTrade(bilateral, game, World), game);
    const marketStock = availableGrain - bought + sold;
    const carryStock = bilateral
      ? Math.max(0, Math.min(18, backgroundStock - (bought - bilateral.report.importUnits) + (sold - bilateral.report.exportUnits)))
      : marketStock;
    const shortage = foodDeficit - bought;
    const capacity = 5 + active(state, "granary").length * 10 + development.storage;
    const reserve = Math.min(capacity, game.reserve - fromReserve + Math.max(0, harvest - demand - sold));
    const funding = finance(game);
    const receipts = localReceipts(output, towns, development.marketReceipts);
    const tax = funding.local + receipts.markets + receipts.workshops;
    const maintenance = Math.ceil(assets.filter((asset) => asset.remaining === 0 && game.owners[asset.hex] === World.key).length / 4) + charterUpkeep;
    const competitiveReceipts = regionalSettlement?.report.freightCompetition?.player.earnings ?? 0;
    const contractReceipts = playerContractReceipts(regionalSettlement?.report.freightContract);
    const income = tax + funding.transfers + sold - bought * buyPrice + (regional?.cash ?? 0) + competitiveReceipts + contractReceipts;
    const cash = Math.max(0, game.cash + income - maintenance);
    const previouslyReached = completed.some((asset) => asset.kind === "road") ? access(game).reached : reached;
    const newlyConnected = [...reached].filter((id) => !previouslyReached.has(id) && World.tiles[id].town).map((id) => World.tiles[id].town.name);
    const programme = activeProgramme(game);
    let delivery = null;
    if (programme) {
      const { id, finish } = programme;
      const nextWork = Math.min(...assets.filter((asset) => asset.programme === id && asset.remaining > 0 && game.owners[asset.hex] === World.key).map((asset) => asset.remaining));
      const followOn = finish === game.year && game.year < campaignEnd(game) && programmeCommissioned(state, id)
        ? Object.entries(visibleProgrammes(state)).find(([key, plan]) => {
          if (programmeCommissioned(state, key) || plan.works.some(({ hex }) => state.owners[hex] !== World.key)) return false;
          const requirements = programmeRequirements(state, key);
          return requirements.some(({ ids }) => ids.includes(id)) && requirements.every(({ met }) => met);
        })?.[0]
        : null;
      delivery = { id, finish, nextWorkYear: Number.isFinite(nextWork) ? game.year + nextWork : null, followOn: followOn ?? null };
      if (programme.terms && programme.approved === game.year) {
        const { agreement, union } = programme.terms;
        delivery.funding = { agreement, union, state: programme.cost, stateName: campaignName(game) };
      }
      if (programme.floodResponse?.year === game.year) delivery.floodResponse = programme.floodResponse;
    }
    const report = {
      year: game.year, monsoon, market, marketStock, harvest, baseline, farms, demand, shortage, reserve, fromReserve, bought, sold, buyPrice,
      skills, output, towns, completed, tax, maintenance, income, openingCash: game.cash, cash, upkeepShortfall: Math.max(0, maintenance - game.cash - income),
      baselineTransfers: funding.transfers, grantAward: game.grantAwards?.[game.year] ?? null,
      attribution: { food: foodEffects, industry, newlyConnected, programme: delivery },
      siteEconomy: { workshops: workshopSites, irrigation: irrigationSites },
    };
    if (World.key === "assam" && (railCapacity || earthquakeLoss || game.year === 1950)) {
      report.assam = { railCapacity, teaOutput, earthquakeLoss, bankRepairs };
    }
    if (powerCommitment?.id === "bhakra") report.bhakra = { allocation, shared: sharedPower, food: powerIrrigation, output: industry.power };
    else if (powerCommitment?.id === "chambal") report.chambal = { agreement: powerCommitment.terms.agreement,
      allocation, food: powerIrrigation, output: industry.power };
    else if (powerCommitment) report.southernPower = { id: powerCommitment.id, agreement: powerCommitment.terms.agreement,
      allocation, food: powerIrrigation, output: industry.power };
    if (bhilaiSuppliers) report.bhilai = { output: bhilaiOutput };
    if (emergencyBudget !== null) report.relief = { budget: emergencyBudget, bought, spent: bought * buyPrice };
    if (juteMills) report.jute = { source: juteSource, mills: juteMills, lost: juteMills * juteLoss };
    if (colleges || universities || technical || agricultural || depots || water || terminals || parks) report.development = development;
    if (service) {
      report.training = {
        id: service.id, title: service.title, status: charter.status, message: charter.message, upkeep: charterUpkeep,
        setup: game.journey.training.authorized === game.year ? service.cost : 0,
        sites: operating?.sites ?? [],
        output: extraOutput, receipts: receipts.workshops - localReceipts(output - extraOutput, towns).workshops,
        food: extraFood, recovered: extensionRecovery,
      };
    }
    if (bilateral) {
      report.regional = regionalSettlement.report;
      report.regionalCash = regional.cash;
      report.migration = regional.migration;
      report.politicalEvents = Object.values(game.journey.events).filter(({ year }) => year === game.year);
      report.signedAgreements = Object.values(game.journey.agreements).filter(({ year }) => year === game.year);
    }
    const growth = World.key === "mayurbhanj" && !expanded ? (shortage ? .06 : .16) : (shortage ? .15 : .55);
    return {
      ...state, year: game.year + 1, cash, reserve, marketStock: carryStock,
      population: Math.max(1, game.population + growth + (regional?.migration ?? 0)),
      ...(regionalSettlement ? { journey: { ...game.journey, partners: regionalSettlement.partners } } : {}),
      reports: [...game.reports, report],
    };
  }

  function score(game) {
    const latest = game.reports.at(-1);
    const secureYears = game.reports.slice(-5).filter((report) => report.shortage === 0).length;
    const goals = targets(game);
    const prosperity = secureYears >= goals.secureYears && latest?.skills >= goals.skills && latest.towns >= goals.towns;
    const economy = latest?.output >= goals.output && latest.towns >= goals.towns && game.cash >= goals.cash;
    return { latest, secureYears, prosperity, economy };
  }

  function validSave(game, region, founding) {
    return game?.version === version && (game.region ?? "bihar") === region && Array.isArray(game.assets) && Array.isArray(game.reports) && game.owners && game.decisions &&
      Number.isInteger(game.marketStock) && Number.isInteger(game.year) && game.year >= World.start && game.year <= campaignEnd(game) + 1 &&
      founding === Boolean(game.journey) && (!founding || (campaignLengths(region).includes(game.journey.end) && game.journey.events && game.journey.agreements && game.journey.partners));
  }

  function load(storage, founding = false) {
    const data = storage.getItem(founding ? foundingSaveKey(World.key) : saveKey);
    if (!data) return null;
    const game = JSON.parse(data);
    if (!validSave(game, World.key, founding)) return null;
    return { ...game, grantAwards: game.grantAwards ?? {}, programmes: game.programmes ?? [] };
  }

  function save(storage, game) {
    storage.setItem(game.journey ? foundingSaveKey(World.key) : saveKey, JSON.stringify(game));
  }

  return {
    saveKey, projects, policies, newGame, active, access, isConnected, cost, buildStatus, build, roadForecast, nextDecision, decide, outlook, finance, localReceipts, earnedReceipts, grantWindow, grantOffers, acceptGrant, advance, score, load, save,
    training, adoptTraining, workshopSkillBonus, authorizeRelief, validSave, freightContract, foodPlan,
    partnerOffers: (game) => partnerOffers(game, World),
    jointProjectOffers: (game) => jointProjectOffers(game, World),
    neighbors: (game) => neighborsFor(World, game),
    signPartnerOffer: (game, id) => signPartnerOffer(game, World, id),
    fundJointProject: (game, id) => fundJointProject(game, World, id),
  };
})();
