const assert = require("node:assert/strict");
const test = require("node:test");

test("campaign rules and complete strategies", async () => {
  const { World } = await import("./src/scenario.js");
  const { Campaign } = await import("./src/campaign.js");
  const road = (hex) => [hex, "road"];
  const routes = [road("hex-6-5"), road("hex-7-4"), road("hex-8-4")];
  const farm = (hex) => [hex, "irrigation"];
  const initial = Campaign.newGame();
  const invalid = Campaign.build(initial, "hex-4-0", "road");
  assert.equal(invalid, initial);
  assert.equal(Campaign.build({ ...initial, cash: 2 }, "hex-6-5", "road").cash, 2);
  const firstRoad = Campaign.build(initial, ...routes[0]);
  assert.equal(firstRoad.cash, 27);
  assert.equal(Campaign.build(firstRoad, ...routes[0]), firstRoad);
  assert.equal(Campaign.access(firstRoad).towns, 3);
  assert.equal(Campaign.access(Campaign.advance(firstRoad)).towns, 4);

  const floodBasin = Campaign.advance(Campaign.build(initial, "hex-11-3", "irrigation"));
  const plain = Campaign.advance(Campaign.build(initial, "hex-6-3", "irrigation"));
  assert.equal(plain.reports[0].monsoon, "Severe flood");
  assert.ok(plain.reports[0].farms > floodBasin.reports[0].farms);

  function run(order, capital, boundary, grainPolicy = "hold") {
    let game = { ...Campaign.newGame(), policy: grainPolicy };
    let next = 0;
    let beforeCouncil;
    while (game.year <= World.end) {
      const choice = { 1947: capital, 1952: "independent", 1956: boundary }[game.year];
      if (Campaign.nextDecision(game)) {
        const decided = Campaign.decide(game, choice);
        assert.notEqual(decided, game);
        if (choice === "council") beforeCouncil = game;
        game = decided;
      }
      while (next < order.length) {
        const candidate = Campaign.build(game, ...order[next]);
        if (candidate === game) break;
        game = candidate;
        next++;
      }
      const data = new Map();
      const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
      Campaign.save(storage, game);
      const updated = Campaign.advance(game);
      assert.deepEqual(updated, Campaign.advance(Campaign.load(storage)));
      assert.notEqual(updated, game);
      const report = updated.reports.at(-1);
      assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
      assert.ok(report.reserve >= 0 && report.marketStock >= 0 && report.marketStock <= 18);
      game = updated;
    }
    assert.equal(next, order.length);
    assert.equal(game.reports.length, 20);
    return { game, beforeCouncil };
  }

  const foodFirst = [farm("hex-4-5"), farm("hex-5-5"), ...routes,
    ["hex-6-6", "school"], ["hex-6-7", "school"], ["hex-6-4", "school"],
    farm("hex-7-6"), farm("hex-7-5"), ["hex-11-12", "granary"]];
  const industryFirst = [routes[0], ["hex-11-12", "mill"], ...routes.slice(1),
    ...["hex-6-6", "hex-6-7", "hex-6-4", "hex-8-3"].map((hex) => [hex, "mill"]),
    farm("hex-4-5"), farm("hex-5-5")];
  const food = run(foodFirst, "food", "unified").game;
  const industry = run(industryFirst, "roads", "unified", "import").game;
  assert.ok(Campaign.score(food).prosperity);
  assert.ok(Campaign.score(industry).economy);
  assert.ok(food.reports.at(-1).shortage < industry.reports.at(-1).shortage || food.reserve > industry.reserve);
  assert.ok(industry.reports.at(-1).output > food.reports.at(-1).output);
  assert.deepEqual(food, run(foodFirst, "food", "unified").game);

  const { game: reorganized, beforeCouncil } = run(industryFirst, "roads", "council");
  const transferred = beforeCouncil.assets.find((asset) => asset.hex === "hex-11-12");
  assert.equal(reorganized.owners[transferred.hex], "council");
  assert.deepEqual(reorganized.assets.find((asset) => asset.id === transferred.id), transferred);
  assert.equal(Object.keys(reorganized.owners).length, Object.keys(World.tiles).length);
  console.log("Campaign checks passed: legal construction, road and flood effects, both victory paths, deterministic resume, reconciled cash, and asset continuity.");
});

