import { briefContent, briefHeadline } from "./annual-brief.js";
import "./annual-brief.css";
import { campaignStorageKey, territories, World } from "./scenario.js";
import { Campaign } from "./campaign.js";
import { campaignOutcomesMarkup } from "./campaign-outcomes.js";
import { decodeSave } from "./save-codec.js";
import { charterOpening } from "./training.js";
import { trainingComparisonMarkup, trainingStatusMarkup } from "./training-view.js";
import { developmentTrees } from "./department-tree.js";
import { departmentTreeMarkup } from "./department-tree-view.js";
import { departmentBadge, departmentIdentity, programmeDepartment } from "./department-presentation.js";
import { departmentIcon } from "./department-icons.js";
import "./department-presentation.css";
import { Fiscal } from "./fiscal.js";
import { fundingReferenceMarkup, priceReferenceMarkup } from "./fiscal-view.js";
import { cabinetPlanMarkup } from "./cabinet-plan-view.js";
import { mandateOptionsMarkup, mandateProgressMarkup } from "./regional-mandate-view.js";
import "./regional-mandate-view.css";
import "./fiscal-view.css";
import { marketFundingMarkup } from "./market-finance-view.js";
import { foodPlanMarkup } from "./food-plan-view.js";
import { crisisSeverity } from "./food-crisis.js";
import { reserveStart, reserveStatus, reserveWindow } from "./union-reserve.js";
import { unionReserveMarkup } from "./union-reserve-view.js";
import { intakeDeadline, intakeStatus } from "./technical-intake.js";
import { technicalIntakeMarkup } from "./technical-intake-view.js";
import { economyRoles, economySites, siteResults } from "./site-economy.js";
import { freightBoardMarkup, freightContractMarkup } from "./freight-view.js";
import { upcomingFreightContract } from "./neighbor-competition.js";
import { campaignCapital, campaignEnd, campaignLengths, campaignName, foundingSaveKey, journeySettings, polityPhase, southernName, successorKey, targets } from "./journey.js";
import { boundaryPreview } from "./journey-map";
import { ReliefMap } from "./map";
import { openingArt } from "./opening.js";
import { accelerateProgramme, accelerationQuote, activeProgramme, approveProgramme, basinAgreementsFor, basinFloodDecision, basinNameFor, partnershipRecord, partnershipWindow, planningPartnership, programmeCommissioned, programmeFootprint, programmeQuote, programmeRequirements, programmes, respondToBasinFlood, visibleProgrammes } from "./programmes.js";

const rupees = (value) => "₹" + value.toLocaleString("en-IN");
const money = Fiscal.lakh;
const textEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => textEntities[character]);

const byId = (id) => document.getElementById(id);
const initialSite = World.capital;
const params = new URLSearchParams(location.search);
const founding = params.get("campaign") === "founding" || World.foundingOnly;
const newJourney = founding && params.get("new") === "1";
const openingKey = founding ? `${foundingSaveKey(World.key)}-briefing` : World.key === "bihar"
  ? "india-alternate-futures-programme-opening-seen" : `india-alternate-futures-programme-opening-seen-${World.key}`;
const guideKey = `${openingKey}-guide-dismissed`;
const mapLayers = {
  terrain: [],
  economy: [],
  access: [["#e8ca7e", "Connected route"]],
  jurisdiction: World.key === "bihar" ? [["#c6753a", "District council sites"]] : [],
  weather: [],
  works: [["#83cbbb", "Operating works"], ["#efc377", "Under construction"]],
};
const modal = byId("modal");
let game;
let selected = initialSite;
let inspectSelection = false;
let inspectEconomy = false;
let inspectWeather = false;
let trainingPreview = null;
let selectedProgramme = "food";
let selectedBasinTerms = "focused";
let layer = "terrain";
let storageIssue = false;
let resolvingSeason = false;
let openingSeen = false;
let guideDismissed = false;
let selectedDepartment = "education";
let cabinetArchiveOpen = false;

const cabinetDepartments = ["food", "trade", "education"];
const tierNumerals = ["", "I", "II", "III", "IV"];
const successorPrefixes = { gujarat: "gj_", maharashtra: "mh_", punjab: "pb_", haryana: "hr_", madras: "tn_", andhra: "ap_" };
const successorNames = { gujarat: "Gujarat", maharashtra: "Maharashtra", punjab: "Punjab", haryana: "Haryana" };
const openingPrefix = (game) => successorPrefixes[successorKey(game)] ?? "";

try {
  Campaign.compactSaves(localStorage);
  if (!newJourney) game = Campaign.load(localStorage, founding);
  openingSeen = !newJourney && localStorage.getItem(openingKey) === "1";
  guideDismissed = !newJourney && localStorage.getItem(guideKey) === "1";
} catch {
  storageIssue = true;
}
game ??= Campaign.newGame(undefined, founding ? journeySettings(params.get("end"), params.get("politics")) : undefined);
selected = campaignCapital(game);
selectedProgramme = `${openingPrefix(game)}food`;
if (newJourney) {
  const url = new URL(location.href);
  for (const key of ["new", "end", "politics"]) url.searchParams.delete(key);
  history.replaceState(null, "", url);
  persist();
  try {
    localStorage.removeItem(openingKey);
    localStorage.removeItem(guideKey);
  } catch { /* The briefing remains available from Help. */ }
}

function persist() {
  try {
    Campaign.save(localStorage, game);
    storageIssue = false;
  } catch {
    storageIssue = true;
  }
}

function choiceButton(text, action, primary = false, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.classList.toggle("primary", primary);
  button.disabled = disabled;
  button.addEventListener("click", action);
  return button;
}

function showModal(kicker, title, content, buttons) {
  modal.classList.remove("opening-dialog", "brief-dialog", "regions-dialog", "founding-dialog", "department-dialog", "results-dialog", "national-market-dialog", "mandate-dialog", "partnership-dialog");
  byId("modal-kicker").textContent = kicker;
  byId("modal-title").textContent = title;
  byId("modal-content").innerHTML = content;
  byId("modal-actions").replaceChildren(...buttons);
  if (!modal.open) modal.showModal();
  byId("modal-title").focus();
}

function savedAt(region, journey) {
  let raw;
  try {
    const key = journey ? foundingSaveKey(region) : campaignStorageKey(region);
    raw = localStorage.getItem(key);
    const saved = decodeSave(raw);
    if (Campaign.validSave(saved, region, journey)) return { saved, exists: true };
  } catch {
    // Keep the option to replace unreadable data explicit.
  }
  return { saved: null, exists: raw != null };
}

function enterCampaign(region, mode, settings) {
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("region", region);
  url.searchParams.set("campaign", mode);
  if (settings) {
    url.searchParams.set("new", "1");
    url.searchParams.set("end", settings.end);
    url.searchParams.set("politics", settings.preset);
  }
  location.assign(url.href);
}

async function showRegions(initial = World.key) {
  const { nationalAtlas, startKind } = await import("./founding-atlas.js");
  const { nationalCoverageMarkup } = await import("./national-coverage.js");
  let region = initial;
  const roster = Object.entries(territories).map(([key, info]) =>
    `<button type="button" class="founding-start" data-start="${key}" aria-pressed="false"><strong>${info.name}</strong><small>${startKind(key)}</small></button>`).join("");
  showModal("Campaign atlas · 1946", "Choose who you will govern", `
    <p>Begin before independence. Make your first development commitment, guide your administration through the transfer of power, then govern through the borders you negotiate.</p>
    <div class="founding-layout">
      <div><div id="atlas-drawing"></div><div id="atlas-coverage"></div></div>
      <div class="founding-controls">
        <div class="founding-controls" role="group" aria-label="Starting region">${roster}</div>
        <div class="founding-preview" id="atlas-preview"></div>
        <div class="founding-settings">
          <label>Campaign length<select id="journey-end"></select></label>
          <label>Politics<select id="journey-politics" aria-describedby="politics-detail"><option value="light">Light</option><option value="standard">Standard</option></select></label>
        </div>
        <small id="politics-detail"></small>
        <div class="founding-actions" id="atlas-actions"></div>
      </div>
    </div>`, [choiceButton("Return to regional map", () => modal.close())]);
  modal.classList.add("founding-dialog");
  byId("journey-politics").value = game.journey?.preset ?? "light";

  const updatePolitics = () => {
    byId("politics-detail").textContent = byId("journey-politics").value === "light"
      ? "Major historical choices with simpler regional trade."
      : "Domestic markets trade from 1946. Neighbors adjust access and migration as conditions change.";
    byId("atlas-coverage").innerHTML = nationalCoverageMarkup({ year: 1946, preset: byId("journey-politics").value });
  };
  byId("journey-politics").addEventListener("change", updatePolitics);
  updatePolitics();
  byId("atlas-coverage").addEventListener("change", (event) => {
    if (!event.target.matches("[data-coverage-period]")) return;
    byId("atlas-coverage").innerHTML = nationalCoverageMarkup({
      year: Number(event.target.value), preset: byId("journey-politics").value,
    });
    byId("atlas-coverage").querySelector("details").open = true;
    byId("atlas-coverage").querySelector("[data-coverage-period]").focus({ preventScroll: true });
  });

  function select(key) {
    region = key;
    const info = territories[key];
    const { saved, exists } = savedAt(key, true);
    const { saved: archive } = savedAt(key, false);
    const length = byId("journey-end");
    const ends = campaignLengths(key);
    const choice = Number(length.value) || campaignEnd(game);
    length.replaceChildren(...ends.map((end) => new Option(`${end - World.start + 1} years · to ${end}`, String(end))));
    length.value = String(ends.includes(choice) ? choice : ends[0]);
    byId("atlas-drawing").innerHTML = nationalAtlas(key);
    for (const button of byId("modal-content").querySelectorAll("[data-start]")) {
      button.setAttribute("aria-pressed", String(button.dataset.start === key));
    }
    byId("atlas-preview").innerHTML = `<p class="kicker">${startKind(key)} · ${money(Fiscal.openingBalance(key, World.start))}</p>
      <h3>${info.name}</h3><p>${info.opening}</p>${exists && !saved ? '<p role="status">This campaign save could not be read.</p>' : ""}`;
    const begin = choiceButton(exists ? "Start over in this region" : `Begin as ${info.name}`, () => {
      const settings = journeySettings(length.value, byId("journey-politics").value, region);
      if (!exists) return enterCampaign(region, "founding", settings);
      const chosen = region;
      showModal("Campaign management", `Start ${info.name} over?`, "<p>This replaces the saved founding campaign for this region.</p>", [
        choiceButton("Keep the saved campaign", () => showRegions(chosen)),
        choiceButton("Begin a new campaign", () => enterCampaign(chosen, "founding", settings), true),
      ]);
    }, !saved);
    begin.id = "begin-founding";
    const buttons = [begin];
    if (saved) {
      const state = key === "madras" ? southernName(saved) : successorNames[successorKey(saved)];
      const status = saved.year > saved.journey.end ? `Review completed campaign${state ? ` · ${state}` : ""}` : `Resume ${saved.year} campaign${state ? ` · ${state}` : ""}`;
      buttons.unshift(choiceButton(status, () => {
        if (founding && key === World.key) {
          if (saved.year > saved.journey.end) showResults();
          else modal.close();
        }
        else enterCampaign(key, "founding");
      }, true));
    }
    if (archive) buttons.push(choiceButton(`Resume earlier regional save · ${Math.min(archive.year, World.end)}`, () => {
      if (!founding && key === World.key) modal.close();
      else enterCampaign(key, "archive");
    }));
    byId("atlas-actions").replaceChildren(...buttons);
  }

  for (const button of byId("modal-content").querySelectorAll("[data-start]")) {
    button.addEventListener("click", () => select(button.dataset.start));
  }
  byId("atlas-drawing").addEventListener("click", (event) => {
    const key = event.target.closest("[data-atlas-start]")?.dataset.atlasStart;
    if (key) select(key);
  });
  select(region);
}

function acknowledgeOpening() {
  openingSeen = true;
  try {
    localStorage.setItem(openingKey, "1");
  } catch {
    // The guide can be used even when browser storage is unavailable.
  }
}

