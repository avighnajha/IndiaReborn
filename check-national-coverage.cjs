const assert = require("node:assert/strict");
const test = require("node:test");

test("western market accounts clear physical shipments and keep the dated fiscal basis", async () => {
  const { domesticLinks, clearNationalMarket, nationalMarketActors } = await import("./src/national-market.js");
  const { westernShipping } = await import("./src/western-shipping.js");
  const { marketFunding } = await import("./src/market-finance.js");
  const ids = (year) => nationalMarketActors({ year, journey: {} }, { key: "bihar" });
  assert.ok(!ids(1955).includes("lakshadweep") && ids(1956).includes("lakshadweep"));
  assert.ok(!ids(1961).includes("goa") && ids(1962).includes("goa"));
  assert.ok(domesticLinks(1957).every((link) => !link.includes("lakshadweep")));
  assert.equal(westernShipping(1969, true).islands.capacity, 1);
  assert.equal(westernShipping(1970, true).islands.capacity, 3);
  assert.equal(westernShipping(1982, true).islands.capacity, 4);
  assert.equal(westernShipping(1969, true).islands.provisioned, 2);
  assert.equal(westernShipping(1970, true).islands.provisioned, 3);
  assert.equal(marketFunding("goa", 1972).reference.value, 980);
  assert.equal(marketFunding("goa", 1985).allocation, 32);
  assert.equal(marketFunding("lakshadweep", 1971).reference, null);
  assert.equal(marketFunding("lakshadweep", 1978).reference.value, 244);

  const game = { year: 1979, journey: { preset: "standard" } };
  const participants = ids(game.year).map((id) => ({ id }));
  const partners = Object.fromEntries(participants.map(({ id }) => [id, { cash: 20, reserve: 5, shortage: 0 }]));
  Object.assign(partners.mysore, { reserve: 10 });
  Object.assign(partners.kerala, { reserve: 10 });
  Object.assign(partners.goa, { shortage: 3 });
  Object.assign(partners.lakshadweep, { shortage: 4 });
  const { market } = clearNationalMarket(game, partners, participants, []);
  assert.deepEqual(market.western.ore, { loads: 2, railCapacity: 3, foodCapacity: 1 });
  const rail = market.links.find(({ from, to }) => from === "mysore" && to === "goa");
  assert.deepEqual([rail.capacity, rail.units, rail.fromMarket], [1, 1, "Hospet–Bellary"]);
  const ship = market.links.find(({ to }) => to === "lakshadweep");
  assert.deepEqual([ship.capacity, ship.units, ship.fromMarket], [1, 1, "Calicut"]);
  assert.equal(market.western.islands.shortage, 3);
  assert.equal(ship.capacity + market.western.islands.administrationCargo, market.western.islands.capacity);
  const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
  assert.equal(sum(market.nodes, "cash"), sum(Object.values(partners), "cash"));
  assert.equal(sum(market.nodes, "reserve") + 2, sum(Object.values(partners), "reserve"));
  assert.equal(sum(market.nodes, "shortage") + 2, sum(Object.values(partners), "shortage"));

  const isolated = { ...game, year: 1958 };
  Object.assign(partners.lakshadweep, { shortage: 0, reserve: 10 });
  Object.assign(partners.kerala, { shortage: 4, reserve: 0 });
  const fair = clearNationalMarket(isolated, partners, participants, []).market;
  const open = clearNationalMarket(game, partners, participants, []).market;
  assert.equal(open.links.find(({ to }) => to === "lakshadweep").units, 0, "Island rice does not become an export supply");
  assert.equal(fair.western.islands.administrationCargo, 1);
  const rough = clearNationalMarket(isolated, partners, participants, [], westernShipping(isolated.year, true)).market;
  assert.equal(rough.links.find(({ to }) => to === "lakshadweep").capacity, 0);
});