test("founding saves preserve distinct 1947 decisions and the northern successor", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const storage = new Map();
  const device = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) };
  const archive = Campaign.newGame();
  Campaign.save(device, archive);

  let game = approveProgramme(Campaign.newGame(undefined, { end: 1985, preset: "light" }), "food");
  game = Campaign.advance(game);
  assert.equal(Campaign.nextDecision(game).id, "independence");
  game = Campaign.decide(game, "food");
  assert.equal(Campaign.nextDecision(game).id, "partition");
  assert.equal(Campaign.advance(game), game);
  game = Campaign.decide(game, "depots");
  assert.equal(Campaign.nextDecision(game), null);

  while (game.year < 1956) {
    if (Campaign.nextDecision(game)) game = Campaign.decide(game, "district");
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    game = next;
  }
  const sites = Object.keys(game.owners);
  game = Campaign.decide(game, "split");
  assert.equal(game.journey.jurisdiction.reorganization, "split");
  assert.deepEqual(Object.keys(game.owners), sites);
  assert.equal(game.owners["hex-11-12"], "council");
  Campaign.save(device, game);
  const loaded = Campaign.load(device, true);
  assert.equal(loaded.journey.end, 1985);
  assert.deepEqual(Campaign.advance(loaded), Campaign.advance(game));
  assert.deepEqual(Campaign.load(device), archive);
});

test("one school network supports distinct food and industrial paths", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme, programmeQuote } = await import("./src/programmes.js");
  const plan = ["skills", "food", "trade", "applied"];
  const choices = ["skills", "settlement", "district", "unified"];
  function year(game) {
    let decision = Campaign.nextDecision(game);
    while (decision) {
      const choice = choices.find((key) => decision.choices[key]);
      assert.ok(choice, decision.title);
      const updated = Campaign.decide(game, choice);
      assert.notEqual(updated, game);
      game = updated;
      decision = Campaign.nextDecision(game);
    }
    if (Campaign.grantOffers(game).length) game = Campaign.acceptGrant(game, "standard");
    const next = plan.find((id) => !programmeQuote(game, id).reason);
    if (next) game = approveProgramme(game, next);
    const resolved = Campaign.advance(game);
    assert.equal(resolved.year, game.year + 1);
    return resolved;
  }

  let shared = Campaign.newGame(1949, { end: 1965, preset: "light" });
  while (shared.year < 1954) shared = year(shared);
  function finish(id) {
    let game = Campaign.adoptTraining(shared, id);
    assert.equal(game.cash, shared.cash - 18);
    assert.equal(Campaign.training(game).status, "preparing");
    assert.equal(Campaign.adoptTraining(game, "extension"), game);
    const data = new Map();
    const device = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
    Campaign.save(device, game);
    assert.deepEqual(year(Campaign.load(device, true)), year(game));
    while (game.year <= 1965) game = year(game);
    return game;
  }

  const rural = finish("extension");
  const industry = finish("apprenticeships");
  assert.equal(Campaign.score(rural).secureYears, 5);
  assert.equal(Campaign.score(industry).secureYears, 3);
  assert.equal(industry.reports.at(-1).output - rural.reports.at(-1).output, 12);
  assert.ok(industry.cash > rural.cash);
  assert.ok(rural.reports.some(({ regional }) => regional?.developments?.some(({ status }) => status === "open")));
});

test("a freight terminal requires both market links and industry", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme, programmeQuote, programmes } = await import("./src/programmes.js");
  const complete = (id) => programmes[id].works.map(({ kind, hex }) => ({
    id: `${hex}:${kind}`, kind, hex, remaining: 0, completed: 1958, programme: id,
  }));
  const initial = Campaign.newGame(undefined, { end: 1965, preset: "light" });
  const industry = { ...initial, year: 1960, cash: 200, assets: complete("applied") };
  const terminal = "tradeFreightTerminal";
  assert.match(programmeQuote(industry, terminal).reason, /Market Corridor/);
  assert.equal(approveProgramme(industry, terminal), industry);
  const connected = { ...industry, assets: [...industry.assets, ...complete("trade")] };
  const funded = approveProgramme(connected, terminal);
  assert.equal(funded.cash, connected.cash - programmes[terminal].cost);
  assert.match(programmeQuote(funded, "food").reason, /delivering another programme/);
  assert.equal(programmeQuote({ ...connected, journey: undefined }, terminal).reason, "Available in a founding campaign.");
});

