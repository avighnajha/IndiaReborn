const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=central" };

const schedule = { 1946: "food", 1948: "trade", 1950: "skills", 1952: "industry", 1955: "centralBerarCotton", 1957: "chambal",
  1962: "tradeFreightTerminal", 1964: "educationColleges", 1966: "educationUniversity", 1968: "tradeIndustrialPark" };
const choices = ["roads", "centralReceiveFamilies", "centralDistrictSchool", "district", "centralNagpurCorridor", "centralBhilaiSuppliers",
  "centralMaharashtra", "extension", "ration"];

test("the 1956 technical intake matches retained schools and delivers timed workshop output", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const { siteResults } = await import("./src/site-economy.js");
  const programmes = { 1946: "skills", 1948: "applied", 1951: "food", 1953: "trade" };
  let game = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  while (game.year < 1956) {
    if (game.year === 1950) {
      assert.equal(Campaign.technicalIntake(game).status, "notice");
      assert.equal(Campaign.acceptTechnicalIntake(game, 1), game);
    }
    while (Campaign.nextDecision(game)) {
      const decision = Campaign.nextDecision(game);
      const next = Campaign.decide(game, choices.find((id) => decision.choices[id]));
      assert.notEqual(next, game, decision.title);
      game = next;
    }
    if (programmes[game.year]) {
      const approved = approveProgramme(game, programmes[game.year]);
      assert.notEqual(approved, game);
      game = approved;
    }
    const next = Campaign.advance(game);
    assert.notEqual(next, game);
    game = next;
  }
  assert.equal(Campaign.acceptTechnicalIntake(game, 1), game);
  game = Campaign.decide(game, "centralNagpurCorridor");
  assert.ok(!Campaign.nextDecision(game));
  const plan = Campaign.technicalIntake(game);
  assert.deepEqual(plan.pairs.map(({ school, workshop }) => [school.name, workshop.name]), [["Jubbulpore", "Jubbulpore"], ["Itarsi", "Hoshangabad"]]);
  assert.equal(Campaign.acceptTechnicalIntake(game, 3), game);
  const smallTreasury = { ...game, cash: 7 };
  assert.equal(Campaign.acceptTechnicalIntake(smallTreasury, 1), smallTreasury);
  let signed = Campaign.acceptTechnicalIntake(game, 2);
  assert.equal(signed.cash, game.cash - 16);
  assert.equal(Campaign.acceptTechnicalIntake(signed, 1), signed);
  let snapshot;
  const storage = { getItem: () => snapshot, setItem: (_key, value) => { snapshot = value; } };
  Campaign.save(storage, signed);
  assert.deepEqual(Campaign.load(storage, true), signed);

  while (game.year <= 1965) {
    while (Campaign.nextDecision(game)) {
      const decision = Campaign.nextDecision(game);
      const id = choices.find((choice) => decision.choices[choice]);
      const next = Campaign.decide(game, id);
      assert.notEqual(next, game, decision.title);
      game = next;
      signed = Campaign.decide(signed, id);
    }
    game = Campaign.advance(game);
    const before = signed;
    signed = Campaign.advance(signed);
    const baseline = game.reports.at(-1);
    const report = signed.reports.at(-1);
    assert.equal(report.year, baseline.year);
    const intake = report.technicalIntake;
    const operating = report.year >= 1958 && report.year <= 1962;
    assert.equal(intake.skills, report.year >= 1958 ? 4 : 0);
    assert.equal(intake.output, operating ? 6 : 0);
    assert.equal(report.skills - baseline.skills, intake.skills);
    assert.equal(report.output - baseline.output, intake.output + intake.skillOutput);
    assert.equal(intake.receipts, Campaign.earnedReceipts(report).workshops - Campaign.earnedReceipts(baseline).workshops);
    if (report.year === 1957) assert.equal(Campaign.technicalIntake(game), null);
    if (report.year === 1958) {
      assert.match(briefContent(report), /Placements added 6 output/);
      for (const { hex } of intake.sites) {
        assert.deepEqual(siteResults(report, hex).workshopEffects.find(({ label }) => label === "technical training intake"), { label: "technical training intake", units: 3 });
      }
      const { school, workshop } = signed.journey.technicalIntake.pairs[1];
      const transfer = { ...before, owners: { ...before.owners, [school]: "neighbor" } };
      const after = Campaign.advance(transfer).reports.at(-1);
      assert.equal(after.technicalIntake.skills, 2);
      assert.ok(!after.technicalIntake.sites.some(({ hex }) => hex === workshop));
    }
    if (report.year === 1963) assert.match(briefContent(report), /Technical placements ended/);
  }
});