test("northeastern market accounts and road links follow their separate timelines", async () => {
  const { clearNationalMarket, inlandActors, marketHubs, nationalMarketActive, nationalMarketActors } = await import("./src/national-market.js");
  const network = (year, played = "bihar") => {
    const game = { year, journey: { preset: "standard" } };
    const ids = nationalMarketActors(game, { key: played });
    const partners = Object.fromEntries(ids.map((id) => [id, { cash: 8, reserve: 5, shortage: 0 }]));
    return clearNationalMarket(game, partners, ids.map((id) => ({ id })), []).market;
  };
  const actor = (market, id) => market.nodes.find((node) => node.id === id);
  const road = (market, id) => market.links.find((link) => [link.from, link.to].includes(id));
  for (const id of ["manipur", "tripura", "arunachal"]) assert.equal(actor(network(1949), id), undefined);
  for (const id of ["manipur", "tripura"]) assert.ok(actor(network(1950), id));
  assert.equal(road(network(1950), "manipur").mode, "road");
  assert.equal(road(network(1954), "tripura"), undefined);
  assert.equal(road(network(1955), "tripura").mode, "road");
  assert.equal(actor(network(1971), "arunachal"), undefined);
  assert.equal(road(network(1972), "arunachal").mode, "road");
  for (const id of ["manipur", "tripura", "arunachal"]) {
    const market = network(1972);
    assert.equal(road(market, id).capacity, 1);
    assert.equal(market.nodes.filter((node) => node.id === id).length, 1);
    assert.equal(actor(network(1972, id), id), undefined);
    assert.ok(inlandActors[id].name && marketHubs[id]);
  }
  // The road tag does not retroactively turn every schematic route into a rail claim.
  assert.equal(network(1972).links.find((link) => link.from === "punjab" && link.to === "delhi").mode, undefined);
  assert.equal(nationalMarketActive({ journey: { preset: "light" } }), false);
});

test("limited northeastern road shipments conserve cash and account for food consumed", async () => {
  const { clearNationalMarket, nationalMarketActors } = await import("./src/national-market.js");
  const game = { year: 1972, journey: { preset: "standard" } };
  const ids = nationalMarketActors(game, { key: "bihar" });
  const states = ["manipur", "tripura", "arunachal"];
  for (const outward of [true, false]) {
    const partners = Object.fromEntries(ids.map((id) => [id, { cash: 8, reserve: 5, shortage: 0 }]));
    partners.assam = { cash: 8, reserve: outward ? 9 : 0, shortage: outward ? 0 : 3 };
    for (const id of states) partners[id] = { cash: 8, reserve: outward ? 0 : 9, shortage: outward ? 2 : 0 };
    const opening = structuredClone(partners);
    const { market, flows } = clearNationalMarket(game, partners, ids.map((id) => ({ id })), ["assam"]);
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
    assert.equal(sum(market.nodes, "cash"), sum(Object.values(opening), "cash"));
    const consumption = sum(Object.values(opening), "shortage") - sum(market.nodes, "shortage");
    assert.equal(sum(Object.values(opening), "reserve") - sum(market.nodes, "reserve"), consumption);
    assert.equal(consumption, 3);
    assert.equal(market.units, 3);
    assert.equal(market.localUnits, 3);
    for (const id of states) {
      const link = market.links.find((row) => [row.from, row.to].includes(id));
      assert.equal(link.units, 1);
      assert.equal(link.mode, "road");
      assert.equal(flows[id][outward ? "bought" : "sold"], 1);
    }
    assert.ok(market.nodes.every((node) => Number.isFinite(node.cash) && node.cash >= 2 && node.reserve >= 0 && node.shortage >= 0));
    assert.deepEqual(partners, opening);
  }
});

