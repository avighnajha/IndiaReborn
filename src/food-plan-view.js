import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import { crisisSource } from "./food-crisis.js";
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

function crisisOptions(crisis, forecast, reserve) {
  const { ordered, possible, rate, capacity, loading } = crisis;
  const reference = `<a class="crisis-reference" href="${crisisSource}" target="_blank" rel="noopener">Historical reference · Indian delegation report, April 1967</a>`;
  if (!forecast.reserveUsed && !forecast.gap && !ordered) return `<section class="crisis-options" data-sector="food">
    <p class="crisis-ready"><strong>Harvest covers local needs.</strong> Your reserves can stay intact.</p>${reference}
  </section>`;
  const localClosing = reserve - forecast.reserveUsed;
  const reliefClosing = localClosing + Math.min(forecast.reserveUsed, Math.max(0, possible - forecast.gap));
  const options = [
    { key: "local", title: "Use local stores", delivery: 0, closing: localClosing,
      summary: loading ? "Keep this year’s freight capacity." : "Draw from reserves before buying locally." },
    { key: "union", title: "Order Union deliveries", delivery: possible, closing: reliefClosing,
      summary: !possible ? "No delivery is needed or affordable this year."
          : loading ? `${Math.ceil(possible / 2)} commercial freight slots reassigned.` : `Up to ${units(capacity)} through your network.` },
  ];
  return `<section class="crisis-options" data-sector="food" aria-labelledby="crisis-options-title">
    <h3 id="crisis-options-title">How will you cover the drought?</h3>
    <div class="food-plan-cases">${options.map(({ key, title, delivery, closing, summary }) => {
      const selected = ordered === (key === "union");
      const disabled = key === "union" && !possible && !ordered;
      const need = Math.max(0, forecast.gap - delivery);
      return `<article class="food-plan-case crisis-option" data-selected="${selected}">
        <h4>${title}</h4>
        <dl class="food-plan-sources"><div><dt>Reserves left</dt><dd>${closing}</dd></div>
          <div><dt>Still needed</dt><dd>${need}</dd></div><div><dt>Order cost</dt><dd>${Fiscal.lakh(delivery * rate)}</dd></div></dl>
        <p class="food-plan-case-note">${delivery ? `${units(delivery)} delivered. ` : ""}${summary}</p>
        <button type="button" data-crisis-order="${key}" aria-pressed="${selected}"${disabled ? " disabled" : ""}>${selected ? "Selected" : title}</button>
      </article>`;
    }).join("")}</div>
    <p class="food-plan-note">Forecast before ordinary emergency purchases and shared reserves. Pay only for deliveries received.</p>
    ${reference}
  </section>`;
}

export function foodPlanMarkup({ outlook, demand, reserve, cases, cash, authorization, crisis }) {
  return `<section class="food-plan" data-sector="food" aria-label="Monsoon food scenarios">
    <header class="food-plan-outlook">
      ${departmentBadge("food")}
      <strong>${escapeText(outlook)}</strong>
      <p><b>${units(demand)}</b> needed <span aria-hidden="true">·</span> <b>${units(reserve)}</b> in state reserves</p>
    </header>
    <div class="food-plan-cases">${cases.map((scenario) => scenarioCard(scenario, demand, reserve)).join("")}</div>
    <p class="food-plan-note">Each scenario includes works due this year. Gaps are shown before shared supplies and purchases.</p>
    ${crisis ? crisisOptions(crisis, cases.at(-1), reserve) : ""}
    <div class="food-plan-purchases">
      <p><b>${Fiscal.lakh(cash)}</b> in treasury${authorization ? ` · ${Fiscal.lakh(authorization)} purchase cap` : ""}</p>
      <p>Local market purchases cost ₹1–2 lakh per unit. The treasury pays only for food bought.</p>
    </div>
  </section>`;
}
