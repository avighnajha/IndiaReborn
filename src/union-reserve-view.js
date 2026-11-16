import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import "./union-reserve-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const units = (value) => `${number.format(value)} ${value === 1 ? "unit" : "units"}`;
const money = Fiscal.lakh;

function figures(rows, className) {
  return `<dl class="${className}">${rows.map(([label, value]) =>
    `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}

function reserveTerms(offer, status) {
  const { id, title, floor, quota, rate, reason, projections } = offer;
  const key = escapeText(id);
  const label = escapeText(title);
  const canSelect = status === "open" || status === "notice";
  return `<article class="union-reserve-offer" data-union-reserve-offer="${key}">
    <h3>${label}</h3>
    ${figures([["Reserve floor", units(floor)], ["Yearly quota", units(quota)], ["Per unit sold", money(rate)]], "union-reserve-terms")}
    ${projections.length ? `<ul class="union-reserve-projections" aria-label="Forecast for ${label}">${projections.map(({ name, shipped, proceeds, reserve }) =>
      `<li><strong>${escapeText(name)}</strong>${figures([["Ship", units(shipped)], ["Earn", money(proceeds)], ["Reserve after shipment", units(reserve)]], "union-reserve-results")}</li>`).join("")}</ul>` : ""}
    ${canSelect ? `<div class="union-reserve-select">
      ${reason ? `<p id="union-reserve-reason-${key}">${escapeText(reason)}</p>` : ""}
      <button type="button" data-union-reserve-choice="${key}" aria-label="Sign agreement · ${label}"${reason ? ` aria-describedby="union-reserve-reason-${key}"` : ""}${reason || status !== "open" ? " disabled" : ""}>Sign agreement</button>
    </div>` : ""}
  </article>`;
}

export function unionReserveMarkup({ year, status, start, end, floor, depotNames, capacity, stock, outlook, cases, offers, last }) {
  const signed = offers.find((offer) => offer.floor === floor);
  const terms = signed ? [signed] : status === "closed" ? [] : offers;
  const timing = {
    notice: `Opens in ${start}`,
    open: `Sign in ${start} · Runs through ${end}`,
    signed: `Signed through ${end}`,
    closed: year > end ? `Ended in ${end}` : "Signing closed",
  }[status];
  return `<section class="union-reserve" data-sector="food" aria-label="Union food reserve">
    <header class="union-reserve-heading"><strong>${timing}</strong>${departmentBadge("food")}
      ${terms.length && cases.length ? "<p>Home needs come first. Sell only food above the reserve floor.</p>" : ""}
    </header>
    ${figures([["Yearly shipping limit", units(capacity)], ["Union stock available", units(stock)]], "union-reserve-facts")}
    ${depotNames.length ? `<p class="union-reserve-note">Connected depots · ${depotNames.map(escapeText).join(", ")}</p>` : ""}
    ${cases.length ? `<section class="union-reserve-weather" aria-label="Conditional forecast">
      <header><h3>${year} seasonal outlook</h3><span>${escapeText(outlook)}</span></header>
      <ul>${cases.map(({ name, harvest, demand, available }) => `<li><strong>${escapeText(name)}</strong>
        <span>Harvest ${number.format(harvest)} · Home needs ${number.format(demand)}</span>
        <b>${units(available)} available after home needs</b></li>`).join("")}</ul>
    </section>` : ""}
    ${terms.length ? `<div class="union-reserve-offers">${terms.map((offer) => reserveTerms(offer, status)).join("")}</div>` : ""}
    ${cases.length && terms.length ? `<p class="union-reserve-note">${status === "notice" ? `Compare terms using ${year} conditions, then check the outlook in ${start}. ` : ""}The forecast is before ordinary market sales.</p>` : ""}
    ${cases.length ? `<p class="union-reserve-note">From ${start + 1}, a connected depot can draw up to 3 units in a shortage, subject to capacity and Union stock.</p>` : ""}
    ${last ? `<section class="union-reserve-last" aria-label="Latest settlement">
      <h3>${last.year} settlement</h3>
      ${figures([["Shipped", units(last.shipped)], ["Earned", money(last.proceeds)], ["Received from Union", units(last.released)], ["Closing reserve", units(last.reserve)]], "union-reserve-results")}
    </section>` : ""}
  </section>`;
}