test("new northeastern AI preserves legacy reports and resumes with its own carried finances", async () => {
  const { settleNationalTrade } = await import("./src/interregional.js");
  const world = { key: "bihar" };
  const legacyReport = { year: 1971, regional: { nationalMarket: { year: 1971, nodes: [{ id: "assam", cash: 8 }], links: [] } } };
  const game = { year: 1972, seed: 1946, reports: [legacyReport], assets: [], owners: {},
    journey: { preset: "standard", end: 1985, events: {}, partners: {
      manipur: { cash: 18, reserve: 6, works: { freight: { opened: 1965 }, trainingSchool: { opened: 1968 }, processing: { opened: 1971 } } },
      tripura: { cash: 17, reserve: 6, works: { freight: { opened: 1965 }, trainingSchool: { opened: 1968 }, processing: { opened: 1971 } } },
      arunachal: { cash: 16, reserve: 6, works: { freight: { opened: 1965 }, trainingSchool: { opened: 1968 }, processing: { opened: 1971 } } },
    } } };
  const snapshot = JSON.parse(JSON.stringify(game));
  const settle = (state) => settleNationalTrade({ partners: state.journey.partners,
    report: { partners: [], developments: [] } }, state, world);
  const uninterrupted = settle(game);
  assert.deepEqual(settle(JSON.parse(JSON.stringify(game))), uninterrupted);
  assert.deepEqual(game, snapshot);
  assert.deepEqual(game.reports[0], legacyReport);
  for (const id of ["manipur", "tripura", "arunachal"]) {
    const partner = uninterrupted.partners[id];
    const traded = partner.national ?? {};
    assert.equal(partner.cash, partner.openingCash + partner.funding.allocation + partner.development.trainingReceipts +
      partner.development.processingReceipts - partner.developmentSpend + (traded.sold ?? 0) - (traded.bought ?? 0));
    assert.equal(uninterrupted.report.nationalMarket.nodes.filter((node) => node.id === id).length, 1);
    assert.equal(partner.routeCapacity, 1);
    assert.equal(partner.mode, "road");
    const node = uninterrupted.report.nationalMarket.nodes.find((node) => node.id === id);
    assert.ok(node.works.find(({ id }) => id === "trainingSchool").effect.includes("Road freight limit: 1 load/year"));
    const route = uninterrupted.report.nationalMarket.links.find(({ from, to }) => from === id || to === id);
    assert.equal(route.capacity, 1);
    assert.equal(route.mode, "road");
  }
  assert.equal(uninterrupted.partners.manipur.development.trainingReceipts, 3);
  assert.equal(uninterrupted.partners.manipur.development.processingReceipts, 5);
  assert.equal(uninterrupted.partners.manipur.development.workforceCapacity, 2);
  const next = { ...game, year: 1973, journey: { ...game.journey, partners: uninterrupted.partners } };
  assert.deepEqual(settle(next), settle(JSON.parse(JSON.stringify(next))));
  const light = { ...game, journey: { ...game.journey, preset: "light" } };
  const regional = { partners: {}, report: { partners: [] } };
  assert.equal(settleNationalTrade(regional, light, world), regional);

  const isolated = { ...game, year: 1954, journey: { ...game.journey, partners: {
    tripura: { cash: 17, reserve: 6, works: { freight: { opened: 1952 }, trainingSchool: { opened: 1953 } } },
  } } };
  const beforeRoad = settle(isolated);
  assert.equal(beforeRoad.partners.tripura.routeCapacity, undefined);
  assert.equal(beforeRoad.partners.tripura.mode, undefined);
  assert.ok(!beforeRoad.report.nationalMarket.nodes.find(({ id }) => id === "tripura").works.some(({ effect }) => effect.includes("Road freight limit")));
});

