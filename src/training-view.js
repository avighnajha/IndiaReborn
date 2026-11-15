import { Fiscal } from "./fiscal.js";
import "./training-view.css";

const statusLabels = {
  locked: "Locked",
  ready: "Ready to specialize",
  preparing: "Preparing",
  operating: "Operating",
  paused: "Paused",
  closed: "Closed",
};

const educationEmblem = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
  <path d="M7 16h26M10 13l10-6 10 6M11 17v12m6-12v12m6-12v12m6-12v12M8 30h24m-27 4h30"/>
  <circle cx="20" cy="12" r="1"/>
</svg>`;

const specialties = {
  apprenticeships: {
    sector: "Industry and craft",
    art: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M9 47h46M12 39h40v8H12zm5 8v8m30-8v8M19 39V26h25v13m-28-13 6-9h18l7 9M26 26v13m11-13v13M26 31h11M15 14l7-5 7 5m15 5 6-5 5 5"/>
      <path d="M33 9v8m-4-4h8m14 20h5m-2-2v5M8 31h5m-2-2v5" class="training-art-detail"/>
    </svg>`,
  },
  extension: {
    sector: "Agriculture and water",
    art: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M7 50h50M11 44c6-9 14-12 21-11s15 4 21 11M16 47c6-7 12-9 16-8s12 4 16 8m-23 0 7-3 7 3M32 33V12m0 10c-8 0-12-5-12-10 7 0 12 4 12 10Zm0 6c0-6 5-10 12-10 0 6-5 10-12 10Z"/>
      <path d="M12 25h6m-3-3v6m35 2h6m-3-3v6" class="training-art-detail"/>
    </svg>`,
  },
};

const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => htmlEntities[character]);
const money = (value) => escapeText(Fiscal.lakh(value));

function charterTitle(model) {
  return model.options.find((option) => option.selected || option.id === model.charter)?.title ?? model.charter;
}

function schoolCount(capacity) {
  return `${capacity} mature ${capacity === 1 ? "school" : "schools"}`;
}

export function trainingStatusMarkup(model) {
  if (!model.available) return "";
  const charter = charterTitle(model);
  const action = charter ? "Review charter" : model.status === "closed" ? "Review specializations" : "Compare specializations";
  return `<section class="training-status" data-training-status="${escapeText(model.status)}" aria-labelledby="training-status-title">
    <header class="training-status-head">
      <span class="training-emblem">${educationEmblem}</span>
      <div><p class="training-eyebrow">Tier II · Education</p><h3 id="training-status-title">Technical school charters</h3></div>
    </header>
    <div class="training-status-meta"><b>${escapeText(statusLabels[model.status])}</b><span>${escapeText(schoolCount(model.capacity))}</span></div>
    ${charter ? `<p class="training-current">${escapeText(charter)}</p>` : ""}
    <p class="training-message">${escapeText(model.message)}</p>
    ${model.options.length ? `<button type="button" data-training-review>${action} <span aria-hidden="true">→</span></button>` : ""}
  </section>`;
}

function optionMarkup(option) {
  const { sector, art } = specialties[option.id];
  const id = escapeText(option.id);
  const title = escapeText(option.title);
  const reasonId = `training-reason-${id}`;
  const hasSites = option.sites.length > 0;
  const cannotAdopt = Boolean(option.reason) || !hasSites;
  return `<section class="training-option" data-training-option="${id}" data-adopted="${Boolean(option.selected)}" aria-labelledby="training-title-${id}">
    <header class="training-option-head">
      <span class="training-option-art">${art}</span>
      <div><p class="training-eyebrow">${sector}</p><h3 id="training-title-${id}">${title}</h3></div>
    </header>
    <div class="training-footprint">
      <p class="training-eyebrow">Training footprint</p>
      ${hasSites ? `<ul aria-label="Participating sites">${option.sites.map(({ name }) => `<li>${escapeText(name)}</li>`).join("")}</ul>` : '<p class="training-empty">No participating sites yet.</p>'}
    </div>
    <ul class="training-effects" aria-label="Expected effects">${option.effects.map((effect) => `<li>${escapeText(effect)}</li>`).join("")}</ul>
    <dl class="training-prices">
      <div><dt>Commitment</dt><dd>${money(option.cost)}</dd></div>
      <div><dt>Annual upkeep</dt><dd>${money(option.upkeep)}</dd></div>
    </dl>
    <div class="training-option-note">${option.selected ? '<span class="training-adopted">Charter adopted</span>' : option.reason ? `<p id="${reasonId}">${escapeText(option.reason)}</p>` : ""}</div>
    <div class="training-option-actions">
      ${hasSites ? `<button type="button" data-training-preview="${id}" aria-label="Preview on map · ${title}">Preview on map</button>` : ""}
      ${option.selected ? "" : `<button type="button" class="primary" data-training-adopt="${id}" aria-label="Adopt charter · ${title}"${option.reason ? ` aria-describedby="${reasonId}"` : ""}${cannotAdopt ? " disabled" : ""}>Adopt charter</button>`}
    </div>
  </section>`;
}

export function trainingComparisonMarkup(model) {
  if (!model.available) return "";
  const charter = charterTitle(model);
  return `<div class="training-comparison">
    <p class="training-intro">Choose one specialization for the campaign. It starts next year and draws annual upkeep while operating. The footprint shows the sites that would take part.</p>
    <div class="training-comparison-status" data-training-status="${escapeText(model.status)}">
      <p><b>${escapeText(statusLabels[model.status])}</b>${charter ? `<span>${escapeText(charter)}</span>` : ""}<span>${escapeText(schoolCount(model.capacity))}</span></p>
      <p>${escapeText(model.message)}</p>
    </div>
    <div class="training-options">${model.options.map(optionMarkup).join("")}</div>
  </div>`;
}
