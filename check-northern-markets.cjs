const assert = require("node:assert/strict");
const test = require("node:test");

test("northern markets enter through dated road and railway connections", async () => {
  const { clearNationalMarket, nationalMarketActors, marketConnection } = await import("./src/national-market.js");
  const network = (year) => {
    const game = { year, journey: { preset: "standard" } };
    const ids = nationalMarketActors(game, { key: "bihar" });
    const partners = Object.fromEntries(ids.map((id) => [id, { cash: 8, reserve: 5, shortage: 0 }]));
    return clearNationalMarket(game, partners, ids.map((id) => ({ id })), []).market;
  };
  const has = (year, id) => network(year).nodes.some((node) => node.id === id);
  assert.equal(has(1947, "himachal"), false);
  assert.equal(has(1948, "himachal"), true);
  assert.equal(has(1948, "jammu"), false);
  assert.equal(has(1949, "jammu"), true);
  assert.equal(has(1974, "sikkim"), false);
  assert.equal(has(1975, "sikkim"), true);
  assert.deepEqual(marketConnection("himachal", 1957), { routeCapacity: 1, mode: "road" });
  assert.deepEqual(marketConnection("himachal", 1958), { routeCapacity: 2, mode: "road" });
  for (const year of [1949, 1968, 1972, 1973, 1985]) {
    const link = network(year).links.find(({ from, to }) => [from, to].includes("jammu"));
    assert.equal(link.capacity, year >= 1973 ? 3 : 1);
    assert.equal(link.mode, year >= 1973 ? "rail" : "road");
  }
  assert.ok(network(1972).chapter.includes("next year"));
});

test("Jammu rail capacity increases real food relief without creating cash or stock", async () => {
  const { clearNationalMarket } = await import("./src/national-market.js");
  const actors = [{ id: "punjab" }, { id: "jammu" }];
  const partners = { punjab: { cash: 20, reserve: 0, shortage: 3 }, jammu: { cash: 8, reserve: 12, shortage: 0 } };
  for (const year of [1972, 1973]) {
    const result = clearNationalMarket({ year }, partners, actors, []);
    const moved = year === 1972 ? 1 : 3;
    assert.equal(result.market.units, moved);
    assert.equal(result.market.nodes.find(({ id }) => id === "punjab").shortage, 3 - moved);
    assert.equal(result.market.nodes.reduce((sum, row) => sum + row.cash, 0), 28);
    assert.equal(result.market.nodes.reduce((sum, row) => sum + row.reserve, 0), 12 - moved);
  }
  assert.equal(partners.jammu.reserve, 12);
});

test("Punjab routes, Haryana transit and inherited Himachal works preserve separate accounts", async () => {
  const { neighborsFor, resolveNeighbors, settleNeighborTrade, settleNationalTrade } = await import("./src/interregional.js");
  const { contractRivalBid } = await import("./src/neighbor-competition.js");
  const world = { key: "punjab" };
  const initial = { year: 1973, seed: 1946, reserve: 0, assets: [{ hex: "hill", kind: "mill", remaining: 0 }], owners: { hill: "himachal" }, reports: [],
    journey: { preset: "standard", end: 1985, jurisdiction: { punjabSuccessor: "punjab" },
      partners: { himachal: { cash: 41, reserve: 6 }, jammu: { cash: 30, reserve: 18, works: { freight: { opened: 1970 } } } } } };
  const nearby = neighborsFor(world, initial);
  assert.ok(nearby.some(({ id }) => id === "himachal"));
  assert.equal(nearby.find(({ id }) => id === "jammu").mode, "rail");
  const local = resolveNeighbors(initial, world, { harvest: 0, demand: 20, towns: 6, monsoon: "Typical monsoon" });
  const settled = settleNeighborTrade(local, { bought: 20, sold: 0, buyPrice: 2 });
  const jammu = settled.report.partners.find(({ id }) => id === "jammu");
  assert.ok(jammu.sold + jammu.bought + jammu.emergencyFood <= 3);
  assert.equal(contractRivalBid(jammu).capacity, 3);
  const himachal = settled.report.partners.find(({ id }) => id === "himachal");
  assert.equal(himachal.inherited.receipts, 3);
  const national = settleNationalTrade(settled, initial, world);
  assert.equal(national.partners.himachal.cash, settled.partners.himachal.cash);
  const haryana = { ...initial, journey: { ...initial.journey, jurisdiction: { punjabSuccessor: "haryana" } } };
  assert.ok(neighborsFor(world, haryana).every(({ id }) => !["jammu", "himachal"].includes(id)));
  const distant = settleNationalTrade({ partners: haryana.journey.partners, report: { partners: [], developments: [] } }, haryana, world);
  assert.equal(distant.partners.himachal.openingCash, 41);
  assert.equal(distant.partners.himachal.inherited.receipts, 3);
  assert.ok(distant.report.nationalMarket.links.some(({ from, to }) => [from, to].includes("jammu")));
  const west = { ...initial, year: 1975, journey: { ...initial.journey, jurisdiction: {} } };
  assert.ok(neighborsFor({ key: "west-bengal" }, west).some(({ id }) => id === "sikkim"));
  assert.ok(!neighborsFor(world, { ...initial, journey: { ...initial.journey, preset: "light" } }).some(({ id }) => id === "jammu"));
  assert.deepEqual(settleNationalTrade(settled, JSON.parse(JSON.stringify(initial)), world), national);
});
