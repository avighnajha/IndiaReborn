const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=assam" };

test("Assam recovers rail access and keeps developing through its territorial changes", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { campaignCapital } = await import("./src/journey.js");
  const { briefContent } = await import("./src/annual-brief.js");
  const { approveProgramme, programmeQuote, programmeCommissioned, basinFloodDecision, respondToBasinFlood } = await import("./src/programmes.js");
  const { sylhet, nagaland, meghalaya, mizoram } = World.assamTransition;
  const schedule = { 1946: "food", 1948: "trade", 1950: "assamRailLink", 1953: "skills", 1956: "brahmaputra", 1959: "industry" };
  const choices = ["roads", "assamRiverRelief", "district", "assamRepairBanks", "assamNagaTransition", "assamCrossBorder", "extension", "ration", "assamMoveOffice"];

  function decide(game, choice) {
    const result = Campaign.decide(game, choice);
    assert.notEqual(result, game, `${game.year}: ${choice}`);
    assert.deepEqual(result.assets.slice(0, game.assets.length), game.assets);
    return result;
  }

  function advance(game) {
    if (basinFloodDecision(game)) game = respondToBasinFlood(game, "repair");
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    const report = next.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    return next;
  }

  const branchResults = [];
  for (const [terms, end, preset] of [["focused", 1965, "light"], ["union", 1985, "standard"]]) {
    let game = Campaign.newGame(1946, { end, preset });
    assert.equal(game.cash, 49);
    assert.equal(Campaign.finance(game).total, 3);
    assert.equal(World.tiles[campaignCapital(game)].town.name, "Shillong");
    assert.ok([...sylhet, ...nagaland, ...meghalaya, ...mizoram].every((hex) => game.owners[hex] === "assam"));
    for (let year = 1946; year <= end; year++) {
      const programme = schedule[year];
      if (programme) {
        assert.equal(programmeQuote(game, programme, terms).reason, undefined, `${year}: ${programme}`);
        game = approveProgramme(game, programme, terms);
      }
      let decision;
      while ((decision = Campaign.nextDecision(game))) {
        const choice = choices.find((id) => decision.choices[id]);
        assert.ok(choice, decision.title);
        if (decision.id === "assam-earthquake") {
          const repair = advance(decide(game, "assamRepairBanks")).reports.at(-1);
          const relief = advance(decide(game, "assamFoodRelief")).reports.at(-1);
          assert.equal(repair.harvest - relief.harvest, 4);
          assert.equal(relief.assam.earthquakeLoss, 6);
          assert.ok(briefContent(repair).includes("Bank repairs prevented 4 units"));
        }
        game = decide(game, choice);
      }
      if (year === 1947) assert.ok(sylhet.every((hex) => game.owners[hex] === "eastBengal"));
      if (year === 1958) assert.ok(nagaland.every((hex) => game.owners[hex] === "nagaHills"));
      if (year === 1963) {
        assert.ok(nagaland.every((hex) => game.owners[hex] === "nagaland"));
        assert.equal(game.journey.agreements.nagaland.kind, "corridor");
      }
      if (year === 1972) {
        assert.ok(meghalaya.every((hex) => game.owners[hex] === "meghalaya"));
        assert.ok(mizoram.every((hex) => game.owners[hex] === "mizoram"));
        assert.equal(Campaign.finance(game).total, 58);
      }
      if (year === 1973) {
        assert.equal(World.tiles[campaignCapital(game)].town.name, "Dispur");
        const memory = new Map();
        const storage = { getItem: (key) => memory.get(key), setItem: (key, value) => memory.set(key, value) };
        Campaign.save(storage, game);
        assert.deepEqual(Campaign.load(storage, true), game);
      }
      game = advance(game);
      const report = game.reports.at(-1);
      if (year === 1947) assert.equal(report.assam.railCapacity, -2);
      if (year === 1952) assert.equal(report.assam.railCapacity, 2);
      if (year === 1965) branchResults.push(report);
    }
    assert.ok(programmeCommissioned(game, "brahmaputra"));
    assert.equal(Campaign.score(game).latest.year, end);
    assert.ok(Campaign.score(game).latest.assam.teaOutput > 0);
    const { output, siteEconomy, assam } = Campaign.score(game).latest;
    assert.equal(siteEconomy.workshops.reduce((total, site) => total + site.output, 0), output);
    assert.equal(siteEconomy.workshops.reduce((total, site) => total + site.rail, 0), assam.teaOutput);
  }
  assert.ok(branchResults[0].harvest > branchResults[1].harvest);
  assert.equal(branchResults[1].development.importCapacity, 3);
});
