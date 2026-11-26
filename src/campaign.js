import { campaignStorageKey, territories, World } from "./scenario.js";
import { compressedSave, decodeSave, encodeSave } from "./save-codec.js";
import { Fiscal } from "./fiscal.js";
import { campaignEnd, campaignLengths, campaignName, foundingSaveKey, journeySettings, settlement, successorKey, successorRegion, targets } from "./journey.js";
import { fundJointProject, jointProjectOffers, neighborsFor, partnerOffers, resolveNeighbors, settleFreight, settleNationalTrade, settleNeighborTrade, signPartnerOffer } from "./interregional.js";
import { contractPlayerBid, contractRivalBid, upcomingFreightContract } from "./neighbor-competition.js";
import { applyPoliticalDecision, politicalDecision } from "./politics.js";
import { activeProgramme, basinAgreementsFor, basinFloodDecision, partnershipRecord, partnershipWindow, programmeCommissioned, programmeRequirements, programmes, visibleProgrammes } from "./programmes.js";
import { apprenticeshipOutput, extensionDryRecovery, extensionFloodRecovery, extensionYield, trainingModel } from "./training.js";
import { reservePlan, reserveWindow, resolveReserve, signReserve } from "./union-reserve.js";
import { enrollIntake, intakeEffects, intakePlan, intakeStatus, matureSchools, placementOutput } from "./technical-intake.js";
import { adoptCabinetPlan, cabinetPlan, resolveCabinetPlan } from "./cabinet-plan.js";
import { adoptRegionalMandate, recordRegionalMandate, regionalMandate } from "./regional-mandate.js";
import { campaignPriceYear, openingPriceYear, periodAmount, priceBasis } from "./period-prices.js";
import { partnershipActivity } from "./partnerships.js";
import { crisisDelivery, crisisSeverity } from "./food-crisis.js";
import { dispatchOffer, dispatchWindow, settleReserveDispatch } from "./reserve-dispatch.js";
import { acceptBayCharter, bayOpening, bayShippingPlan } from "./bay-shipping.js";
import { playerMarketId } from "./national-market.js";

const outcomeWindowYears = 5;
const productiveTarget = 4;

