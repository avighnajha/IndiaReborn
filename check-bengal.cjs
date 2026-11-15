const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=west-bengal" };

test("Bengal's jute supply and territorial choices survive a full campaign", async () => {
  const { World } = await import("./src/scenario.js");
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme, programmeQuote, programmes } = await import("./src/programmes.js");
  const { campaignName } = await import("./src/journey.js");
  const initial = Campaign.newGame(1946, { end: 1965, preset: "light" });
  assert.equal(campaignName(initial), "Western Bengal districts");
  assert.equal(initial.cash, 44);
  assert.ok(World.coochBeharSites.every((hex) => initial.owners[hex] === "coochBehar"));
  assert.ok(World.bengalTransferSites.every((hex) => initial.owners[hex] === "bihar"));

  function advance(game, settlement) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const key = ["roads", "settlement", "coochStandard", "district", "extension", "ration", settlement].find((choice) => decision.choices[choice]);
      assert.ok(key, decision.title);
      game = Campaign.decide(game, key);
    }
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    const report = next.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    return next;
  }

  let shared = approveProgramme(initial, "trade");
  while (shared.year < 1949) shared = advance(shared);
  assert.equal(campaignName(shared), "West Bengal");
  assert.equal(shared.reports.at(-1).jute.lost, 2);
  const corridor = Campaign.signPartnerOffer(shared, "eastBengal:corridor");
  assert.equal(advance(corridor).reports.at(-1).jute.lost, 0);
  const domestic = approveProgramme(shared, "juteSupply");
  assert.notEqual(domestic, shared);
  for (const [start, choice, end, preset] of [[corridor, "transitCompact", 1965, "light"], [domestic, "receiveDistricts", 1985, "standard"]]) {
    let game = { ...start, journey: { ...start.journey, end, preset } };
    while (game.year <= end) {
      const plan = ["food", "skills", "industry", "applied", "puruliaIndustry", "bengalDeltaRenewal"].find((id) => !programmeQuote(game, id).reason);
      if (plan) game = approveProgramme(game, plan);
      game = advance(game, choice);
      if (game.year === 1951) assert.ok(World.coochBeharSites.every((hex) => game.owners[hex] === World.key));
      if (game.year === 1957) {
        const expected = choice === "receiveDistricts" ? World.key : "bihar";
        assert.ok(World.bengalTransferSites.every((hex) => game.owners[hex] === expected));
        const entries = new Map();
        const storage = { getItem: (key) => entries.get(key), setItem: (key, value) => entries.set(key, value) };
        Campaign.save(storage, game);
        assert.deepEqual(Campaign.load(storage, true), game);
      }
    }
    assert.equal(game.reports.length, end - 1946 + 1);
    assert.equal(game.reports.at(-1).jute.lost, 0);
    assert.equal(Campaign.neighbors(game).find(({ id }) => id === "eastBengal").name, end === 1985 ? "Bangladesh" : "East Pakistan");
    assert.equal(game.programmes.some(({ id }) => id === "puruliaIndustry"), choice === "receiveDistricts");
    assert.ok(programmes.puruliaIndustry.works.every(({ hex }) => World.bengalTransferSites.includes(hex)));
  }
});
