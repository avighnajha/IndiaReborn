const assert = require("node:assert/strict");
const test = require("node:test");

test("matched public-action priorities have different timing, recorded costs and resumable results", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { approveProgramme, programmeQuote } = await import("./src/programmes.js");
  function settle(game) {
    for (let count = 0; count < 15; count++) {
      const decision = Campaign.nextDecision(game);
      if (!decision) break;
      const choices = ["skills", "settlement", "district", "unified", ...Object.keys(decision.choices)];
      const choice = choices.find((id) => decision.choices[id] && Campaign.decide(game, id) !== game);
      assert.ok(choice, `An affordable public decision exists in ${game.year}`);
      game = Campaign.decide(game, choice);
    }
    const grant = Campaign.grantOffers(game).find(({ id, reason }) => id === "standard" && !reason);
    return grant ? Campaign.acceptGrant(game, grant.id) : game;
  }
  const previewWeather = { "Typical monsoon": "Typical monsoon", "If flooding occurs": "Severe flood", "If the monsoon is dry": "Dry monsoon" };
  const matchedWeather = new Set();
  function resolve(game) {
    const preview = Campaign.foodPlan(game);
    const priority = Campaign.cabinetPriority(game).current;
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1);
    const report = next.reports.at(-1);
    assert.equal(report.cash, report.openingCash + report.income - report.maintenance + report.upkeepShortfall);
    assert.equal(report.cabinetPriority?.spent ?? 0, priority?.status === "funded" ? priority.annualCost : 0);
    assert.equal(preview.cash, Math.max(0, game.cash - (report.training?.upkeep ?? 0) - (report.cabinetPriority?.spent ?? 0)));
    const scenario = preview.cases.find(({ name }) => previewWeather[name] === report.monsoon);
    if (scenario) {
      assert.equal(report.harvest, scenario.harvest, `Food preview matches ${report.year}`);
      matchedWeather.add(report.monsoon);
    }
    const stored = new Map();
    const device = { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) };
    Campaign.save(device, game);
    assert.deepEqual(next, Campaign.advance(Campaign.load(device, true)), `Resume preserves ${report.year}`);
    return next;
  }

  // Reach the shared position through normal decisions, grants and paid works.
  let shared = Campaign.newGame(1949, { end: 1965, preset: "light" });
  while (shared.year < 1954) {
    shared = settle(shared);
    const programme = ["skills", "food", "trade", "applied"].find((id) => !programmeQuote(shared, id).reason);
    if (programme) shared = approveProgramme(shared, programme);
    shared = resolve(shared);
  }
  shared = settle(shared);
  assert.ok(["education", "food", "trade"].every((id) => !Campaign.cabinetPriority(shared).options.find((option) => option.id === id).reason));
  const branches = {};
  for (const focus of ["services", "education", "food", "trade"]) {
    let game = Campaign.chooseCabinetPriority(shared, focus);
    while (game.year <= 1965) {
      game = settle(game);
      if (game.year === 1959) game = Campaign.chooseCabinetPriority(game, focus);
      game = resolve(game);
    }
    branches[focus] = new Map(game.reports.map((report) => [report.year, report]));
  }

  const baseline = (year) => branches.services.get(year);
  const education = (year) => branches.education.get(year);
  const trade = (year) => branches.trade.get(year);
  const food = (year) => branches.food.get(year);
  for (let year = 1954; year <= 1958; year++) {
    assert.equal(education(year).skills, baseline(year).skills);
    assert.equal(education(year).output, baseline(year).output, "Graduating cohorts serve from the following year");
  }
  assert.equal(education(1958).cabinetPriority.newGraduates, 4);
  assert.equal(education(1959).skills - baseline(1959).skills, 8);
  assert.equal(education(1959).output - baseline(1959).output, 4);
  assert.equal(education(1963).cabinetPriority.newGraduates, 4);
  assert.equal(education(1964).cabinetPriority.spent, 0, "No automatic renewal");
  assert.equal(education(1964).skills - baseline(1964).skills, 16);
  assert.equal(education(1964).output - baseline(1964).output, 8, "Workforce persists after funding ends");

  for (let year = 1954; year <= 1963; year++) {
    assert.equal(trade(year).output - baseline(year).output, 3);
    assert.equal(food(year).harvest - baseline(year).harvest, food(year).cabinetPriority.food + food(year).cabinetPriority.recovered);
    assert.equal(food(year).cabinetPriority.food, 2);
    const residualLoss = Math.max(0, food(year).attribution.food.weatherLoss - food(year).attribution.food.protection - (food(year).training?.recovered ?? 0) - (food(year).development?.waterRecovery ?? 0));
    assert.ok(food(year).cabinetPriority.recovered <= residualLoss);
    const ordinaryUpkeep = Math.ceil(shared.assets.filter(({ remaining }) => !remaining).length / 4);
    assert.equal(trade(year).maintenance, ordinaryUpkeep + trade(year).cabinetPriority.spent, "Priority appropriation posts once");
  }
  assert.equal(food(1954).harvest - baseline(1954).harvest, 2);
  assert.equal(food(1956).harvest - baseline(1956).harvest, 6);
  assert.equal(food(1957).harvest - baseline(1957).harvest, 6);
  assert.equal(baseline(1962).shortage, 6);
  assert.equal(food(1962).shortage, 0);
  assert.equal(baseline(1963).shortage, 3);
  assert.equal(food(1963).shortage, 0);
  assert.equal(trade(1964).output, baseline(1964).output, "Temporary production support ends with its term");
  assert.equal(food(1964).harvest, baseline(1964).harvest, "Temporary food support ends with its term");
  assert.deepEqual([...matchedWeather].sort(), ["Dry monsoon", "Severe flood", "Typical monsoon"].sort());
});

