import { departmentIcon } from "./department-icons.js";
import { departmentIdentity } from "./department-presentation.js";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const sector = (id) => Object.hasOwn(departmentIdentity, id) ? id : "";
const icon = (id) => departmentIcon(departmentIdentity[sector(id)]?.icon ?? "school");

function metricMarkup(metric) {
  const met = Boolean(metric.met);
  const hasScale = Number.isFinite(metric.value) && Number.isFinite(metric.target) && metric.target > 1;
  return `<div class="regional-mandate-metric" data-met="${met}">
    <dt>${escapeText(metric.label)}</dt>
    <dd>${hasScale ? `<span class="regional-mandate-value"><strong>${escapeText(metric.value)}</strong> · target ${escapeText(metric.target)}</span>` : ""}
      <span class="regional-mandate-metric-status"><span aria-hidden="true">${met ? "✓" : "○"}</span> ${hasScale ? met ? "Met" : "To reach" : met ? "Operating" : "Required"}</span>
      ${hasScale ? `<progress max="${metric.target}" value="${Math.max(0, Math.min(metric.value, metric.target))}" aria-hidden="true"></progress>` : ""}</dd>
  </div>`;
}

export function mandateProgressMarkup(progress, { compact = false, review = false } = {}) {
  if (!progress) return "";
  const complete = Boolean(progress.complete);
  const achieved = Boolean(progress.achieved);
  const status = complete
    ? achieved ? "Mandate achieved" : "Mandate not achieved"
    : achieved ? "Targets met" : progress.id !== "education" && progress.year < progress.starts ? "Preparing" : "In progress";
  return `<section class="regional-mandate-progress${compact ? " regional-mandate-progress-compact" : ""}" data-sector="${sector(progress.id)}" data-complete="${complete}" data-achieved="${achieved}" aria-label="Regional mandate progress">
    <header class="regional-mandate-progress-heading">
      <span class="regional-mandate-icon">${icon(progress.id)}</span>
      <div class="regional-mandate-progress-title"><p class="regional-mandate-eyebrow">Regional mandate</p><h3>${escapeText(progress.label)}</h3></div>
      <strong class="regional-mandate-status">${escapeText(status)}</strong>
    </header>
    <p class="regional-mandate-period">Assessment ${escapeText(progress.starts)}–${escapeText(progress.ends)}${!complete ? ` <span aria-hidden="true">·</span> ${escapeText(progress.year)}` : ""}</p>
    <dl class="regional-mandate-metrics">${(progress.metrics ?? []).map(metricMarkup).join("")}</dl>
    ${progress.yearNote ? `<p class="regional-mandate-year-note">${escapeText(progress.yearNote)}</p>` : ""}
    ${!compact && progress.guidance ? `<p class="regional-mandate-guidance">${escapeText(progress.guidance)}</p>` : ""}
    ${review ? '<button type="button" class="regional-mandate-review" id="brief-mandate-review">Review mandate <span aria-hidden="true">→</span></button>' : ""}
  </section>`;
}

function optionMarkup(option, available, unavailableLabel) {
  const id = escapeText(option.id);
  const titleId = `regional-mandate-title-${id}`;
  const conditionsId = `regional-mandate-conditions-${id}`;
  return `<article class="regional-mandate-option" data-sector="${sector(option.id)}" aria-labelledby="${titleId}">
    <header><span class="regional-mandate-icon">${icon(option.id)}</span><h3 id="${titleId}">${escapeText(option.label)}</h3></header>
    ${option.description ? `<p class="regional-mandate-description">${escapeText(option.description)}</p>` : ""}
    <dl class="regional-mandate-conditions" id="${conditionsId}">${(option.conditions ?? []).map((condition) => `<div><dt>${escapeText(condition.label)}</dt><dd>${condition.target === 1 ? `<span>Required</span>` : `<span>Target</span> <strong>${escapeText(condition.target)}</strong>`}</dd></div>`).join("")}</dl>
    ${option.guidance ? `<p class="regional-mandate-help" id="regional-mandate-help-${id}">${escapeText(option.guidance)}</p>` : ""}
    <button type="button" data-regional-mandate="${id}" aria-label="Commit to ${escapeText(option.label)}" aria-describedby="${conditionsId}${option.guidance ? ` regional-mandate-help-${id}` : ""}"${available ? "" : " disabled"}>${available ? "Commit to this mandate" : escapeText(unavailableLabel)}</button>
  </article>`;
}

export function mandateOptionsMarkup(model) {
  if (!model) return "";
  if (model.progress) return mandateProgressMarkup(model.progress);
  const available = model.available;
  const unavailableLabel = model.year < model.opens ? `Opens ${model.opens}` : "Selection closed";
  return `<section class="regional-mandate" aria-label="Choose a regional mandate">
    <header class="regional-mandate-intro"><p class="regional-mandate-eyebrow">Assessment ${escapeText(model.starts)}–${escapeText(model.ends)}</p>
      <p>Choose one legacy. Keep its final-tier project operating and meet its outcome target by ${escapeText(model.ends)}.</p>
      <p class="regional-mandate-selection-window">${available ? `Choose by ${escapeText(model.closes)}` : model.year < model.opens ? `Selection opens ${escapeText(model.opens)}` : `Selection ended ${escapeText(model.closes)}`} <span aria-hidden="true">·</span> Optional and permanent once chosen</p>
    </header>
    <div class="regional-mandate-options">${(model.options ?? []).map((option) => optionMarkup(option, available, unavailableLabel)).join("")}</div>
  </section>`;
}
