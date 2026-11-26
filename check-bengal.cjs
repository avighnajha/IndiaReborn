const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=west-bengal" };

test("the Calcutta charter trades early freight receipts against island food coverage", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme } = await import("./src/programmes.js");
  const { decodeSave, encodeSave } = await import("./src/save-codec.js");
  const head = (game) => {
    for (let decision; (decision = Campaign.nextDecision(game));) {
      const id = Object.keys(decision.choices).find((id) => Campaign.decide(game, id) !== game);
      assert.ok(id, decision.title);
      game = Campaign.decide(game, id);
    }
    return game;
  };
  const advance = (game) => {
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    return next;
  };
  let start = Campaign.newGame(1946, { end: 1985, preset: "standard" });
  while (start.year < 1952) {
    start = head(start);
    const id = { 1946: "trade", 1949: "food" }[start.year];
    if (id) start = approveProgramme(start, id);
    start = advance(start);
  }
  const portBlair = (report) => report.regional.nationalMarket.nodes.find(({ id }) => id === "andamans");
  assert.equal(portBlair(start.reports.find(({ year }) => year === 1949)), undefined);
  assert.ok(portBlair(start.reports.find(({ year }) => year === 1950)));
  assert.ok(start.reports.at(-1).regional.nationalMarket.links.some(({ from, to, mode, capacity }) =>
    mode === "sea" && capacity === 1 && [from, to].includes("madras") && [from, to].includes("andamans")));
  const { options, capacity } = Campaign.bayShipping(start);
  assert.equal(capacity, 3);
  assert.ok(options.every(({ reason }) => !reason));
  const holdFee = (id) => options.find((option) => option.id === id).cost;
  let food = Campaign.signBayShipping(start, "food");
  let trade = Campaign.signBayShipping(start, "trade");
  assert.equal(food.cash, start.cash - holdFee("food"));
  assert.equal(trade.cash, start.cash - holdFee("trade"));
  assert.equal(Campaign.signBayShipping(food, "trade"), food);
  food = decodeSave(encodeSave(food));
  let normal = start;
  let sent = 0;
  let timber = 0;
  while (normal.year <= 1954) {
    normal = advance(head(normal));
    food = advance(head(food));
    trade = advance(head(trade));
    const plain = normal.reports.at(-1);
    const supplied = food.reports.at(-1);
    const sold = trade.reports.at(-1);
    const manifest = supplied.regional.maritime;
    const freight = sold.regional.maritime;
    sent += manifest.food;
    timber += freight.timber;
    assert.ok(manifest.food <= capacity && freight.timber <= capacity);
    assert.equal(manifest.fee, supplied.year === 1952 ? holdFee("food") : 0);
    assert.equal(supplied.shortage, plain.shortage);
    if (manifest.food) assert.ok(supplied.reserve >= manifest.localFloor);
    assert.equal(portBlair(supplied).shortage, manifest.islandShortage);
    assert.ok(portBlair(supplied).shortage <= portBlair(plain).shortage);
    assert.equal(sold.income - plain.income, freight.receipt);
    assert.equal(Campaign.earnedReceipts(supplied).procurement, manifest.receipt);
    assert.equal(Campaign.earnedReceipts(sold).freight - Campaign.earnedReceipts(plain).freight, freight.receipt);
  }
  assert.ok(sent > 0);
  assert.equal(timber, 9);
  assert.equal(Campaign.bayShipping(food), null);
  assert.equal(advance(head(food)).reports.at(-1).regional.maritime, undefined);
});

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
