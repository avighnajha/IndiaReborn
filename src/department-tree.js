import { Campaign } from "./campaign.js";
import { departmentTracks } from "./department-content.js";
import { departmentFacility } from "./department-icons.js";
import { Fiscal } from "./fiscal.js";
import { activeProgramme, programmeCommissioned, programmeFootprint, programmeQuote, programmeRequirements, programmes } from "./programmes.js";
import { World } from "./scenario.js";
import { apprenticeshipOutput, charterOpening, extensionYield } from "./training.js";
import { campaignPriceYear, openingPriceYear, periodAmount } from "./period-prices.js";

const money = Fiscal.lakh;
const years = (count) => `${count} ${count === 1 ? "year" : "years"}`;
const quantity = (count, unit, plural = `${unit}s`) => count ? `${count} ${count === 1 ? unit : plural}` : "";
const pair = (...parts) => parts.filter(Boolean).join(" · ");

const facilityMetrics = {
  school: (count) => `+${count("school") * 7} Skills at maturity`,
  college: (count) => `+${count("college") * 6} Skills · +${count("college")} output per linked workshop`,
  university: () => "+8 Skills · +1 output per linked workshop",
  engineering: () => "+4 Skills · +2 output per linked workshop",
  research: () => "+4 Skills · +3 food per year",
  apprenticeships: () => `+${apprenticeshipOutput} output per served workshop`,
  extension: () => `+${extensionYield} food per served growing area`,
  irrigation: (count) => pair(quantity(count("irrigation"), "irrigated area"), `+${count("granary") * 10} food storage`),
  flood: (count) => pair(quantity(count("levee"), "embankment"), quantity(count("irrigation"), "irrigated area"), quantity(count("power"), "power station"),
    quantity(count("granary"), "reserve store"), quantity(count("freightTerminal"), "freight terminal")),
  tank: (count) => pair(quantity(count("irrigation"), "irrigated area"), `+${count("granary") * 10} food storage`),
  depot: () => "+18 food storage",
  canals: () => "+2 food per year · recovers up to 4 weather losses",
  road: (count) => pair(quantity(count("road"), "road link"), quantity(count("mill"), "workshop")),
  workshop: (count) => quantity(count("mill"), "new workshop"),
  jute: () => "Restores output at jute mills",
  trainingWorkshop: (count) => pair(quantity(count("mill"), "new workshop"), quantity(count("school"), "technical school")),
  freight: (_count, year) => `Up to ${money(periodAmount(8, openingPriceYear, year))} at current rates · +3 food import capacity`,
  industrialPark: () => "+3 output per linked workshop",
};

function facilityPresentation(id, footprint = [], year = openingPriceYear) {
  const facility = departmentFacility(id);
  if (!facility) return {};
  const count = (kind) => footprint.filter((work) => work.kind === kind).length;
  return { facility: facility.label, icon: facility.icon, metric: facility.metric ?? facilityMetrics[facility.icon](count, year) };
}

const programmeLockHints = {
  "Available in a founding campaign.": "Founding campaign only",
  "This programme requires a different territorial settlement.": "Territorial settlement required",
  "Campaign complete.": "Campaign complete",
  "Already commissioned.": "Already commissioned",
  "These works are already under construction.": "Works already under way",
  "Part of this programme lies outside your administration.": "Outside your administration",
  "The works office is delivering another programme.": "Works office busy",
  "This programme would finish after the campaign.": "Too late to finish",
  "The basin and resettlement survey is required.": "Survey required",
  "The treasury cannot cover this commitment yet.": "Insufficient funds",
};

function programmeLockHint(reason, requirements) {
  if (Object.hasOwn(programmeLockHints, reason)) return programmeLockHints[reason];
  const missing = requirements.find(({ met }) => !met);
  if (!missing) return "";
  if (missing.text.endsWith("operating schools")) return `Needs ${missing.text}`;
  const facilities = new Set(missing.ids.map((id) => departmentFacility(id)?.label).filter(Boolean));
  return facilities.size === 1 ? `Needs ${[...facilities][0]}` : "Needs prior works";
}

const charterLockHints = {
  [`Charters open in ${charterOpening}.`]: `Opens ${charterOpening}`,
  "Two schools must each have a full year of teaching behind them.": "Needs 2 mature schools",
  "Connect an operating workshop to a market.": "Needs a linked workshop",
  "Open at least one irrigated growing area.": "Needs irrigation",
  "The treasury cannot cover the setup cost.": "Insufficient funds",
  "A new charter needs a year to prepare.": "Too late to open",
};

