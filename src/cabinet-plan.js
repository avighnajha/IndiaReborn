import { campaignEnd } from "./journey.js";
import { bulkFreightOnTurn, upcomingFreightContract } from "./neighbor-competition.js";

export const cabinetPlanOpening = 1951;
export const cabinetPlanRate = .30;
const teachingYearsPerCohort = 5;
const labels = { education: "Education", food: "Food & Water", trade: "Trade & Industry", services: "Normal services" };

const whole = (value) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const yearsAt = (record) => whole(record?.years);
const cohortsAt = (record) => Math.floor(yearsAt(record) / teachingYearsPerCohort);
const unique = (sites = []) => [...new Map(sites.filter(({ hex }) => typeof hex === "string" && hex.length)
  .map((site) => [site.hex, site])).values()];

function facilities(game, context = {}) {
  return {
    education: unique(context.education).filter(({ completed }) => completed === undefined || completed < game.year),
    food: unique(context.farms),
    trade: unique(context.workshops),
  };
}

function ownedCohorts(education, progress) {
  return education.reduce((total, { hex }) => total + cohortsAt(progress[hex]), 0);
}

function currentTerm(game) {
  const term = game.journey?.cabinet?.term;
  return term && Object.hasOwn(labels, term.id) && term.id !== "services" && game.year >= cabinetPlanOpening &&
    game.year >= term.starts && game.year <= term.ends && game.year <= campaignEnd(game) ? term : null;
}

function annualCost(finance, rate = cabinetPlanRate) {
  return Math.max(1, Math.round(Math.max(0, finance?.total ?? 0) * rate));
}

function fundingStatus(game, term, finance, sites, context) {
  const due = annualCost(finance, term.rate ?? cabinetPlanRate);
  if (!sites[term.id].length) return { annualCost: due, spent: 0, status: "paused", message: "No eligible operating sites remain in your administration." };
  if (game.cash - Math.max(0, context.reservedCash ?? 0) < due) return {
    annualCost: due, spent: 0, status: "paused", message: "Set aside this year’s appropriation after the training charter. No priority benefit or charge while paused.",
  };
  return { annualCost: due, spent: due, status: "funded", message: "This year’s appropriation is reserved before emergency food purchases." };
}

function effectsFor(id, sites, bulk) {
  if (id === "education") return ["5 funded years → +2 lasting Skills per campus.", "+1 linked-workshop output per cohort, from the next year."];
  if (id === "food") return [`+${sites.food.length} food a year from irrigated areas.`, "Recover up to 2 remaining weather losses per area."];
  if (id === "trade") return ["+3 output per linked workshop while funded.", bulk
    ? "Fund Trade in 1981 to bid for bulk freight, then each year to carry it."
    : "Extra production earns recurring workshop receipts."];
  return ["Existing works keep their normal services.", "Keep funds available for construction and food."];
}

export function cabinetPlan(game, finance, context = {}) {
  const sites = facilities(game, context);
  const progress = game.journey?.cabinet?.education ?? {};
  const end = campaignEnd(game);
  const available = Boolean(game.journey) && game.year >= cabinetPlanOpening && game.year <= end;
  const term = available ? currentTerm(game) : null;
  const ends = Math.min(game.year + 4, end);
  const termYears = Math.max(0, ends - game.year + 1);
  const timingReason = !game.journey ? "Available in a founding campaign."
    : game.year > end ? "Campaign complete."
      : game.year < cabinetPlanOpening ? `Priorities open in ${cabinetPlanOpening}.` : null;
  const lockReason = term ? `Committed through ${term.ends}.` : null;
  const cost = annualCost(finance);
  const bulk = upcomingFreightContract(game)?.bulk || bulkFreightOnTurn(game);
  const options = Object.entries(labels).map(([id, label]) => {
    const selected = term ? term.id === id : id === "services";
    let reason = timingReason ?? lockReason;
    if (!reason && id !== "services") {
      if (!sites[id].length) reason = id === "education" ? "Open an education campus for a full year."
        : id === "food" ? "Open an irrigated growing area." : "Open a market-linked workshop.";
      else if (id === "education" && !sites.education.some(({ hex }) =>
        teachingYearsPerCohort - yearsAt(progress[hex]) % teachingYearsPerCohort <= termYears &&
        game.year + teachingYearsPerCohort - yearsAt(progress[hex]) % teachingYearsPerCohort <= end)) {
        reason = "No cohort can enter service before the campaign ends.";
      } else if (game.cash - Math.max(0, context.reservedCash ?? 0) < cost) {
        reason = "Set aside the first year’s appropriation after the training charter.";
      }
    }
    return { id, label, annualCost: id === "services" ? 0 : selected && term ? annualCost(finance, term.rate ?? cabinetPlanRate) : cost,
      ends: term?.ends ?? ends, effects: effectsFor(id, sites, bulk), reason, selected,
      actionLabel: id === "services" ? "Keep normal services" : selected ? "Committed" : `Commit ${termYears} ${termYears === 1 ? "year" : "years"}` };
  });
  const status = term ? fundingStatus(game, term, finance, sites, context) : null;
  const current = term ? { id: term.id, label: labels[term.id], starts: term.starts, ends: term.ends,
    annualCost: status.annualCost, status: status.status, remaining: term.ends - game.year + 1,
    paidYears: whole(term.paidYears), message: status.message } : null;
  return { year: game.year, available, current, options, graduates: ownedCohorts(sites.education, progress),
    costNote: "30% of each year’s works allocation; the rupee amount can change. No automatic renewal.",
    message: timingReason ?? (term ? "Other priorities remain unavailable until this term ends."
      : ends < game.year + 4 ? `Choose a priority for the final ${termYears} ${termYears === 1 ? "year" : "years"}.`
        : "Choose one five-year priority, or keep normal services."),
  };
}