test("joint reserves precede capped purchases and both sides pay once", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const game = Campaign.newGame(1946, { end: 1965, preset: "light" });
  const context = {
    ...game, year: 1954, cash: 60, reserve: 0, population: 45,
    journey: { ...game.journey, partners: { up: { reserve: 12, cash: 35,
      works: { storage: { started: 1950, completionYear: 1952, opened: 1952, cost: 7 } },
    } } },
  };
  const compact = Campaign.signPartnerOffer(context, "up:supply");
  const offer = Campaign.jointProjectOffers(compact).find(({ partner }) => partner === "up");
  assert.equal(offer.reason, null);
  const funded = Campaign.fundJointProject(compact, offer.id);
  assert.equal(funded.cash, compact.cash - offer.playerCost);
  assert.equal(funded.journey.partners.up.cash, 35 - offer.partnerCost);
  assert.equal(Campaign.fundJointProject(funded, offer.id), funded);
  const built = Campaign.advance(funded);
  assert.equal(built.reports.at(-1).regional.emergencyFood, 0);
  const plan = Campaign.authorizeRelief(built, 4);
  const resolved = Campaign.advance(plan);
  const report = resolved.reports.at(-1);
  assert.equal(report.regional.emergencyFood, 2);
  assert.equal(report.shortage, report.demand - report.harvest - report.fromReserve - report.regional.emergencyFood - report.bought);
  assert.equal(report.relief.spent, report.bought * report.buyPrice);
  assert.ok(report.relief.spent <= 4);
  assert.equal(resolved.relief, undefined);
  assert.equal(resolved.policy, "hold");
});

test("a connected terminal wins freight without changing signed payments", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const initial = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  const exchange = { reserve: 12, cash: 30, works: { freight: { opened: 1955, completionYear: 1955 } } };
  const operating = (kind, hex) => ({ id: `${hex}:${kind}`, kind, hex, remaining: 0, completed: 1956 });
  const game = {
    ...initial, year: 1958, cash: 100, assets: [operating("mill", "hex-6-6"), operating("road", "hex-6-5")],
    journey: { ...initial.journey, partners: { up: exchange, bengal: exchange }, agreements: { up: { kind: "corridor", title: "Market corridor agreement" } } },
  };
  const baseline = Campaign.advance(game).reports.at(-1);
  const improved = Campaign.advance({ ...game, assets: [...game.assets, operating("freightTerminal", "hex-6-6")] }).reports.at(-1);
  const competition = improved.regional.freightCompetition;
  const domestic = improved.regional.nationalMarket;
  assert.ok(domestic.nodes.some(({ id, local }) => id === "punjab" && !local));
  assert.ok(!domestic.nodes.some(({ id }) => id === "bihar" || id === "eastBengal"));
  assert.ok(competition.player.loads > baseline.regional.freightCompetition.player.loads);
  assert.equal(competition.served, competition.player.loads + [...competition.partners, ...(competition.inland ?? [])].reduce((sum, rival) => sum + rival.loads, 0));
  assert.equal(competition.demand, competition.served + competition.unserved);
  assert.equal(improved.regionalCash, baseline.regionalCash);
  assert.equal(improved.income, improved.tax + improved.baselineTransfers + improved.regionalCash + competition.player.earnings);
  for (const row of improved.regional.partners) {
    assert.equal(row.cash, row.openingCash + 1 + row.freight + row.competitionCash - row.developmentSpend +
      row.sold * improved.buyPrice - row.bought + (row.national?.sold ?? 0) - (row.national?.bought ?? 0));
  }
  const light = Campaign.advance({ ...game, journey: { ...game.journey, preset: "light" } }).reports.at(-1);
  assert.equal(light.regional.freightCompetition, undefined);
  assert.equal(light.regional.nationalMarket, undefined);
});

