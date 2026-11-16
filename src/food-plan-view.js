import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import "./food-plan-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const units = (value) => `${number.format(value)} ${value === 1 ? "unit" : "units"}`;

function scenarioCard(scenario, demand, reserve) {
  const { name, harvest, reserveUsed, gap, weatherLoss, protectedFood } = scenario;
  const fromHarvest = Math.min(demand, Math.max(0, harvest));
  const coverage = [
    ["harvest", "Harvest used", fromHarvest],
    ["reserve", "Reserves used", reserveUsed],
    ["gap", "Still needed", gap],
  ];
  const details = [
    weatherLoss > 0 ? `${units(weatherLoss)} of weather loss before protection` : "",
    protectedFood > 0 ? `${units(protectedFood)} protected` : "",
    harvest > demand ? `${units(harvest - demand)} in harvest surplus` : "",
    reserveUsed > 0 && reserve > reserveUsed ? `${units(reserve - reserveUsed)} left in reserve` : "",
  ].filter(Boolean);
  return `<article class="food-plan-case" data-food-plan-gap="${gap > 0}">
    <header><h3>${escapeText(name)}</h3><strong>${gap ? `${units(gap)} to cover` : "Needs covered"}</strong></header>
    <div class="food-plan-meter" aria-hidden="true">${coverage.filter(([, , amount]) => amount > 0).map(([source, , amount]) =>
      `<span data-food-source="${source}" style="flex-grow: ${Number(amount)}"></span>`).join("")}</div>
    <dl class="food-plan-sources">${coverage.map(([source, label, amount]) =>
      `<div data-food-source="${source}"><dt>${label}</dt><dd>${number.format(amount)}</dd></div>`).join("")}</dl>
    ${details.length ? `<p class="food-plan-case-note">${details.join(" · ")}</p>` : ""}
  </article>`;
}

export function foodPlanMarkup({ outlook, demand, reserve, cases, cash, authorization }) {
  return `<section class="food-plan" data-sector="food" aria-label="Monsoon food scenarios">
    <header class="food-plan-outlook">
      ${departmentBadge("food")}
      <strong>${escapeText(outlook)}</strong>
      <p><b>${units(demand)}</b> needed <span aria-hidden="true">·</span> <b>${units(reserve)}</b> in state reserves</p>
    </header>
    <div class="food-plan-cases">${cases.map((scenario) => scenarioCard(scenario, demand, reserve)).join("")}</div>
    <p class="food-plan-note">Each scenario includes works due this year. Gaps are shown before shared supplies and purchases.</p>
    <div class="food-plan-purchases">
      <p><b>${Fiscal.lakh(cash)}</b> in treasury${authorization ? ` · ${Fiscal.lakh(authorization)} purchase cap` : ""}</p>
      <p>Emergency purchases cost ₹1–2 lakh per unit. The treasury pays only for food bought.</p>
    </div>
  </section>`;
}