export function adoptCabinetPlan(game, id, finance, context = {}) {
  const model = cabinetPlan(game, finance, context);
  const option = model.options.find((candidate) => candidate.id === id);
  if (!model.available || !option || option.reason) return game;
  const previous = game.journey.cabinet ?? {};
  const cabinet = { ...previous, education: previous.education ?? {}, term: id === "services" ? null
    : { id, starts: game.year, ends: option.ends, rate: cabinetPlanRate, paidYears: 0 },
    ...(id === "services" ? { declinedYear: game.year } : {}) };
  return { ...game, journey: { ...game.journey, cabinet } };
}

export function resolveCabinetPlan(game, finance, context = {}) {
  const previous = game.journey?.cabinet;
  const cabinet = previous ?? { education: {}, term: null };
  const sites = facilities(game, context);
  const progress = cabinet.education ?? {};
  const before = ownedCohorts(sites.education, progress);
  const term = game.journey ? currentTerm(game) : null;
  const status = term ? fundingStatus(game, term, finance, sites, context) : null;
  const funded = status?.status === "funded";
  const education = { ...progress };
  let newGraduates = 0;
  if (funded && term.id === "education") {
    for (const { hex } of sites.education) {
      const years = yearsAt(progress[hex]) + 1;
      const cohorts = Math.floor(years / teachingYearsPerCohort);
      newGraduates += cohorts - cohortsAt(progress[hex]);
      education[hex] = { ...progress[hex], years, cohorts };
    }
  }
  const graduates = ownedCohorts(sites.education, education);
  const effects = { skills: before * 2, trainingOutputPerWorkshop: before,
    tradeOutputPerWorkshop: funded && term.id === "trade" ? 3 : 0,
    foodPerFarm: funded && term.id === "food" ? 1 : 0, recoverPerFarm: funded && term.id === "food" ? 2 : 0 };
  const paidYears = term ? whole(term.paidYears) + (funded ? 1 : 0) : 0;
  const next = term ? { ...cabinet, education, term: { ...term, paidYears } } : cabinet;
  const report = term || graduates ? {
    id: term?.id ?? null, label: labels[term?.id ?? "services"], starts: term?.starts ?? null, ends: term?.ends ?? null,
    annualCost: status?.annualCost ?? 0, spent: status?.spent ?? 0, status: status?.status ?? "baseline",
    message: status?.message ?? "Earlier teaching cohorts continue to support the economy.", paidYears,
    graduates, newGraduates, ...effects,
    sites: {
      education: sites.education.map(({ hex }) => ({ hex, years: yearsAt(education[hex]), cohorts: cohortsAt(education[hex]),
        graduated: cohortsAt(education[hex]) - cohortsAt(progress[hex]) })),
      food: funded && term.id === "food" ? sites.food.map(({ hex }) => ({ hex })) : [],
      trade: funded && term.id === "trade" || before ? sites.trade.map(({ hex }) => ({ hex })) : [],
    },
  } : null;
  return { cabinet: next, report, effects };
}
