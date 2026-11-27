import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import { freightCompetitionOpening, maxFreightCapacity } from "./neighbor-competition.js";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);

export function freightBoardMarkup(result, resolvedYear, preset) {
  if (preset !== "standard") return "";
  if (!result) return `<section class="freight-board" data-sector="trade">
    <h3>Freight competition</h3><p>From ${freightCompetitionOpening}, connect three towns and a workshop to compete for orders. Inland exchanges can bid through nearby markets.</p></section>`;
  const rows = [result.player, ...result.partners, ...(result.inland ?? []), ...(result.exportRival ? [result.exportRival] : [])];
  const inlandLoads = (result.inland ?? []).reduce((total, row) => total + row.loads, 0);
  const contractedCarrier = rows.find(({ contractLoads }) => contractLoads);
  return `<section class="freight-board" data-sector="trade" aria-labelledby="freight-heading">
    <header><div><h3 id="freight-heading">${contractedCarrier ? "Spot freight" : "Freight competition"}</h3><p>${resolvedYear} · ${result.served} of ${result.demand} loads carried</p></div>${departmentBadge("trade")}</header>
    <ul class="freight-results">${rows.map(({ id, name, capacity, loads, earnings, reason, via }, index) => `<li data-freight-player="${index === 0}"${via ? ' data-freight-inland' : ''}${id === result.exportRival?.id && result.exportRival ? ' data-freight-export-rival' : ''}>
      <div><strong>${name}</strong><span>${reason ?? `${loads} carried · ${capacity} capacity`}${via ? ` · via ${via}` : ""}</span></div>
      <div><b>${Fiscal.lakh(earnings)}</b><progress max="${result.demand}" value="${loads}" aria-label="${name}, share of available loads"></progress></div>
    </li>`).join("")}</ul>
    ${inlandLoads ? `<p class="freight-note">Inland exchanges carried ${inlandLoads} of the available loads through nearby markets.</p>` : ""}
    ${contractedCarrier ? `<p class="freight-note">${escapeText(contractedCarrier.name)} used ${contractedCarrier.contractLoads} slots for bulk freight before spot orders cleared.</p>` : ""}
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

export function bulkFreightResultMarkup(contract, { year, more = false } = {}) {
  if (!contract?.bulk) return "";
  const { start, end, winner, fee, loadsRequired, loadsDelivered, payment, reason, awarded, playerCapacity, playerReason } = contract;
  const won = winner?.id === "player";
  const status = !winner ? "No award" : loadsDelivered ? "Delivered" : "Suspended";
  const holder = won ? "Your administration" : winner?.name ?? "No carrier qualified";
  const awardNote = awarded && !won
    ? playerReason ?? (winner ? `Winning bid ${winner.capacity} · Your bid ${playerCapacity}` : "") : "";
  const deliveryNote = loadsDelivered && won
    ? `${loadsDelivered} slots went to the contract before spot freight cleared.` : reason;
  return `<section class="bulk-freight-result" data-sector="trade" data-state="${loadsDelivered ? "delivered" : "inactive"}" aria-label="Bulk freight results">
    <div class="bulk-freight-result-header"><h3>${departmentBadge("trade", "Bulk freight")}</h3><b>${year ? `${year} · ` : ""}${status}</b></div>
    <p class="bulk-freight-holder"><strong>${escapeText(holder)}</strong><span>${start}–${end} · ${Fiscal.lakh(fee)} per year</span></p>
    <dl class="bulk-freight-metrics">
      <div><dt>Loads delivered</dt><dd><strong>${loadsDelivered}</strong> <span>/ ${loadsRequired}</span></dd>
        <progress max="${loadsRequired}" value="${loadsDelivered}" aria-label="Share of contract delivered"></progress></div>
      <div><dt>${won ? "Your receipts" : "Contract payment"}</dt><dd><strong>${Fiscal.lakh(payment)}</strong></dd></div>
    </dl>
    ${[deliveryNote, awardNote].filter(Boolean).map((note) => `<p class="freight-note">${escapeText(note)}</p>`).join("")}
    ${more ? '<button type="button" class="brief-programme-link" id="brief-freight">View freight results <span aria-hidden="true">↗</span></button>' : ""}
  </section>`;
}

function bidCard(label, value, reason) {
  return `<div><dt>${escapeText(label)}</dt><dd><strong>${value ?? "—"}</strong>
    ${value === undefined ? "" : `<progress max="${maxFreightCapacity}" value="${value}" aria-hidden="true"></progress>`}</dd>
    ${reason ? `<dd class="freight-bid-reason">${escapeText(reason)}</dd>` : ""}</div>`;
}

export function freightContractMarkup(forecast) {
  if (!forecast?.active && !forecast?.upcoming) return "";
  const { year, active, upcoming, canDevelop } = forecast;
  const currentAward = active?.bulk ? bulkFreightResultMarkup(active, { year: year - 1 })
    : active ? contractResultMarkup(active, year - 1) : "";
  const bids = upcoming?.bulk ? [
    ["Approved plans", upcoming.projectedCapacity, upcoming.projectedReason],
    ["If Trade is funded", upcoming.projectedWithPriority, upcoming.projectedWithPriorityReason],
    [upcoming.rival ? `Strongest rival · ${upcoming.rival.name}` : "Strongest rival", upcoming.rival?.capacity],
  ] : [
    ["Your bid capacity now", upcoming?.playerCapacity],
    [`With approved works by ${upcoming?.start}`, upcoming?.projectedCapacity],
    [upcoming?.rival ? `Projected rival · ${upcoming.rival.name}` : "Projected rival", upcoming?.rival?.capacity],
  ];
  const bidding = upcoming ? `
    <div class="freight-contract-deadline"><strong>${upcoming.start === year ? "Award at this year’s close" : `Award at the close of ${upcoming.start}`}</strong>
      <span>${upcoming.start}–${upcoming.end} · ${Fiscal.lakh(upcoming.fee)} per year</span></div>
    <dl class="freight-contract-capacity" aria-label="Bid capacity forecast">
      ${bids.map(([label, value, reason]) => bidCard(label, value, reason)).join("")}
    </dl>
    <p class="freight-note">Highest eligible bid wins. Minimum ${upcoming.minimumCapacity}. Ties rotate.</p>
    ${upcoming.bulk ? `<ul class="freight-bulk-rules">
      <li>Link 3 towns, a workshop and a freight terminal. Linked industrial parks strengthen the bid.</li>
      <li>Fund Trade &amp; Industry to win and deliver. A term starting in ${upcoming.start} covers all five years.</li>
      <li>Each delivery uses ${upcoming.loadsRequired} slots before spot orders.</li>
    </ul>` : `<p class="freight-note">Forecast uses current borders and known works.</p>
    <details class="freight-contract-rules"><summary>How to raise your bid</summary>
      <p>Link at least 3 towns and a workshop. Each linked workshop adds 1, each connected terminal adds 3, and the towns beyond the first two add up to 2.</p>
    </details>`}
    ${canDevelop ? `<div class="freight-contract-actions">
      ${upcoming.bulk ? '<button type="button" data-freight-priority>Review five-year priority</button>' : ""}
      <button type="button" data-freight-contract-trees>View Trade &amp; Industry tree</button>
    </div>` : ""}` : "";
  return `<section class="freight-board freight-contract" data-sector="trade" aria-labelledby="freight-contract-heading">
    <header><h3 id="freight-contract-heading">${upcoming?.bulk ? "Bulk freight tender" : active?.bulk ? "Freight contracts" : "Freight contract"}</h3>${departmentBadge("trade")}</header>
    ${!upcoming?.bulk ? currentAward : ""}
    ${bidding}
    ${upcoming?.bulk && active ? `<details class="freight-contract-rules"><summary>Earlier award · ${active.start}–${active.end}</summary>${currentAward}</details>` : ""}
  </section>`;
}
