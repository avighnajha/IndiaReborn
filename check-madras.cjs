const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=madras" };

test("Andhra Pradesh can distribute harvest surplus and replenish distant reserves in the 1982 drought", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme, basinFloodDecision, respondToBasinFlood } = await import("./src/programmes.js");
  const { decodeSave, encodeSave } = await import("./src/save-codec.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const { lateDroughtSeverity } = await import("./src/food-crisis.js");
  const programme = new Map([[1946, "food"], [1948, "trade"], [1956, "krishna"], [1959, "ap_foodDepot"],
    [1961, "ap_foodWaterNetwork"], [1967, "ap_nagarjunaCanals"]]);
  function advance(game) {
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    return next;
  }

  let game = Campaign.newGame(1946, { end: 1985, preset: "standard" });
  while (game.year < 1981) {
    for (let decision; (decision = Campaign.nextDecision(game));) {
      const choice = ["andhra", ...Object.keys(decision.choices)].find((id) => decision.choices[id] && Campaign.decide(game, id) !== game);
      assert.ok(choice, decision.title);
      game = Campaign.decide(game, choice);
    }
    if (basinFloodDecision(game)) game = respondToBasinFlood(game, "delay");
    if (programme.has(game.year)) {
      const funded = approveProgramme(game, programme.get(game.year));
      assert.notEqual(funded, game, programme.get(game.year));
      game = funded;
    }
    game = advance(game);
  }
  assert.equal(Campaign.foodPlan(game).dispatch, null);
  const normal = advance(game);
  const prepared = advance(Campaign.chooseCabinetPriority(game, "food"));
  assert.equal(Campaign.foodPlan(normal).dispatch.network, false);
  assert.equal(Campaign.foodPlan(prepared).dispatch.network, true);
  assert.equal(lateDroughtSeverity(prepared, "orissa"), 0);
  assert.ok(lateDroughtSeverity(prepared, "madras") > lateDroughtSeverity(prepared, "andhra"));
  const stored = encodeSave(prepared);
  const forecast = Campaign.distributionComparison(prepared, Campaign.foodPlan(prepared).dispatch);
  assert.equal(encodeSave(prepared), stored, "The comparison does not mutate the current year or its partners");
  const offer = Campaign.pledgeReserve(prepared, true);
  assert.deepEqual(Campaign.pledgeReserve(offer, false), prepared);
  const held = advance(prepared);
  const sent = advance(decodeSave(encodeSave(offer)));
  const report = sent.reports.at(-1);
  const dispatch = report.reserveDispatch;
  const reference = held.reports.at(-1);
  assert.equal(report.foodCrisis, undefined, "The 1960s Union ordering mechanism does not reopen");
  assert.ok(report.lateDrought.loss > 0);
  assert.equal(dispatch.sent, forecast.shared.sent);
  assert.ok(dispatch.covered > 0 && dispatch.restocked > 0);
  assert.equal(dispatch.sent, dispatch.covered + dispatch.restocked);
  assert.equal(report.shortage, reference.shortage);
  assert.ok(report.reserve >= dispatch.floor);
  assert.equal(report.reserve, forecast.shared.reserve);
  assert.ok(report.reserve <= reference.reserve);
  assert.equal(report.regional.freightCompetition.player.capacity,
    reference.regional.freightCompetition.player.capacity - dispatch.freightCapacityUsed);
  for (const delivery of dispatch.deliveries) {
    const before = held.journey.partners[delivery.id];
    const after = sent.journey.partners[delivery.id];
    assert.equal(after.reserve, before.reserve + delivery.restocked);
    assert.equal(after.shortage, before.shortage - delivery.covered);
  }
  const markup = briefContent(report, reference);
  assert.match(markup, /Public distribution results/);
  assert.match(markup, /id="brief-distribution-map"/);
  assert.equal(sent.reserveDispatch, undefined, "The cabinet reviews its offer each year");
});

