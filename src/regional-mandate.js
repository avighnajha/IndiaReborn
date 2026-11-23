import { campaignEnd } from "./journey.js";

const opens = 1974;
const closes = 1979;
const starts = 1981;
const ends = 1985;
const qualifyingYears = 4;
const farmSupportTarget = 3;
const productionGainTarget = 6;

const mandates = {
  food: {
    label: "Food resilience",
    description: "Keep harvests and reserves strong with active farm support.",
    guidance: `A year counts if harvest covers demand, reserves cover half a year's needs, and Food & Water or agricultural extension adds or saves at least ${farmSupportTarget} food.`,
    signature: "Regional water network",
  },
  education: {
    label: "A trained workforce",
    description: "Train new cohorts and put applied research to work.",
    guidance: "Fund five teaching years per cohort. It enters service the following year. A teaching charter unlocks the final research tier.",
    signature: "Research institute",
  },
  trade: {
    label: "An industrial region",
    description: "Grow workshops through training and production services.",
    guidance: `A year counts when workshops reach the output target and at least ${productionGainTarget} output comes from trained cohorts, the Trade & Industry priority, or both.`,
    signature: "Industrial park",
  },
};

function conditions(id, outputTarget) {
  const outcome = id === "food" ? { label: "Reserve-ready years", target: qualifyingYears }
    : id === "education" ? { label: "New cohorts in service since signing", target: 4 }
      : { label: `Years with ${outputTarget}+ workshop output`, target: qualifyingYears };
  return [outcome, { label: `${mandates[id].signature} in service`, target: 1 }];
}

function farmSupport({ cabinetPriority, training }) {
  return (cabinetPriority?.food ?? 0) + (cabinetPriority?.recovered ?? 0) + (training?.food ?? 0) + (training?.recovered ?? 0);
}

function productionGain({ cabinetPriority }) {
  return (cabinetPriority?.trainingOutput ?? 0) + (cabinetPriority?.tradeOutput ?? 0);
}

function foodReady(report) {
  return !report.shortage && report.harvest >= report.demand && report.reserve >= Math.ceil(report.demand / 2) && farmSupport(report) >= farmSupportTarget;
}

function tradeReady(report, outputTarget) {
  return report.output >= outputTarget && productionGain(report) >= productionGainTarget;
}

function yearEvidence(id, report, previous, chosen, outputTarget) {
  if (id === "education") {
    const entering = previous?.year >= chosen ? previous.cabinetPriority?.newGraduates ?? 0 : 0;
    return entering ? `${entering} new ${entering === 1 ? "cohort entered" : "cohorts entered"} service in ${report.year}.` : "";
  }
  if (report.year < starts) return "";
  if (id === "food") {
    return `${report.year} ${foodReady(report) ? "qualified" : "did not qualify"}. Harvest ${report.harvest}/${report.demand} · Reserve ${report.reserve}/${Math.ceil(report.demand / 2)} · Farm support ${farmSupport(report)}/${farmSupportTarget}.`;
  }
  return `${report.year} ${tradeReady(report, outputTarget) ? "qualified" : "did not qualify"}. Output ${report.output} (target ${outputTarget}) · Service gains +${productionGain(report)} (target +${productionGainTarget}).`;
}

export function regionalMandate(game, outputGoal, facilities = {}) {
  const term = game.journey?.mandate;
  const year = game.year;
  const available = Boolean(game.journey) && campaignEnd(game) === ends && year >= opens && year <= closes && !term;
  const outputTarget = Math.ceil(outputGoal * 1.5);
  const options = available ? Object.entries(mandates).map(([id, definition]) => ({
    id, ...definition, conditions: conditions(id, outputTarget),
  })) : [];
  const progress = term ? game.reports.at(-1)?.regionalMandate ?? {
    id: term.id, label: mandates[term.id].label, guidance: mandates[term.id].guidance,
    year: term.chosen, starts, ends, complete: false, achieved: false,
    metrics: conditions(term.id, term.outputTarget).map((metric, index) => {
      const value = index === 1 ? Number(facilities[term.id] > 0) : 0;
      return { ...metric, value, met: value >= metric.target };
    }),
  } : null;
  return { available, options, progress, year, opens, closes, starts, ends };
}

export function adoptRegionalMandate(game, id, outputGoal) {
  const option = regionalMandate(game, outputGoal).options.find((candidate) => candidate.id === id);
  if (!option) return game;
  return {
    ...game,
    journey: { ...game.journey, mandate: { id, chosen: game.year, outputTarget: Math.ceil(outputGoal * 1.5) } },
  };
}

export function recordRegionalMandate(game, report, facilities) {
  const term = game.journey?.mandate;
  if (!term) return null;
  const { id, chosen, outputTarget } = term;
  const { year } = report;
  const definition = mandates[id];
  const recent = [...game.reports, report].filter((entry) => entry.year >= starts && entry.year <= ends);
  const outcome = id === "food"
    ? recent.filter(foodReady).length
    : id === "education"
      ? game.reports.filter((entry) => entry.year >= chosen && entry.year < year)
        .reduce((total, entry) => total + (entry.cabinetPriority?.newGraduates ?? 0), 0)
      : recent.filter((entry) => tradeReady(entry, outputTarget)).length;
  const values = [outcome, Number(facilities[id] > 0)];
  const metrics = conditions(id, outputTarget).map((metric, index) => ({
    ...metric, value: values[index], met: values[index] >= metric.target,
  }));
  return {
    id, label: definition.label, year, starts, ends, complete: year === ends,
    achieved: metrics.every(({ met }) => met), metrics, guidance: definition.guidance,
    yearNote: yearEvidence(id, report, game.reports.at(-1), chosen, outputTarget),
  };
}
