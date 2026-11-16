import { departmentIcon } from "./department-icons.js";
import { departmentBadge } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import "./technical-intake-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const money = Fiscal.lakh;
const pairCount = (count) => `${count} ${count === 1 ? "pair" : "pairs"}`;
const added = (value) => value ? `+${value}` : "0";

function figures(rows, className) {
  return `<dl class="${className}">${rows.map(([label, value]) =>
    `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}

function enrollmentOption(option, isOpen, commonReason) {
  const { count, state, union, skills, output, reason } = option;
  const reasonId = isOpen && reason && reason !== commonReason ? `technical-option-${count}-reason` : "";
  const descriptionId = reasonId || (commonReason ? "technical-intake-reason" : "");
  return `<article class="technical-intake-option">
    <h3>${pairCount(count)}</h3>
    ${figures([["State share", money(state)], ["Union equipment", money(union)], ["Skills", added(skills)], ["Placement output", added(output)]], "technical-intake-figures")}
    ${reasonId ? `<p class="technical-intake-reason" id="${reasonId}">${escapeText(reason)}</p>` : ""}
    <button type="button" data-technical-enroll="${count}"${descriptionId ? ` aria-describedby="${descriptionId}"` : ""}${!isOpen || commonReason || reason ? " disabled" : ""}>Enroll ${pairCount(count)}</button>
  </article>`;
}

function siteButton({ hex, name }, kind, result) {
  const label = kind === "school" ? "Technical school" : "Workshop";
  const title = escapeText(name);
  return `<button type="button" class="technical-intake-site" data-technical-site="${escapeText(hex)}" data-technical-facility="${kind}" aria-label="${title} · Show ${label.toLowerCase()} on map">
    ${departmentIcon(kind)}<span><small>${label}</small><b>${title}</b>${result ? `<small>${result}</small>` : ""}</span><span class="technical-intake-map-arrow" aria-hidden="true">↗</span>
  </button>`;
}

export function technicalIntakeMarkup({ deadline, first, last, status, reason, schools, workshops, pairs, options, award, latest }) {
  const signed = status === "signed";
  const commonReason = status === "open" ? reason : null;
  const shownPairs = signed ? pairs.slice(0, award.count) : pairs;
  const reportedSchools = new Map((latest?.schools ?? []).map(({ hex, skills }) => [hex, skills]));
  const reportedWorkshops = new Set((latest?.sites ?? []).map(({ hex }) => hex));
  const timing = signed ? `First cohort · ${first}–${last}` : status === "open" ? `Enroll by the end of ${deadline}` : `Enrollment opens in ${deadline}`;
  return `<section class="technical-intake" data-sector="education" aria-label="Technical training intake">
    <header class="technical-intake-heading"><strong>${timing}</strong>${departmentBadge("education")}
      ${signed ? `<p>Skills stay at schools you retain. Workshop output through ${last} requires both sites and a market connection.</p>`
        : `<p>Complete technical schools by the end of ${deadline - 2} for a full academic year. Linked workshops must be operating when you apply.</p>`}
    </header>
    ${signed
      ? figures([["Enrolled", pairCount(award.count)], ["State share paid", money(award.state)], ["Union equipment", money(award.union)]], "technical-intake-figures technical-intake-summary")
      : figures([["Qualifying schools", schools], ["Connected workshops", workshops], ["Eligible pairs", pairs.length]], "technical-intake-figures technical-intake-summary")}
    ${latest ? `<section class="technical-intake-latest" aria-label="Latest intake results"><h3>${latest.year} results</h3>
      ${figures([["Skills from intake", added(latest.skills)], ["Workshop output added", added(latest.output)], ["Workshop receipts added", money(latest.receipts)]], "technical-intake-figures")}</section>` : ""}
    ${!signed ? `<p class="technical-intake-note">Each retained school adds <b>2 Skills from ${first}</b>. Each paired workshop adds <b>3 output a year in ${first}–${last}</b>.</p>
      <p class="technical-intake-note">The state pays once at enrollment. The Union supplies equipment directly.</p>
      ${commonReason ? `<p class="technical-intake-reason" id="technical-intake-reason">${escapeText(commonReason)}</p>` : ""}
      <div class="technical-intake-options">${options.map((option) => enrollmentOption(option, status === "open", commonReason)).join("")}</div>` : ""}
    ${shownPairs.length ? `<section class="technical-intake-pairs" aria-label="${signed ? "Enrolled pairs" : "Eligible pairs"}">
      <h3>${signed ? "Enrolled pairs" : "Eligible pairs"}</h3>
      ${!signed && shownPairs.length > 1 ? `<p class="technical-intake-note">Enrollment uses pairs in this order.</p>` : ""}
      <ol>${shownPairs.map(({ school, workshop }) => `<li><div class="technical-intake-pair">${siteButton(school, "school", reportedSchools.has(school.hex) ? `${added(reportedSchools.get(school.hex))} Skills in ${latest.year}` : "")}
        <span class="technical-intake-pair-link" aria-hidden="true">→</span>${siteButton(workshop, "workshop", reportedWorkshops.has(workshop.hex) ? `Output added in ${latest.year}` : "")}</div></li>`).join("")}</ol>
    </section>` : ""}
  </section>`;
}