test("the Pondicherry compact shares the existing railway and stops charging after the term", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { domesticLinks, nationalMarketActors } = await import("./src/national-market.js");
  const { marketFunding } = await import("./src/market-finance.js");
  const { neighborsFor } = await import("./src/interregional.js");
  const { approveProgramme } = await import("./src/programmes.js");

  function resolve(game, preferred = "madras") {
    for (let decision; (decision = Campaign.nextDecision(game));) {
      const choices = [preferred, "roads", "districtRations", "integratePudukkottai", "district", "southernServices", ...Object.keys(decision.choices)];
      const choice = choices.find((id) => decision.choices[id] && (decision.priced[id] ?? 0) <= game.cash);
      assert.ok(choice);
      game = Campaign.decide(game, choice);
    }
    const result = Campaign.advance(game);
    assert.equal(result.year, game.year + 1);
    return result;
  }

  function railYear(seed, programmes = {}) {
    let game = Campaign.newGame(seed, { end: 1965, preset: "standard" });
    while (game.year < 1955) {
      if (programmes[game.year]) game = approveProgramme(game, programmes[game.year]);
      game = resolve(game);
    }
    return game;
  }

  const start = railYear(1946);
  assert.equal(Campaign.nextDecision(start).id, "madras-pondicherry-rail");
  assert.ok(!start.reports.at(-1).regional.nationalMarket.nodes.find(({ id }) => id === "pondicherry"));
  const food = Campaign.decide(start, "pondicherryFood");
  const trade = Campaign.decide(start, "pondicherryTextiles");
  assert.equal(food.cash - trade.cash, 10);
  assert.deepEqual(food.owners, trade.owners);
  assert.equal(Campaign.nextDecision(trade), null);
  assert.equal(neighborsFor(World, food).find(({ id }) => id === "pondicherry").routeCapacity, 3);
  assert.equal(neighborsFor(World, trade).find(({ id }) => id === "pondicherry").routeCapacity, 1);

  let result = trade;
  for (let year = 1955; year <= 1962; year++) {
    const current = result;
    result = resolve(current);
    const report = result.reports.at(-1);
    const { regional } = report;
    const rail = regional.coromandel;
    assert.equal(rail.foodCapacity + Number(year <= 1956) * 2, rail.railCapacity);
    assert.equal(rail.fee, year === 1955 ? 10 : 0);
    assert.equal(rail.textileLoads, year > 1956 ? 0 : report.monsoon === "Severe flood" ? 1 : 2);
    assert.equal(rail.receipt, rail.textileLoads * 4);
    assert.equal(rail.phase, year < 1962 ? "transition" : "union");
    const tradeActivity = rail.settlement.foodBought + rail.settlement.foodSold + rail.settlement.relief;
    assert.ok(tradeActivity <= rail.foodCapacity);
    assert.equal(regional.nationalMarket.nodes.filter(({ id }) => id === "pondicherry").length, 1);
    assert.equal(regional.nationalMarket.links.filter(({ from, to }) => from === "pondicherry" || to === "pondicherry").length, 0);
    assert.deepEqual(regional.nationalMarket.coromandel, rail);
    assert.equal(report.income, report.tax + report.funding.transfers + report.sold - report.bought * report.buyPrice +
      report.regionalCash + (regional.freightCompetition?.player.earnings ?? 0) +
      (regional.freightContract?.winner?.id === "player" ? regional.freightContract.payment : 0) + rail.receipt);
  }
  assert.equal(result.reports.find(({ year }) => year === 1955).regional.nationalMarket.coromandel.fee, 10);
  assert.equal(marketFunding("pondicherry", 1954).reference, null);
  assert.equal(marketFunding("pondicherry", 1955).reference.value, 73.96);
  assert.equal(marketFunding("pondicherry", 1972).reference.value, 348.48);
  assert.equal(marketFunding("pondicherry", 1985).allocation, 17);
  assert.ok(domesticLinks(1954).every((link) => !link.includes("pondicherry")));
  assert.deepEqual(domesticLinks(1955).find((link) => link.includes("pondicherry")), ["madras", "pondicherry", 3, "rail"]);
  assert.ok(nationalMarketActors({ year: 1955, journey: {} }, { key: "bihar" }).includes("pondicherry"));

  const branch = (state, decision) => resolve(Campaign.decide(state, decision)).reports.at(-1);
  const exposed = railYear(1948);
  const assisted = branch(exposed, "pondicherryFood");
  assert.equal(assisted.regional.coromandel.settlement.relief, 1);
  assert.equal(assisted.shortage, 0);
  assert.equal(branch(exposed, "pondicherryTextiles").shortage, 1);
  const surplus = railYear(1951, { 1946: "trade", 1949: "food" });
  const donated = branch(surplus, "pondicherryFood");
  assert.equal(donated.regional.coromandel.settlement.aidSent, 1);
  const shortage = ({ regional }) => regional.partners.find(({ id }) => id === "pondicherry").shortage;
  assert.equal(shortage(donated), 0);
  assert.equal(shortage(branch(surplus, "pondicherryTextiles")), 1);
});

