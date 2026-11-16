import { World } from "./scenario.js";

const notice = 1950;
export const intakeDeadline = 1956;
const first = 1958;
const last = 1962;
const stateShare = 8;
const equipmentShare = 12;
const schoolSkills = 2;
const placementOutput = 3;
const counts = [1, 2];

export function intakeStatus(game) {
  if (!game.journey || game.year < notice) return null;
  if (game.journey.technicalIntake) return "signed";
  if (game.year === intakeDeadline) return "open";
  return game.year < intakeDeadline ? "notice" : null;
}

export function matureSchools(game, schools) {
  return schools.filter(({ completed }) => completed <= game.year - 2);
}

function location(hex) {
  const tile = World.tiles[hex];
  return { hex, name: tile.town?.name ?? World.districts[tile.district] };
}

function districtDistance(school, workshop) {
  const a = World.tiles[school];
  const b = World.tiles[workshop];
  const x = (tile) => tile.q + (tile.r % 2) / 2;
  return (x(a) - x(b)) ** 2 + (a.r - b.r) ** 2 * 0.75;
}

function matchSites(schools, workshops) {
  const candidates = [...new Set(schools.map(({ hex }) => hex))].flatMap((school) =>
    [...new Set(workshops.map(({ hex }) => hex))].map((workshop) => ({ school, workshop, distance: districtDistance(school, workshop) })));
  candidates.sort((a, b) => a.distance - b.distance);
  const pairs = [];
  for (const { school, workshop } of candidates) {
    if (pairs.some((pair) => pair.school === school || pair.workshop === workshop)) continue;
    pairs.push({ school, workshop });
    if (pairs.length === counts.at(-1)) break;
  }
  return pairs;
}

export function intakePlan(game, schools, workshops, pending) {
  const status = intakeStatus(game);
  if (!status) return null;
  const award = game.journey.technicalIntake ?? null;
  const placements = award?.pairs ?? matchSites(schools, workshops);
  const reason = status === "notice" ? `Applications open in ${intakeDeadline}.`
    : pending ? "Settle this year’s pending decision before applying."
      : !schools.length && !award ? "Open a technical school by the end of 1954."
        : !workshops.length && !award ? "Open a market-linked workshop before applying." : null;
  return {
    year: game.year, notice, deadline: intakeDeadline, first, last, status, reason, award,
    schools: new Set(schools.map(({ hex }) => hex)).size, workshops: new Set(workshops.map(({ hex }) => hex)).size,
    pairs: placements.map(({ school, workshop }) => ({ school: location(school), workshop: location(workshop) })),
    options: award ? [] : counts.map((count) => ({
      count, state: count * stateShare, union: count * equipmentShare, skills: count * schoolSkills, output: count * placementOutput,
      reason: reason ?? (placements.length < count ? `Needs ${count} distinct schools and linked workshops.`
        : game.cash < count * stateShare ? "Treasury cannot cover the state share." : null),
    })),
    latest: game.reports.at(-1)?.technicalIntake ?? null,
  };
}

export function enrollIntake(game, plan, count) {
  if (plan?.status !== "open") return game;
  const option = plan.options.find((offer) => offer.count === count);
  if (!option || option.reason) return game;
  const { state, union } = option;
  const pairs = plan.pairs.slice(0, count).map(({ school, workshop }) => ({ school: school.hex, workshop: workshop.hex }));
  return { ...game, cash: game.cash - state, journey: { ...game.journey, technicalIntake: { count, state, union, pairs } } };
}

export function intakeEffects(game, schools, workshops) {
  const award = game.journey?.technicalIntake;
  if (!award) return null;
  const schoolSites = new Set(schools.map(({ hex }) => hex));
  const linked = new Set(workshops.map(({ hex }) => hex));
  const retained = game.year < first ? [] : award.pairs.filter(({ school }) => schoolSites.has(school));
  const placements = game.year > last ? [] : retained.filter(({ workshop }) => linked.has(workshop));
  return {
    year: game.year, first, last, skills: retained.length * schoolSkills,
    schools: retained.map(({ school }) => ({ ...location(school), skills: schoolSkills })),
    sites: placements.map(({ workshop }) => location(workshop)),
    output: placements.length * placementOutput,
    state: game.year === intakeDeadline ? award.state : 0, union: game.year === intakeDeadline ? award.union : 0,
  };
}

export { placementOutput };
