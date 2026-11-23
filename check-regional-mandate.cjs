const assert = require("node:assert/strict");
const test = require("node:test");

test("a regional mandate locks its choice and records only qualifying results in the right years", async () => {
  const { adoptRegionalMandate, recordRegionalMandate, regionalMandate } = await import("./src/regional-mandate.js");
  const make = (year, end = 1985) => ({ year, journey: { end }, reports: [] });
  assert.equal(regionalMandate(make(1973), 40).available, false);
  assert.equal(regionalMandate(make(1980), 40).available, false);
  assert.equal(regionalMandate(make(1974, 1970), 40).available, false);
  const position = make(1974);
  let game = adoptRegionalMandate(position, "trade", 40);
  assert.equal(position.journey.mandate, undefined);
  assert.equal(adoptRegionalMandate(game, "food", 40), game);
  assert.equal(regionalMandate(game, 40, { trade: 1 }).progress.metrics[1].met, true);

  function record(report, facilities) {
    const progress = recordRegionalMandate(game, report, facilities);
    game = { ...game, year: report.year + 1, reports: [...game.reports, { ...report, regionalMandate: progress }] };
    return progress;
  }
  const highOutput = { output: 60, cabinetPriority: { trainingOutput: 3, tradeOutput: 3 } };
  assert.equal(record({ year: 1980, ...highOutput }, { trade: 1 }).metrics[0].value, 0);
  const missed = record({ year: 1981, output: 600 }, { trade: 1 });
  assert.equal(missed.metrics[0].value, 0, "Production without new services or trained workforce does not qualify");
  for (let year = 1982; year <= 1985; year++) record({ year, ...highOutput }, { trade: 1 });
  const final = regionalMandate(game, 99).progress;
  assert.deepEqual(final.metrics.map(({ value, target }) => [value, target]), [[4, 4], [1, 1]]);
  assert.match(final.metrics[0].label, /60\+/);
  assert.equal(final.complete, true);
  assert.equal(final.achieved, true);
  assert.equal(missed.metrics[0].value, 0, "Past briefs keep their original progress");

  game = adoptRegionalMandate(make(1979), "education", 40);
  record({ year: 1978, cabinetPriority: { newGraduates: 9 } }, { education: 1 });
  const graduates = record({ year: 1984, cabinetPriority: { newGraduates: 4 } }, { education: 1 });
  assert.equal(graduates.metrics[0].value, 0, "Pre-signing and same-year graduates do not count");
  const workforce = record({ year: 1985, cabinetPriority: { newGraduates: 2 } }, { education: 1 });
  assert.equal(workforce.metrics[0].value, 4);
  assert.equal(workforce.achieved, true);

  game = adoptRegionalMandate(make(1974), "food", 40);
  const secure = { harvest: 39, demand: 39, reserve: 20, shortage: 0, training: { food: 2, recovered: 1 } };
  assert.equal(record({ year: 1981, ...secure, reserve: 19 }, { food: 1 }).metrics[0].value, 0);
  for (let year = 1982; year < 1985; year++) record({ year, ...secure }, { food: 1 });
  const noNetwork = record({ year: 1985, ...secure }, { food: 0 });
  assert.equal(noNetwork.metrics[0].value, 4);
  assert.equal(noNetwork.achieved, false, "The signature facility must still be operating at the ending");
});