test("Madras and Andhra retain their works, budgets and water or power commitments", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { campaignCapital, campaignName } = await import("./src/journey.js");
  const { developmentTrees } = await import("./src/department-tree.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const { approveProgramme, basinAgreementsFor, basinFloodDecision, programmeCommissioned, programmeQuote, respondToBasinFlood } = await import("./src/programmes.js");

  function advance(game) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const choice = ["roads", "districtRations", "integratePudukkottai", "district", "pondicherryFood", "southernServices", "extension", "ration"].find((id) => decision.choices[id]);
      assert.ok(choice, decision.title);
      game = Campaign.decide(game, choice);
    }
    if (basinFloodDecision(game)) game = respondToBasinFlood(game, "delay");
    const resolved = Campaign.advance(game);
    assert.equal(resolved.year, game.year + 1);
    const report = resolved.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    return resolved;
  }

  function fund(game, id, terms) {
    assert.equal(programmeQuote(game, id, terms).reason, undefined, `${game.year}: ${id}`);
    return approveProgramme(game, id, terms);
  }

  let province = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  assert.equal(province.cash, 51);
  assert.equal(Campaign.finance(province).total, 21);
  assert.equal(campaignName(province), "Madras Province");
  assert.ok(World.madrasTransition.pudukkottai.every((hex) => province.owners[hex] !== World.key));
  const programme = { 1946: "trade", 1949: "food", 1951: "skills" };
  let signed;
  while (province.year < 1953) {
    if (programme[province.year]) province = fund(province, programme[province.year]);
    if (province.year === 1952) signed = advance(Campaign.signBayShipping(province, "trade"));
    province = advance(province);
  }
  assert.ok(World.madrasTransition.pudukkottai.every((hex) => province.owners[hex] === World.key));
  assert.equal(Campaign.nextDecision(province).id, "madras-division");
  assert.equal(signed.journey.bayCharter.port, "madras");
  for (const choice of ["madras", "andhra"]) {
    const division = Campaign.decide(signed, choice);
    assert.notEqual(division.journey.jurisdiction.madrasSuccessor, undefined);
    const report = advance(division).reports.at(-1).regional.maritime;
    assert.equal(report.timber, choice === "madras" ? 1 : 0);
    assert.equal(report.status, choice === "madras" ? "operating" : "transferred");
    assert.equal(report.fee, 0);
  }
  const oldCash = province.cash;
  const mysoreShare = Math.floor(oldCash / 75);
  const andhraShare = Math.floor(oldCash * 27 / 75);
  const shares = { madras: oldCash - andhraShare - mysoreShare, andhra: andhraShare };

  for (const [choice, other, prefix, basin, terms, end] of [
    ["madras", "andhra", "tn_", "cauvery", "focused", 1965],
    ["madras", "andhra", "tn_", "cauvery", "union", 1985],
    ["andhra", "madras", "ap_", "krishna", "union", 1965],
    ["andhra", "madras", "ap_", "krishna", "focused", 1985],
  ]) {
    let game = Campaign.decide({ ...province, journey: { ...province.journey, end } }, choice);
    assert.equal(game.cash, shares[choice]);
    assert.equal(game.journey.partners[other].cash, shares[other]);
    assert.equal(game.journey.partners.mysore.cash - province.journey.partners.mysore.cash, mysoreShare);
    assert.equal(World.tiles[campaignCapital(game)].town.name, choice === "andhra" ? "Kurnool" : "Madras");
    assert.deepEqual(game.assets, province.assets);
    assert.deepEqual(Object.keys(game.owners).filter((hex) => game.owners[hex] === World.key).sort(), [...World.successors[choice].sites].sort());
    assert.ok(programmeCommissioned(game, `${prefix}trade`));
    assert.ok(World.madrasTransition.bellary.every((hex) => game.owners[hex] === "mysore"));
    assert.equal(Campaign.finance(game).historic.revenue, choice === "andhra" ? 1964 : 4286);
    const storageData = new Map();
    const storage = { setItem: (key, value) => storageData.set(key, value), getItem: (key) => storageData.get(key) };
    Campaign.save(storage, game);
    assert.deepEqual(Campaign.load(storage, true), game);

    const terminal = choice === "andhra" ? "ap_tradeFreightTerminal" : "tradeFreightTerminal";
    while (game.year <= end) {
      const candidates = [`${prefix}industry`, ...(game.year >= 1957 ? [basin] : []), terminal];
      const ready = candidates.find((id) => !programmeQuote(game, id, id === basin ? terms : undefined).reason);
      if (ready) game = fund(game, ready, ready === basin ? terms : undefined);
      game = advance(game);
      if (ready === basin) assert.ok(briefContent(game.reports.at(-1), game.reports.at(-2)).includes(basinAgreementsFor(basin)[terms].title));
      if (game.year === 1957) {
        const { telangana, tamil, kanyakumari, kerala, mysore } = World.madrasTransition;
        const retained = choice === "andhra" ? [...World.successors.andhra.sites, ...telangana] : tamil;
        assert.deepEqual(Object.keys(game.owners).filter((hex) => game.owners[hex] === World.key).sort(), [...retained].sort());
        assert.ok(kanyakumari.every((hex) => game.owners[hex] === (choice === "andhra" ? "madrasState" : World.key)));
        assert.ok(kerala.every((hex) => game.owners[hex] === "kerala"));
        assert.ok(mysore.every((hex) => game.owners[hex] === "mysore"));
        assert.equal(World.tiles[campaignCapital(game)].town.name, choice === "andhra" ? "Hyderabad" : "Madras");
        assert.ok(developmentTrees(game).every(({ nodes }) => nodes.every(({ id }) => !id.startsWith(choice === "andhra" ? "tn_" : "ap_"))));
      }
    }
    const last = Campaign.score(game).latest;
    assert.equal(last.year, end);
    assert.equal(last.southernPower.id, basin);
    assert.equal(last.southernPower.food, terms === "focused" ? 4 : 0);
    assert.equal(last.southernPower.output > 0, terms === "union");
    assert.ok(programmeCommissioned(game, terminal));
    assert.ok(last.regional.nationalMarket.nodes.some(({ id, local }) => id === other && local));
    assert.ok(!last.regional.nationalMarket.nodes.some(({ id }) => id === choice));
    if (end === 1985) assert.equal(campaignName(game), choice === "andhra" ? "Andhra Pradesh" : "Tamil Nadu");
  }
});