test("Central Provinces develops through the Vidarbha transfer and both Chambal allocations", async () => {
  const { economySites, siteResults } = await import("./src/site-economy.js");
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { campaignCapital, campaignName } = await import("./src/journey.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const { developmentTrees } = await import("./src/department-tree.js");
  const { approveProgramme, programmeQuote, programmeCommissioned } = await import("./src/programmes.js");
  const { accession, departure, expansion } = World.centralTransition;
  const results = [];

  for (const [terms, end, preset] of [["focused", 1965, "light"], ["union", 1985, "standard"]]) {
    let game = Campaign.newGame(1946, { end, preset });
    assert.equal(game.cash, 77);
    assert.equal(World.tiles[campaignCapital(game)].town.name, "Nagpur");
    assert.ok(departure.every((hex) => game.owners[hex] === "central"));
    assert.ok([...accession, ...expansion].every((hex) => game.owners[hex] !== "central"));
    assert.equal(developmentTrees(game).length, 3);
    for (let year = 1946; year <= end; year++) {
      let decision;
      while ((decision = Campaign.nextDecision(game))) {
        const choice = choices.find((id) => decision.choices[id]);
        assert.ok(choice, decision.title);
        const before = game;
        game = Campaign.decide(game, choice);
        assert.notEqual(game, before, choice);
        assert.deepEqual(game.assets.slice(0, before.assets.length), before.assets);
        if (year === 1956) {
          const transfer = game.journey.partners.bombay.cash - (before.journey.partners.bombay?.cash ?? 0);
          assert.equal(transfer, Math.floor(before.cash * 0.3580198228189597));
          assert.equal(game.cash, before.cash - transfer - decision.priced[choice]);
          assert.ok(game.assets.some(({ hex, remaining }) => departure.includes(hex) && remaining > 0));
          assert.ok(expansion.every((hex) => game.owners[hex] === "central"));
          assert.ok(departure.every((hex) => game.owners[hex] === "bombay"));
          assert.ok(economySites(before).some(({ hex }) => departure.includes(hex)));
          assert.ok(economySites(game).every(({ hex }) => !departure.includes(hex)));
          assert.equal(World.tiles[campaignCapital(game)].town.name, "Bhopal");
          assert.equal(Campaign.finance(game).historic.name, "Madhya Pradesh");
          const memory = new Map();
          const storage = { getItem: (key) => memory.get(key), setItem: (key, value) => memory.set(key, value) };
          Campaign.save(storage, game);
          assert.deepEqual(Campaign.load(storage, true), game);
        }
      }
      if (year === 1948) assert.ok(accession.every((hex) => game.owners[hex] === "central"));
      if (year === 1950) assert.equal(campaignName(game), "Madhya Pradesh");
      if (year === 1957) assert.equal(Campaign.outlook(game), "Dry-season risk elevated");
      if (year === 1960) {
        assert.ok(departure.every((hex) => game.owners[hex] === "maharashtra"));
        assert.equal(game.journey.agreements.maharashtra.title, "Nagpur freight agreement");
        assert.equal(game.journey.agreements.bombay, undefined);
      }
      const programme = schedule[year];
      if (programme) {
        const quote = programmeQuote(game, programme, terms);
        assert.equal(quote.reason, undefined, `${year}: ${programme} · ${quote.reason ?? ""}`);
        game = approveProgramme(game, programme, terms);
      }
      const next = Campaign.advance(game);
      assert.equal(next.year, year + 1);
      const report = next.reports.at(-1);
      assert.equal(report.siteEconomy.workshops.reduce((total, site) => total + site.output, 0), report.output);
      if (year === 1949) {
        const workshop = siteResults(report, "hex-13-10");
        assert.equal(workshop.output, 7);
        assert.deepEqual(workshop.workshopEffects, [{ label: "base production", units: 3 }, { label: "market access", units: 4 }]);
        assert.equal(siteResults({ ...report, siteEconomy: undefined }, "hex-13-10").output, null);
      }
      assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
      assert.equal(Campaign.earnedReceipts(report).total,
        report.income - Campaign.finance(game).total + report.bought * report.buyPrice);
      if (year === 1956) {
        assert.ok(report.regional.partners.find(({ id }) => id === "bombay").inherited.workshops > 0);
        const brief = briefContent(report, game.reports.at(-1));
        assert.match(brief, /Earned receipts/);
        assert.match(brief, /Planning commitments and grants/);
      }
      if (year === 1957) {
        assert.equal(report.monsoon, "Dry monsoon");
        const plan = Campaign.foodPlan(game);
        assert.equal(plan.cases[1].harvest, report.harvest);
        assert.equal(plan.cases[1].reserveUsed, report.fromReserve);
      }
      if (year === 1959) {
        assert.ok(report.bhilai.output > 0);
        assert.match(briefContent(report), /Bhilai supplier contracts/);
      }
      if (year === 1960) assert.ok(report.regional.partners.find(({ id }) => id === "maharashtra").inherited.workshops > 0);
      if (year === 1961) {
        assert.match(briefContent(report, game.reports.at(-1)), /Chambal allocation|Powered irrigation/);
        if (preset === "standard") {
          const award = report.regional.freightContract;
          const rival = report.regional.partners.find(({ id }) => id === award.winner.id);
          assert.equal(award.winner.id, "maharashtra");
          assert.equal(rival.contractCash, 6);
          assert.equal(report.regional.nationalMarket.nodes.find(({ id }) => id === rival.id).cash, rival.cash);
          assert.equal(rival.cash, rival.openingCash + rival.funding.allocation + rival.freight + rival.competitionCash + rival.contractCash +
            rival.inherited.receipts - rival.inherited.upkeepPaid - rival.developmentSpend + rival.sold * report.buyPrice - rival.bought +
            (rival.national?.sold ?? 0) - (rival.national?.bought ?? 0));
          assert.equal(Campaign.earnedReceipts(report).contract, 0);
        } else {
          assert.equal(report.regional.freightContract, undefined);
        }
        results.push(report.chambal);
      }
      game = next;
    }
    assert.ok(programmeCommissioned(game, "chambal"));
    assert.equal(Campaign.score(game).latest.year, end);
  }
  assert.deepEqual(results[0], { agreement: "focused", allocation: "irrigation", food: 4, output: 0 });
  assert.equal(results[1].allocation, "industry");
  assert.equal(results[1].food, 0);
  assert.ok(results[1].output >= 4);
});

test("Madhya Pradesh can prioritize engineering and Itarsi to win the 1961 freight contract", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const plans = { ...schedule, 1957: "applied", 1960: "tradeFreightTerminal", 1962: undefined };
  let game = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  for (let year = 1946; year <= 1965; year++) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const next = Campaign.decide(game, choices.find((id) => decision.choices[id]));
      assert.notEqual(next, game, decision.title);
      game = next;
    }
    if (plans[year]) {
      const next = approveProgramme(game, plans[year]);
      assert.notEqual(next, game, plans[year]);
      game = next;
    }
    if (year === 1957) assert.equal(Campaign.freightContract(game).upcoming.start, 1961);
    if (year === 1961) {
      const forecast = Campaign.freightContract(game).upcoming;
      assert.equal(forecast.projectedCapacity, forecast.playerCapacity + 3);
      assert.deepEqual(forecast.rival, { name: "Maharashtra", capacity: 8 });
    }
    const next = Campaign.advance(game);
    const report = next.reports.at(-1);
    assert.equal(Campaign.earnedReceipts(report).total,
      report.income - Campaign.finance(game).total + report.bought * report.buyPrice);
    if (year >= 1961) {
      const award = report.regional.freightContract;
      assert.deepEqual([award.winner.id, award.payment, award.awarded], ["player", 6, year === 1961]);
      assert.equal(Campaign.earnedReceipts(report).contract, 6);
    }
    if (year === 1961) {
      assert.match(briefContent(report), /Your administration won with bid capacity 11/);
      let saved;
      const storage = { getItem: () => saved, setItem: (_key, data) => { saved = data; } };
      Campaign.save(storage, next);
      assert.deepEqual(Campaign.advance(Campaign.load(storage, true)), Campaign.advance(next));
      const separated = { ...next, assets: next.assets.filter(({ kind }) => kind !== "mill") };
      const suspended = Campaign.advance(separated).reports.at(-1);
      assert.equal(suspended.regional.freightContract.payment, 0);
      assert.equal(suspended.regional.freightContract.winner.id, "player");
      assert.match(briefContent(suspended, report), /Payment suspended/);
    }
    game = next;
  }
  assert.equal(Campaign.freightContract(game).upcoming, null);
  assert.equal(game.reports.reduce((total, report) => total + Campaign.earnedReceipts(report).contract, 0), 30);
});