test("Bihar's flood plan previews delivered irrigation and real emergency needs", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const opening = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  const trade = approveProgramme(opening, "trade");
  const food = approveProgramme(opening, "food");
  const tradePlan = Campaign.foodPlan(trade);
  const foodPlan = Campaign.foodPlan(food);
  assert.equal(foodPlan.outlook, "Flood risk elevated");
  assert.deepEqual(tradePlan.cases.map(({ gap }) => gap), [0, 6]);
  assert.deepEqual(foodPlan.cases.map(({ gap }) => gap), [0, 2]);
  const authorized = Campaign.authorizeRelief(food, 4);
  assert.equal(Campaign.foodPlan(authorized).authorization, 4);
  const next = Campaign.advance(authorized);
  const report = next.reports.at(-1);
  const flood = foodPlan.cases[1];
  assert.equal(report.monsoon, "Severe flood");
  assert.equal(report.demand, foodPlan.demand);
  assert.equal(report.harvest, flood.harvest);
  assert.equal(report.fromReserve, flood.reserveUsed);
  assert.equal(report.shortage + report.bought + report.regional.emergencyFood, flood.gap);
  assert.deepEqual(report.attribution.food.floodSites, [{ hex: "hex-5-4", lost: 2, protected: 0 }]);
  assert.equal(Campaign.foodPlan(next).authorization, 0);
});

test("inland exchanges win existing orders, collect their revenue once and invest in loading yards", async () => {
  const { settleFreight, settleNationalTrade } = await import("./src/interregional.js");
  const game = { year: 1959, seed: 1946, journey: { end: 1965, preset: "standard" } };
  const market = {
    nodes: [
      { id: "up", name: "Uttar Pradesh", local: true, cash: 10 },
      { id: "central", name: "Madhya Pradesh", local: false, cash: 20, shortage: 0 },
      { id: "delhi", name: "Delhi", local: false, cash: 5, shortage: 2 },
    ],
    links: [
      { from: "up", to: "central", capacity: 3 }, { from: "up", to: "delhi", capacity: 3 },
    ],
  };
  const partners = { up: { cash: 10 }, central: { cash: 20, works: { freight: { opened: 1955 } } },
    delhi: { cash: 5, works: { freight: { opened: 1955 } } } };
  const initial = { partners, freight: { towns: 3, workshops: 1, terminals: 0, partners: [{ id: "up", name: "Uttar Pradesh", capacity: 3 }] },
    report: { partners: [{ id: "up", cash: 10 }], nationalMarket: market } };
  const linked = settleFreight(initial, game);
  const { inland, player, served } = linked.report.freightCompetition;
  assert.deepEqual(inland, [{ id: "central", name: "Madhya Pradesh", via: "Uttar Pradesh", capacity: 2, loads: 2, earnings: 2 }]);
  assert.equal(served, player.loads + linked.report.freightCompetition.partners[0].loads + inland[0].loads);
  assert.equal(linked.partners.central.cash, 22);
  assert.equal(linked.report.nationalMarket.nodes[1].cash, 22);
  assert.equal(linked.report.nationalMarket.nodes[1].freight, 2);
  assert.equal(initial.partners.central.cash, 20);

  const next = settleNationalTrade(linked, { ...game, year: 1960 }, { key: "bihar" });
  assert.equal(next.partners.central.works.loadingYard.started, 1960);
  assert.equal(next.partners.central.works.loadingYard.completionYear, 1962);
});

