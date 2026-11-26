import { bayDeadline, bayShippingSource } from "./bay-shipping.js";
import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import "./bay-shipping-view.css";

const units = (value, singular) => `${value} ${singular}${value === 1 ? "" : "s"}`;

export function bayShippingMarkup(plan, last) {
  const { port, contract, status } = plan;
  const route = `<div class="bay-route" aria-label="${port.name} to Port Blair">
    <strong>${port.name}</strong><span class="bay-route-line" aria-hidden="true"><span>Bay of Bengal</span></span><strong>Port Blair</strong>
  </div>`;
  const source = `<a class="bay-source" href="${bayShippingSource}" target="_blank" rel="noopener">1950–51 Home Affairs report</a>`;
  if (status !== "open") {
    return `<section class="bay-shipping">${route}<article class="bay-option" data-sector="${contract.id}">
      ${departmentBadge(contract.id)}<h3>${plan.title}</h3>
      <p>${status === "transferred" ? "Madras kept the port after division. Your administration’s payments and shipments have ended." : `Signed through ${contract.end} · ${Fiscal.lakh(contract.fee)} paid upfront.`}</p>
      ${last?.status === "operating" ? `<p>Last year · ${last.reason ?? (last.id === "food" ? `${units(last.food, "food unit")} to Port Blair` : `${units(last.timber, "timber load")} to ${last.port}`)}${last.receipt ? ` · ${Fiscal.lakh(last.receipt)} earned` : ""}</p>` : ""}
    </article>${source}</section>`;
  }
  const cards = plan.options.map(({ id, title, cost, reason, rate }) => {
    const food = id === "food";
    const capacity = plan.capacity || port.capacity;
    return `<article class="bay-option" data-sector="${id}">
      ${departmentBadge(id)}<h3>${title}</h3>
      <dl><div><dt>Upfront</dt><dd>${Fiscal.lakh(cost)}</dd></div>
        <div><dt>Capacity each year</dt><dd>Up to ${units(capacity, food ? "food unit" : "timber load")}</dd></div>
        <div><dt>${food ? "Union pays per unit" : "Receipts per load"}</dt><dd>${Fiscal.lakh(rate)}</dd></div></dl>
      <p>${food ? "Supplies Port Blair after home needs. Keeps four months in reserve." : "Carries timber from Port Blair using the same berth."}</p>
      ${reason ? `<p class="bay-requirement">${reason}</p>` : ""}
      <button type="button" data-bay-charter="${id}"${reason ? " disabled" : ""}>${food ? "Sign food charter" : "Sign timber charter"}</button>
    </article>`;
  }).join("");
  return `<section class="bay-shipping">${route}
    <p class="bay-term">Choose one charter for ${plan.start}–${plan.end}. Offers close in ${bayDeadline}.${port.name === "Madras" && plan.end >= 1953 ? " Choosing Andhra in 1953 ends your charter early." : ""}</p>
    ${plan.island ? `<p class="bay-term">Port Blair last year · ${plan.island.shortage ? `${units(plan.island.shortage, "food unit")} still needed` : "Food needs covered"} · ${units(plan.island.reserve, "unit")} in reserve</p>` : ""}
    <div class="bay-options">${cards}</div>${source}
  </section>`;
}
