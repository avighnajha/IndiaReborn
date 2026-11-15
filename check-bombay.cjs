const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=bombay" };

test("Bombay's two successors keep their inherited works and have playable endings", async () => {
  const { World } = await import("./src/scenario.js");
  const { Campaign } = await import("./src/campaign.js");
  const { campaignName, campaignCapital } = await import("./src/journey.js");
  const { developmentTrees } = await import("./src/department-tree.js");
  const { approveProgramme, basinFloodDecision, programmeCommissioned, programmeQuote, respondToBasinFlood } = await import("./src/programmes.js");
  const opening = Campaign.newGame(1946, { end: 1965, preset: "standard" });
  assert.equal(opening.cash, 80);
  assert.equal(Campaign.finance(opening).total, 31);
  assert.ok(World.bombayEarlySites.every((hex) => opening.owners[hex] !== World.key));
  assert.ok(World.bombayDepartureSites.every((hex) => opening.owners[hex] === World.key));

  function resolveYear(game) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const choice = ["roads", "depots", "districtSchools", "regularIntegration", "district", "extension", "ration"].find((key) => decision.choices[key]);
      assert.ok(choice, decision.title);
      const resolved = Campaign.decide(game, choice);
      assert.notEqual(resolved, game);
      game = resolved;
    }
    if (basinFloodDecision(game)) game = respondToBasinFlood(game, "delay");
    const updated = Campaign.advance(game);
    assert.equal(updated.year, game.year + 1);
    const report = updated.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    return updated;
  }

  let shared = opening;
  const provincial = ["trade", "food", "skills", "bombayWater", "industry", "bombayKutchLinks", "bombayVidarbhaLinks"];
  while (shared.year < 1960) {
    const id = provincial.find((plan) => !programmeQuote(shared, plan, "union").reason);
    if (id) shared = approveProgramme(shared, id, "union");
    shared = resolveYear(shared);
  }
  assert.ok(World.bombayEarlySites.every((hex) => shared.owners[hex] === World.key));
  assert.ok(World.bombayAccessionSites.every((hex) => shared.owners[hex] === World.key));
  assert.ok(World.bombayDepartureSites.every((hex) => shared.owners[hex] === "mysore"));
  assert.equal(Campaign.nextDecision(shared).id, "bombay-reorganization");

  for (const [choice, prefix, end, other, capital, fraction] of [
    ["maharashtra", "mh_", 1985, "gujarat", "Bombay", .3369],
    ["gujarat", "gj_", 1965, "maharashtra", "Ahmedabad", .6631],
  ]) {
    let game = Campaign.decide({ ...shared, journey: { ...shared.journey, end } }, choice);
    assert.equal(campaignName(game), World.successors[choice].name);
    assert.equal(World.tiles[campaignCapital(game)].town.name, capital);
    assert.equal(Campaign.finance(game).historic.name, World.successors[choice].name);
    assert.equal(game.journey.partners[other].cash, Math.floor(shared.cash * fraction));
    assert.equal(game.cash + game.journey.partners[other].cash, shared.cash);
    assert.equal(game.reserve + game.journey.partners[other].reserve, shared.reserve);
    assert.equal(game.population + game.journey.partners[other].population, shared.population);
    assert.deepEqual(game.assets, shared.assets);
    assert.deepEqual(Object.keys(game.owners).filter((hex) => game.owners[hex] === World.key).sort(), [...World.successors[choice].sites].sort());
    assert.ok(programmeCommissioned(game, `${prefix}trade`));
    assert.ok(developmentTrees(game).every(({ nodes }) => nodes.every(({ id }) => !id.startsWith(choice === "gujarat" ? "mh_" : "gj_"))));
    const data = new Map();
    const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
    Campaign.save(storage, game);
    assert.deepEqual(Campaign.load(storage, true), game);
    const firstReport = resolveYear(game).reports.at(-1);
    const initialNeighbor = firstReport.regional.partners.find(({ id }) => id === other);
    assert.ok(initialNeighbor.inherited.workshops > 0);
    assert.equal(initialNeighbor.cash, initialNeighbor.openingCash + 1 + initialNeighbor.freight + initialNeighbor.inherited.receipts +
      (initialNeighbor.competitionCash ?? 0) - initialNeighbor.developmentSpend - initialNeighbor.inherited.upkeepPaid +
      initialNeighbor.sold * firstReport.buyPrice - initialNeighbor.bought + (initialNeighbor.national?.sold ?? 0) - (initialNeighbor.national?.bought ?? 0));
    const terminal = choice === "gujarat" ? "gj_tradeFreightTerminal" : "tradeFreightTerminal";
    while (game.year <= end) {
      const plan = [`${prefix}applied`, terminal].find((id) => !programmeQuote(game, id).reason);
      if (plan) game = approveProgramme(game, plan);
      game = resolveYear(game);
    }
    assert.ok(programmeCommissioned(game, terminal));
    assert.equal(game.reports.at(-1).year, end);
  }
});