test("domestic shortages are filled through finite routes and freight demand uses shipments through neighbors", async () => {
  const { clearNationalMarket, seedBombayDivision } = await import("./src/national-market.js");
  const { competitiveFreight } = await import("./src/neighbor-competition.js");
  const game = { year: 1968, journey: { preset: "standard" } };
  const opening = {
    punjab: { reserve: 14, cash: 8, shortage: 0 },
    delhi: { reserve: 0, cash: 8, shortage: 6 },
    up: { reserve: 6, cash: 8, shortage: 0 },
    madras: { reserve: 9, cash: 8, shortage: 0 },
    kerala: { reserve: 0, cash: 4, shortage: 3 },
  };
  const ids = Object.keys(opening).map((id) => ({ id, name: id, market: id }));
  const { market, flows } = clearNationalMarket(game, opening, ids, ["up"]);
  assert.deepEqual(flows.delhi, { bought: 6, sold: 0 });
  assert.deepEqual(flows.kerala, { bought: 2, sold: 0 });
  assert.equal(market.units, 8);
  assert.equal(market.localUnits, 1);
  assert.ok(market.links.every(({ units, capacity }) => units <= capacity));
  for (const { id, cash, reserve, shortage } of market.nodes) {
    const prior = opening[id];
    const { bought, sold } = flows[id];
    assert.equal(cash, prior.cash + sold - bought);
    assert.equal(reserve - shortage, prior.reserve - prior.shortage + bought - sold);
  }
  const freight = { towns: 4, workshops: 1, terminals: 0, partners: [{ id: "up", capacity: 3 }] };
  const normal = competitiveFreight(game, freight);
  assert.equal(competitiveFreight(game, { ...freight, linkedLoads: market.localUnits }).demand, normal.demand + 1);

  const foreignBombay = { cash: 41, reserve: 11, works: { freight: { opened: 1959 }, storage: { opened: 1958 } } };
  const divided = seedBombayDivision({ bombay: foreignBombay }, { year: 1960 }, { key: "bihar" });
  assert.equal(divided.bombay, undefined);
  assert.equal(divided.maharashtra.cash + divided.gujarat.cash, foreignBombay.cash);
  assert.equal(divided.maharashtra.reserve + divided.gujarat.reserve, foreignBombay.reserve);
  assert.deepEqual({ ...divided.maharashtra.works, ...divided.gujarat.works }, foreignBombay.works);
});

test("domestic routes follow Partition and the first southern reorganizations", async () => {
  const { clearNationalMarket, nationalMarketActive, nationalMarketActors, seedSouthernTransitions } = await import("./src/national-market.js");
  const world = { key: "bihar" };
  const market = (year) => {
    const game = { year, journey: { preset: "standard" } };
    const ids = nationalMarketActors(game, world);
    const partners = Object.fromEntries(ids.map((id) => [id, { reserve: 5, cash: 8, shortage: 0 }]));
    assert.equal(nationalMarketActive(game), true);
    return clearNationalMarket(game, partners, ids.map((id) => ({ id })), []).market;
  };
  const hasRoute = (network, from, to) => network.links.some((link) => link.from === from && link.to === to);
  const hasActor = (network, id) => network.nodes.some((node) => node.id === id);
  assert.ok(hasRoute(market(1946), "bengal", "assam"));
  assert.ok(hasActor(market(1947), "assam"));
  assert.ok(!hasRoute(market(1947), "bengal", "assam"));
  assert.ok(hasRoute(market(1950), "bengal", "assam"));
  assert.ok(hasRoute(market(1952), "orissa", "madras"));
  assert.ok(!hasActor(market(1952), "andhra"));
  assert.ok(hasRoute(market(1953), "andhra", "madras"));
  assert.ok(hasRoute(market(1953), "hyderabad", "andhra"));
  assert.ok(!hasActor(market(1956), "hyderabad"));
  assert.ok(hasRoute(market(1956), "madras", "kerala"));

  const initial = { madras: { cash: 150, reserve: 12, works: { storage: { opened: 1952 } } }, mysore: { cash: 12 } };
  const divided = seedSouthernTransitions(initial, { year: 1953 }, world);
  assert.equal(divided.andhra.cash, 54);
  assert.equal(divided.madras.cash, 94);
  assert.equal(divided.mysore.cash, 14);
  assert.equal(divided.andhra.reserve + divided.madras.reserve, initial.madras.reserve);
  assert.deepEqual(divided.andhra.works.storage, initial.madras.works.storage);
  assert.equal(seedSouthernTransitions(divided, { year: 1953 }, world), divided);
  const coast = { cash: 11, reserve: 4, works: {} };
  const reorganized = seedSouthernTransitions({ travancore: coast }, { year: 1956 }, world);
  assert.deepEqual(reorganized, { kerala: coast });
});
