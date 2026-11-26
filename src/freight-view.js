import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import { freightCompetitionOpening, maxFreightCapacity } from "./neighbor-competition.js";
import "./freight-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);

export function freightBoardMarkup(result, resolvedYear, preset) {
  if (preset !== "standard") return "";
  if (!result) return `<section class="freight-board" data-sector="trade">
    <h3>Freight competition</h3><p>From ${freightCompetitionOpening}, connect three towns and a workshop to compete for orders. Inland exchanges can bid through nearby markets.</p></section>`;
  const rows = [result.player, ...result.partners, ...(result.inland ?? []), ...(result.exportRival ? [result.exportRival] : [])];
  const inlandLoads = (result.inland ?? []).reduce((total, row) => total + row.loads, 0);
  return `<section class="freight-board" data-sector="trade" aria-labelledby="freight-heading">
    <header><div><h3 id="freight-heading">Freight competition</h3><p>${resolvedYear} · ${result.served} of ${result.demand} loads carried</p></div>${departmentBadge("trade")}</header>
    <ul class="freight-results">${rows.map(({ id, name, capacity, loads, earnings, reason, via }, index) => `<li data-freight-player="${index === 0}"${via ? ' data-freight-inland' : ''}${id === result.exportRival?.id && result.exportRival ? ' data-freight-export-rival' : ''}>
      <div><strong>${name}</strong><span>${reason ?? `${loads} carried · ${capacity} capacity`}${via ? ` · via ${via}` : ""}</span></div>
      <div><b>${Fiscal.lakh(earnings)}</b><progress max="${result.demand}" value="${loads}" aria-label="${name}, share of available loads"></progress></div>
    </li>`).join("")}</ul>
    ${inlandLoads ? `<p class="freight-note">Inland exchanges carried ${inlandLoads} of the available loads through nearby markets.</p>` : ""}
    ${result.exportRival ? '<p class="freight-note">Sugar and oilcake shippers can use Mormugao when Bombay’s railway is congested. Both ports compete for these commercial orders.</p>' : ""}
    ${result.linkedDemand ? `<p class="freight-note">Last year’s domestic shipments through your neighbors added ${result.linkedDemand} orders.</p>` : ""}
    <p class="freight-note">Connect more towns and workshops, or add a freight terminal to carry a larger share. Signed corridor payments are separate.</p>
  </section>`;
}

function contractResultMarkup({ start, end, fee, minimumCapacity, winner, capacity, payment, reason }, resolvedYear) {
  const status = !winner ? "No award" : winner.id === "player" ? "Your administration won" : `${winner.name} won`;
  const outcome = !winner ? `No bidder met the minimum capacity of ${minimumCapacity}.`
    : payment ? `${Fiscal.lakh(payment)} paid in ${resolvedYear} · Bid capacity ${capacity}`
      : `${resolvedYear} payment suspended · ${reason ?? `Bid capacity ${capacity} is below ${minimumCapacity}.`}`;
  return `<div class="freight-contract-result" data-contract-player="${winner?.id === "player"}">
    <strong>${escapeText(status)}</strong><span>${start}–${end} · ${Fiscal.lakh(fee)} per year</span><p>${escapeText(outcome)}</p>
  </div>`;
}

export function freightContractMarkup(forecast) {
  if (!forecast?.active && !forecast?.upcoming) return "";
  const { year, active, upcoming, canDevelop } = forecast;
  const bids = upcoming && [
    ["Your bid capacity now", upcoming.playerCapacity],
    [`With approved works by ${upcoming.start}`, upcoming.projectedCapacity],
    [upcoming.rival ? `Projected rival · ${upcoming.rival.name}` : "Projected rival", upcoming.rival?.capacity],
  ];
  const bidding = upcoming ? `
    <div class="freight-contract-deadline"><strong>${upcoming.start === year ? "Award at this year’s close" : `Award at the close of ${upcoming.start}`}</strong>
      <span>${upcoming.start}–${upcoming.end} · ${Fiscal.lakh(upcoming.fee)} per year</span></div>
    <dl class="freight-contract-capacity" aria-label="Bid capacity forecast">
      ${bids.map(([label, value]) => `<div><dt>${escapeText(label)}</dt><dd>
        <strong>${value ?? "—"}</strong>${value === undefined ? "" : `<progress max="${maxFreightCapacity}" value="${value}" aria-hidden="true"></progress>`}
      </dd></div>`).join("")}
    </dl>
    <p class="freight-note">Highest bid capacity wins. Minimum ${upcoming.minimumCapacity}. Ties rotate. Forecast uses current borders and known works.</p>
    <details class="freight-contract-rules"><summary>How to raise your bid</summary>
      <p>Link at least 3 towns and a workshop. Each linked workshop adds 1, each connected terminal adds 3, and the towns beyond the first two add up to 2.</p>
    </details>
    ${canDevelop ? '<button type="button" data-freight-contract-trees>View Trade &amp; Industry tree</button>' : ""}` : "";
  return `<section class="freight-board freight-contract" data-sector="trade" aria-labelledby="freight-contract-heading">
    <header><h3 id="freight-contract-heading">Freight contract</h3>${departmentBadge("trade")}</header>
    ${active ? contractResultMarkup(active, year - 1) : ""}${bidding}
  </section>`;
}
