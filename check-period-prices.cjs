const assert = require("node:assert/strict");
const test = require("node:test");

test("linked period prices change new quotes and receipts while paid costs and past reports stay fixed", async () => {
  const { priceBasis } = await import("./src/period-prices.js");
  assert.equal(priceBasis(1946).referenceYear, 1952);
  assert.equal(priceBasis(1946).index, priceBasis(1952).index);
  assert.ok(Math.abs(priceBasis(1961).index / priceBasis(1952).index - 1.251) < 1e-10);
  assert.equal(priceBasis(1970).index, 100);
  assert.equal(priceBasis(1981).index, 281.3);
  assert.ok(Math.abs(priceBasis(1985).index - 352.7502) < 1e-10);

  const { Campaign } = await import("./src/campaign.js");
  const { accelerationQuote, approveProgramme, programmeQuote } = await import("./src/programmes.js");
  const { encodeSave, decodeSave } = await import("./src/save-codec.js");
  const opening = Campaign.newGame(1946, { end: 1985, preset: "light" });
  assert.equal(programmeQuote(opening, "food").cost, 29);
  const proposal = { ...opening, year: 1966, cash: 600 };
  assert.equal(programmeQuote(proposal, "floodplainRenewal").cost, 112);
  assert.equal(programmeQuote({ ...proposal, year: 1974 }, "floodplainRenewal").cost, 237);
  const approved = approveProgramme(proposal, "floodplainRenewal");
  assert.equal(approved.cash, 488);
  const reloaded = decodeSave(encodeSave(approved));
  assert.equal(reloaded.programmes[0].cost, 112);
  assert.equal(accelerationQuote({ ...reloaded, year: 1967 }, "floodplainRenewal").cost, 28);

  // Hold the territory, operating portfolio and policy fixed across two years.
  const state = { ...opening, year: 1982, cash: 500, assets: [
    { hex: "hex-6-6", kind: "mill", remaining: 0, completed: 1960 },
    { hex: "hex-6-6", kind: "freightTerminal", remaining: 0, completed: 1970 },
  ] };
  const after = Campaign.advance(state);
  const first = after.reports.at(-1);
  const second = Campaign.advance(after).reports.at(-1);
  assert.equal(first.year, 1982);
  assert.equal(second.year, 1983);
  assert.equal(first.output, second.output);
  assert.equal(first.towns, second.towns);
  assert.ok(second.receipts.workshops > first.receipts.workshops);
  assert.equal(second.prices.receiptEffect, second.receipts.workshops + second.receipts.markets - first.receipts.workshops - first.receipts.markets);
  assert.equal(second.maintenance, second.prices.worksUpkeep);
  assert.equal(second.cash, second.openingCash + second.income - second.maintenance);
  assert.deepEqual(decodeSave(encodeSave(after)).reports.at(-1), first);
});
