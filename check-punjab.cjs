const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=punjab" };

test("Punjab plays both Bhakra allocations and both sides of the 1966 division", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { campaignName, campaignCapital } = await import("./src/journey.js");
  const { developmentTrees } = await import("./src/department-tree.js");
  const { approveProgramme, basinFloodDecision, programmeCommissioned, programmeQuote, respondToBasinFlood } = await import("./src/programmes.js");

  function playTurn(game) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const choice = ["roads", "resettlementStores", "districtRelief", "district", "districtServices", "patialaSchool", "integratePepsu", "extension", "ration"]
        .find((key) => decision.choices[key] && (decision.priced[key] ?? 0) <= game.cash);
      assert.ok(choice, decision.title);
      game = Campaign.decide(game, choice);
    }
    if (basinFloodDecision(game)) game = respondToBasinFlood(game, "delay");
    const advanced = Campaign.advance(game);
    assert.equal(advanced.year, game.year + 1);
    const report = advanced.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    return advanced;
  }

  function fund(game, programme, agreement) {
    assert.equal(programmeQuote(game, programme, agreement).reason, undefined, `${game.year}: ${programme}`);
    return approveProgramme(game, programme, agreement);
  }

  let initial = Campaign.newGame(1946, { end: 1970, preset: "standard" });
  assert.equal(initial.cash, 57);
  assert.equal(Campaign.finance(initial).historic.revenue, 2190);
  assert.equal(campaignName(initial), "Eastern Punjab districts");
  assert.ok(World.punjabAccessionSites.every((hex) => initial.owners[hex] !== World.key));
  assert.ok(Campaign.neighbors(initial).some(({ id }) => id === "westPunjab"));
  const earlyPlans = { 1946: "food", 1948: "trade", 1951: "skills" };
  while (initial.year < 1953) {
    if (earlyPlans[initial.year]) initial = fund(initial, earlyPlans[initial.year]);
    initial = playTurn(initial);
    if (initial.year === 1948) {
      assert.equal(campaignName(initial), "East Punjab");
      assert.ok(!Campaign.neighbors(initial).some(({ id }) => id === "westPunjab"));
      assert.equal(Campaign.finance(initial).historic.name, "East Punjab");
    }
  }
  initial = Campaign.decide(initial, "districtServices");
  assert.equal(World.tiles[campaignCapital(initial)].town.name, "Chandigarh");
  initial = playTurn(initial);

  for (const [terms, choice, prefix, other, otherShare, end] of [
    ["focused", "punjab", "pb_", "haryana", .3738, 1970],
    ["union", "haryana", "hr_", "punjab", .5484, 1985],
  ]) {
    let game = fund({ ...initial, journey: { ...initial.journey, end } }, "bhakra", terms);
    const proposed = ["punjabCanalBelt", "punjabCotton", "industry", "applied"];
    while (game.year < 1966) {
      const id = proposed.find((plan) => !programmeQuote(game, plan).reason);
      if (id) game = fund(game, id);
      game = playTurn(game);
    }
    assert.equal(game.journey.events["punjab-enlargement"].year, 1956);
    assert.ok(World.punjabAccessionSites.every((hex) => game.owners[hex] === World.key));
    const previous = game.reports.at(-1);
    assert.equal(previous.bhakra.food, terms === "focused" ? 4 : 0);
    assert.equal(previous.bhakra.output > 0, terms === "union");
    const inheritedAssets = game.assets;
    const treasury = game.cash;
    const reserves = game.reserve;
    const population = game.population;
    assert.equal(Campaign.nextDecision(game).id, "punjab-reorganization");
    game = Campaign.decide(game, choice);
    assert.equal(campaignName(game), World.successors[choice].name);
    assert.equal(Campaign.finance(game).historic.name, World.successors[choice].name);
    assert.equal(game.journey.partners[other].cash, Math.floor(treasury * otherShare));
    assert.equal(game.journey.punjabUnionTransfer.cash, Math.floor(treasury * .0778));
    assert.equal(game.cash + game.journey.partners[other].cash + game.journey.punjabUnionTransfer.cash, treasury);
    assert.equal(game.reserve + game.journey.partners[other].reserve + game.journey.punjabUnionTransfer.reserve, reserves);
    assert.ok(Math.abs(game.population + game.journey.partners[other].population + game.journey.punjabUnionTransfer.population - population) < 1e-8);
    assert.deepEqual(game.assets, inheritedAssets);
    assert.deepEqual(Object.keys(game.owners).filter((hex) => game.owners[hex] === World.key).sort(), [...World.successors[choice].sites].sort());
    assert.ok(World.punjabUnionSites.every((hex) => game.owners[hex] === "chandigarh"));
    assert.ok(World.punjabHimachalSites.every((hex) => game.owners[hex] === "himachal"));
    assert.ok(programmeCommissioned(game, `${prefix}trade`));
    assert.ok(developmentTrees(game).every(({ nodes }) => nodes.every(({ id }) => !id.startsWith(choice === "punjab" ? "hr_" : "pb_"))));
    const data = new Map();
    const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
    Campaign.save(storage, game);
    assert.deepEqual(Campaign.load(storage, true), game);

    const terminal = choice === "punjab" ? "tradeFreightTerminal" : "hr_tradeFreightTerminal";
    while (game.year <= end) {
      const plan = [`${prefix}industry`, terminal, `${prefix}water`].find((id) => !programmeQuote(game, id).reason);
      if (plan) game = fund(game, plan);
      game = playTurn(game);
      const report = game.reports.at(-1);
      assert.equal(report.bhakra.shared, true);
      assert.equal(report.bhakra.food, terms === "focused" ? 2 : 0);
      assert.ok(report.regional.nationalMarket.nodes.some(({ id, local }) => id === other && local));
      assert.ok(!report.regional.nationalMarket.nodes.some(({ id }) => id === choice));
    }
    assert.ok(programmeCommissioned(game, terminal));
    assert.equal(Campaign.score(game).latest.year, end);
  }
});
