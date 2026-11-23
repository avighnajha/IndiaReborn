import { Fiscal } from "./fiscal.js";
import "./market-finance.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);

export function marketFundingMarkup(funding) {
  if (!funding || !Number.isFinite(funding.allocation)) return "";
  const { reference } = funding;
  return `<details class="market-funding"><summary>${Fiscal.lakh(funding.allocation)} market budget · ${funding.year}</summary>
    ${reference ? `<p>${escapeText(reference.name)} · FY ${Fiscal.yearLabel(reference.fiscalYear)}<br>${escapeText(reference.metric)}: ${reference.value < 1000 ? Fiscal.lakh(reference.value) : Fiscal.crore(reference.value)}<br>${escapeText(reference.status)}.</p>` : ""}
    <p>${escapeText(funding.basis)}. Rounded to lakh rupees, with a ₹1 lakh minimum. Opening cash and project prices remain modeled.</p>
    ${reference?.url?.startsWith("https://") ? `<a href="${escapeText(reference.url)}" target="_blank" rel="noopener noreferrer">Historical reference</a>` : ""}
  </details>`;
}
