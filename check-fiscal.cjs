const assert = require("node:assert/strict");
const test = require("node:test");

test("player and AI use the same later state receipts without losing precise accounts", async () => {
  const { Fiscal } = await import("./src/fiscal.js");
  const { marketFunding } = await import("./src/market-finance.js");
  // Independent values in crore from RBI Table 5, FY1980–81 through FY1985–86.
  const expected = {
    bihar: [988, 1160, 1319, 1504, 1794, 2396],
    orissa: [621, 602, 802, 783, 823, 941],
    "west-bengal": [1092, 1224, 1379, 1533, 1779, 2343],
    maharashtra: [2038, 2386, 2838, 3252, 3668, 4174],
    gujarat: [1025, 1160, 1349, 1565, 1770, 1903],
    up: [1899, 2260, 2556, 2656, 3145, 3877],
  };
  for (const [profile, crore] of Object.entries(expected)) {
    for (let i = 0; i < crore.length; i++) {
      const year = 1980 + i;
      const player = Fiscal.envelope(profile, year);
      const ai = marketFunding(profile === "west-bengal" ? "bengal" : profile, year);
      assert.equal(player.historic.fiscalYear, year);
      assert.equal(player.historic.revenue, crore[i] * 100);
      assert.equal(player.total, Math.round(crore[i] * 100 * .005));
      assert.equal(player.local + player.transfers, player.total);
      assert.equal(ai.reference.value, player.historic.revenue);
      assert.equal(ai.reference.url, player.historic.url);
      assert.equal(ai.allocation, Math.max(1, Math.round(player.total * .1)));
    }
  }
  for (const [profile, year, revenue] of [["punjab", 1982, 78605], ["haryana", 1985, 96030],
    ["tamil-nadu", 1980, 128000], ["andhra-pradesh", 1980, 126450],
    ["assam-reorganized", 1985, 93750], ["central-reorganized", 1980, 113390]]) {
    assert.equal(Fiscal.reference(profile, year).revenue, revenue, `${profile} retains finer regional account`);
  }
});

test("later references respect period jurisdictions and retain the recorded transfer mix", async () => {
  const { Fiscal } = await import("./src/fiscal.js");
  for (const profile of ["bihar", "orissa", "west-bengal", "maharashtra", "gujarat", "up"]) {
    assert.ok(Fiscal.reference(profile, 1979).fiscalYear < 1980);
  }
  for (const [profile, year] of [["madras", 1952], ["madras-residual", 1955], ["andhra-state", 1955],
    ["bombay", 1958], ["punjab-colonial", 1946], ["east-punjab", 1955], ["punjab-enlarged", 1965],
    ["assam", 1946], ["assam-post-partition", 1962], ["assam-post-nagaland", 1971], ["central", 1955]]) {
    assert.equal(Fiscal.reference(profile, 1985).fiscalYear, year, `${profile} must not acquire a successor budget`);
  }
  const bihar = Fiscal.envelope("bihar", 1980);
  assert.equal(bihar.historic.sharedTax, null);
  assert.equal(bihar.historic.grants, null);
  assert.equal(bihar.historic.transferYear, 1963);
  assert.equal(bihar.transfers, Math.round(494 * (2338 + 1260) / 10000));
  assert.match(bihar.historic.transferNote, /1963–64.*recorded transfer mix/);
  assert.equal(Fiscal.openingBalance("bihar", 1946), 34);
  assert.equal(Fiscal.envelope("bihar", 1946).total, 13);
  const { stateRevenueReferences } = await import("./src/state-revenue-references.js");
  assert.ok(stateRevenueReferences.mizoram.every(({ metric }) => metric === "Revenue receipts"));
});

test("resolved reports freeze fiscal provenance and monetary receipts with legacy fallback", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { encodeSave, decodeSave } = await import("./src/save-codec.js");
  const { fundingReferenceMarkup } = await import("./src/fiscal-view.js");
  let game = Campaign.newGame(1946, { end: 1985, preset: "light" });
  while (game.year < 1980) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const choice = Object.keys(decision.choices).find((id) => (decision.priced?.[id] ?? 0) <= game.cash);
      game = Campaign.decide(game, choice);
    }
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    game = next;
  }
  const next = Campaign.advance(game);
  const report = next.reports.at(-1);
  assert.equal(report.funding.total, 494);
  assert.equal(report.funding.historic.fiscalYear, 1980);
  assert.equal(report.funding.historic.revenue, 98800);
  assert.equal(report.tax, report.funding.local + report.receipts.workshops + report.receipts.markets);
  assert.equal(report.income, report.funding.total + report.receipts.workshops + report.receipts.markets + report.sold - report.bought * report.buyPrice);
  assert.match(fundingReferenceMarkup(report.funding), /FY 1980–81/);
  const saved = decodeSave(encodeSave(next));
  const frozen = structuredClone(saved.reports.at(-1));
  const following = Campaign.advance(saved);
  assert.equal(following.reports.at(-1).funding.historic.fiscalYear, 1981);
  assert.deepEqual(saved.reports.at(-1), frozen);
  assert.deepEqual(following.reports.at(-2), frozen);
  const legacy = structuredClone(report);
  delete legacy.funding;
  delete legacy.receipts;
  delete legacy.prices;
  legacy.tax = report.funding.local + Math.floor(report.output * .8) + Math.max(0, report.towns - 2);
  const inferred = Campaign.reportFunding(legacy);
  assert.equal(inferred.total, 494);
  assert.equal(inferred.historic, null);
  assert.match(fundingReferenceMarkup(inferred), /not saved/);
  assert.doesNotMatch(fundingReferenceMarkup(inferred), /988|1980–81/);
  // Future receipt rules can change without relabeling money already recorded.
  const monetary = { ...report, receipts: { workshops: 91, markets: 7 } };
  assert.equal(Campaign.earnedReceipts(monetary).workshops, 91);
  assert.equal(Campaign.earnedReceipts(monetary).markets, 7);
  assert.equal(Campaign.reportFunding({ tax: 12 }), null);
});