test("Assam sees the bounded road partners only when their routes become available", async () => {
  const { neighborsFor, resolveNeighbors, settleNationalTrade, settleNeighborTrade } = await import("./src/interregional.js");
  const world = { key: "assam", assamTransition: {} };
  const initial = { year: 1954, seed: 1946, cash: 100, reserve: 0, assets: [], owners: {}, reports: [],
    journey: { preset: "standard", end: 1985, events: {}, partners: {
      tripura: { cash: 41, reserve: 8, works: { storage: { opened: 1953 }, freight: { opened: 1953 } } },
    }, agreements: {}, jointProjects: {}, jurisdiction: {} } };
  const at = (year, preset = "standard") => neighborsFor(world, { ...initial, year, journey: { ...initial.journey, preset } });
  const ids = (year, preset) => at(year, preset).map(({ id }) => id);
  assert.ok(!ids(1949).includes("manipur"));
  assert.ok(ids(1950).includes("manipur"));
  assert.ok(!ids(1954).includes("tripura"));
  assert.ok(ids(1955).includes("tripura"));
  assert.ok(!ids(1971).includes("arunachal"));
  assert.ok(ids(1972).includes("arunachal"));
  assert.ok(!ids(1972, "light").some((id) => ["manipur", "tripura", "arunachal"].includes(id)));
  for (const neighbor of at(1972).filter(({ id }) => ["manipur", "tripura", "arunachal"].includes(id))) {
    assert.equal(neighbor.routeCapacity, 1);
    assert.equal(neighbor.mode, "road");
  }
  const economy = { harvest: 20, demand: 10, towns: 6, monsoon: "Typical monsoon" };
  const resolved1954 = resolveNeighbors(initial, world, economy);
  assert.ok(!resolved1954.report.partners.some(({ id }) => id === "tripura"));
  const national1954 = settleNationalTrade(settleNeighborTrade(resolved1954, { bought: 0, sold: 0, buyPrice: 1 }), initial, world);
  assert.ok(national1954.report.nationalMarket.nodes.some(({ id }) => id === "tripura"));
  const carried = national1954.partners.tripura;
  const next = { ...initial, year: 1955, journey: { ...initial.journey, partners: national1954.partners } };
  const resolved1955 = resolveNeighbors(next, world, economy);
  const local = resolved1955.report.partners.find(({ id }) => id === "tripura");
  assert.equal(local.openingCash, carried.cash);
  assert.deepEqual(local.works, carried.works);
  const national1955 = settleNationalTrade(settleNeighborTrade(resolved1955, { bought: 0, sold: 0, buyPrice: 1 }), next, world);
  assert.equal(national1955.partners.tripura.cash, local.cash);
  assert.ok(national1955.report.nationalMarket.links.every(({ from, to }) => from !== "assam" && to !== "assam"));
  assert.equal(national1955.report.nationalMarket.nodes.find(({ id }) => id === "tripura").local, true);
});

