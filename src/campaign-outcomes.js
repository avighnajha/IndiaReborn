import { departmentBadge } from "./department-presentation.js";

function average(reports, measure) {
  return reports.reduce((total, report) => total + measure(report), 0) / reports.length;
}

function period(reports) {
  return {
    label: `${reports[0].year}–${reports.at(-1).year}`,
    reserveMonths: average(reports, ({ reserve, demand }) => demand > 0 ? 12 * reserve / demand : 0),
    skills: average(reports, ({ skills }) => skills),
    output: average(reports, ({ output }) => output),
  };
}

export function campaignOutcomes(reports, recent) {
  const servicedContracts = reports.map(({ regional }) => regional?.freightContract)
    .filter((contract) => contract?.winner?.id === "player" && contract.payment > 0);
  const latest = recent.at(-1);
  const droughtReports = reports.filter(({ foodCrisis }) => foodCrisis);
  return {
    opening: period(reports.slice(0, recent.length)),
    closing: period(recent),
    unionShipments: reports.reduce((total, report) => total + (report.unionReserve?.shipped ?? 0), 0),
    droughtYears: droughtReports.length,
    droughtYearsCovered: droughtReports.filter(({ shortage }) => !shortage).length,
    cohorts: (latest.cabinetPriority?.graduates ?? 0) - (latest.cabinetPriority?.newGraduates ?? 0),
    researchOutput: average(recent, ({ development }) => development?.researchOutput ?? 0),
    linkedWorkshops: latest.siteEconomy?.workshops?.filter(({ market }) => market > 0).length,
    freightTerms: new Set(servicedContracts.map(({ start }) => start)).size,
    freightYears: servicedContracts.length,
  };
}

const format = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const count = (value, singular, plural = `${singular}s`) => `${value} ${value === 1 ? singular : plural}`;

export function campaignOutcomesMarkup(reports, recent, secureYears) {
  const outcome = campaignOutcomes(reports, recent);
  const { opening, closing, unionShipments, droughtYears, droughtYearsCovered, cohorts, researchOutput, linkedWorkshops, freightTerms, freightYears } = outcome;
  const latest = recent.at(-1);
  const card = (sector, metric, label, facts) => {
    const max = Math.max(1, opening[metric], closing[metric]);
    const comparison = [opening, closing].map((entry) => `<div class="outcome-period">
      <span>${entry.label}</span><span class="outcome-bar" aria-hidden="true"><i style="--extent:${100 * entry[metric] / max}%"></i></span><strong>${format.format(entry[metric])}</strong>
    </div>`).join("");
    return `<section class="outcome-card" data-sector="${sector}"><h3>${departmentBadge(sector)}</h3><p>${label}</p>
      ${comparison}<ul>${facts.filter(Boolean).map((fact) => `<li>${fact}</li>`).join("")}</ul></section>`;
  };
  return `<section class="campaign-outcomes" aria-labelledby="campaign-outcomes-title">
    <h3 id="campaign-outcomes-title">The region you leave behind</h3>
    <p>Five-year averages for your administration at the start and finish. Borders may have changed during the campaign.</p>
    <div class="outcome-grid">
      ${card("food", "reserveMonths", "Months of demand covered by food reserves", [
        `${secureYears} of ${recent.length} final years food-secure`,
        droughtYears && `${droughtYearsCovered} of ${droughtYears} drought years food-secure in 1965–66`,
        unionShipments && `${count(unionShipments, "food unit")} supplied to the Union`,
      ])}
      ${card("education", "skills", "Skills in service", [
        cohorts && `${count(cohorts, "trained cohort")} in service in ${latest.year}`,
        researchOutput && `+${format.format(researchOutput)} output per year from research at the finish`,
      ])}
      ${card("trade", "output", "Annual workshop output", [
        linkedWorkshops !== undefined ? `${count(linkedWorkshops, "linked workshop")} in ${latest.year}` : `${count(latest.towns, "market town")} in ${latest.year}`,
        freightTerms && `${count(freightTerms, "Union freight term")} served over ${count(freightYears, "year")}`,
      ])}
    </div>
  </section>`;
}
