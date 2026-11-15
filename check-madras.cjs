const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=madras" };

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
      const choice = ["roads", "districtRations", "integratePudukkottai", "district", "southernServices", "extension", "ration"].find((id) => decision.choices[id]);
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
  while (province.year < 1953) {
    if (programme[province.year]) province = fund(province, programme[province.year]);
    province = advance(province);
  }
  assert.ok(World.madrasTransition.pudukkottai.every((hex) => province.owners[hex] === World.key));
  assert.equal(Campaign.nextDecision(province).id, "madras-division");
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