test("the 1957 reserve offer commits to one floor and accounts for shipments and relief", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const { briefContent } = await import("./src/annual-brief.js");

  function play(seed, choice, programmes, policy = "hold") {
    let game = { ...Campaign.newGame(seed, { end: 1965, preset: "standard" }), policy };
    const results = {};
    for (let year = 1946; year <= 1961; year++) {
      let decision;
      while ((decision = Campaign.nextDecision(game))) {
        const decided = Campaign.decide(game, choices.find((key) => decision.choices[key]));
        assert.notEqual(decided, game, decision.title);
        game = decided;
      }
      if (programmes[year]) {
        const approved = approveProgramme(game, programmes[year]);
        assert.notEqual(approved, game, programmes[year]);
        game = approved;
      }

      const forecast = year === 1957 ? Campaign.unionReserve(game) : null;
      if (forecast) {
        assert.equal(forecast.status, "open");
        assert.equal(Campaign.acceptUnionReserve(game, "invalid"), game);
        const signed = Campaign.acceptUnionReserve(game, choice);
        assert.equal(signed === game, !forecast.capacity);
        game = signed;
        assert.equal(Campaign.acceptUnionReserve(game, "buffer"), game);
        const record = new Map();
        const device = { getItem: (key) => record.get(key), setItem: (key, value) => record.set(key, value) };
        Campaign.save(device, game);
        assert.deepEqual(Campaign.load(device, true), game);
      } else {
        assert.equal(Campaign.acceptUnionReserve(game, choice), game);
      }

      const next = Campaign.advance(game);
      assert.equal(next.year, year + 1);
      const report = next.reports.at(-1);
      const union = report.unionReserve;
      results[year] = report;
      if (union) {
        assert.equal(union.closing, union.opening + union.shipped - union.released);
        assert.equal(union.proceeds, union.shipped * 2);
        assert.equal(union.closing, next.journey.unionReserve.stock);
        assert.equal(report.demand - report.shortage, Math.min(report.harvest, report.demand) + report.fromReserve +
          (report.regional?.emergencyFood ?? 0) + union.released + report.bought);
        assert.equal(Campaign.earnedReceipts(report).total,
          report.income - Campaign.finance(game).total + report.bought * report.buyPrice);
        if (union.shipped) assert.ok(report.reserve >= union.floor && !union.released);
        if (forecast && policy === "hold") {
          const { projections } = forecast.offers.find(({ id }) => id === choice);
          const dry = projections.find(({ name }) => name === "If the monsoon is dry");
          assert.deepEqual([dry.shipped, dry.proceeds, dry.reserve], [union.shipped, union.proceeds, report.reserve]);
        }
      }
      game = next;
    }
    assert.equal(results[1961].unionReserve, undefined);
    return results;
  }

  const supply = play(69, "supply", { 1946: "food" });
  const buffer = play(69, "buffer", { 1946: "food" });
  assert.deepEqual([supply[1957].unionReserve.shipped, supply[1957].reserve], [5, 4]);
  assert.deepEqual([buffer[1957].unionReserve.shipped, buffer[1957].reserve], [0, 9]);
  assert.equal(supply[1958].unionReserve.released, 2);
  assert.equal(buffer[1958].unionReserve.released, 0);
  assert.match(briefContent(supply[1958]), /Received 2 units after state and shared reserves/);
  assert.deepEqual([supply[1959].shortage, buffer[1959].shortage], [4, 1]);

  const late = play(1946, "supply", { 1946: "trade", 1956: "food" }, "export");
  assert.deepEqual([late[1958].unionReserve.shipped, late[1958].sold, late[1958].reserve], [6, 6, 4]);
  const unqualified = play(1946, "supply", { 1946: "trade" });
  assert.equal(unqualified[1957].unionReserve, undefined);
});
