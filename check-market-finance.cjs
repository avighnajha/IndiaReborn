const assert = require("node:assert/strict");
const test = require("node:test");

test("market budgets retain historical units, measures and fiscal dates", async () => {
  const { marketFunding } = await import("./src/market-finance.js");
  assert.equal(marketFunding("manipur", 1979).reference, null);
  assert.equal(marketFunding("manipur", 1980).reference.value, 11100);
  assert.equal(marketFunding("manipur", 1980).allocation, 6);
  assert.equal(marketFunding("tripura", 1980).reference.value, 12300);
  assert.equal(marketFunding("himachal", 1980).allocation, 15);
  assert.equal(marketFunding("jammu", 1980).reference.name, "Jammu and Kashmir");
  assert.equal(marketFunding("jammu", 1980).allocation, 13);
  assert.equal(marketFunding("sikkim", 1980).reference.value, 3700);
  assert.equal(marketFunding("sikkim", 1980).allocation, 2);
  const arunachal = marketFunding("arunachal", 1972);
  assert.equal(arunachal.reference.metric, "Annual Plan outlay");
  assert.equal(arunachal.reference.value, 390.1);
  assert.equal(arunachal.allocation, 2);
  assert.equal(marketFunding("arunachal", 1980).reference.value, 2621);
  assert.equal(marketFunding("arunachal", 1981).allocation, 19);
  assert.equal(marketFunding("arunachal", 1985).reference.fiscalYear, 1981);
  assert.equal(marketFunding("delhi", 1972).allocation, 21);
  assert.equal(marketFunding("mizoram", 1984).reference.metric, "Annual Plan outlay");
  assert.equal(marketFunding("mizoram", 1985).reference.metric, "Revenue receipts");
  for (const id of ["bihar", "bombay", "punjab", "haryana", "madras", "andhra", "assam", "central", "manipur", "arunachal", "sikkim", "jammu"]) {
    for (let year = 1946; year <= 1985; year++) {
      const budget = marketFunding(id, year);
      assert.ok(budget.allocation >= 1 && Number.isInteger(budget.allocation));
      assert.ok(!budget.reference || budget.reference.fiscalYear <= year, `${id} ${year}`);
    }
  }
});

test("different sourced allowances change affordable AI commitments", async () => {
  const { resolveNeighbors } = await import("./src/interregional.js");
  const game = { year: 1955, seed: 1946, reserve: 10, assets: [], owners: {}, reports: [],
    journey: { preset: "standard", end: 1985, partners: { up: { cash: 9, reserve: 10 }, bengal: { cash: 9, reserve: 10 } } } };
  const regional = resolveNeighbors(game, { key: "bihar" }, { harvest: 30, demand: 10, towns: 5, monsoon: "Typical monsoon" });
  const up = regional.report.partners.find(({ id }) => id === "up");
  const bengal = regional.report.partners.find(({ id }) => id === "bengal");
  assert.equal(up.funding.allocation, 3);
  assert.equal(bengal.funding.allocation, 2);
  assert.equal(up.shortage, 0);
  assert.equal(bengal.shortage, 0);
  assert.ok(up.works.freight);
  assert.equal(bengal.works.freight, undefined);
  for (const row of regional.report.partners) {
    assert.equal(row.cash, row.openingCash + row.funding.allocation - row.developmentSpend);
    assert.ok(row.cash >= 3);
  }
});

test("sourced funding posts once, preserves carried cash and freezes saved references", async () => {
  const { resolveNeighbors, settleNeighborTrade, settleNationalTrade, settleFreight } = await import("./src/interregional.js");
  const game = { year: 1980, seed: 1946, reserve: 6, assets: [], owners: {}, reports: [],
    journey: { preset: "standard", end: 1985, partners: { up: { cash: 21, reserve: 5 }, manipur: { cash: 17, reserve: 6 } } } };
  const snapshot = structuredClone(game);
  const run = (state) => {
    const local = resolveNeighbors(state, { key: "bihar" }, { harvest: 30, demand: 10, towns: 5, monsoon: "Typical monsoon" });
    return settleFreight(settleNationalTrade(settleNeighborTrade(local, { bought: 0, sold: 0, buyPrice: 2 }), state, { key: "bihar" }), state);
  };
  const result = run(game);
  assert.deepEqual(run(JSON.parse(JSON.stringify(game))), result);
  assert.deepEqual(game, snapshot);
  for (const row of result.report.nationalMarket.nodes) {
    const partner = result.partners[row.id];
    assert.equal(row.funding.allocation, partner.funding.allocation);
    const local = result.report.partners.find(({ id }) => id === row.id);
    const before = local?.openingCash ?? partner.openingCash;
    const funding = row.funding.allocation;
    assert.equal(partner.cash, before + funding + (local?.freight ?? 0) +
      partner.development.trainingReceipts + partner.development.processingReceipts -
      (local?.developmentSpend ?? partner.developmentSpend) + (partner.national?.sold ?? 0) - (partner.national?.bought ?? 0) +
      (row.freight ?? 0) + (row.freightContract ?? 0));
  }
  const saved = JSON.parse(JSON.stringify(result.report.nationalMarket));
  run({ ...game, year: 1981, journey: { ...game.journey, partners: result.partners } });
  assert.deepEqual(result.report.nationalMarket, saved);
  assert.equal(result.partners.manipur.openingCash, 17);
});