function charterNode(id, tier, training) {
  const option = training.options.find(({ id: path }) => id === path);
  if (!option) return null;
  const nodeId = `charter:${id}`;
  const status = option.selected ? (training.status === "preparing" ? "active" : "completed") : option.reason ? "locked" : "available";
  return {
    id: nodeId, tier, title: option.title, ...facilityPresentation(nodeId),
    description: option.effects.join(" "),
    requires: `Two established schools, eligible works and ${charterOpening} or later`,
    prerequisites: ["skills", "northSkills", "orissa_skills", "mh_skills", "gj_skills", "pb_skills", "hr_skills", "tn_skills", "ap_skills"],
    price: `${money(option.cost)} setup · ${money(option.upkeep)}/yr`,
    time: status === "active" ? "Opens next year" : option.selected ? "" : "1 year to open",
    status, statusLabel: option.selected ? (training.status === "paused" ? "Paused" : status === "active" ? "Preparing" : "Adopted") : training.charter ? "Other charter chosen" : status === "available" ? "Available" : "Locked",
    lockHint: status === "locked" ? charterLockHints[option.reason] : "",
    detail: option.selected ? training.message : option.reason ?? "This charter opens next year and stays with this campaign.",
    actionLabel: "Review charter",
  };
}

function programmeNode(game, id, tier, current) {
  const plan = programmes[id];
  const quote = programmeQuote(game, id);
  const record = game.programmes.find((entry) => entry.id === id);
  const requirements = programmeRequirements(game, id);
  const delivered = programmeCommissioned(game, id);
  const status = delivered ? "completed" : current?.id === id ? "active" : quote.reason ? "locked" : "available";
  const statusLabel = { completed: "Operating", active: "Building", locked: "Locked", available: "Available" }[status];
  const cost = record?.cost ?? quote.cost ?? plan.cost;
  const price = Number.isFinite(cost) ? `${money(cost)}${record ? " committed" : ""}` : "";
  const duration = quote.duration ?? Math.max(...plan.works.map(({ year }) => year));
  const time = status === "active" ? `${years(record.finish - game.year + 1)} left` : record || delivered || !duration ? "" : years(duration);
  const detail = delivered ? (record ? `Delivered ${record.finish}.` : "The required works are operating.") : status === "active" ? `Final phase due ${record.finish}.` : quote.reason ?? `${money(game.cash - quote.cost)} stays in the treasury after approval.`;
  const facility = facilityPresentation(id, programmeFootprint(game, id), campaignPriceYear(game));
  if (facility.icon === "freight" && game.journey?.preset === "standard") facility.metric += " · +3 bid capacity when linked";
  return {
    id, tier, title: plan.title, district: plan.district, ...facility,
    description: plan.effect ?? plan.outcome, status, statusLabel, price, time, detail,
    lockHint: status === "locked" ? programmeLockHint(quote.reason, requirements) : "",
    requires: requirements.map(({ text, ids }) => requirements.length > 1 && ids.length > 1 ? `(${text})` : text).join(" + "),
    prerequisites: requirements.flatMap(({ ids }) => ids),
    actionLabel: status === "completed" ? "View works" : "Review programme",
  };
}

export function developmentTrees(game) {
  const training = Campaign.training(game);
  const intake = Campaign.technicalIntake(game);
  const current = activeProgramme(game);
  return departmentTracks(World, game).map(({ tiers, ...track }) => {
    const nodes = tiers.flatMap((ids, index) => ids.map((id) => id.startsWith("charter:")
      ? charterNode(id.slice("charter:".length), index + 1, training)
      : programmeNode(game, id, index + 1, current)).filter(Boolean));
    if (track.id === "education" && intake) {
      const status = intake.award ? game.year <= intake.first ? "active" : "completed"
        : intake.options.some(({ reason }) => !reason) ? "available" : "locked";
      nodes.push({
        id: "technical-intake", tier: 2, title: "Technical training intake", icon: "school",
        metric: "Match mature schools with linked workshops",
        status, statusLabel: intake.award ? status === "active" ? "Funded" : "Enrolled" : status === "available" ? "Applications open" : intake.status === "notice" ? `Apply in ${intake.deadline}` : "Review requirements",
        actionLabel: "Review intake",
      });
    }
    return { ...track, nodes };
  });
}