function reviewProgramme(id, focus = false) {
  selectedProgramme = id;
  inspectSelection = false;
  inspectWeather = false;
  trainingPreview = null;
  const plan = programmes[id];
  selected = plan.works[0].hex;
  layer = plan.layer;
  render();
  if (focus) {
    ReliefMap.reset();
    if (World.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger") ReliefMap.zoom(.55, selected);
    if (plan.partnership) {
      ReliefMap.zoom(.7, selected);
      byId("map").scrollIntoView({ block: "nearest" });
    }
    byId("programme-title").focus({ preventScroll: true });
  }
}

function programmeKind(plan, tier) {
  const parts = [];
  if (tier) parts.push(`Tier ${tierNumerals[tier] ?? tier}`);
  if (plan.partnership) parts.push("Union partnership");
  else if (plan.era) parts.push("Special project");
  else if (!plan.department && plan.requires) parts.push("Follow-on");
  return parts.join(" · ");
}

function showOpening() {
  const isOpening = game.year === World.start;
  const successor = successorKey(game);
  const openings = Object.entries(visibleProgrammes(game)).filter(([, plan]) => plan.opening && (!successor || (plan.bombaySuccessor ?? plan.punjabSuccessor ?? plan.madrasSuccessor) === successor));
  const cards = openings.map(([id, plan]) => {
    const quote = programmeQuote(game, id);
    const { id: department, label, tier } = programmeDepartment(World, game, id, plan);
    return `<article class="opening-path" data-path="${id}" data-sector="${department}">
      <svg class="opening-illustration" viewBox="0 0 200 90" aria-hidden="true" focusable="false">${openingArt[id.replace(/^(mh|gj)_/, "")]}</svg>
      <div class="opening-path-copy"><div class="programme-identity">${departmentBadge(department, label)}<span class="programme-tier">${programmeKind(plan, tier)}</span></div><h3>${plan.title}</h3><p>${plan.pitch}</p>
      <p class="opening-chain">${plan.next}</p><p class="opening-cost">${quote.duration ? `${money(quote.cost)} · ${quote.duration} ${quote.duration === 1 ? "year" : "years"}` : "Works already placed"}</p></div>
    </article>`;
  }).join("");
  showModal(isOpening ? "1946 · Cabinet briefing" : "Field guide · Regional programmes", `Set ${campaignName(game)}’s development priority`, `
    <p class="opening-lede">You have ${money(game.cash)} in the treasury. Choose a regional programme to fund its works. ${game.journey ? "Development trees show what each investment unlocks." : "See the works appear on the map as the years pass."}</p>
    <ol class="opening-stages"><li>1. Review a programme</li><li>2. Commit the budget</li><li>3. Review each year's results</li></ol>
    <div class="opening-paths">${cards}</div>
    <p class="opening-disclaimer">The works office can deliver one programme at a time. You can change direction when it finishes.</p>`, [choiceButton("Campaign atlas", () => showRegions()), choiceButton("Return to map", () => {
      acknowledgeOpening();
      modal.close();
    })]);
  modal.classList.add("opening-dialog");
  for (const [id, plan] of openings) {
    const button = choiceButton("Review programme →", () => {
      acknowledgeOpening();
      modal.close();
      reviewProgramme(id, true);
    });
    button.setAttribute("aria-label", `Review ${plan.title}`);
    byId("modal-content").querySelector(`[data-path="${id}"]`).append(button);
  }
}

function cabinetEntries(active) {
  return Object.entries(visibleProgrammes(game)).flatMap(([id, plan]) => {
    const record = game.programmes?.find((entry) => entry.id === id);
    if (plan.partnership && !record && selectedProgramme !== id) return [];
    if (plan.treeOnly && id !== selectedProgramme && !record) return [];
    const department = programmeDepartment(World, game, id, plan);
    const quote = programmeQuote(game, id);
    const operating = programmeCommissioned(game, id);
    const status = active?.id === id ? `Due ${active.finish}` : operating ? "Operating"
      : record ? "Archived" : quote.reason ? "Locked" : "Ready";
    return [{ id, plan, record, department, status }];
  });
}

function programmeCard({ id, plan, department, status }, context = "") {
  const button = choiceButton(plan.title, () => reviewProgramme(id, true));
  button.className = "cabinet-programme";
  button.dataset.programme = id;
  button.dataset.sector = department.id;
  button.setAttribute("aria-pressed", String(selectedProgramme === id));
  const kind = programmeKind(plan, department.tier);
  button.innerHTML = `<span class="cabinet-programme-mark">${departmentIcon(departmentIdentity[department.id].icon)}</span><span class="cabinet-programme-copy">
    ${context ? `<span class="cabinet-programme-context">${context}</span>` : ""}
    <strong>${plan.title}</strong>${kind ? `<span class="programme-tier">${kind}</span>` : ""}</span><small>${status}</small>`;
  return button;
}

function openCabinetDepartment(department, focusTab = false) {
  const active = activeProgramme(game);
  const entries = cabinetEntries(active).filter((entry) => entry.department.id === department);
  const current = entries.find(({ id }) => id === selectedProgramme);
  const next = current ?? entries.find(({ status }) => status === "Ready") ?? entries.find(({ record }) => !record) ?? entries[0];
  if (!next) return;
  reviewProgramme(next.id, !focusTab);
  if (focusTab) byId("programme-list").querySelector(`[data-cabinet-department="${department}"]`)?.focus({ preventScroll: true });
}

function showPlanningPartnership() {
  const model = planningPartnership(game);
  if (!model || model.record) return;
  const preparing = game.year < partnershipWindow.opens;
  const cards = model.options.map(({ id, plan, quote, requirements }) => {
    const status = preparing ? `Opens ${partnershipWindow.opens}` : quote.reason ? "Not ready" : "Ready to fund";
    return `<article class="partnership-option" data-sector="${plan.department}" data-ready="${!quote.reason}">
      <header>${departmentBadge(plan.department)}<span class="partnership-state">${status}</span></header>
      <h3>${escapeText(plan.title)}</h3><p class="partnership-area">${escapeText(plan.district)}</p>
      <p class="partnership-outcome">${escapeText(plan.outcome)}${plan.department === "trade" && game.journey?.preset === "standard" ? " Market-linked suppliers also strengthen freight bids." : ""}</p>
      <dl class="partnership-finance"><div><dt>State share</dt><dd>${money(quote.cost)}</dd></div><div><dt>Union share</dt><dd>${money(quote.union)}</dd></div></dl>
      <p class="partnership-duration">${quote.duration ? `${quote.duration} ${quote.duration === 1 ? "year" : "years"} to deliver` : "Works already operating"}</p>
      <ul class="partnership-requirements" aria-label="Eligibility">${requirements.map(({ text, met }) => `<li data-met="${met}"><span>${met ? "Met" : "Requires"}</span> ${escapeText(text)}</li>`).join("")}</ul>
      ${quote.reason ? `<p class="partnership-reason">${escapeText(quote.reason)}</p>` : ""}
      <button type="button" data-partnership-review="${id}" aria-label="Review ${escapeText(plan.title)} on the map">Review on map <span aria-hidden="true">→</span></button>
    </article>`;
  }).join("");
  showModal(`${partnershipWindow.opens}–${partnershipWindow.closes} · Union co-funding`, preparing ? "Prepare a partnership" : "Choose one partnership", `
    <p class="partnership-lede">The Union will co-fund one package. Review the sites, then commit the state share by ${partnershipWindow.closes}.</p>
    <p class="partnership-quote-year">${game.year} ${preparing ? "price estimates" : "quotes"}</p>
    <div class="partnership-options">${cards}</div>`, [choiceButton("Return to Cabinet", returnToMap, true)]);
  modal.classList.add("partnership-dialog");
  for (const button of byId("modal-content").querySelectorAll("[data-partnership-review]")) {
    button.addEventListener("click", () => {
      modal.close();
      reviewProgramme(button.dataset.partnershipReview, true);
    });
  }
}

function renderCabinetList(active, department) {
  const entries = cabinetEntries(active);
  const list = byId("programme-list");
  const picker = document.createElement("div");
  picker.className = "cabinet-department-picker";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", "Programme departments");
  for (const sector of cabinetDepartments) {
    const button = choiceButton("", () => openCabinetDepartment(sector, true));
    button.dataset.cabinetDepartment = sector;
    button.dataset.sector = sector;
    button.setAttribute("aria-controls", "cabinet-department-programmes");
    button.setAttribute("aria-pressed", String(sector === department));
    button.innerHTML = departmentBadge(sector);
    picker.append(button);
  }
  const cards = document.createElement("div");
  cards.id = "cabinet-department-programmes";
  cards.className = "cabinet-programme-cards";
  for (const entry of entries) {
    if (entry.department.id !== department || entry.record) continue;
    cards.append(programmeCard(entry));
  }
  if (!cards.childElementCount) {
    cards.innerHTML = '<p class="cabinet-empty">No new regional programmes in this department.</p>';
  }
  list.replaceChildren(picker, cards);
  const partnership = planningPartnership(game);
  if (partnership && !partnership.record) {
    const compare = choiceButton("", showPlanningPartnership);
    compare.className = "cabinet-partnership-link";
    compare.innerHTML = `<span><strong>Union development partnership</strong><small>${game.year < partnershipWindow.opens ? `Prepare for ${partnershipWindow.opens}` : `Choose by ${partnershipWindow.closes}`} · One package</small></span><b>Compare →</b>`;
    list.prepend(compare);
  }

  const ongoing = entries.find(({ id }) => id === active?.id);
  if (ongoing) {
    list.append(programmeCard(ongoing, `Active works · ${ongoing.department.label}`));
  }
  const archive = entries.filter(({ id, record }) => record && id !== active?.id).sort((a, b) => b.record.approved - a.record.approved);
  if (!archive.length) return;
  const ledger = document.createElement("details");
  ledger.className = "cabinet-archive";
  ledger.open = cabinetArchiveOpen || archive.some(({ id }) => id === selectedProgramme);
  ledger.innerHTML = `<summary>Programme archive <span>${archive.length}</span></summary>`;
  const archivedCards = document.createElement("div");
  archivedCards.className = "cabinet-programme-cards";
  for (const entry of archive) archivedCards.append(programmeCard(entry, entry.department.label));
  ledger.append(archivedCards);
  ledger.addEventListener("toggle", () => { cabinetArchiveOpen = ledger.open; });
  list.append(ledger);
}

function renderProgrammes() {
  const plans = game.programmes ?? [];
  const active = activeProgramme(game);
  byId("programme-state").textContent = active ? `Delivery through ${active.finish}` : "Works office available";
  byId("development-trees").hidden = !game.journey;
  const plan = programmes[selectedProgramme];
  const { id: department, label, tier } = programmeDepartment(World, game, selectedProgramme, plan);
  renderCabinetList(active, department);
  const agreements = basinAgreementsFor(selectedProgramme);
  const isBasin = Boolean(agreements);
  const quote = programmeQuote(game, selectedProgramme, selectedBasinTerms);
  const record = plans.find(({ id }) => id === selectedProgramme);
  const inherited = !record && programmeCommissioned(game, selectedProgramme);
  const terms = agreements?.[record ? record.terms?.agreement : selectedBasinTerms];
  const union = record?.partnership?.union ?? record?.terms?.union ?? quote.union;
  const period = record ? `${record.approved}–${record.finish}` : quote.duration ? `${quote.duration} ${quote.duration === 1 ? "year" : "years"}` : "Works already placed";
  const funded = record ? record.cost : quote.cost;
  const requirements = record ? [] : programmeRequirements(game, selectedProgramme);
  const summary = record ? active?.id === record.id ? `Funded. Final works due in ${record.finish}.`
    : programmeCommissioned(game, selectedProgramme) ? `Delivered in ${record.finish}.` : "Archived following a change in administration."
    : inherited ? "The required works are already operating." : quote.reason || `${money(game.cash - funded)} remains after approval.`;
  const details = byId("programme-details");
  details.dataset.sector = department;
  details.innerHTML = `
    <div class="programme-identity">${departmentBadge(department, label)}<span class="programme-tier">${programmeKind(plan, tier)}</span></div><h3 id="programme-title" tabindex="-1">${plan.title}</h3>
    <p class="programme-area">${terms?.area ?? plan.district}</p><p>${terms?.detail ?? plan.outcome}</p>
    ${isBasin && !record ? '<div id="kosi-options" class="kosi-options" role="group" aria-label="Compare basin agreements"></div>' : `<p class="programme-next">${plan.next}</p>`}
    ${requirements.length ? `<ul class="programme-prerequisites" aria-label="Prerequisites">${requirements.map(({ text, met }) => `<li>${met ? "Met" : "Requires"} · ${text}</li>`).join("")}</ul>` : ""}
    ${inherited ? "" : `<div class="programme-terms"><b>${money(funded)}</b><span>${plan.partnership ? "State share · " : ""}${period}</span></div>`}
    ${plan.partnership ? `<p class="partnership-contribution">Union share <b>${money(union)}</b>${record ? "" : " · One package can receive co-funding"}</p>` : ""}
    ${!inherited && record && game.journey ? `<p class="fiscal-note">Committed in ${record.approved}</p>`
      : !inherited && quote.pricing && quote.cost !== quote.pricing.baseCost ? `<p class="fiscal-note">${quote.pricing.year} quote · ${money(quote.pricing.baseCost)} at ${quote.pricing.priceYear} prices</p>` : ""}
    ${terms ? basinTermsContent(terms, quote, record, union) : ""}
    <p class="programme-status">${summary}</p>`;
  const priority = !record && Number.isFinite(funded) ? Campaign.cabinetPriority({ ...game, cash: game.cash - funded }) : null;
  if (priority?.current?.status === "paused" && Campaign.cabinetPriority(game).current?.status === "funded") {
    const warning = document.createElement("p");
    warning.className = "programme-status";
    warning.textContent = "This commitment would pause your five-year priority this year.";
    details.append(warning);
  }
  if (isBasin && !record) renderBasinOffers(agreements);
  if (!record && !inherited) {
    const approve = choiceButton(`${isBasin ? "Sign agreement" : "Approve programme"} · ${money(funded)}`, () => {
      const updated = approveProgramme(game, selectedProgramme, selectedBasinTerms);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      byId("feedback").textContent = `${plan.title} approved. ${money(game.cash)} remains.`;
      byId("advance").focus({ preventScroll: true });
    }, true, Boolean(quote.reason));
    approve.id = "approve-programme";
    details.append(approve);
  }
  const faster = accelerationQuote(game, selectedProgramme);
  if (faster) {
    const hurry = choiceButton(`Finish in ${faster.finish} · ${money(faster.cost)} extra`, () => {
      const updated = accelerateProgramme(game, selectedProgramme);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      byId("feedback").textContent = `Delivery accelerated to ${faster.finish}.`;
      byId("advance").focus({ preventScroll: true });
    }, false, !faster.affordable);
    hurry.id = "accelerate-programme";
    details.append(hurry);
  }
  if (game.journey) {
    const tree = choiceButton(`View ${label} tree →`, () => {
      selectedDepartment = department;
      showDevelopmentTrees(false, tier || plan.partnership ? selectedProgramme : null);
    });
    tree.className = "programme-tree-link";
    tree.dataset.programmeTree = department;
    details.append(tree);
  }
}

function basinTermsContent(terms, quote, record, union) {
  const firstDefence = quote.works.find(({ kind }) => kind === "levee");
  const schedule = !record && firstDefence ? ` · First embankment due ${game.year + firstDefence.year - 1}` : "";
  const financing = union ? `${campaignName(game)} ${money(record?.cost ?? quote.cost)} · Union ${money(union)}` : terms.funding;
  return `<p class="kosi-financing">${financing}${schedule}</p>`;
}

function renderBasinOffers(agreements) {
  for (const [key, offer] of Object.entries(agreements)) {
    const quote = programmeQuote(game, selectedProgramme, key);
    const button = choiceButton(offer.title, () => {
      selectedBasinTerms = key;
      render();
      byId("kosi-options").querySelector(`[data-terms="${key}"]`).focus({ preventScroll: true });
    });
    button.dataset.terms = key;
    button.setAttribute("aria-pressed", String(selectedBasinTerms === key));
    button.innerHTML = `<span>${offer.title}</span><small>${money(quote.cost)} · ${quote.duration || 0} yr</small>`;
    byId("kosi-options").append(button);
  }
}
function selectSite(id, fromMap = false) {
  selected = id;
  inspectSelection = true;
  render();
  if (fromMap) ReliefMap.focus(id);
  else {
    ReliefMap.reset();
    ReliefMap.zoom(.67, id);
  }
}

function pendingDecision() {
  const decision = Campaign.nextDecision(game);
  if (decision) return { title: decision.title, open: () => showDecision(decision) };
  const flood = basinFloodDecision(game);
  if (flood) return { title: `${basinNameFor(flood.id)} flood response`, open: showBasinDecision };
  return null;
}

function returnToMap() {
  modal.close();
  if (!byId("pending-decision").hidden) byId("review-decision").focus();
}

function showDevelopmentTrees(focusDepartment = false, focusNode = null) {
  const delivery = activeProgramme(game);
  const overview = `${money(game.cash)} available · ${delivery ? `Works office occupied through ${delivery.finish}` : "Works office available"}`;
  showModal(`${Math.min(game.year, campaignEnd(game))} · Cabinet planning`, "Development trees",
    departmentTreeMarkup(developmentTrees(game), selectedDepartment, overview), [
    ...(Campaign.cabinetPriority(game).available ? [choiceButton("Five-year priority", showCabinetPriority)] : []),
    ...(selectedDepartment === "food" && reserveWindow(game) ? [choiceButton("Union food reserve", () => showUnionReserve(showDevelopmentTrees, "Back to Food & Water"))] : []),
    choiceButton("Regional programmes →", () => {
      modal.close();
      openCabinetDepartment(selectedDepartment);
    }), choiceButton("Return to map", () => {
      modal.close();
      byId("development-trees").focus({ preventScroll: true });
    })]);
  modal.classList.add("department-dialog");
  const content = byId("modal-content");
  for (const button of content.querySelectorAll("[data-department]")) {
    button.addEventListener("click", () => {
      selectedDepartment = button.dataset.department;
      showDevelopmentTrees(true);
    });
  }
  if (focusDepartment) content.querySelector(`[data-department="${selectedDepartment}"]`)?.focus({ preventScroll: true });
  if (focusNode) {
    const node = content.querySelector(`[data-tree-node="${focusNode}"]`);
    (node ?? content.querySelector(`[data-department="${selectedDepartment}"]`))?.focus();
  }
  for (const button of content.querySelectorAll("[data-tree-node]")) {
    button.addEventListener("click", () => {
      const id = button.dataset.treeNode;
      if (id.startsWith("charter:")) {
        showTraining(true);
        return;
      }
      if (id === "technical-intake") {
        showTechnicalIntake(true);
        return;
      }
      modal.close();
      reviewProgramme(id, true);
    });
  }
}

function renderCabinetGuide() {
  const guide = byId("cabinet-guide");
  guide.hidden = !game.journey || guideDismissed || game.reports.length > 1;
  if (guide.hidden) return;
  const current = game.reports.length ? 2 : game.programmes.length ? 1 : 0;
  const steps = ["Fund works", "Advance year", "Read results"];
  const copy = ["Compare the first three investments and choose where to start.", "Advance to see how the monsoon and your works affect the year.", "See what the harvest covered and which works opened."];
  guide.innerHTML = `<header><strong>First turns</strong><button type="button" data-guide-dismiss aria-label="Dismiss first turns guide">×</button></header>
    <ol>${steps.map((step, index) => `<li${index === current ? ' aria-current="step"' : ""}>${step}</li>`).join("")}</ol>
    <p>${copy[current]}</p><div class="cabinet-guide-action"></div>`;
  const actions = [showOpening, () => byId("advance").click(), () => showReport(0)];
  const labels = ["Compare investments", "Advance year", "Open first report"];
  guide.querySelector(".cabinet-guide-action").append(choiceButton(labels[current], actions[current]));
}

function showRelief() {
  const plan = Campaign.foodPlan(game);
  const { authorization } = plan;
  showModal(`${game.year} · Monsoon planning`, "Emergency food plan", `
    ${foodPlanMarkup(plan)}
    <p class="fiscal-note">A purchase cap replaces the standing food policy for ${game.year}.</p>
    <div id="relief-options" class="modal-actions" role="group" aria-label="Set purchase cap"></div>`,
  [choiceButton("Return to map", () => { returnToMap(); byId("relief").focus(); })]);
  for (const button of byId("modal-content").querySelectorAll("[data-crisis-order]")) {
    button.addEventListener("click", () => {
      const { crisisOrder } = button.dataset;
      game = Campaign.orderCrisisFood(game, crisisOrder === "union");
      persist();
      render();
      showRelief();
      byId("modal-content").querySelector(`[data-crisis-order="${crisisOrder}"]`).focus();
    });
  }
  for (const budget of [0, 4, 8, 12]) {
    const button = choiceButton(budget ? money(budget) : "Use standing policy", () => {
      game = Campaign.authorizeRelief(game, budget);
      persist();
      render();
      showRelief();
      byId("relief-options").querySelector(`[data-relief-budget="${budget}"]`).focus();
    }, budget === authorization, budget > game.cash);
    button.dataset.reliefBudget = budget;
    button.setAttribute("aria-pressed", String(budget === authorization));
    byId("relief-options").append(button);
  }
}

function showUnionReserve(back = null, label = "Return to map") {
  const plan = Campaign.unionReserve(game);
  showModal(`${game.year} · Department of Food`, "Union food reserve", unionReserveMarkup(plan), [
    choiceButton(label, back ?? (() => {
      returnToMap();
      byId("union-reserve").focus();
    }), true),
  ]);
  modal.classList.add("opening-dialog");
  for (const button of byId("modal-content").querySelectorAll("[data-union-reserve-choice]")) {
    button.addEventListener("click", () => {
      const updated = Campaign.acceptUnionReserve(game, button.dataset.unionReserveChoice);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      showUnionReserve(back, label);
    });
  }
}

function showCabinetPriority() {
  const model = Campaign.cabinetPriority(game);
  showModal(`${game.year} · Cabinet planning`, "Five-year priority", cabinetPlanMarkup(model), [
    choiceButton("Development trees", () => showDevelopmentTrees()),
    choiceButton("Economy map", () => showPriorityMap()),
    choiceButton("Return to map", returnToMap, true),
  ]);
  modal.classList.add("opening-dialog");
  for (const button of byId("modal-content").querySelectorAll("[data-cabinet-plan]")) {
    button.addEventListener("click", () => {
      const next = Campaign.chooseCabinetPriority(game, button.dataset.cabinetPlan);
      if (next === game) return;
      game = next;
      persist();
      render();
      showCabinetPriority();
    });
  }
}

function showRegionalMandate(back = returnToMap, backLabel = "Return to map") {
  const model = Campaign.regionalMandate(game);
  const focus = model.progress?.id;
  const date = Math.min(game.year, campaignEnd(game));
  showModal(`${date} · Cabinet planning`, "Regional mandate", mandateOptionsMarkup(model), [
    ...(focus && !model.progress.complete ? [choiceButton(`Open ${departmentIdentity[focus].label} tree`, () => {
      selectedDepartment = focus;
      showDevelopmentTrees(true);
    })] : []),
    choiceButton(backLabel, back, true),
  ]);
  modal.classList.add("opening-dialog", "mandate-dialog");
  for (const button of byId("modal-content").querySelectorAll("[data-regional-mandate]")) {
    button.addEventListener("click", () => {
      const next = Campaign.chooseRegionalMandate(game, button.dataset.regionalMandate);
      if (next === game) return;
      game = next;
      persist();
      render();
      showRegionalMandate(back, backLabel);
    });
  }
}

function showPriorityMap(report = game.reports.at(-1)) {
  const priority = report?.cabinetPriority;
  const candidates = priority?.id === "food" ? priority.sites.food : priority?.id === "education" ? priority.sites.education : priority?.sites.trade;
  const site = candidates?.find(({ hex }) => game.owners[hex] === World.key);
  if (site) focusEconomySite(site.hex);
  else showEconomyMap();
}

function showTechnicalIntake(fromTree = false) {
  const plan = Campaign.technicalIntake(game);
  if (!plan) return;
  showModal(`${Math.min(game.year, campaignEnd(game))} · Education`, "Technical training intake", technicalIntakeMarkup(plan), [
    fromTree ? choiceButton("Back to Education", () => showDevelopmentTrees(false, "technical-intake"), true)
      : choiceButton("Return to map", () => {
        returnToMap();
        byId("technical-intake").focus();
      }, true),
  ]);
  modal.classList.add("opening-dialog");
  const content = byId("modal-content");
  for (const button of content.querySelectorAll("[data-technical-enroll]")) {
    button.addEventListener("click", () => {
      const updated = Campaign.acceptTechnicalIntake(game, Number(button.dataset.technicalEnroll));
      if (updated === game) return;
      game = updated;
      persist();
      render();
      showTechnicalIntake(fromTree);
    });
  }
  for (const button of content.querySelectorAll("[data-technical-site]")) {
    button.addEventListener("click", () => focusEconomySite(button.dataset.technicalSite));
  }
}

function render() {
  const done = game.year > campaignEnd(game);
  const end = campaignEnd(game);
  const name = campaignName(game);
  const goal = targets(game);
  const { latest, secureYears, productiveYears, productiveTarget } = Campaign.score(game);
  const { reached, towns } = Campaign.access(game);
  const tile = World.tiles[selected];
  const terrain = World.terrain[tile.kind];
  const pending = pendingDecision();
  const training = Campaign.training(game);
  const priority = Campaign.cabinetPriority(game);
  byId("cabinet-priority").hidden = !priority.available;
  byId("cabinet-priority").dataset.sector = priority.current?.id ?? "";
  byId("cabinet-priority").querySelector("small").textContent = priority.current
    ? `${priority.current.label} · ${priority.current.status === "paused" ? "Paused" : `to ${priority.current.ends}`}` : "Choose a focus →";
  const mandate = Campaign.regionalMandate(game);
  const mandateButton = byId("regional-mandate");
  mandateButton.hidden = !mandate.available && !mandate.progress;
  mandateButton.dataset.sector = mandate.progress?.id ?? "";
  mandateButton.querySelector("small").textContent = mandate.progress?.label ?? `Choose by ${mandate.closes} →`;

  byId("year").textContent = done ? "Complete" : game.year;
  document.title = `${name} · India: Alternate Futures`;
  byId("title").textContent = name;
  byId("campaign-edition").textContent = game.journey ? `${polityPhase(game)} · 1946–${end}` : `Campaign ${World.number} · 1946–${end}`;
  byId("goals-year").textContent = `${end} scorecard`;
  byId("chronicle").hidden = !game.journey;
  byId("neighbors").hidden = !game.journey;
  const contract = upcomingFreightContract(game);
  byId("neighbors").textContent = contract ? `Neighbors · ${contract.start} bid` : "Neighbors";
  byId("neighbors").classList.toggle("funding-open", Boolean(contract));
  byId("progress").max = end - World.start + 1;
  byId("progress").value = game.reports.length;
  const outlook = Campaign.outlook(game);
  const stress = !done && game.journey && outlook !== "No monsoon warning" ? Campaign.foodPlan(game).cases[1] : null;
  byId("campaign-line").textContent = done ? `${game.reports.length} years of regional decisions are ready to review.`
    : stress ? `${outlook}. ${stress.gap ? `${stress.gap} more food ${stress.gap === 1 ? "unit" : "units"} could be needed after reserves.` : "Harvest and reserves cover the forecast scenario."}`
      : `${outlook}.`;
  byId("pending-decision").hidden = !pending;
  byId("pending-year").textContent = pending ? `Decision pending · ${game.year}` : "";
  byId("pending-title").textContent = pending?.title ?? "";
  byId("save-status").textContent = storageIssue ? "Autosave unavailable" : game.reports.length || game.assets.length ? "Saved on this device" : "Local autosave";
  const grant = Campaign.grantWindow(game);
  byId("finance").classList.toggle("funding-open", grant.open && !grant.award);
  byId("finance").textContent = grant.open && !grant.award ? "Union funding open" : "Budget office";
  byId("indicators").innerHTML = [
    ["Treasury", rupees(game.cash), "lakh available for works"],
    ["Food security", latest ? (latest.shortage ? `${latest.shortage} short` : "Covered") : "Pending", `${game.reserve} in reserve`],
    ["Market links", towns, "connected settlements"],
    ["Workshop output", latest?.output ?? 0, "production units", '<button type="button" id="economy">Economy breakdown</button>'],
    ["Skills", latest?.skills ?? 0, "training points"],
  ].map(([label, number, detail, action]) => `<div class="indicator"><span>${label}</span><strong>${number}</strong><small>${detail}</small>${action ?? ""}</div>`).join("");

  const townName = (tile.town?.era ?? World.start) <= game.year ? tile.town?.name : null;
  byId("site-title").textContent = townName ?? terrain.name;
  for (const option of byId("jump").options) option.hidden = Number(option.dataset.era ?? World.start) > game.year;
  byId("jump").value = townName ? tile.id : "";
  const localAssets = game.assets.filter((asset) => asset.hex === tile.id);
  const operating = localAssets.filter((asset) => !asset.remaining);
  const building = localAssets.length - operating.length;
  const owned = game.owners[selected] === World.key;
  const developedSites = layer === "economy" ? economySites(game) : [];
  const selectedRoles = developedSites.find(({ hex }) => hex === selected)?.roles ?? [];
  const results = owned ? siteResults(latest, selected) : null;
  const production = results?.output != null ? `${results.output} workshop output` : "";
  const harvest = results?.food != null ? `${results.food} food from irrigation` : "";
  const resultsSummary = [production, harvest].filter(Boolean).join(" · ");
  const intakeSchool = owned && latest?.technicalIntake?.schools?.find(({ hex }) => hex === selected);
  const roleSummary = selectedRoles.map((role) => economyRoles[role].label).join(" · ");
  const workforce = owned && game.journey?.cabinet?.education?.[selected];
  const workforceNote = workforce ? `<p>${workforce.cohorts} trained ${workforce.cohorts === 1 ? "cohort" : "cohorts"} · ${workforce.years % 5}/5 funded years toward the next.</p>` : "";
  const effects = (results?.workshopEffects.length ? `<ul aria-label="Effects on workshop output">${results.workshopEffects.map(({ label, units }) => `<li><b>${units > 0 ? "+" : ""}${units}</b> ${label}</li>`).join("")}</ul>` : "") + workforceNote;
  const floodSites = latest?.attribution?.food?.floodSites ?? [];
  const droughtSites = latest?.attribution?.food?.droughtSites ?? [];
  const floodImpact = layer === "weather" && floodSites.find(({ hex }) => hex === selected);
  const droughtImpact = layer === "weather" && droughtSites.find(({ hex }) => hex === selected);
  const floodSummary = floodImpact && [
    floodImpact.lost ? `${floodImpact.lost} food lost` : "",
    floodImpact.protected ? `${floodImpact.protected} food saved` : "",
  ].filter(Boolean).join(" · ");
  byId("map-site-peek").hidden = !inspectSelection;
  byId("map-site-name").textContent = townName ?? World.districts[tile.district];
  byId("map-site-summary").textContent = (droughtImpact && `${droughtImpact.lost} food lost before recovery`) || floodSummary || (layer === "economy" && (resultsSummary || roleSummary)) || (localAssets.length
    ? [operating.length ? `${operating.length} operating` : "", building ? `${building} building` : ""].filter(Boolean).join(" · ")
    : "No works at this site");
  const siteProduction = byId("map-site-production");
  const siteDetails = byId("inspect-site");
  const economyDetailsOpen = layer === "economy" && inspectEconomy;
  siteProduction.hidden = !economyDetailsOpen;
  siteDetails.textContent = economyDetailsOpen ? "Hide" : "Details";
  if (layer === "economy") {
    siteDetails.setAttribute("aria-expanded", String(economyDetailsOpen));
    siteDetails.setAttribute("aria-controls", "map-site-production");
  } else {
    siteDetails.removeAttribute("aria-expanded");
    siteDetails.removeAttribute("aria-controls");
  }
  if (economyDetailsOpen) {
    const facilities = [...new Set(operating.map(({ kind }) => Campaign.projects[kind].name))].join(" · ");
    siteProduction.innerHTML = `${resultsSummary ? `<b>${latest.year} production</b>${effects}` : ""}<p>${facilities || "No operating facilities"}</p>`;
  }
  const exposure = ["Low", "Moderate", "High", "Severe"][tile.flood];
  const owner = game.owners[selected];
  const ownerName = owner === World.key ? `${name} administration` : World.owners[owner];
  const elevation = ReliefMap.elevation(selected);
  byId("site-details").innerHTML = `<p class="site-location">${World.districts[tile.district]} <span>·</span> ${ownerName}</p>
    <div class="site-facts"><div><small>Terrain</small><b>${terrain.name}</b></div><div><small>Flood risk</small><b>${exposure}</b></div><div><small>Market</small><b>${Campaign.isConnected(reached, selected) ? "In reach" : "Isolated"}</b></div></div>
    <p class="site-bonus">${elevation === undefined ? "Elevation unavailable" : `Approximate elevation · ${elevation.toLocaleString("en-IN")} m`}</p>
    ${floodSummary ? `<p class="site-bonus">${latest.year} flood · ${floodSummary}</p>` : ""}
    ${tile.mineral ? '<p class="site-bonus">◆ Local mineral deposits</p>' : ''}
    ${resultsSummary ? `<section class="site-production"><h3>${latest.year} production</h3><p>${resultsSummary}</p>${effects}</section>` : ""}
    ${intakeSchool ? `<p class="site-bonus">${latest.year} technical intake · +${intakeSchool.skills} Skills</p>` : ""}
    ${localAssets.length ? `<ul class="site-works">${localAssets.map((asset) => `<li data-building="${Boolean(asset.remaining)}"><strong>${Campaign.projects[asset.kind].name}</strong><small>${asset.remaining ? `Due ${game.year + asset.remaining - 1}` : asset.completed ? `Operating since ${asset.completed}` : "Operating"}</small></li>`).join("")}</ul>` : "<p class='site-bonus'>No works at this site.</p>"}`;
  renderProgrammes();
  renderCabinetGuide();
  byId("training-charter").hidden = !training.available;
  byId("training-charter").innerHTML = trainingStatusMarkup(training);
  const intakeAction = byId("technical-intake");
  const intake = intakeStatus(game);
  intakeAction.hidden = !intake;
  intakeAction.querySelector("small").textContent = intake === "signed" ? "Funded →" : intake === "open" ? "Apply this year →" : `${intakeDeadline} offer →`;

  byId("trade-policy").value = game.policy;
  byId("trade-policy").disabled = done;
  const relief = game.relief?.year === game.year ? game.relief : null;
  byId("trade-note").textContent = relief ? `Purchase cap for ${game.year}` : "Applies each year";
  byId("relief").hidden = !game.journey || done;
  byId("relief").textContent = crisisSeverity(game, World.key)
    ? game.crisisOrder?.year === game.year ? "Drought plan · Union food ordered" : "Drought plan · Review supplies"
    : relief ? `Emergency purchases · ${money(relief.budget)} cap` : "Emergency food plan";
  const reserveAction = byId("union-reserve");
  const reserveOffer = reserveStatus(game);
  reserveAction.hidden = done || !reserveWindow(game);
  reserveAction.textContent = reserveOffer === "notice" ? `Union food reserve · ${reserveStart} offer`
    : reserveOffer === "open" ? "Union food reserve · Sign this year"
      : reserveOffer === "signed" ? "Union food reserve · Signed" : "Union food reserve";
  byId("advance").textContent = done ? "Campaign results →" : pending ? "Review pending decision →" : `Advance ${game.year} →`;
  byId("reports").disabled = !game.reports.length;
  const active = activeProgramme(game);
  const queued = game.assets.filter((asset) => asset.remaining > 0 && !asset.programme);
  const portfolio = active ? `<div class="programme-progress"><strong>${programmes[active.id].title}</strong><p>Final phase due ${active.finish}</p><progress max="${active.finish - active.approved + 1}" value="${game.year - active.approved}" aria-label="Programme delivery progress"></progress></div>` : "";
  const earlierWorks = queued.length ? `<ul>${queued.map((asset) => {
    const site = World.tiles[asset.hex];
    return `<li><strong>${Campaign.projects[asset.kind].name}</strong><span>${site.town?.name ?? World.districts[site.district]} · ${asset.remaining} yr${asset.remaining === 1 ? "" : "s"}</span></li>`;
  }).join("")}</ul>` : "";
  byId("queue").innerHTML = portfolio + earlierWorks || "<p>The works office has capacity for a new programme.</p>";
  const industrialProgress = game.journey
    ? `${productiveYears} of the last 5 years qualified (target ${productiveTarget}) · ${goal.output}+ output and ${goal.towns}+ market towns in the same year`
    : `${latest?.output ?? 0}/${goal.output} output · ${towns}/${goal.towns} towns · ${rupees(game.cash)} / ${money(goal.cash)}`;
  byId("goals").innerHTML = `<ul><li><strong>Shared prosperity</strong><span>${secureYears} of the last 5 years food-secure (target ${goal.secureYears}) · ${latest?.skills ?? 0}/${goal.skills} skills · ${towns}/${goal.towns} towns</span></li><li><strong>Industrial economy</strong><span>${industrialProgress}</span></li></ul>`;

  for (const button of document.querySelectorAll("[data-layer]")) button.setAttribute("aria-pressed", String(layer === button.dataset.layer));
  const weather = latest ? `Last resolved season: ${latest.monsoon}` : "Advance a year to see monsoon conditions.";
  const plan = programmes[selectedProgramme];
  const sector = programmeDepartment(World, game, selectedProgramme, plan);
  const colour = departmentIdentity[sector.id].color;
  const tint = `#${colour.toString(16).padStart(6, "0")}`;
  const footprint = programmeFootprint(game, selectedProgramme, selectedBasinTerms);
  const coverage = (basinAgreementsFor(selectedProgramme) || plan.partnership && plan.department === "food") ? [...new Set(footprint.filter(({ kind }) => kind === "levee").flatMap(({ hex }) => [hex, ...World.neighbors(hex)]))].filter((id) => World.tiles[id].flood >= 2) : [];
  byId("map-subtitle").textContent = ReliefMap.boundary(game);
  byId("bengal-map-credit").hidden = World.key !== "west-bengal";
  const key = [["#f9dfa1", `${name} border`], ["#b7c0b2", "Neighboring borders"], ...mapLayers[layer], ["#53999b", "River"]];
  if (layer === "economy") {
    const activeRoles = new Set(developedSites.flatMap(({ roles }) => roles));
    for (const [role, { color, label }] of Object.entries(economyRoles)) if (activeRoles.has(role)) key.push([color, label]);
  }
  if (layer === "weather") {
    if (latest?.monsoon === "Severe flood") key.push(["#4696b2", "Flood-prone terrain"]);
    if (latest?.monsoon === "Dry monsoon") key.push(["#d59f50", "Dry-season exposure"]);
    if (floodSites.some(({ lost }) => lost)) key.push(["#80d7f2", "Food lost at site"]);
    if (floodSites.some((site) => site.protected)) key.push(["#c9e78d", "Food saved at site"]);
    if (droughtSites.length) key.push(["#f3aa66", "Crop losses at sites before recovery"]);
  }
  const trainingPath = training.options.find(({ id }) => id === (trainingPreview ?? training.charter));
  const showTraining = layer === "works" && trainingPath?.sites.length && (trainingPreview || training.status === "operating");
  const trainingTint = trainingPath?.id === "extension" ? 0xc8e88d : 0xe8aa5f;
  let preview;
  if (layer !== "works" && layer !== "economy" && !(layer === "weather" && inspectWeather)) {
    key.push([tint, "Programme sites"]);
    if (coverage.length) key.push(["#a8d8b4", "Protection reach"]);
    preview = { cells: footprint.map(({ hex }) => hex), color: colour, coverage };
  } else if (showTraining) {
    key.push([`#${trainingTint.toString(16)}`, trainingPreview ? `Preview · ${trainingPath.title}` : `${trainingPath.title} sites`]);
    preview = { cells: trainingPath.sites.map(({ id }) => id), color: trainingTint };
  }
  const served = latest?.cabinetPriority;
  if (layer === "economy" && served) {
    const focus = served.status === "funded" && served.id ? served.id : served.graduates ? "education" : null;
    const sources = focus === "food" ? served.sites.food : focus === "trade" ? served.sites.trade
      : focus ? served.sites.education.filter(({ cohorts }) => served.status === "funded" || cohorts) : [];
    const cells = sources.filter(({ hex }) => game.owners[hex] === World.key).map(({ hex }) => hex);
    if (focus && cells.length) {
      const color = departmentIdentity[focus].color;
      preview = { cells, color };
      key.push([`#${color.toString(16).padStart(6, "0")}`, `${departmentIdentity[focus].label} priority · ${latest.year}`]);
    }
  }
  byId("legend").innerHTML = key.map(([color, label]) => `<span><i style="--swatch:${color}"></i>${label}</span>`).join("") + (layer === "weather" ? `<span>${weather}</span>` : "");
  const sitePicker = byId("economy-sites");
  sitePicker.hidden = !developedSites.length;
  if (developedSites.length) {
    sitePicker.replaceChildren(new Option("Jump to operating site", ""));
    const siteName = (hex) => World.tiles[hex].town?.name ?? World.districts[World.tiles[hex].district];
    const sorted = [...developedSites].sort((a, b) => siteName(a.hex).localeCompare(siteName(b.hex)));
    for (const { hex, roles } of sorted) sitePicker.append(new Option(`${siteName(hex)} · ${roles.map((role) => economyRoles[role].label).join(", ")}`, hex));
    sitePicker.value = selectedRoles.length ? selected : "";
  }
  byId("map-help").textContent = layer === "economy" ? (developedSites.length ? "Select a marker to inspect its works. Zoom in to see more roles." : "Operating facilities will appear here when construction finishes.")
    : "Scroll to zoom, drag to pan. Select a site to see its works.";
  ReliefMap.render(game, layer, selected, selectSite, preview, developedSites);
}

function showTraining(fromTree = false) {
  const model = Campaign.training(game);
  showModal(`${game.year} · Regional education`, model.charter ? "Your training charter" : "Choose a school specialization", trainingComparisonMarkup(model),
    [fromTree ? choiceButton("Back to development trees", () => showDevelopmentTrees()) : choiceButton("Back to the map", returnToMap)]);
  for (const button of byId("modal-content").querySelectorAll("[data-training-preview]")) {
    button.addEventListener("click", () => {
      const option = model.options.find(({ id }) => id === button.dataset.trainingPreview);
      trainingPreview = option.id;
      selected = option.sites[0].id;
      layer = "works";
      inspectSelection = true;
      modal.close();
      render();
      ReliefMap.focus(selected);
      ReliefMap.reset();
      ReliefMap.zoom(.72, selected);
    });
  }
  for (const button of byId("modal-content").querySelectorAll("[data-training-adopt]")) {
    button.addEventListener("click", () => {
      const updated = Campaign.adoptTraining(game, button.dataset.trainingAdopt);
      if (updated === game) return;
      game = updated;
      trainingPreview = null;
      persist();
      render();
      showTraining(fromTree);
    });
  }
}

function showFinance() {
  const { historic, developmentRecord, local, transfers, total } = Campaign.finance(game);
  const window = Campaign.grantWindow(game);
  const sourceYear = historic.sourcePeriod ?? `FY ${Fiscal.yearLabel(historic.fiscalYear)}`;
  const carry = game.year < historic.fiscalYear ? "Later record used as an opening-era proxy." : game.year > historic.fiscalYear ? "Latest applicable figure carried forward for this turn." : "This year has a period reference.";
  const fundingNote = window.award ? `${window.award.title} awarded ${money(window.award.grant)} with a ${money(window.award.match)} local contribution.` : window.open ? "Choose one offer in this funding round. A larger award requires completed works and local matching funds." : window.next ? `The next funding round opens in ${window.next}.` : "Funding rounds have closed for this campaign.";
  showModal(`${Math.min(game.year, campaignEnd(game))} · Public finance`, `${campaignName(game)} budget office`, `
    <div class="fiscal-summary"><div><small>Historical revenue reference</small><strong>${Fiscal.crore(historic.revenue)}</strong><span>${sourceYear} · ${historic.status}</span></div><div><small>Annual development allocation</small><strong>${money(total)}</strong><span>${money(local)} local · ${money(transfers)} regular transfers</span></div></div>
    <div class="fiscal-bar" aria-hidden="true"><i style="--local:${total ? local / total * 100 : 0}%"></i></div>
    <p class="fiscal-note">${carry} The campaign assigns a modeled share of revenue to development works. <a href="${historic.url}" target="_blank" rel="noopener">View period source</a></p>
    ${developmentRecord ? `<p class="fiscal-note">FY ${Fiscal.yearLabel(game.year)} development spending reference: ${money(developmentRecord.lakh)} (${developmentRecord.basis}). <a href="${developmentRecord.url}" target="_blank" rel="noopener">View programme source</a></p>` : ""}
    ${historic.transferNote ? `<p class="fiscal-note">${historic.transferNote}</p>` : historic.transferYear !== historic.fiscalYear ? `<p class="fiscal-note">The modeled split uses the FY ${Fiscal.yearLabel(historic.transferYear)} transfer mix.</p>` : ""}
    ${game.journey ? priceReferenceMarkup(Math.min(game.year, campaignEnd(game))) : ""}
    <section class="union-funding"><h3>Union funding</h3><p>${fundingNote}</p><div id="grant-offers"></div></section>`, [
    choiceButton("Compare states", showComparison), choiceButton("Economy breakdown", showEconomy),
    ...(reserveWindow(game) ? [choiceButton("Union food reserve", () => showUnionReserve(showFinance, "Back to budget office"))] : []),
    choiceButton("Return to map", () => modal.close(), true),
  ]);
  for (const offer of Campaign.grantOffers(game)) {
    const card = document.createElement("div");
    card.className = "grant-card";
    card.innerHTML = `<div><h4>${offer.title}</h4><p>${offer.detail}</p><small>${offer.reason ?? (offer.match ? `${money(offer.match)} local match · ${money(offer.grant - offer.match)} net` : "No local match")}</small></div>`;
    card.append(choiceButton(`Accept ${money(offer.grant)}`, () => {
      const updated = Campaign.acceptGrant(game, offer.id);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      showFinance();
    }, !offer.reason, Boolean(offer.reason)));
    byId("grant-offers").append(card);
  }
}

function showEconomy() {
  const report = game.reports.at(-1);
  const freightReceipts = report?.regional?.freightCompetition?.player.earnings;
  const { workshops, markets, freight, contract, sales, procurement, total } = report ? Campaign.earnedReceipts(report)
    : { workshops: 0, markets: 0, freight: 0, contract: 0, sales: 0, procurement: 0, total: 0 };
  const sources = [`${money(workshops)} workshops`, `${money(markets)} markets`, freight && `${money(freight)} freight`,
    contract && `${money(contract)} freight contract`, sales && `${money(sales)} food sales`,
    procurement && `${money(procurement)} Union food shipments`].filter(Boolean).join(" · ");
  const funding = report && Campaign.reportFunding(report);
  const recordedAllocation = funding?.total ?? null;
  const allocation = recordedAllocation ?? Campaign.finance(game).total;
  const label = recordedAllocation === null ? "Current public allocation" : "Public allocation that year";
  showModal(report ? `${report.year} · Last resolved year` : "Economy · Opening position", "How the economy earns revenue", `
    <div class="fiscal-summary">
      <div><small>Earned receipts</small><strong>${money(total)}</strong><span>${sources}</span></div>
      <div><small>${label}</small><strong>${money(allocation)}</strong><span>Modeled share of historical public revenue</span></div>
    </div>
    ${report ? fundingReferenceMarkup(funding) : ""}
    <ul class="economy-cause">
      ${report?.cabinetPriority ? `<li><b>Five-year priorities.</b> ${report.cabinetPriority.skills} Skills and ${report.cabinetPriority.trainingOutput} direct workshop output from earlier training; ${report.cabinetPriority.tradeOutput} output from the production priority. This year’s extra services cost ${money(report.cabinetPriority.spent)}.</li>` : ""}
      <li><b>Schools → skills → workshop output.</b> Every 6 skill points adds 1 output to each operating workshop, up to 3 per workshop. More output earns higher receipts at that year’s modeled rate.</li>
      <li><b>Market links → production and trade.</b> Market access adds 4 output to each workshop it serves. Each connected town after the first two adds annual market receipts. More links also raise the food purchase limit.</li>
      ${report?.development ? `<li><b>Advanced programmes.</b> This year higher education and industrial parks added ${report.development.researchOutput + report.development.parkOutput} workshop output. Freight terminals contributed ${money(report.development.marketReceipts)} in market receipts.</li>` : ""}
      ${report?.bhilai?.output ? `<li><b>Bhilai supplier contracts.</b> Connected workshops in the Chhattisgarh plain produced ${report.bhilai.output} extra output this year.</li>` : ""}
      ${report?.assam?.teaOutput ? `<li><b>Assam rail feeders.</b> Connected tea workshops produced ${report.assam.teaOutput} extra output this year.</li>` : ""}
      ${freightReceipts ? `<li><b>Freight competition.</b> Orders carried this year earned ${money(freightReceipts)} in addition to workshop and market receipts.</li>` : ""}
      <li><b>Harvest and reserves → food security.</b> Rain changes the harvest. Irrigation, flood protection, stored food and emergency purchases cover demand. Sales add cash and purchases use it.</li>
    </ul>
    <p class="fiscal-note">The treasury also reflects public allocations, one-off grants, food purchases and upkeep. Workshop output is in production units and earnings are in rupees.</p>
    ${report?.prices ? priceReferenceMarkup(report.year) : ""}`,
  [choiceButton("Budget office", showFinance), choiceButton("Economy map", showEconomyMap), choiceButton("Return to map", returnToMap, true)]);
}

function showComparison() {
  const largest = Math.max(...Fiscal.comparison.map(({ revenue }) => revenue));
  const rows = Fiscal.comparison.slice().sort((a, b) => b.revenue - a.revenue).map((state) => `
    <li><span>${state.name}</span><i style="--share:${state.revenue / largest * 100}%" aria-hidden="true"></i><b>${Fiscal.crore(state.revenue)}</b></li>`).join("");
  showModal("Historical accounts · FY 1950–51", "State revenues", `<p>Nominal revenue recorded for the states as they existed in 1950–51. These are the reference figures for future regional budgets.</p><ul class="state-bars">${rows}</ul><p class="fiscal-note"><a href="${Fiscal.comparison[0].url}" target="_blank" rel="noopener">First Finance Commission · Appendix VIII</a></p>`, [choiceButton(`Back to ${World.name} budget`, showFinance, true)]);
}

function nextBriefDecision(report) {
  const pending = pendingDecision();
  if (pending) return { advice: pending.title, label: "Review decision", open: pending.open };
  if (crisisSeverity(game, World.key)) return {
    advice: "Rainfall is failing. Compare your harvest and stores with what the Union can deliver this year.",
    label: "Plan drought supplies", open: showRelief,
  };
  const partnership = planningPartnership(game);
  if (partnership && !partnership.record && [partnershipWindow.notice, partnershipWindow.opens, partnershipWindow.closes].includes(game.year)) {
    return {
      advice: game.year === partnershipWindow.notice ? `Union co-funding opens in ${partnershipWindow.opens}. Compare food and supplier packages and prepare their requirements.`
        : game.year === partnershipWindow.closes ? "This is the final year to fund one Union development partnership. Review eligibility and the state share."
          : `Union co-funding is open. Choose one food or supplier package by ${partnershipWindow.closes}.`,
      label: "Compare Union partnerships", open: showPlanningPartnership,
    };
  }
  const mandate = Campaign.regionalMandate(game);
  if (mandate.available && [mandate.opens, mandate.closes].includes(game.year)) {
    return { advice: "Choose the outcome that will define this administration in 1985.", label: "Compare regional mandates", open: () => showRegionalMandate() };
  }
  if (game.journey && [1950, 1954, intakeDeadline].includes(game.year) && intakeStatus(game) !== "signed") return {
    advice: game.year === intakeDeadline ? "Fund the technical training intake this year using established schools and market-linked workshops."
      : `Open a technical school by the end of ${intakeDeadline - 2} to qualify for equipment funding.`,
    label: "Review training intake", open: showTechnicalIntake,
  };
  const reserveOffer = reserveStatus(game);
  if (reserveOffer === "notice" || reserveOffer === "open") return {
    advice: reserveOffer === "notice" ? `In ${reserveStart}, the Union will pay states with connected food stores for surplus shipments.`
      : "Choose how much food to keep at home before supplying the Union reserve. Sign by year end.",
    label: "Review reserve offer",
    open: showUnionReserve,
  };
  if ((game.year === charterOpening || report.completed.some(({ kind }) => ["school", "road", "mill", "irrigation"].includes(kind))) &&
      Campaign.training(game).status === "ready") {
    return { advice: "Your technical school network can specialize in industry or agriculture.", label: "Compare specializations", open: showTraining };
  }
  if (report.shortage) {
    if (game.journey) return { advice: "Set a purchase cap for next year, or invest in storage and flood protection.", label: "Plan emergency purchases", open: showRelief };
    const advice = game.policy === "import"
      ? "The current food policy buys what it can. Review whether to build a larger reserve or keep more cash available for purchases."
      : "You can authorize emergency purchases for next year or keep the cash available for works.";
    return { advice, label: "Review food policy", open: () => byId("trade-policy").focus() };
  }
  if (report.jute?.lost && !game.programmes.some(({ id }) => id === "juteSupply")) return {
    advice: "The Hooghly mill needs raw jute. Invest in domestic supply or open an eastern market corridor in Neighbors.",
    label: "Review domestic supply",
    open: () => reviewProgramme("juteSupply", true),
  };
  const tender = upcomingFreightContract(game);
  if (tender && (tender.noticeYear === game.year || tender.start === game.year)) return {
    advice: `The ${tender.start} freight contract compares operating workshops and terminals at year end.`,
    label: "Review freight bids",
    open: showNeighbors,
  };
  const followOn = report.attribution?.programme?.followOn;
  if (followOn) return {
    advice: `Review ${programmes[followOn].title} and decide whether to commit funds.`,
    label: "Review proposal",
    open: () => reviewProgramme(followOn, true),
  };
  return null;
}

function showMonsoonMap(report) {
  modal.close();
  layer = "weather";
  inspectWeather = true;
  const sites = report.attribution?.food?.floodSites ?? report.attribution?.food?.droughtSites ?? [];
  const highlight = sites.find(({ lost }) => lost) ?? sites[0];
  if (highlight) selectSite(highlight.hex);
  else {
    render();
    ReliefMap.reset();
  }
  byId("map").focus();
}

function focusEconomySite(hex) {
  modal.close();
  layer = "economy";
  trainingPreview = null;
  if (hex) selectSite(hex);
  else render();
  byId("map").focus();
}

function showEconomyMap() {
  const sites = economySites(game);
  const workshop = sites.find(({ roles }) => roles.includes("industry"));
  focusEconomySite((workshop ?? sites[0])?.hex);
}

function showReport(index = game.reports.length - 1) {
  const report = game.reports[index];
  const latest = index === game.reports.length - 1;
  const done = game.year > campaignEnd(game);
  const decision = latest && !done ? nextBriefDecision(report) : null;
  showModal(`${report.year} · Annual brief`, briefHeadline(report, game.reports[index - 1]), briefContent(report, game.reports[index - 1], decision?.advice, latest), [
    choiceButton("Earlier", () => showReport(index - 1), false, index === 0),
    choiceButton("Later", () => showReport(index + 1), false, latest),
    ...(latest && report.monsoon !== "Typical monsoon" ? [choiceButton("View monsoon map", () => showMonsoonMap(report))] : []),
    ...(latest && report.siteEconomy?.workshops.length ? [choiceButton("Locate workshops", () => {
      const placement = report.technicalIntake?.sites[0];
      if (placement) focusEconomySite(placement.hex);
      else showEconomyMap();
    })] : []),
    ...(report.regional?.nationalMarket ? [choiceButton("Domestic market", () => showNationalMarket(report, () => showReport(index), "Back to annual brief"))] : []),
    choiceButton(done && latest ? "See results" : "Return to map", () => {
      if (done && latest) showResults();
      else returnToMap();
    }, true),
  ]);
  modal.classList.add("brief-dialog");
  byId("brief-freight")?.addEventListener("click", () => {
    showModal(`${report.year} · Trade & Industry`, "Freight results", freightBoardMarkup(report.regional.freightCompetition, report.year, game.journey.preset), [
      choiceButton("Back to annual brief", () => showReport(index), true),
    ]);
    modal.classList.add("opening-dialog");
  });
  byId("brief-priority-map")?.addEventListener("click", () => showPriorityMap(report));
  byId("brief-mandate-review")?.addEventListener("click", () => showRegionalMandate(() => showReport(index), "Back to annual brief"));
  for (const button of byId("modal-content").querySelectorAll("[data-brief-programme]")) {
    button.addEventListener("click", () => {
      modal.close();
      reviewProgramme(button.dataset.briefProgramme, true);
    });
  }
  if (decision) byId("brief-action").append(choiceButton(decision.label, () => {
    modal.close();
    decision.open();
  }));
}
function historyRows(records) {
  return records.map(({ year, title, label, effect }) => `<section class="journey-event"><small>${year}</small><h3>${title}</h3><p><strong>${label}</strong></p><p>${effect}</p></section>`).join("");
}

async function showChronicle() {
  const { nationalAtlas } = await import("./founding-atlas.js");
  const events = Object.values(game.journey.events);
  const division = game.journey.jurisdiction?.punjabSuccessor;
  const south = game.journey.jurisdiction?.madrasSuccessor;
  const northeast = game.journey.jurisdiction?.assamReorganized ? 1972 : game.journey.jurisdiction?.assamNagaland ? 1963 : 0;
  const active = northeast || (division ? 1971 : game.year >= 1957 ? 1961 : south ? 1953 : game.year >= 1949 ? 1951 : 1941);
  showModal("Campaign chronicle", `${campaignName(game)} through independence`, `
    <p>Review your decisions alongside historical census snapshots.</p>
    <div class="founding-layout">
      <div><div class="modal-actions" aria-label="Census snapshots"><button type="button" data-census="1941">Before independence</button><button type="button" data-census="1951">After accession</button>${south ? '<button type="button" data-census="1953">After the 1953 division</button>' : ''}<button type="button" data-census="1961">After reorganization</button>${division ? '<button type="button" data-census="1971">After the 1966 division</button>' : ''}${northeast ? '<button type="button" data-census="1963">Nagaland</button>' : ''}${northeast === 1972 ? '<button type="button" data-census="1972">Meghalaya and Mizoram</button>' : ''}</div><div id="chronicle-atlas"></div></div>
      <div class="journey-events">${events.length ? historyRows(events) : "<p>Your political decisions will appear here after the 1947 transition.</p>"}</div>
    </div>`, [choiceButton("Back to the map", () => modal.close(), true)]);
  modal.classList.add("founding-dialog");
  function showSnapshot(year) {
    const key = World.key === "mayurbhanj" && year === 1941 ? World.key : year === 1961
      ? (south === "andhra" ? "andhra pradesh" : game.journey.jurisdiction?.bombaySuccessor ?? World.mapKey) : World.mapKey;
    byId("chronicle-atlas").innerHTML = year === 1953 ? boundaryPreview(year, { madrasSuccessor: south })
      : year === 1963 || year === 1972 ? boundaryPreview(year, { assamNagaland: true, assamReorganized: year === 1972 })
      : year === 1971 ? boundaryPreview(year, game.journey.jurisdiction) : nationalAtlas(key, year);
    for (const button of byId("modal-content").querySelectorAll("[data-census]")) {
      button.classList.toggle("primary", Number(button.dataset.census) === year);
      button.setAttribute("aria-pressed", String(Number(button.dataset.census) === year));
    }
  }
  for (const button of byId("modal-content").querySelectorAll("[data-census]")) button.addEventListener("click", () => showSnapshot(Number(button.dataset.census)));
  showSnapshot(active);
}

async function showNationalMarket(report, back, backLabel) {
  const { nationalMarketMarkup } = await import("./national-market-view.js");
  showModal(`${report?.year ?? game.year} · Trade & Industry`, "Domestic food market", nationalMarketMarkup(report?.regional?.nationalMarket), [
    choiceButton(backLabel, back, true),
  ]);
  modal.classList.add("national-market-dialog");
}

function showNeighbors() {
  const neighbors = Campaign.neighbors(game);
  const offers = Campaign.partnerOffers(game);
  const projects = Campaign.jointProjectOffers(game);
  const latest = game.reports.at(-1);
  const freight = freightBoardMarkup(latest?.regional?.freightCompetition, latest?.year, game.journey.preset);
  const forecast = Campaign.freightContract(game);
  const openTradeTree = () => { selectedDepartment = "trade"; showDevelopmentTrees(); };
  showModal(`${Math.min(game.year, campaignEnd(game))} · Regional diplomacy`, "Neighboring administrations", `
    <p>Sign a trade agreement, then co-fund a reserve or freight project when the partner is ready.</p>
    ${freightContractMarkup(forecast)}${freight}
    <div class="journey-choices">${neighbors.map((neighbor) => `<section class="journey-choice" data-neighbor="${neighbor.id}">
      <p class="kicker">${neighbor.access}</p><h3>${neighbor.name}</h3><p>${neighbor.status}</p>
      ${neighbor.routeCapacity ? `<p>${neighbor.mode === "rail" ? "Rail" : "Road"} connection · up to ${neighbor.routeCapacity} food ${neighbor.routeCapacity === 1 ? "unit" : "units"} per year</p>` : ""}
      ${marketFundingMarkup(neighbor.funding)}
      ${neighbor.offer === null ? "" : `<p>${neighbor.offer} food available · ${neighbor.request} sought<br>${money(neighbor.cash)} modeled treasury</p>`}
      ${neighbor.national ? `<p>Domestic routes · ${neighbor.national.bought} food bought · ${neighbor.national.sold} sold</p>` : ""}
      ${neighbor.inherited ? `<p>Inherited works · ${money(neighbor.inherited.receipts)} in workshop receipts · ${money(neighbor.inherited.upkeepPaid)} upkeep${neighbor.inherited.trainedCohorts ? ` · ${neighbor.inherited.trainedCohorts} trained cohorts` : ""}</p>` : ""}
      ${neighbor.development?.harvestSaved ? `<p>${neighbor.development.harvestSaved} food saved by crop protection this year.</p>` : ""}
      ${(neighbor.development?.trainingReceipts ?? 0) + (neighbor.development?.processingReceipts ?? 0) ? `<p>School and processing receipts · ${money(neighbor.development.trainingReceipts + neighbor.development.processingReceipts)} this year</p>` : ""}
      ${neighbor.works?.length ? `<ul class="neighbor-works">${neighbor.works.map(({ title, status, completionYear, effect, department, reason }) =>
        `<li${department ? ` data-sector="${department}"` : ""}>${department ? departmentBadge(department) : ""}<strong>${title}</strong><small>${status === "open" ? `Opened ${completionYear}` : `Due ${completionYear}`}</small><span>${effect}</span>${reason ? `<small>${reason}</small>` : ""}</li>`).join("")}</ul>` : ""}
      ${neighbor.agreement ? `<p><strong>${neighbor.agreement.title}</strong> · Signed ${neighbor.agreement.year}</p>` : `<div class="journey-events" data-partner="${neighbor.id}"></div>`}
      ${neighbor.jointProject ? jointProjectCard(neighbor.jointProject, neighbor.name) : `<div data-joint-partner="${neighbor.id}"></div>`}
    </section>`).join("")}</div>`, [
    ...(freight && !forecast?.canDevelop ? [choiceButton("Trade & Industry tree", openTradeTree)] : []),
    ...(latest?.regional?.nationalMarket ? [choiceButton("Domestic market", () => showNationalMarket(latest, showNeighbors, "Back to neighbors"))] : []),
    choiceButton("Back to the map", () => modal.close(), true),
  ]);
  modal.classList.add("opening-dialog");
  byId("modal-content").querySelector("[data-freight-contract-trees]")?.addEventListener("click", openTradeTree);
  for (const offer of offers) {
    const slot = byId("modal-content").querySelector(`[data-partner="${offer.partner}"]`);
    if (!slot) continue;
    const card = document.createElement("div");
    card.className = "journey-event";
    card.innerHTML = `<h3>${offer.title}</h3><p>${offer.detail}</p>${offer.reason ? `<small>${offer.reason}</small>` : ""}`;
    const sign = choiceButton(`Sign · ${money(offer.cost)}`, () => {
      const updated = Campaign.signPartnerOffer(game, offer.id);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      showNeighbors();
    }, false, Boolean(offer.reason));
    sign.dataset.offer = offer.id;
    card.append(sign);
    slot.append(card);
  }
  for (const project of projects) {
    const slot = byId("modal-content").querySelector(`[data-joint-partner="${project.partner}"]`);
    slot.innerHTML = jointProjectCard(project, project.name);
    const commit = choiceButton("Fund joint project", () => {
      const updated = Campaign.fundJointProject(game, project.id);
      if (updated === game) return;
      game = updated;
      persist();
      render();
      showNeighbors();
    }, false, Boolean(project.reason));
    commit.dataset.jointProject = project.id;
    slot.firstElementChild.append(commit);
  }
}

function jointProjectCard(project, partner) {
  const date = project.status === "open" ? `Opened ${project.completionYear}` : `Due ${project.completionYear}`;
  return `<section class="joint-project"><h4>${project.title}</h4><small>${date}</small><p>${project.effect}</p>
    <dl><div><dt>Your share</dt><dd>${money(project.playerCost)}</dd></div><div><dt>${partner}</dt><dd>${money(project.partnerCost)}</dd></div></dl>
    ${project.reason ? `<p class="joint-reason">${project.reason}</p>` : ""}</section>`;
}

function showResults() {
  const { latest, recent, secureYears, productiveYears, productiveTarget, prosperity, economy, mandate } = Campaign.score(game);
  const goal = targets(game);
  const name = campaignName(game);
  const path = (title, won, measures) => `<section class="result-path" data-achieved="${won}"><h3>${title} <span>${won ? "Achieved" : "Below target"}</span></h3>
    <dl>${measures.map(([label, value, target, format = String]) => `<div><dt>${label}</dt><dd><b>${format(value)}</b><small>Target ${format(target)}</small></dd></div>`).join("")}</dl></section>`;
  const identity = name === World.name ? name : `${World.name} → ${name}`;
  const completed = game.programmes.filter(({ id }) => programmeCommissioned(game, id)).length;
  const allSecure = game.reports.filter(({ shortage }) => !shortage).length;
  const opened = game.journey ? developmentTrees(game).map(({ label, nodes }) => {
    const tiers = new Set(nodes.filter(({ status, tier }) => status === "completed" && Number.isInteger(tier) && tier >= 1 && tier <= 4).map(({ tier }) => tier));
    return `<li><span>${label}</span><strong>${tiers.size} of 4 tiers</strong></li>`;
  }).join("") : "";
  const milestones = Object.values(game.journey?.events ?? {}).filter(({ choice }) =>
    ["merger", "compact", "split", "autonomy", "unified", "receiveDistricts", "transitCompact", "coochSchools", "coochStandard", "districtSchools", "regularIntegration", "maharashtra", "gujarat", "punjab", "haryana", "patialaSchool", "integratePepsu", "assamCrossBorder", "assamSeparateServices"].includes(choice));
  const charter = Campaign.training(game).options.find(({ selected }) => selected);
  const trainingYears = game.reports.filter(({ training }) => training?.status === "operating");
  const trainingEffect = charter?.id === "apprenticeships"
    ? `${trainingYears.reduce((total, { training }) => total + training.output, 0)} extra workshop output`
    : `${trainingYears.reduce((total, { training }) => total + training.food + training.recovered, 0)} extra food units including recovered losses`;
  const partnership = latest.partnership;
  const partnershipPlan = partnership && programmes[partnership.id];
  const approval = partnershipRecord(game);
  const partnershipSite = partnershipPlan && game.assets.find(({ programme, hex, remaining }) =>
    programme === partnership.id && !remaining && game.owners[hex] === World.key);
  const partnershipYears = partnership ? game.reports.filter((report) => report.partnership?.id === partnership.id) : [];
  const partnershipFood = partnershipPlan?.department === "food";
  const partnershipTotal = partnershipYears.reduce((total, report) => total + (partnershipFood ? report.partnership.food : report.partnership.output), 0);
  const productivePartnershipYears = partnershipYears.filter((report) => (partnershipFood ? report.partnership.food : report.partnership.output) > 0).length;
  const partnershipSummary = partnershipPlan ? `<section class="result-path partnership-result" data-sector="${partnershipPlan.department}">
    <header><h3>Union development partnership${approval ? ` · ${approval.approved}` : ""}</h3>
      ${partnershipSite ? '<button type="button" id="result-partnership-map">Locate on map</button>' : ""}</header>
    <p>${departmentBadge(partnershipPlan.department, partnershipPlan.title)}</p>
    <dl><div><dt>${partnershipFood ? "Total food harvested" : "Total workshop output"}</dt><dd><b>${partnershipTotal}</b><small>Across ${productivePartnershipYears} productive ${productivePartnershipYears === 1 ? "year" : "years"}</small></dd></div>
      <div><dt>${partnershipFood ? "Food storage at campaign end" : "Linked workshops at campaign end"}</dt><dd><b>${partnershipFood ? partnership.storage : partnership.linkedWorkshops}</b><small>${partnership.delivered ? "Operating" : "Not fully operating"}</small></dd></div></dl>
    <p class="partnership-result-note">Recorded production at project sites includes later improvements.</p></section>` : "";
  const marketTowns = ["Market towns", latest.towns, goal.towns];
  const industryMeasures = game.journey
    ? [[`Years with ${goal.output}+ output and ${goal.towns}+ market towns in the final five`, productiveYears, productiveTarget]]
    : [["Workshop output", latest.output, goal.output], marketTowns, ["Treasury", game.cash, goal.cash, money]];
  showModal(`1946–${campaignEnd(game)} · ${identity}`, `${name} in ${campaignEnd(game)}`, `
    ${game.journey ? campaignOutcomesMarkup(game.reports, recent, secureYears) : ""}
    ${partnershipSummary}
    ${mandate ? mandateProgressMarkup(mandate) : ""}
    <div class="result-goals">
      ${path("Shared prosperity", prosperity, [["Secure years in the final five", secureYears, goal.secureYears], ["Skills", latest.skills, goal.skills], marketTowns])}
      ${path("Industrial economy", economy, industryMeasures)}
    </div>
    <div class="result-summary"><div><strong>${allSecure}/${game.reports.length}</strong><span>food-secure years</span></div><div><strong>${completed}</strong><span>programmes delivered and retained</span></div><div><strong>${money(game.cash)}</strong><span>final treasury</span></div></div>
    ${opened ? `<section class="result-path"><h3>Development reached</h3><ul class="result-departments">${opened}</ul></section>` : ""}
    ${charter ? `<section class="result-path"><h3>${charter.title}</h3><p>${trainingYears.length} operating years · ${trainingEffect}</p></section>` : ""}
    ${milestones.length ? `<div class="journey-events">${historyRows(milestones)}</div>` : ""}`, [
    choiceButton("Inspect the map", () => game.journey ? showEconomyMap() : modal.close()),
    choiceButton("Read the final brief", () => showReport()),
    ...(game.journey ? [choiceButton("Read your chronicle", showChronicle)] : []),
    choiceButton("Campaign atlas", () => showRegions(), true),
  ]);
  modal.classList.add("results-dialog");
  if (partnershipSite) byId("result-partnership-map").addEventListener("click", () => focusEconomySite(partnershipSite.hex));
}

function showDecisionCards(kicker, title, description, options, choose, source) {
  const cards = options.map(({ key, label, art, effects, price, transfer }) => `
    <section class="journey-choice" data-option="${key}">
      ${art ?? ""}<h3>${label}</h3>
      <p class="decision-cost">${transfer ? "Transfer" : "Treasury cost"} · ${money(price)}</p>
      <ul class="decision-effects">${effects.map((effect) => `<li>${effect}</li>`).join("")}</ul>
    </section>`).join("");
  showModal(kicker, title, `<p>${description}</p><div class="journey-choices">${cards}</div>
    ${source ? `<p class="journey-source"><a href="${source}" target="_blank" rel="noopener">Historical reference</a></p>` : ""}`,
  [choiceButton("Return to map", returnToMap)]);
  modal.classList.add("opening-dialog");
  for (const { key, label, price } of options) {
    const unaffordable = game.cash < price;
    const button = choiceButton(unaffordable ? "Insufficient treasury" : "Choose", () => choose(key), true, unaffordable);
    button.dataset.decision = key;
    button.setAttribute("aria-label", `Choose ${label}${unaffordable ? " · Insufficient treasury" : ""}`);
    byId("modal-content").querySelector(`[data-option="${key}"]`).append(button);
  }
}

function showDecision(decision) {
  const division = ["bombay-reorganization", "punjab-reorganization", "madras-division"].includes(decision.id);
  const options = Object.entries(decision.choices).map(([key, label]) => {
    let art;
    if (decision.id === "bihar-reorganization") art = boundaryPreview(game.year, { reorganization: key });
    if (decision.id === "mayurbhanj-merger") art = boundaryPreview(game.year, { settlement: key });
    if (decision.id === "cooch-behar-integration") art = boundaryPreview(game.year, { bengalPartition: true, coochBehar: true });
    if (decision.id === "bengal-territorial-settlement") art = boundaryPreview(game.year, { bengalPartition: true, coochBehar: true, bengalTransfer: key });
    if (decision.id === "bombay-early-integration") art = boundaryPreview(game.year, { bombayEarlyIntegration: true });
    if (decision.id === "bombay-enlargement") art = boundaryPreview(game.year, { bombayEarlyIntegration: true, bombayEnlarged: true });
    if (decision.id === "bombay-reorganization") art = boundaryPreview(game.year, { bombayEnlarged: true, bombaySuccessor: key });
    if (decision.id === "punjab-enlargement") art = boundaryPreview(game.year, { punjabEnlarged: true });
    if (decision.id === "punjab-reorganization") art = boundaryPreview(game.year, { punjabSuccessor: key });
    if (decision.id === "madras-pudukkottai") art = boundaryPreview(game.year, { madrasIntegrated: true });
    if (decision.id === "madras-division") art = boundaryPreview(game.year, { madrasSuccessor: key });
    if (decision.id === "madras-reorganization") art = boundaryPreview(game.year, { ...game.journey.jurisdiction, madrasReorganized: true });
    if (World.key === "punjab" && decision.id === "partition") art = boundaryPreview(game.year, { punjabPartition: true });
    if (World.key === "assam" && decision.id === "partition") art = boundaryPreview(game.year, { assamPartition: true });
    if (decision.id === "assam-naga-hills") art = boundaryPreview(game.year, { assamNagaHills: true });
    if (decision.id === "assam-nagaland") art = boundaryPreview(game.year, { assamNagaland: true });
    if (decision.id === "assam-northeast") art = boundaryPreview(game.year, { assamReorganized: true });
    if (decision.id === "central-eastern-states") art = boundaryPreview(game.year, { centralIntegrated: true });
    if (decision.id === "central-reorganization") art = boundaryPreview(game.year, { centralReorganized: true });
    if (key === "gridIndustry" || key === "gridIrrigation") {
      art = `<svg class="decision-art" viewBox="0 0 200 90" aria-hidden="true">${openingArt[key === "gridIndustry" ? "trade" : "food"]}</svg>`;
    }
    return { key, label, art, effects: decision.details[key], price: decision.priced?.[key] ?? 0, transfer: key === "split" || key === "council" || division };
  });
  showDecisionCards(`${game.year} · ${decision.id ? "Campaign chapter" : "Scenario decision"}`,
    decision.title, decision.description, options, (key) => {
      const updated = Campaign.decide(game, key);
      if (updated === game) return;
      game = updated;
      if (division || ["punjab-capital", "madras-reorganization", "assam-northeast", "assam-dispur", "central-reorganization"].includes(decision.id)) {
        selected = campaignCapital(game);
        if (division) selectedProgramme = `${openingPrefix(game)}food`;
        selectedBasinTerms = "focused";
        selectedDepartment = "food";
        inspectSelection = false;
        trainingPreview = null;
        ReliefMap.reset();
      }
      if (decision.id?.startsWith("bombay-") || decision.id?.startsWith("madras-") || decision.id === "punjab-enlargement" || decision.id === "punjab-reorganization" ||
        ["assam-naga-hills", "assam-nagaland", "assam-northeast", "central-eastern-states", "central-reorganization", "central-bombay-division"].includes(decision.id) ||
        (["punjab", "assam"].includes(World.key) && decision.id === "partition")) layer = "jurisdiction";
      if (key === "council" || ["bihar-reorganization", "mayurbhanj-merger", "cooch-behar-integration", "bengal-territorial-settlement"].includes(decision.id)) {
        layer = "jurisdiction";
        if (World.key === "mayurbhanj" && key === "merger") {
          selected = "hex-11-6";
          ReliefMap.reset();
        }
      }
      persist();
      render();
      const next = decision.id === "independence" ? Campaign.nextDecision(game) : null;
      if (next?.id === "partition") showDecision(next);
      else modal.close();
    }, decision.source);
}

function showBasinDecision() {
  const decision = basinFloodDecision(game);
  if (!decision) return;
  const options = [
    { key: "repair", label: "Make emergency repairs", price: decision.cost, effects: [`Finish in ${decision.finish}.`] },
    { key: "delay", label: "Defer unfinished works", price: 0, effects: [`Finish in ${decision.delayedFinish}.`, "Keep the treasury available for other works."] },
  ];
  showDecisionCards(`${game.year} · ${programmes[decision.id].title}`,
    "Flood damage puts the timetable at risk", "Crews reported damage before the embankments were completed.", options, (choice) => {
      const updated = respondToBasinFlood(game, choice);
      if (updated === game) return;
      game = updated;
      persist();
      modal.close();
      reviewProgramme(decision.id, true);
    });
}

function confirmNew() {
  if (game.journey) return showRegions();
  showModal("Campaign management", "Start over?", `<p>This replaces the saved ${World.name} campaign with a fresh 1946 start.</p>`, [
    choiceButton("Keep playing", () => modal.close()),
    choiceButton("Start fresh", () => {
      game = Campaign.newGame();
      selected = initialSite;
      selectedProgramme = "food";
      selectedBasinTerms = "focused";
      cabinetArchiveOpen = false;
      layer = "terrain";
      ReliefMap.reset();
      persist();
      render();
      showOpening();
    }, true),
  ]);
}

function showHelp() {
  showModal("Field guide", `Governing ${World.name}`, `<ol class="guide"><li><b>Choose a regional direction.</b> Compare food security, market access and skills. The map highlights the selected programme’s footprint.</li>
    <li><b>Commit the budget.</b> Pay once. The works office places and delivers the individual works in phases. It handles one programme at a time.</li>
    ${game.journey ? '<li><b>Plan your next investment.</b> Development trees show which projects unlock each tier. Regional programmes is where you review the map footprint, approve works and check delivery.</li>' : ""}
    <li><b>Plan through the monsoon.</b> Keep enough cash for emergencies or use food policy to buy supplies. Review completed works and fiscal changes after each year.</li>
    <li><b>Build on results.</b> Completed starter programmes unlock larger investments. Check the Budget office for Union funding rounds.</li></ol>`, [choiceButton("Cabinet briefing", showOpening), choiceButton(`Back to ${World.name}`, () => modal.close(), true)]);
}
for (const tile of Object.values(World.tiles).filter((entry) => entry.town).sort((a, b) => a.town.name.localeCompare(b.town.name))) {
  const option = new Option(tile.town.name, tile.id);
  if (tile.town.era) option.dataset.era = String(tile.town.era);
  byId("jump").append(option);
}
for (const [key, name] of Object.entries(Campaign.policies)) byId("trade-policy").append(new Option(name, key));
for (const button of document.querySelectorAll("[data-layer]")) button.addEventListener("click", () => {
  layer = button.dataset.layer;
  inspectWeather = layer === "weather";
  trainingPreview = null;
  render();
});
byId("training-charter").addEventListener("click", (event) => {
  if (event.target.closest("[data-training-review]")) showTraining();
});
byId("development-trees").querySelector("small").textContent = "View unlocks →";
byId("development-trees").addEventListener("click", () => {
  selectedDepartment = programmeDepartment(World, game, selectedProgramme, programmes[selectedProgramme]).id;
  showDevelopmentTrees();
});
byId("relief").addEventListener("click", showRelief);
byId("union-reserve").addEventListener("click", () => showUnionReserve());
byId("technical-intake").addEventListener("click", () => showTechnicalIntake());
byId("cabinet-priority").addEventListener("click", showCabinetPriority);
byId("regional-mandate").addEventListener("click", () => showRegionalMandate());
byId("cabinet-guide").addEventListener("click", (event) => {
  if (!event.target.closest("[data-guide-dismiss]")) return;
  guideDismissed = true;
  try { localStorage.setItem(guideKey, "1"); } catch { /* Dismissed for this session. */ }
  renderCabinetGuide();
  byId("development-trees").focus();
});
byId("jump").addEventListener("change", (event) => { if (event.target.value) selectSite(event.target.value); });
byId("economy-sites").addEventListener("change", (event) => { if (event.target.value) selectSite(event.target.value); });
byId("inspect-site").addEventListener("click", () => {
  if (layer === "economy") {
    inspectEconomy = !inspectEconomy;
    render();
    return;
  }
  const inspector = byId("site-inspector");
  inspector.open = true;
  inspector.querySelector("summary").focus();
  inspector.scrollIntoView({ block: "nearest" });
});
byId("review-decision").addEventListener("click", () => pendingDecision()?.open());
byId("indicators").addEventListener("click", (event) => {
  if (event.target.closest("#economy")) showEconomy();
});
byId("zoom-in").addEventListener("click", () => ReliefMap.zoom(0.78, selected));
byId("zoom-out").addEventListener("click", () => ReliefMap.zoom(1.28));
byId("reset-map").addEventListener("click", ReliefMap.reset);
byId("trade-policy").addEventListener("change", (event) => { game = { ...game, policy: event.target.value }; persist(); render(); });
byId("skip-season").addEventListener("click", ReliefMap.skip);
modal.addEventListener("cancel", () => {
  if (modal.classList.contains("opening-dialog")) acknowledgeOpening();
});
byId("advance").addEventListener("click", async () => {
  if (resolvingSeason) return;
  if (game.year > campaignEnd(game)) return showResults();
  const pending = pendingDecision();
  if (pending) return pending.open();
  game = Campaign.advance(game);
  persist();
  render();
  const report = game.reports.at(-1);
  const sidebar = document.querySelector(".sidebar");
  const topActions = document.querySelector(".top-actions");
  resolvingSeason = true;
  sidebar.inert = true;
  topActions.inert = true;
  byId("season-name").textContent = `${report.year} · ${report.monsoon}`;
  const works = report.completed.length;
  const food = report.attribution.food;
  const recovered = food.protection + (report.training?.recovered ?? 0) + (report.development?.waterRecovery ?? 0);
  const netLoss = Math.max(0, food.weatherLoss - recovered);
  byId("season-detail").textContent = [
    netLoss && `${netLoss} food lost`,
    recovered && `${recovered} food protected or recovered`,
    works && `${works} ${works === 1 ? "work" : "works"} completed`,
  ].filter(Boolean).join(" · ") || "Harvest and trade resolved";
  byId("map-conditions").hidden = false;
  try {
    await ReliefMap.season(report);
  } finally {
    byId("map-conditions").hidden = true;
    sidebar.inert = false;
    topActions.inert = false;
    resolvingSeason = false;
  }
  showReport();
});
byId("reports").addEventListener("click", () => showReport());
byId("finance").addEventListener("click", showFinance);
byId("regions").addEventListener("click", () => showRegions());
byId("chronicle").addEventListener("click", showChronicle);
byId("neighbors").addEventListener("click", showNeighbors);
byId("map-sources").addEventListener("click", () => showModal("Map references", "Sources and campaign scale", `
  <p>Outlines use India State Stories’ digitization of the Census of India Administrative Atlas. The map uses the nearest relevant census outline at each historical transition.</p>
  <p>Shaded relief uses Mapzen Terrain Tiles. SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey. ETOPO1 data courtesy of NOAA. Coast and major river lines are from Natural Earth.</p>
  ${World.key === "west-bengal" ? '<p>Hooghly and Damodar centerlines use OpenStreetMap data. Settlement locations were checked against GeoNames.</p><ul><li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></li><li><a href="https://www.geonames.org/export/" target="_blank" rel="noopener">GeoNames</a></li></ul>' : ""}
  <p>Settlement positions and elevations are approximate. Programme sites, ownership and monsoon effects follow the campaign model.</p>
  <ul><li><a href="https://www.indiastatestory.in/datadownloads" target="_blank" rel="noopener">India State Stories</a></li><li><a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Mapzen Terrain Tiles</a></li><li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a></li></ul>`,
  [choiceButton("Back to map", () => modal.close(), true)]));
byId("new-game").addEventListener("click", confirmNew);
byId("help").addEventListener("click", showHelp);

async function start() {
  try {
    await ReliefMap.init();
  } catch (error) {
    console.error(error);
    byId("map").textContent = "The terrain renderer could not start. Open in Chrome with graphics acceleration enabled.";
  }
  render();
  if (World.key === "mayurbhanj" && game.journey?.jurisdiction?.settlement !== "merger") ReliefMap.zoom(.55, initialSite);
  if (!founding && !params.has("region") && !params.has("campaign")) showRegions();
  else if (!openingSeen && game.year === World.start && !game.assets.length) showOpening();
  else if (founding && game.year > campaignEnd(game)) showResults();
}

void start();
