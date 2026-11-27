import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import { crisisSource, dispatchSource, distributionSource } from "./food-crisis.js";
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
    <p class="crisis-ready"><strong>Harvest covers local needs.</strong></p>${reference}
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

function dispatchOptions({ limit, floor, pledged, orderPlaced }, standard) {
  const status = pledged ? "Offer filed. Dispatch depends on remaining shortfalls and route capacity."
    : orderPlaced ? "Union deliveries are ordered for your own region."
    : !limit ? "Dispatch needs connected stores and reserves above the home minimum."
      : "Send food from storage where there’s a shortfall and room on the route.";
  return `<section class="dispatch-options food-plan-case" data-selected="${pledged}" aria-labelledby="reserve-dispatch-title">
    <div><h3 id="reserve-dispatch-title">Interstate drought relief</h3>
      <p class="food-plan-case-note">${status}</p></div>
    <dl class="dispatch-totals food-plan-sources"><div><dt>Keep at home · six months</dt><dd>${units(floor)}</dd></div>
      <div><dt>Can offer</dt><dd>Up to ${units(orderPlaced ? 0 : limit)}</dd></div></dl>
    <div class="dispatch-actions"><p class="food-plan-note">${standard ? "Each two units shipped use one spot freight slot, rounded up." : "Relief travels to nearby markets."} Home needs come first.</p>
      <button type="button" data-reserve-dispatch aria-pressed="${pledged}"${!pledged && (!limit || orderPlaced) ? " disabled" : ""}>${pledged ? "Withdraw offer" : "Offer reserve food"}</button></div>
    <a class="crisis-reference" href="${dispatchSource}" target="_blank" rel="noopener">Historical reference · Andhra Pradesh budget speech, 1967</a>
  </section>`;
}

function distributionForecast(title, result, selected) {
  const figures = [
    ["Reserves at year end", result.reserve],
    ["Food sent", result.sent ?? 0],
    ...(result.bulkLoads === undefined ? [] : [["Bulk loads", result.bulkLoads]]),
    ...(result.spotLoads === undefined ? [] : [["Spot loads", result.spotLoads]]),
  ];
  const deliveries = result.deliveries ?? [];
  return `<article class="distribution-forecast food-plan-case" data-selected="${selected}">
    <header><h4>${title}</h4>${selected ? "<strong>Selected</strong>" : ""}</header>
    <dl class="food-plan-sources">${figures.map(([label, value]) => `<div><dt>${label}</dt><dd>${number.format(value)}</dd></div>`).join("")}</dl>
    ${result.shortage ? `<p class="food-plan-case-note">${units(result.shortage)} still needed at home.</p>` : ""}
    ${result.sent ? `<p class="food-plan-case-note">${[
      result.covered && `${units(result.covered)} to cover shortfalls`,
      result.restocked && `${units(result.restocked)} to rebuild reserves`,
      result.freightCapacityUsed && `${result.freightCapacityUsed} freight ${result.freightCapacityUsed === 1 ? "slot" : "slots"} used`,
    ].filter(Boolean).join(" · ")}</p>` : ""}
    ${deliveries.length ? `<ul aria-label="Projected deliveries">${deliveries.map(({ name, units: amount }) =>
      `<li>${escapeText(name)} <b>${units(amount)}</b></li>`).join("")}</ul>` : ""}
  </article>`;
}

function distributionOptions({ limit, floor, pledged, network, comparison, orderPlaced, dispatchStore }, standard) {
  const eligible = Boolean(limit && !orderPlaced);
  const offer = comparison?.shared;
  const noShipment = eligible && offer && !offer.sent;
  const status = pledged ? "Offer filed" : "Keeping reserves";
  const note = !eligible ? "A dispatch needs connected stores and food above the home reserve floor."
    : noShipment ? "No shipments expected under this forecast."
      : standard ? "Every two food units shipped use one freight slot, rounded up." : "Shipments use spare capacity on nearby routes.";
  return `<section class="distribution-plan food-plan-case" aria-labelledby="reserve-dispatch-title">
    <header><h3 id="reserve-dispatch-title">Public distribution</h3><strong>${status}</strong></header>
    <p class="food-plan-note">Keep at least ${units(floor)} at home · ${eligible ? `Offer up to ${units(limit)}` : "Offer unavailable"}</p>
    ${comparison?.held ? `<div class="distribution-outlook" aria-label="Year-end forecast">
      <p class="food-plan-note">${comparison.scenario ? `${escapeText(comparison.scenario)} · ` : ""}Estimated year-end results</p>
      <div class="distribution-comparison">
        ${distributionForecast("Hold reserves", comparison.held, !pledged)}
        ${offer && (eligible || pledged) ? distributionForecast("Offer food", offer, pledged) : ""}
      </div>
    </div>` : ""}
    <div class="dispatch-actions"><p class="food-plan-note">${note}</p>
      <button type="button" data-reserve-dispatch aria-pressed="${pledged}"${!pledged && !eligible ? " disabled" : ""}>${pledged ? "Withdraw offer" : "Offer food"}</button></div>
    <p class="food-plan-case-note">${network ? "Your funded Food & Water priority and cooperative depot can ship harvest surplus and rebuild other regions’ reserves."
      : "Fund Food & Water, open a cooperative depot and link a store to ship harvest surplus and rebuild other regions’ reserves."}${dispatchStore ? ` Dispatch via ${escapeText(dispatchStore)}.` : ""}</p>
    <a class="crisis-reference" href="${distributionSource}" target="_blank" rel="noopener">Historical reference · Economic Survey 1982–83</a>
  </section>`;
}

export function foodPlanMarkup({ outlook, demand, reserve, cases, cash, authorization, crisis, dispatch }, standard) {
  return `<section class="food-plan" data-sector="food" aria-label="Monsoon food scenarios">
    <header class="food-plan-outlook">
      ${departmentBadge("food")}
      <strong>${escapeText(outlook)}</strong>
      <p><b>${units(demand)}</b> needed <span aria-hidden="true">·</span> <b>${units(reserve)}</b> in state reserves</p>
    </header>
    ${dispatch?.late ? distributionOptions(dispatch, standard) : ""}
    <div class="food-plan-cases">${cases.map((scenario) => scenarioCard(scenario, demand, reserve)).join("")}</div>
    <p class="food-plan-note">Each scenario includes works due this year. Gaps are shown before shared supplies and purchases.</p>
    ${crisis ? crisisOptions(crisis, cases.at(-1), reserve) : ""}
    ${dispatch && !dispatch.late ? dispatchOptions(dispatch, standard) : ""}
    <div class="food-plan-purchases">
      <p><b>${Fiscal.lakh(cash)}</b> in treasury${authorization ? ` · ${Fiscal.lakh(authorization)} purchase cap` : ""}</p>
      <p>Local market purchases cost ₹1–2 lakh per unit. The treasury pays only for food bought.</p>
    </div>
  </section>`;
}
