import { Fiscal } from "./fiscal.js";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);

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
