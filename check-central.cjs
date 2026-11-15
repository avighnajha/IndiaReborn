const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=central" };

const schedule = { 1946: "food", 1948: "trade", 1950: "skills", 1952: "industry", 1955: "centralBerarCotton", 1957: "chambal",
  1962: "tradeFreightTerminal", 1964: "educationColleges", 1966: "educationUniversity", 1968: "tradeIndustrialPark" };
const choices = ["roads", "centralReceiveFamilies", "centralDistrictSchool", "district", "centralNagpurCorridor", "centralBhilaiSuppliers",
  "centralMaharashtra", "extension", "ration"];

test("Central Provinces develops through the Vidarbha transfer and both Chambal allocations", async () => {
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
      assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
      assert.equal(Campaign.earnedReceipts(report).total,
        report.income - Campaign.finance(game).total + report.bought * report.buyPrice);
      if (year === 1956) {
        assert.ok(report.regional.partners.find(({ id }) => id === "bombay").inherited.workshops > 0);
        const brief = briefContent(report, game.reports.at(-1));
        assert.match(brief, /Earned receipts/);
        assert.match(brief, /Planning commitments and grants/);
      }
      if (year === 1957) assert.equal(report.monsoon, "Dry monsoon");
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
          assert.equal(rival.cash, rival.openingCash + 1 + rival.freight + rival.competitionCash + rival.contractCash +
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