test("priority terms preserve reserved cash, campus ownership, progress and useful final-year eligibility", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { World } = await import("./src/scenario.js");
  const { cabinetPlan, adoptCabinetPlan, resolveCabinetPlan } = await import("./src/cabinet-plan.js");
  const finance = { total: 100 };
  const campus = { hex: "hex-6-6", completed: 1950 };
  const context = { education: [campus, { ...campus }], farms: [{ hex: "hex-4-5" }], workshops: [{ hex: "hex-6-6" }], reservedCash: 4 };
  const game = { ...Campaign.newGame(1949, { end: 1965, preset: "light" }), year: 1954, cash: 34 };
  const original = structuredClone(game);
  const chosen = adoptCabinetPlan(game, "education", finance, context);
  assert.deepEqual(game, original, "Adoption leaves its input unchanged");
  assert.equal(chosen.cash, 34, "The appropriation is posted when the year resolves");
  assert.equal(chosen.journey.cabinet.term.ends, 1958);
  assert.equal(adoptCabinetPlan(chosen, "food", finance, context), chosen);
  assert.equal(adoptCabinetPlan(chosen, "services", finance, context), chosen, "A live term cannot be cancelled for another focus");
  const resolution = resolveCabinetPlan(chosen, finance, context);
  assert.equal(resolution.report.spent, 30);
  assert.equal(resolution.cabinet.education[campus.hex].years, 1, "A campus with several institution kinds is funded once");
  assert.equal(chosen.journey.cabinet.education[campus.hex], undefined, "Resolving leaves its input unchanged");

  const paused = { ...chosen, cash: 33 };
  const pause = resolveCabinetPlan(paused, finance, context);
  assert.equal(pause.report.status, "paused");
  assert.equal(pause.report.spent, 0, "Charter money is reserved before this priority");
  assert.equal(pause.cabinet.education[campus.hex], undefined);
  assert.equal(pause.cabinet.term.ends, 1958, "Unfunded years do not extend the calendar commitment");
  const noSite = resolveCabinetPlan(chosen, finance, { ...context, education: [] });
  assert.equal(noSite.report.status, "paused");
  assert.equal(noSite.report.spent, 0);
  assert.ok(cabinetPlan({ ...game, cash: 33 }, finance, context).options.find(({ id }) => id === "education").reason);
  assert.ok(cabinetPlan(game, finance, { ...context, education: [{ ...campus, completed: 1954 }] }).options.find(({ id }) => id === "education").reason, "A newly completed campus needs its first teaching year");

  const progress = (year, years) => ({ ...game, year, journey: { ...game.journey, cabinet: { education: { [campus.hex]: { years, cohorts: Math.floor(years / 5) } }, term: null } } });
  const option = (year, years, id = "education") => cabinetPlan(progress(year, years), finance, context).options.find((candidate) => candidate.id === id);
  assert.equal(option(1960, 0).reason, null);
  assert.ok(option(1961, 0).reason, "A 1965 graduation would first serve after this campaign");
  assert.equal(option(1964, 4).reason, null, "Carried teaching progress can make a shorter final term useful");
  assert.ok(option(1965, 4).reason);
  assert.equal(option(1965, 0, "food").reason, null);
  assert.equal(option(1965, 0, "trade").ends, 1965);
  const fourthYear = adoptCabinetPlan(progress(1954, 4), "education", finance, context);
  const graduation = resolveCabinetPlan(fourthYear, finance, context);
  assert.equal(graduation.report.newGraduates, 1);
  assert.equal(graduation.effects.skills, 0);
  assert.equal(graduation.effects.trainingOutputPerWorkshop, 0);
  const afterTerm = { ...game, year: 1959, journey: { ...game.journey, cabinet: graduation.cabinet } };
  const lasting = resolveCabinetPlan(afterTerm, finance, context);
  assert.equal(cabinetPlan(afterTerm, finance, context).current, null);
  assert.equal(lasting.report.spent, 0);
  assert.equal(lasting.effects.skills, 2);
  assert.equal(lasting.effects.trainingOutputPerWorkshop, 1);

  const ownership = { ...afterTerm, assets: [{ ...campus, kind: "school", remaining: 0 }], owners: { ...afterTerm.owners, [campus.hex]: World.key } };
  assert.equal(Campaign.cabinetPriority(ownership).graduates, 1);
  const transferred = { ...ownership, owners: { ...ownership.owners, [campus.hex]: "council" } };
  assert.equal(Campaign.cabinetPriority(transferred).graduates, 0, "Graduates follow their physical campus out of the administration");
  assert.deepEqual(transferred.journey.cabinet.education, ownership.journey.cabinet.education, "Border transfer does not delete campus progress");
  assert.equal(Campaign.cabinetPriority({ ...transferred, owners: ownership.owners }).graduates, 1);

  // At annual settlement, purchases cannot spend either service appropriation.
  const serviceFixture = { ...game, cash: 100, reserve: 0, population: 100, policy: "import", assets: [
    { hex: "hex-6-6", kind: "school", remaining: 0, completed: 1950 },
    { hex: "hex-6-7", kind: "school", remaining: 0, completed: 1950 },
    { hex: "hex-6-6", kind: "mill", remaining: 0, completed: 1950 },
    { hex: "hex-4-5", kind: "irrigation", remaining: 0, completed: 1950 },
  ], journey: { ...game.journey, training: { id: "extension", cost: 18, upkeep: 4, authorized: 1953, opens: 1954 } } };
  const committed = Campaign.chooseCabinetPriority(serviceFixture, "food");
  const serviceCost = Campaign.cabinetPriority(committed).current.annualCost;
  const exact = { ...committed, cash: serviceCost + 4 };
  assert.equal(Campaign.foodPlan(exact).cash, 0);
  const paid = Campaign.advance(exact).reports.at(-1);
  assert.equal(paid.training.upkeep, 4);
  assert.equal(paid.cabinetPriority.spent, serviceCost);
  assert.equal(paid.bought, 0, "Emergency purchases cannot consume service appropriations");
  assert.equal(paid.cash, paid.openingCash + paid.income - paid.maintenance + paid.upkeepShortfall);
  const underfunded = { ...committed, cash: serviceCost + 3 };
  const pausedYear = Campaign.advance(underfunded).reports.at(-1);
  assert.equal(pausedYear.training.upkeep, 4);
  assert.equal(pausedYear.cabinetPriority.spent, 0);
  assert.equal(pausedYear.cabinetPriority.status, "paused");
  assert.ok(pausedYear.bought * pausedYear.buyPrice <= underfunded.cash - 4);

  const due = { ...game, assets: [{ hex: "hex-4-5", kind: "irrigation", remaining: 1, started: 1954 }],
    journey: { ...game.journey, cabinet: { term: { id: "food", starts: 1953, ends: 1957, rate: .3, paidYears: 1 }, education: {} } } };
  const forecast = Campaign.cabinetPriority(due).current;
  const resolved = Campaign.advance(due).reports.at(-1).cabinetPriority;
  assert.equal(forecast.status, "funded", "Service preview includes works due to open this year");
  assert.equal(resolved.spent, forecast.annualCost);
  assert.equal(resolved.food, 1);
});