export const Campaign = (() => {
  const projects = {
    irrigation: { name: "Irrigation", icon: "≈", cost: 13, years: 1, summary: "Adds harvest. Fertile land gives more, but exposed crops lose more in a flood." },
    juteFarm: { name: "Jute growing area", summary: "Supplies raw fibre to the Hooghly mill once the Nadia programme is complete." },
    levee: { name: "Embankment", icon: "≋", cost: 15, years: 2, summary: "Shields this hex and adjacent farms. Also reduces regional flood damage." },
    road: { name: "Road link", icon: "╍", cost: 7, years: 1, summary: "Extend a chain from an existing hub. Connected towns unlock trade and improve workshop output." },
    mill: { name: "Workshop", icon: "⚙", cost: 24, years: 2, summary: "Earns revenue. Nearby minerals improve output and a market road raises it further." },
    school: { name: "Technical school", icon: "◇", cost: 17, years: 2, summary: "Trains workers over seven years. Skills raise workshop output and count toward shared prosperity." },
    granary: { name: "Food store", icon: "▣", cost: 12, years: 1, summary: "Stores 10 more food units for lean years." },
    power: { name: "Hydropower station", icon: "ϟ", cost: 20, years: 3, summary: "Supplies connected industry or irrigation pumps through the Mahanadi agreement." },
    college: { name: "Degree college", summary: "Adds 6 Skills. Connected workshops gain 1 output when the college network is operating." },
    university: { name: "Regional university", summary: "Adds 8 Skills. Connected workshops gain 1 output from university research." },
    technicalInstitute: { name: "Technical institute", summary: "Adds 4 Skills and 2 output per market-connected workshop." },
    agriculturalInstitute: { name: "Agricultural institute", summary: "Adds 4 Skills and 3 food each year through agricultural research." },
    foodDepot: { name: "Cooperative food depot", summary: "Stores 18 more units of food for lean years." },
    waterNetwork: { name: "Regional water network", summary: "Adds 2 food each year and recovers up to 4 weather losses that remain after existing protection." },
    freightTerminal: { name: "Freight terminal", summary: "Earns market receipts from up to eight connected towns beyond the first two and adds capacity to buy three more food units." },
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
    const schools = matureSchools(game, active(game, "school"));
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

  function technicalIntake(game) {
    const status = intakeStatus(game);
    if (!status) return null;
    const reached = access(game).reached;
    return intakePlan(game, matureSchools(game, active(game, "school")),
      active(game, "mill").filter(({ hex }) => isConnected(reached, hex)), status === "open" && nextDecision(game));
  }

  function acceptTechnicalIntake(game, count) {
    return enrollIntake(game, technicalIntake(game), count);
  }

  function cost(game, kind) {
    const subsidy = game.decisions[1947];
    if (game.year <= 1951 && ((subsidy === "food" && kind === "irrigation") || (subsidy === "roads" && kind === "road"))) {
      return projects[kind].cost - 3;
    }
    return periodAmount(projects[kind].cost, openingPriceYear, campaignPriceYear(game));
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

  function cabinetContext(game, assets = game.assets, reservedCash) {
    const state = { ...game, assets };
    const { reached } = access(state);
    const kinds = ["school", "college", "university", "technicalInstitute", "agriculturalInstitute"];
    const charter = reservedCash === undefined ? training(game) : null;
    return {
      education: assets.filter(({ kind, remaining, hex }) => kinds.includes(kind) && !remaining && game.owners[hex] === World.key),
      farms: active(state, "irrigation"),
      workshops: active(state, "mill").filter(({ hex }) => isConnected(reached, hex)),
      reservedCash: reservedCash ?? (charter?.status === "operating" ? charter.options.find(({ selected }) => selected)?.upkeep ?? 0 : 0),
    };
  }

  function cabinetPriority(game) {
    return cabinetPlan(game, finance(game), cabinetContext(game, yearWorks(game).assets));
  }

  function chooseCabinetPriority(game, id) {
    return adoptCabinetPlan(game, id, finance(game), cabinetContext(game, yearWorks(game).assets));
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

  function localReceipts(output, towns, terminalReceipts = 0, year = openingPriceYear) {
    return {
      workshops: periodAmount(output * 0.8, openingPriceYear, year, Math.floor),
      markets: periodAmount(Math.max(0, towns - 2), openingPriceYear, year) + terminalReceipts,
    };
  }

  function earnedReceipts(report) {
    const { workshops, markets } = report.receipts ?? localReceipts(report.output, report.towns, report.development?.marketReceipts);
    const maritime = report.regional?.maritime;
    const freight = (report.regionalCash ?? 0) + (report.regional?.freightCompetition?.player.earnings ?? 0) + (maritime?.id === "trade" ? maritime.receipt : 0);
    const contract = playerContractReceipts(report.regional?.freightContract);
    const sales = report.sold ?? 0;
    const procurement = (report.unionReserve?.proceeds ?? 0) + (maritime?.id === "food" ? maritime.receipt : 0);
    return { workshops, markets, freight, contract, sales, procurement, total: workshops + markets + freight + contract + sales + procurement };
  }

  function reportFunding(report) {
    if (report.funding) return report.funding;
    if (report.baselineTransfers === undefined) return null;
    const { workshops, markets } = report.receipts ?? localReceipts(report.output, report.towns, report.development?.marketReceipts);
    const local = report.tax - workshops - markets;
    // Older reports retain the allocation amounts, but not their historical source.
    // Never attach today's fiscal reference to a previously resolved year.
    return { local, transfers: report.baselineTransfers, total: local + report.baselineTransfers, historic: null };
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
    if (centralDrought(game) || crisisSeverity(game, World.key)) return "Dry monsoon";
    const forecast = yearlyRoll(game, 17) + (yearlyRoll(game, 382) - 0.5) * 0.34;
    if (forecast < 0.28) return "Severe flood";
    if (forecast > 0.77) return "Dry monsoon";
    return null;
  }

  function outlook(game) {
    if (crisisSeverity(game, World.key)) return "Regional drought";
    const warning = monsoonWarning(game);
    return warning === "Severe flood" ? "Flood risk elevated" : warning === "Dry monsoon" ? "Dry-season risk elevated" : "No monsoon warning";
  }

  function authorizeRelief(game, budget) {
    if (!game.journey || game.year > campaignEnd(game) || ![0, 4, 8, 12].includes(budget) || budget > game.cash) return game;
    if (budget) return { ...game, relief: { year: game.year, budget } };
    const { relief, ...rest } = game;
    return relief ? rest : game;
  }

  function orderCrisisFood(game, order) {
    if (!crisisSeverity(game, World.key) || game.year > campaignEnd(game)) return game;
    const { crisisOrder, reserveDispatch, ...planning } = game;
    if (!order) return crisisOrder ? { ...planning, ...(reserveDispatch ? { reserveDispatch } : {}) } : game;
    return crisisOrder?.year === game.year ? game : { ...planning, crisisOrder: { year: game.year } };
  }

  function pledgeReserve(game, pledged) {
    if (!dispatchWindow(game)) return game;
    const { reserveDispatch, ...planning } = game;
    if (!pledged) return reserveDispatch ? planning : game;
    const { dispatch } = foodPlan(game);
    if (dispatch.orderPlaced || !dispatch.limit || dispatch.pledged) return game;
    return { ...planning, reserveDispatch: { year: game.year } };
  }

  function droughtDelivery(game, state, { harvest, demand, towns, reached, charterUpkeep, priorityCost }) {
    const terminals = active(state, "freightTerminal").filter(({ hex }) => isConnected(reached, hex)).length;
    return crisisDelivery(game, { harvest, demand, towns, terminals, cash: Math.max(0, game.cash - charterUpkeep - priorityCost) });
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

  function harvestFor(game, state, monsoon, { successor, powerIrrigation, operating, priority }) {
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
    const severeDry = monsoon === "Dry monsoon" ? crisisSeverity(game, World.key) : 0;
    const weatherLoss = monsoon === "Severe flood" ? (expanded ? 8 : economy.floodLoss)
      : severeDry ? Math.round(normalHarvest * severeDry)
        : monsoon === "Dry monsoon" ? Math.min(economy.dryLoss ?? 5, normalHarvest) : 0;
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
    const droughtSites = [];
    const irrigationSites = [];
    const farms = irrigated.reduce((total, { hex, completed }) => {
      const tile = World.tiles[hex];
      const potential = 2 + World.terrain[tile.kind].fertility;
      const flood = monsoon === "Severe flood";
      const exposedLoss = flood ? tile.flood * 2 : Math.round(potential * severeDry / 2);
      const avoidedLoss = flood && sheltered.has(hex) ? exposedLoss : 0;
      const produced = potential - exposedLoss + avoidedLoss;
      foodEffects.irrigationPotential += potential;
      foodEffects.weatherLoss += exposedLoss;
      foodEffects.protection += avoidedLoss;
      if (!otherShelter.has(hex)) foodEffects.basinProtection += avoidedLoss;
      if (completed === game.year) foodEffects.newIrrigation += produced;
      const recoveredHere = flood && servedSites.has(hex) ? Math.min(extensionFloodRecovery, exposedLoss - avoidedLoss) : 0;
      extensionRecovery += recoveredHere;
      if (flood && exposedLoss) floodSites.push({ hex, lost: exposedLoss - avoidedLoss - recoveredHere, protected: avoidedLoss + recoveredHere });
      if (severeDry && exposedLoss) droughtSites.push({ hex, lost: exposedLoss, protected: 0 });
      irrigationSites.push({ hex, food: produced + (servedSites.has(hex) ? extensionYield : 0) + recoveredHere });
      return total + produced;
    }, 0);
    if (powerIrrigation) foodEffects.powerIrrigation = powerIrrigation;
    if (floodSites.length) foodEffects.floodSites = floodSites;
    if (droughtSites.length) foodEffects.droughtSites = droughtSites;
    const water = active(state, "waterNetwork").length;
    const waterRecovery = Math.min(water * 4, Math.max(0, foodEffects.weatherLoss - foodEffects.protection - extensionRecovery));
    const researchFood = active(state, "agriculturalInstitute").length * 3;
    const waterYield = water * 2;
    // Attribute existing water recovery before the priority so protection is never counted twice.
    let waterForSites = monsoon === "Severe flood" ? waterRecovery : 0;
    for (const site of floodSites) {
      const recovered = Math.min(site.lost, waterForSites);
      site.lost -= recovered;
      site.protected += recovered;
      waterForSites -= recovered;
      irrigationSites.find(({ hex }) => hex === site.hex).food += recovered;
    }
    const priorityFood = irrigated.length * (priority?.foodPerFarm ?? 0);
    let recoveryBudget = Math.min(irrigated.length * (priority?.recoverPerFarm ?? 0),
      Math.max(0, foodEffects.weatherLoss - foodEffects.protection - extensionRecovery - waterRecovery));
    let priorityRecovery = 0;
    for (const site of irrigationSites) {
      const flood = floodSites.find(({ hex }) => hex === site.hex);
      const recovered = Math.min(recoveryBudget, priority?.recoverPerFarm ?? 0,
        monsoon === "Severe flood" ? flood?.lost ?? 0 : monsoon === "Dry monsoon" ? Infinity : 0);
      recoveryBudget -= recovered;
      priorityRecovery += recovered;
      site.priority = (priority?.foodPerFarm ?? 0) + recovered;
      site.food += site.priority;
      if (flood) { flood.lost -= recovered; flood.protected += recovered; }
    }
    const harvest = baseline + farms + powerIrrigation + extraFood + extensionRecovery + researchFood + waterYield + waterRecovery + priorityFood + priorityRecovery;
    const demand = Math.max(expanded ? 18 : economy.demandFloor, Math.floor(game.population) - (hasCouncil ? 7 : 0));
    return { harvest, demand, baseline, farms, expanded, extraFood, extensionRecovery, waterRecovery,
      researchFood, waterYield, foodEffects, irrigationSites, earthquakeLoss, bankRepairs, priorityFood, priorityRecovery };
  }

  function foodPlan(game) {
    const { assets } = yearWorks(game);
    const state = { ...game, assets };
    const successor = successorRegion(game);
    const { powerIrrigation } = powerEffects(game, state, successor);
    const charter = game.journey?.training ? training(game) : null;
    const operating = charter?.status === "operating" ? charter.options.find(({ selected }) => selected) : null;
    const priority = resolveCabinetPlan(game, finance(game), cabinetContext(game, assets, operating?.upkeep ?? 0));
    const severeDry = crisisSeverity(game, World.key);
    const warning = monsoonWarning(game);
    const seasons = [["Typical monsoon", severeDry ? "Typical monsoon reference" : "Typical monsoon"]];
    if (warning) seasons.push([warning, severeDry ? "Drought outlook" : warning === "Severe flood" ? "If flooding occurs" : "If the monsoon is dry"]);
    const scenarios = seasons.map(([monsoon, name]) => ({ name,
      ...harvestFor(game, state, monsoon, { successor, powerIrrigation, operating, priority: priority.effects }),
    }));
    const { demand } = scenarios[0];
    const cases = scenarios.map(({ name, harvest, foodEffects, extensionRecovery, waterRecovery, priorityRecovery }) => {
      const needed = Math.max(0, demand - harvest);
      const reserveUsed = Math.min(game.reserve, needed);
      return { name, harvest, reserveUsed, gap: needed - reserveUsed, weatherLoss: foodEffects.weatherLoss,
        protectedFood: foodEffects.protection + extensionRecovery + waterRecovery + priorityRecovery };
    });
    const authorization = game.relief?.year === game.year ? game.relief.budget : 0;
    const network = dispatchWindow(game) ? access(state) : null;
    const dispatch = network ? dispatchOffer(game, demand, reserveFacilities(state, network)) : null;
    const crisis = severeDry ? droughtDelivery(game, state, { ...scenarios[1], ...network, charterUpkeep: operating?.upkeep ?? 0, priorityCost: priority.report?.spent ?? 0 }) : null;
    return { outlook: outlook(game), demand, reserve: game.reserve, cases,
      cash: Math.max(0, game.cash - (operating?.upkeep ?? 0) - (priority.report?.spent ?? 0)), authorization, crisis, dispatch };
  }

  function reserveFacilities(state, { reached, towns }) {
    const granaries = active(state, "granary");
    const depots = active(state, "foodDepot");
    const connected = (assets) => assets.filter(({ hex }) => isConnected(reached, hex));
    const localStores = connected(granaries);
    const cooperatives = connected(depots);
    const depotNames = [...new Set([...localStores, ...cooperatives].map(({ hex }) => {
      const tile = World.tiles[hex];
      return tile.town?.name ?? World.districts[tile.district];
    }))];
    return { capacity: Math.max(0, Math.min(6, towns - 1, localStores.length * 4 + cooperatives.length * 6)),
      storage: 5 + granaries.length * 10 + depots.length * 18, depotNames };
  }

  function unionReserve(game) {
    const state = { ...game, assets: yearWorks(game).assets };
    return reservePlan(game, reserveFacilities(state, access(state)), foodPlan(game));
  }

  function acceptUnionReserve(game, id) {
    const state = { ...game, assets: yearWorks(game).assets };
    return signReserve(game, id, reserveFacilities(state, access(state)).capacity);
  }

  function portFacilities(state, { reached, towns }) {
    const operates = (kind) => active(state, kind).some(({ hex }) => isConnected(reached, hex));
    return { towns, stores: operates("granary") || operates("foodDepot"), workshops: operates("mill") };
  }

  function bayShipping(game) {
    if (!game.journey || game.year < bayOpening) return null;
    return bayShippingPlan(game, playerMarketId(game, World), portFacilities(game, access(game)));
  }

  function signBayShipping(game, id) {
    const plan = bayShipping(game);
    return plan ? acceptBayCharter(game, plan, playerMarketId(game, World), id) : game;
  }

  function advance(game) {
    if (game.year > campaignEnd(game) || nextDecision(game) || basinFloodDecision(game)) return game;
    const charter = game.journey?.training ? training(game) : null;
    const service = charter?.options.find(({ selected }) => selected);
    const operating = charter?.status === "operating" ? service : null;
    const servedSites = new Set(operating?.sites.map(({ id }) => id));
    const charterUpkeep = operating?.upkeep ?? 0;
    const { assets, completed } = yearWorks(game);
    const { relief, crisisOrder, reserveDispatch, ...planning } = game;
    const state = { ...planning, assets };
    const priceYear = campaignPriceYear(game);
    const priority = resolveCabinetPlan(game, finance(game), cabinetContext(game, assets, charterUpkeep));
    const priorityCost = priority.report?.spent ?? 0;
    const { reached, towns } = access(state);
    const roll = yearlyRoll(game, 17);
    const severeDry = crisisSeverity(game, World.key);
    const monsoon = centralDrought(game) || severeDry ? "Dry monsoon" : roll < 0.2 ? "Severe flood" : roll > 0.83 ? "Dry monsoon" : "Typical monsoon";
    const successor = successorRegion(game);
    const { powerCommitment, allocation, sharedPower, powerIrrigation, industrialPower } = powerEffects(game, state, successor);
    const { harvest, demand, baseline, farms, expanded, extraFood, extensionRecovery, waterRecovery,
      researchFood, waterYield, foodEffects, irrigationSites, earthquakeLoss, bankRepairs, priorityFood, priorityRecovery } = harvestFor(game, state, monsoon, { successor, powerIrrigation, operating, priority: priority.effects });
    const crisis = severeDry ? droughtDelivery(game, state, { harvest, demand, towns, reached, charterUpkeep, priorityCost }) : null;
    const crisisFood = crisis?.delivered ?? 0;
    const crisisCost = crisis?.cost ?? 0;
    const colleges = active(state, "college").length;
    const universities = active(state, "university").length;
    const technical = active(state, "technicalInstitute").length;
    const agricultural = active(state, "agriculturalInstitute").length;
    const depots = active(state, "foodDepot").length;
    const water = active(state, "waterNetwork").length;
    const freightTerminals = active(state, "freightTerminal");
    const terminals = freightTerminals.length;
    const parks = active(state, "industrialPark").length;
    const terminalActivity = terminals * Math.min(8, Math.max(0, towns - 2));
    const development = {
      skills: colleges * 6 + universities * 8 + (technical + agricultural) * 4,
      researchOutput: 0, parkOutput: 0, researchFood,
      waterYield, waterRecovery, storage: depots * 18,
      marketReceipts: periodAmount(terminalActivity, openingPriceYear, priceYear), importCapacity: terminals * 3,
    };
    const mills = active(state, "mill");
    const linkedMills = mills.filter(({ hex }) => isConnected(reached, hex));
    const schools = active(state, "school");
    const intake = intakeEffects(state, schools, linkedMills);
    const intakeSites = new Set(intake?.sites.map(({ hex }) => hex));
    const regional = game.journey ? resolveNeighbors(state, World, {
      harvest: harvest + crisisFood, demand, towns, monsoon,
      connectedWorkshops: linkedMills.length,
      freightTerminals: freightTerminals.filter(({ hex }) => isConnected(reached, hex)).length,
    }) : null;
    const juteMills = mills.filter(({ programme }) => programmes[programme]?.rawJute).length;
    const easternPartner = regional?.report.partners.find(({ id }) => id === "eastBengal");
    const juteSource = !juteMills ? null : !game.journey?.events.partition ? "Bengal market"
      : programmeCommissioned(state, "juteSupply") ? "Domestic supply"
        : easternPartner?.access === "Open corridor" ? `Corridor with ${easternPartner.name}` : "Supply disrupted";
    const juteLoss = juteSource === "Supply disrupted" ? 2 : 0;
    const ordinarySkills = schools.reduce((total, asset) => total + Math.min(7, game.year - asset.completed + 1), 0) + development.skills;
    const ordinaryTrainedSkills = ordinarySkills + (intake?.skills ?? 0);
    const skills = ordinaryTrainedSkills + priority.effects.skills;
    const industry = { workshops: 0, base: 0, minerals: 0, marketAccess: 0, skills: 0, power: 0, newWorkshops: 0, workforce: 0, priority: 0 };
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
      const placement = intakeSites.delete(asset.hex) ? placementOutput : 0;
      const workforce = accessBonus ? priority.effects.trainingOutputPerWorkshop : 0;
      const productionPriority = accessBonus ? priority.effects.tradeOutputPerWorkshop : 0;
      const produced = 3 + minerals + accessBonus + skillBonus + powerBonus + charterBonus + research + park + supplierOutput + placement + workforce + productionPriority - materialLoss;
      teaOutput += rail;
      bhilaiOutput += supplierOutput;
      industry.workshops++;
      industry.base += 3;
      industry.minerals += minerals;
      industry.marketAccess += accessBonus;
      industry.skills += skillBonus;
      industry.power += powerBonus;
      industry.workforce += workforce;
      industry.priority += productionPriority;
      development.researchOutput += research;
      development.parkOutput += park;
      if (asset.completed === game.year) industry.newWorkshops += produced;
      return { hex: asset.hex, output: produced + rail, base: 3, market: accessBonus, skills: skillBonus, research,
        power: powerBonus, apprenticeship: charterBonus, placement, minerals, park, supplier: supplierOutput, rail, materialLoss, workforce, priority: productionPriority };
    });
    const output = workshopSites.reduce((total, site) => total + site.output, 0);
    const neighborHarvest = 3 + Math.floor(yearlyRoll(game, 911) * 8);
    const backgroundStock = Math.max(0, Math.min(18, game.marketStock + neighborHarvest - 6));
    const availableGrain = Math.max(0, Math.min(18, backgroundStock + (regional?.marketStockAdjustment ?? 0)));
    const market = availableGrain <= 5 ? "Tight" : "Open";
    const buyPrice = market === "Tight" ? 2 : 1;
    const railCapacity = assamRail ? 2 : assamDisruption ? -2 : 0;
    const supply = Math.max(0, (market === "Tight" ? 2 : 5) + Math.floor((towns - 1) / 2) + (game.decisions[1952] === "contract" ? 4 : 0) + (regional?.marketCapacity ?? 0) + railCapacity) + development.importCapacity;
    const fromReserve = Math.min(game.reserve, Math.max(0, demand - harvest - crisisFood));
    const fromPartnerReserve = regional?.emergencyFood ?? 0;
    const afterLocalRelief = Math.max(0, demand - harvest - crisisFood - fromReserve - fromPartnerReserve);
    const available = Math.max(0, game.reserve + harvest + crisisFood - demand);
    const union = reserveWindow(game) ? resolveReserve(game, reserveFacilities(state, { reached, towns }).capacity, available, afterLocalRelief) : null;
    const foodDeficit = afterLocalRelief - (union?.released ?? 0);
    const emergencyBudget = relief?.year === game.year ? relief.budget : null;
    const policy = emergencyBudget === null ? game.policy : "import";
    const purchaseFunds = Math.max(0, Math.min(game.cash - charterUpkeep - priorityCost - crisisCost, emergencyBudget ?? Infinity));
    const bought = policy === "import" ? Math.min(foodDeficit, availableGrain, supply, Math.floor(purchaseFunds / buyPrice)) : 0;
    const foodAfterShipment = available - (union?.shipped ?? 0);
    const marketSurplus = Math.min(Math.max(0, harvest - demand), Math.max(0, foodAfterShipment - (union?.floor ?? 0)));
    const sold = policy === "export" ? Math.min(marketSurplus, 18 - availableGrain, market === "Tight" ? towns * 2 : towns) : 0;
    const bilateral = regional && settleNeighborTrade(regional, { bought, sold, buyPrice });
    const marketStock = availableGrain - bought + sold;
    const carryStock = bilateral
      ? Math.max(0, Math.min(18, backgroundStock - (bought - bilateral.report.importUnits) + (sold - bilateral.report.exportUnits)))
      : marketStock;
    const shortage = foodDeficit - bought;
    const capacity = 5 + active(state, "granary").length * 10 + development.storage;
    const foodOnHand = foodAfterShipment - sold;
    const closingStock = Math.min(capacity, foodOnHand);
    const shipping = game.journey?.bayCharter && game.year <= game.journey.bayCharter.end ? {
      ...portFacilities(state, { reached, towns }), stock: foodOnHand, demand, shortage,
    } : null;
    let domestic = bilateral && settleNationalTrade(bilateral, game, World, shipping);
    const maritime = domestic?.report.maritime;
    let dispatch = null;
    if (domestic && reserveDispatch?.year === game.year && dispatchWindow(game)) {
      const result = settleReserveDispatch(domestic, game, World, { stateName: campaignName(game), demand, towns, fromReserve,
        facilities: reserveFacilities(state, { reached, towns }), foodOnHand: foodOnHand - (maritime?.food ?? 0), shortage });
      domestic = result.regional;
      dispatch = result.dispatch;
    }
    const reserve = dispatch?.reserve ?? Math.min(closingStock, foodOnHand - (maritime?.food ?? 0));
    const regionalSettlement = domestic && settleFreight(domestic, game, (crisis?.freightCapacityUsed ?? 0) + (dispatch?.freightCapacityUsed ?? 0));
    const funding = finance(game);
    const receipts = localReceipts(output, towns, development.marketReceipts, priceYear);
    const tax = funding.local + receipts.markets + receipts.workshops;
    const operatingAssets = assets.filter(({ remaining, hex }) => remaining === 0 && game.owners[hex] === World.key).length;
    const worksUpkeep = periodAmount(Math.ceil(operatingAssets / 4), openingPriceYear, priceYear);
    const maintenance = worksUpkeep + charterUpkeep + priorityCost;
    const competitiveReceipts = regionalSettlement?.report.freightCompetition?.player.earnings ?? 0;
    const contractReceipts = playerContractReceipts(regionalSettlement?.report.freightContract);
    const income = tax + funding.transfers + sold - bought * buyPrice - crisisCost + (regional?.cash ?? 0) + competitiveReceipts + contractReceipts + (union?.proceeds ?? 0) + (maritime?.receipt ?? 0);
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
          if (plan.partnership && game.year + 1 < partnershipWindow.opens) return false;
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
      funding, receipts, baselineTransfers: funding.transfers, grantAward: game.grantAwards?.[game.year] ?? null,
      attribution: { food: foodEffects, industry, newlyConnected, programme: delivery },
      siteEconomy: { workshops: workshopSites, irrigation: irrigationSites },
    };
    if (crisis) {
      const { ordered, delivered, cost, freightCapacityUsed } = crisis;
      report.foodCrisis = { ordered, delivered, cost, freightCapacityUsed };
    }
    if (dispatch) report.reserveDispatch = dispatch;
    const partnership = partnershipRecord(game);
    if (partnership) {
      report.partnership = {
        ...partnershipActivity(partnership, assets, game.owners, World.key, report.siteEconomy, foodEffects.floodSites ?? [],
          (hex) => isConnected(reached, hex)),
        delivered: programmeCommissioned(state, partnership.id),
      };
      if (partnership.approved === game.year) report.partnership.funding = { state: partnership.cost, union: partnership.partnership.union };
    }
    if (game.journey) {
      const { index, referenceYear } = priceBasis(priceYear);
      const previous = game.reports.at(-1);
      const comparisonYear = previous?.prices?.referenceYear ?? openingPriceYear;
      const atEarlierPrices = localReceipts(output, towns, periodAmount(terminalActivity, openingPriceYear, comparisonYear), comparisonYear);
      report.prices = {
        index, referenceYear, worksUpkeep,
        receiptEffect: previous ? receipts.workshops + receipts.markets - atEarlierPrices.workshops - atEarlierPrices.markets : null,
      };
    }
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
    if (union) report.unionReserve = { ...union, reserve };
    if (intake) {
      const skillOutput = mills.length * (skillBonus - workshopSkillBonus(ordinarySkills + priority.effects.skills));
      report.technicalIntake = { ...intake, skillOutput, receipts: receipts.workshops - localReceipts(output - intake.output - skillOutput, towns, 0, priceYear).workshops };
    }
    if (priority.report) {
      const extraOutput = industry.workforce + industry.priority;
      report.cabinetPriority = { ...priority.report, food: priorityFood, recovered: priorityRecovery,
        output: extraOutput, trainingOutput: industry.workforce, tradeOutput: industry.priority,
        receipts: receipts.workshops - localReceipts(output - extraOutput, towns, 0, priceYear).workshops };
    }
    if (juteMills) report.jute = { source: juteSource, mills: juteMills, lost: juteMills * juteLoss };
    if (colleges || universities || technical || agricultural || depots || water || terminals || parks) report.development = development;
    if (service) {
      report.training = {
        id: service.id, title: service.title, status: charter.status, message: charter.message, upkeep: charterUpkeep,
        setup: game.journey.training.authorized === game.year ? service.cost : 0,
        sites: operating?.sites ?? [],
        output: extraOutput, receipts: receipts.workshops - localReceipts(output - extraOutput, towns, 0, priceYear).workshops,
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
    const mandate = recordRegionalMandate(game, report, { food: water, education: technical + agricultural, trade: parks });
    if (mandate) report.regionalMandate = mandate;
    const growth = World.key === "mayurbhanj" && !expanded ? (shortage ? .06 : .16) : (shortage ? .15 : .55);
    return {
      ...state, year: game.year + 1, cash, reserve, marketStock: carryStock,
      population: Math.max(1, game.population + growth + (regional?.migration ?? 0)),
      ...(game.journey ? { journey: { ...game.journey, ...(regionalSettlement ? { partners: regionalSettlement.partners } : {}),
        ...(priority.cabinet ? { cabinet: priority.cabinet } : {}),
        ...(union ? { unionReserve: { ...game.journey.unionReserve, stock: union.closing } } : {}),
      } } : {}),
      reports: [...game.reports, report],
    };
  }

  function score(game) {
    const latest = game.reports.at(-1);
    const recent = game.reports.slice(-outcomeWindowYears);
    const secureYears = recent.filter((report) => report.shortage === 0).length;
    const goals = targets(game);
    const prosperity = secureYears >= goals.secureYears && latest?.skills >= goals.skills && latest.towns >= goals.towns;
    const productiveYears = recent.filter(({ output, towns }) => output >= goals.output && towns >= goals.towns).length;
    const economy = game.journey
      ? productiveYears >= productiveTarget
      : latest?.output >= goals.output && latest.towns >= goals.towns && game.cash >= goals.cash;
    return { latest, recent, secureYears, productiveYears, productiveTarget, prosperity, economy, mandate: latest?.regionalMandate ?? null };
  }

  function validSave(game, region, founding) {
    return game?.version === version && (game.region ?? "bihar") === region && Array.isArray(game.assets) && Array.isArray(game.reports) && game.owners && game.decisions &&
      Number.isInteger(game.marketStock) && Number.isInteger(game.year) && game.year >= World.start && game.year <= campaignEnd(game) + 1 &&
      founding === Boolean(game.journey) && (!founding || (campaignLengths(region).includes(game.journey.end) && game.journey.events && game.journey.agreements && game.journey.partners));
  }

  function load(storage, founding = false) {
    const data = storage.getItem(founding ? foundingSaveKey(World.key) : saveKey);
    if (!data) return null;
    const game = decodeSave(data);
    if (!validSave(game, World.key, founding)) return null;
    return { ...game, grantAwards: game.grantAwards ?? {}, programmes: game.programmes ?? [] };
  }

  function save(storage, game) {
    storage.setItem(game.journey ? foundingSaveKey(World.key) : saveKey, encodeSave(game));
  }

  function compactSaves(storage) {
    let updated = 0;
    for (const region of Object.keys(territories)) {
      for (const founding of [false, true]) {
        const key = founding ? foundingSaveKey(region) : campaignStorageKey(region);
        try {
          const raw = storage.getItem(key);
          if (!raw || compressedSave(raw)) continue;
          const saved = decodeSave(raw);
          if (!validSave(saved, region, founding)) continue;
          const packed = encodeSave(saved);
          if (packed.length >= raw.length) continue;
          storage.setItem(key, packed);
          updated++;
        } catch {
          // Web Storage keeps the existing value when a replacement fails.
          // Unreadable saves remain available for an explicit user decision.
        }
      }
    }
    return updated;
  }

  return {
    saveKey, projects, policies, newGame, active, access, isConnected, cost, buildStatus, build, roadForecast, nextDecision, decide, outlook, finance, localReceipts, earnedReceipts, reportFunding, grantWindow, grantOffers, acceptGrant, advance, score, load, save, compactSaves,
    training, adoptTraining, technicalIntake, acceptTechnicalIntake, workshopSkillBonus, authorizeRelief, orderCrisisFood, pledgeReserve, validSave, freightContract, foodPlan, unionReserve, acceptUnionReserve, cabinetPriority, chooseCabinetPriority, bayShipping, signBayShipping,
    regionalMandate: (game) => regionalMandate(game, targets(game).output, game.journey?.mandate && {
      food: active(game, "waterNetwork").length,
      education: active(game, "technicalInstitute").length + active(game, "agriculturalInstitute").length,
      trade: active(game, "industrialPark").length,
    }),
    chooseRegionalMandate: (game, id) => adoptRegionalMandate(game, id, targets(game).output),
    partnerOffers: (game) => partnerOffers(game, World),
    jointProjectOffers: (game) => jointProjectOffers(game, World),
    neighbors: (game) => neighborsFor(World, game),
    signPartnerOffer: (game, id) => signPartnerOffer(game, World, id),
    fundJointProject: (game, id) => fundJointProject(game, World, id),
  };
})();
