import { departmentIcon } from "./department-icons.js";
import { departmentIdentity } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import "./cabinet-plan-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const money = (value) => escapeText(Fiscal.lakh(Number.isFinite(value) ? value : 0));
const statusLabels = { funded: "Funded", operating: "Funded", active: "Funded", preparing: "Preparing", paused: "Paused", expired: "Term ended", completed: "Term ended", closed: "Term ended" };

const cabinetIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 9h18L12 3 3 9Zm1 12h16M5 18h14M7 10v8m5-8v8m5-8v8"/></svg>';
const icon = (id) => departmentIdentity[id] ? departmentIcon(departmentIdentity[id].icon) : cabinetIcon;
const sector = (id) => Object.hasOwn(departmentIdentity, id) ? id : "services";

function commitmentMarkup(current, year) {
  if (!current) return "";
  const duration = Math.max(1, current.ends - current.starts + 1);
  const funded = Math.max(0, Math.min(duration, current.paidYears ?? 0));
  const remaining = Number.isFinite(current.remaining) ? current.remaining : Math.max(0, current.ends - year + 1);
  const ended = remaining === 0 || current.ends < year;
  const status = ended ? "Term ended" : statusLabels[current.status] ?? current.status ?? "Committed";
  const note = current.note ?? current.message;
  const id = sector(current.id);
  return `<section class="cabinet-plan-current" data-sector="${id}" data-status="${escapeText(current.status)}" aria-label="Current cabinet commitment">
    <span class="cabinet-plan-current-icon">${icon(current.id)}</span>
    <div class="cabinet-plan-current-copy"><span class="cabinet-plan-eyebrow">${ended ? "Last priority" : "Current priority"}</span>
      <h3>${escapeText(current.label)}</h3><p>${escapeText(current.starts)}–${escapeText(current.ends)} <span aria-hidden="true">·</span> ${money(current.annualCost)} / year</p></div>
    <strong class="cabinet-plan-status">${escapeText(status)}</strong>
    <div class="cabinet-plan-progress"><span>${number.format(funded)} / ${number.format(duration)} years funded</span>
      <progress max="${duration}" value="${funded}" aria-label="Years funded"></progress>
      ${!ended ? `<span>${number.format(remaining)} ${remaining === 1 ? "year" : "years"} left</span>` : ""}</div>
    ${note ? `<p class="cabinet-plan-current-note">${escapeText(note)}</p>` : ""}
  </section>`;
}

function optionMarkup(option, available) {
  const id = escapeText(option.id);
  const label = escapeText(option.label);
  const isServices = option.id === "services";
  const reason = option.reason ? String(option.reason) : !available ? "Priorities are not available yet." : "";
  const effectsId = `cabinet-plan-effects-${id}`;
  const reasonId = `cabinet-plan-reason-${id}`;
  const action = option.actionLabel ?? (option.selected ? "Selected" : isServices ? "Keep normal services" : "Choose priority");
  return `<article class="cabinet-plan-option" data-sector="${sector(option.id)}" data-selected="${Boolean(option.selected)}" aria-labelledby="cabinet-plan-title-${id}">
    <header><span class="cabinet-plan-option-icon">${icon(option.id)}</span><div>
      <h3 id="cabinet-plan-title-${id}">${label}</h3>
      <p class="cabinet-plan-price">${isServices ? "No extra commitment" : `${money(option.annualCost)} / year`}</p>
    </div>${option.selected ? '<span class="cabinet-plan-selected" aria-label="Selected">✓</span>' : ""}</header>
    <ul id="${effectsId}" class="cabinet-plan-effects">${(option.effects ?? []).slice(0, 2).map((effect) => `<li>${escapeText(effect)}</li>`).join("")}</ul>
    <footer><span class="cabinet-plan-timing">${isServices ? "Review each year" : `Through ${escapeText(option.ends)}`}</span>
      ${reason ? `<p class="cabinet-plan-reason" id="${reasonId}">${escapeText(reason)}</p>` : ""}
      <button type="button" data-cabinet-plan="${id}" aria-label="${escapeText(action)} · ${label}" aria-describedby="${effectsId}${reason ? ` ${reasonId}` : ""}"${reason ? " disabled" : ""}>${escapeText(action)}</button>
    </footer>
  </article>`;
}

export function cabinetPlanMarkup(model) {
  const options = model.options ?? [];
  return `<section class="cabinet-plan" aria-label="Five-year cabinet priorities">
    <header class="cabinet-plan-heading"><p class="cabinet-plan-eyebrow">${escapeText(model.year)} · Cabinet priorities</p>
      <p>Fund one department’s extra work for up to five years.</p>
      ${model.costNote ? `<p class="cabinet-plan-cost-note">${escapeText(model.costNote)}</p>` : ""}</header>
    ${commitmentMarkup(model.current, model.year)}
    ${model.message ? `<p class="cabinet-plan-note" role="status">${escapeText(model.message)}</p>` : ""}
    ${options.length ? `<div class="cabinet-plan-options">${options.map((option) => optionMarkup(option, model.available)).join("")}</div>` : ""}
  </section>`;
}
