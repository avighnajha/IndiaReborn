import { Fiscal } from "./fiscal.js";
import { openingPriceYear, priceBasis } from "./period-prices.js";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const priceFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function priceReferenceMarkup(year) {
  const { index, referenceYear, url, assumed } = priceBasis(year);
  const ratio = priceFormat.format(index / priceBasis(openingPriceYear).index);
  return `<details class="fiscal-reference"><summary>Works and operating prices · ${ratio}× opening rates</summary>
    <p>New quotes adjust each programme’s modeled cost from its own price year. Ordinary upkeep and receipts use the same wholesale-price proxy. Signed amounts and public allocations keep their nominal values.</p>
    ${assumed ? `<p>FY ${Fiscal.yearLabel(referenceYear)} prices are held for this turn.</p>` : ""}
    <p>Broad wholesale prices stand in for changes in costs. <a href="${url}" target="_blank" rel="noopener noreferrer">Reserve Bank annual price series</a></p>
  </details>`;
}

export function fundingReferenceMarkup(funding) {
  const historic = funding?.historic;
  if (!historic) return '<p class="fiscal-note">Source details were not saved with this earlier report.</p>';
  const period = historic.sourcePeriod ?? `FY ${Fiscal.yearLabel(historic.fiscalYear)}`;
  return `<details class="fiscal-reference"><summary>Budget source · ${escapeText(period)}</summary>
    <p>${escapeText(historic.name)} revenue reference: <b>${Fiscal.crore(historic.revenue)}</b><br>${escapeText(historic.status)}.</p>
    <p>${Number.isFinite(funding.share) ? `${(funding.share * 100).toLocaleString("en-IN", { maximumFractionDigits: 3 })}% modeled works share` : "Modeled works allocation"}${funding.developmentRecord ? ", subject to the recorded development-outlay cap" : ""}. Historical revenue includes many services beyond the works you control.</p>
    ${historic.transferNote ? `<p>${escapeText(historic.transferNote)}</p>` : ""}
    ${historic.url?.startsWith("https://") ? `<a href="${escapeText(historic.url)}" target="_blank" rel="noopener noreferrer">View the historical reference</a>` : ""}
  </details>`;
}