test("Assam road limits survive compacts, shared reserves and expanded freight facilities", async () => {
  const { contractRivalBid } = await import("./src/neighbor-competition.js");
  const { jointProjectOffers, neighborsFor, partnerOffers, resolveNeighbors, settleNeighborTrade, settleNationalTrade, settleFreight } = await import("./src/interregional.js");
  const world = { key: "assam", assamTransition: {} };
  const ids = ["manipur", "tripura", "arunachal"];
  const works = { storage: { opened: 1965 }, freight: { opened: 1965 }, loadingYard: { opened: 1966 },
    trainingSchool: { opened: 1967 }, processing: { opened: 1970 } };
  const makeGame = (kind) => ({ year: 1972, seed: 1946, cash: 100, reserve: 0, assets: [], owners: {}, reports: [],
    journey: { preset: "standard", end: 1985, events: {}, jurisdiction: {},
      partners: Object.fromEntries(ids.map((id) => [id, { cash: 100, reserve: 18, works: structuredClone(works) }])),
      agreements: Object.fromEntries(ids.map((id) => [id, { kind, title: "Road agreement" }])),
      jointProjects: Object.fromEntries(ids.map((id) => [id, { kind: kind === "supply" ? "reserve" : "freight", completionYear: 1969 }])),
    } });
  for (const kind of ["supply", "corridor"]) {
    const game = makeGame(kind);
    const economy = { harvest: kind === "supply" ? 0 : 40, demand: 20, towns: 8,
      monsoon: "Typical monsoon", connectedWorkshops: 3, freightTerminals: 2 };
    const regional = resolveNeighbors(game, world, economy);
    const settled = settleNeighborTrade(regional, { bought: 99, sold: 99, buyPrice: 2 });
    for (const id of ids) {
      const row = settled.report.partners.find((candidate) => candidate.id === id);
      assert.equal(row.routeCapacity, 1);
      assert.equal(row.mode, "road");
      assert.equal(row.emergencyFood + row.bought + row.sold, 1);
      assert.ok(row.offer <= 1 && row.request <= 1);
      assert.equal(regional.freight.partners.find((candidate) => candidate.id === id).capacity, 1);
      assert.equal(contractRivalBid(row).capacity, 1);
      assert.equal(contractRivalBid(row, 1976).capacity, 1);
      if (kind === "supply") {
        assert.equal(row.emergencyFood, 1);
        assert.equal(row.bought + row.sold, 0);
      }
    }
    const final = settleFreight(settleNationalTrade(settled, game, world), game);
    for (const id of ids) {
      const carrier = final.report.freightCompetition.partners.find((candidate) => candidate.id === id);
      assert.ok(carrier.loads <= 1);
      assert.equal(final.partners[id].routeCapacity, 1);
      const node = final.report.nationalMarket.nodes.find((candidate) => candidate.id === id);
      assert.ok(node.works.find(({ id }) => id === "storage").effect.includes("Food road limit: 1 unit/year"));
      assert.ok(node.works.find(({ id }) => id === "trainingSchool").effect.includes("Road freight limit: 1 load/year"));
    }
  }
  const unsigned = makeGame("supply");
  unsigned.journey.agreements = {};
  unsigned.journey.jointProjects = {};
  const offers = partnerOffers(unsigned, world).filter(({ partner }) => ids.includes(partner));
  assert.ok(offers.every(({ detail }) => detail.includes("Road limit: 1 unit a year") && !detail.includes("one extra food unit") && detail.length < 160));
  for (const neighbor of neighborsFor(world, unsigned).filter(({ id }) => ids.includes(id))) {
    assert.ok(neighbor.works.find(({ id }) => id === "storage").effect.includes("Food road limit: 1 unit/year"));
    assert.ok(neighbor.works.find(({ id }) => id === "trainingSchool").effect.includes("Road freight limit: 1 load/year"));
    assert.ok(!neighbor.works.some(({ effect }) => effect.includes("adds 1 freight bid capacity") || effect.includes("offer one more unit")));
  }
  const signed = makeGame("supply");
  signed.journey.jointProjects = {};
  const joint = jointProjectOffers(signed, world).filter(({ partner }) => ids.includes(partner));
  assert.ok(joint.length === 3 && joint.every(({ effect }) => effect.includes("up to 1 available food unit")));

  const scarce = makeGame("corridor");
  for (const id of ids) Object.assign(scarce.journey.partners[id], { reserve: 0, population: 20, works: {} });
  const buying = resolveNeighbors(scarce, world, { harvest: 40, demand: 20, towns: 8, monsoon: "Severe flood" });
  const supplied = settleNeighborTrade(buying, { bought: 0, sold: 99, buyPrice: 2 });
  for (const id of ids) {
    const row = supplied.report.partners.find((candidate) => candidate.id === id);
    assert.equal(row.bought, 1);
    assert.equal(row.sold + row.emergencyFood, 0);
    assert.equal(row.works.loadingYard, undefined);
  }
  const noYards = makeGame("corridor");
  for (const id of ids) delete noYards.journey.partners[id].works.loadingYard;
  const stable = resolveNeighbors(noYards, world, { harvest: 40, demand: 20, towns: 8, monsoon: "Typical monsoon" });
  for (const id of ids) {
    const row = stable.report.partners.find((candidate) => candidate.id === id);
    assert.equal(row.shortage, 0);
    assert.ok(row.cash >= 14 && row.works.freight.opened);
    assert.equal(row.works.loadingYard, undefined, "An affordable yard cannot improve a one-capacity road");
  }
  const due = makeGame("corridor");
  for (const id of ids) due.journey.partners[id].works.trainingSchool = { started: 1970, completionYear: 1972, cost: 12 };
  const openings = resolveNeighbors(due, world, { harvest: 40, demand: 20, towns: 8, monsoon: "Typical monsoon" });
  const schoolOpenings = openings.report.developments.filter(({ partner, id }) => ids.includes(partner) && id === "trainingSchool");
  assert.equal(schoolOpenings.length, 3);
  assert.ok(schoolOpenings.every(({ effect }) => effect.includes("Road freight limit: 1 load/year")));
});
