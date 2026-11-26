import { Campaign } from "./campaign.js";
import { departmentBadge, programmeDepartment } from "./department-presentation.js";
import { Fiscal } from "./fiscal.js";
import { fundingReferenceMarkup, priceReferenceMarkup } from "./fiscal-view.js";
import { basinAgreementsFor, basinNameFor, programmes } from "./programmes.js";
import { World } from "./scenario.js";
import { mandateProgressMarkup } from "./regional-mandate-view.js";

const money = Fiscal.lakh;
const units = (count) => `${count} ${count === 1 ? "unit" : "units"}`;
const names = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const signed = (value) => `${value < 0 ? "−" : "+"}${number.format(Math.abs(value))}`;

const signedMoney = (value) => `${value < 0 ? "−" : "+"}${money(Math.abs(value))}`;

export function foodStatus(report) {
  if (report.shortage) return "Shortfall";
  if (report.fromReserve || report.bought || report.regional?.emergencyFood || report.unionReserve?.released || report.foodCrisis?.delivered) return "Covered with support";
  return "Covered by harvest";
}

export function briefHeadline(report, previous) {
  if (report.assam?.earthquakeLoss) return report.shortage ? "Earthquake damage left a food shortfall" : "Assam met food needs after the earthquake";
  if (report.reserveDispatch?.sent) return "Your reserves helped cover interstate shortages";
  if (report.foodCrisis) {
    if (report.shortage) return "Drought left food needs unmet";
    if (report.foodCrisis.delivered) return "Union deliveries helped cover the drought";
    if (report.fromReserve) return "Local reserves cushioned the drought";
    return "Food needs met through drought";
  }
  if (report.monsoon === "Severe flood") return report.shortage ? "Floods left a food shortfall" : "Food needs were met through flooding";
  if (report.monsoon === "Dry monsoon") return report.shortage ? "A dry monsoon left food in short supply" : "Food needs were met through a dry monsoon";
  if (report.shortage) return "Food supply fell short";
  if (report.regional?.maritime?.food) return "Your port kept supplies moving to Port Blair";
  if (report.regional?.maritime?.timber) return "Timber freight earned receipts for your port";
  if (report.attribution?.newlyConnected?.length) return "The market network expanded";
  if (report.completed?.some(({ kind }) => kind === "school")) return "New technical schools opened";
  if (report.completed?.length) return "New works came into service";
  if (previous && report.output !== previous.output) return report.output > previous.output ? "Workshop output rose" : "Workshop output fell";
  return "A steady year";
}

function foodCoverage(report) {
  const demand = Math.max(0, report.demand ?? 0);
  const shortage = Math.max(0, Math.min(report.shortage ?? 0, demand));
  const supplied = demand - shortage;
  const sources = [
    ["harvest", "Harvest", report.harvest],
    ["union", "Union drought deliveries", report.foodCrisis?.delivered],
    ["reserve", "State reserves", report.fromReserve],
    ["shared", "Shared reserves", report.regional?.emergencyFood],
    ["union", "Union reserve", report.unionReserve?.released],
    ["purchase", "Purchases", report.bought],
  ];
  let remainder = supplied;
  const segments = sources.map(([id, label, amount]) => {
    const covered = Math.min(remainder, Math.max(0, amount ?? 0));
    remainder -= covered;
    return [id, label, covered];
  });
  segments.push(["other", "Unitemized supply", remainder], ["shortfall", "Unmet", shortage]);
  const visible = segments.filter(([, , amount]) => amount > 0);
  return `<section class="brief-card brief-food" data-sector="food" data-shortfall="${shortage > 0}">
    <div class="brief-card-header"><h3>Food security</h3><span class="brief-food-status">${foodStatus(report)}</span></div>
    <p class="brief-coverage-value"><strong>${number.format(supplied)} <span>/ ${number.format(demand)}</span></strong><span>food units supplied</span></p>
    ${visible.length ? `<div class="brief-coverage-meter" aria-hidden="true">${visible.map(([id, , amount]) =>
      `<span data-source="${id}" style="flex-grow: ${amount}"></span>`).join("")}</div>
      <ul class="brief-coverage-key" aria-label="Sources of food">${visible.map(([id, label, amount]) =>
        `<li data-source="${id}"><span>${label}</span><b>${number.format(amount)}</b></li>`).join("")}</ul>` : ""}
    <p class="brief-reserve"><b>${number.format(report.reserve ?? 0)}</b> in reserve at year end</p>
  </section>`;
}

function weatherCard(report) {
  const season = report.monsoon === "Severe flood" ? "flood" : report.monsoon === "Dry monsoon" ? "dry" : "typical";
  const effect = report.attribution?.food;
  const recovered = (effect?.protection ?? 0) + (report.training?.recovered ?? 0) + (report.development?.waterRecovery ?? 0) + (report.cabinetPriority?.recovered ?? 0);
  const lost = Math.max(0, (effect?.weatherLoss ?? 0) - recovered);
  const details = effect ? [
    lost ? `${units(lost)} lost` : "No net harvest loss",
    recovered ? `${units(recovered)} protected or recovered` : "",
  ].filter(Boolean).join(" · ") : "Recorded harvest includes weather effects.";
  return `<section class="brief-card brief-weather" data-season="${season}">
    <h3>Monsoon</h3><strong>${report.foodCrisis ? "Regional drought" : escapeText(report.monsoon)}</strong><p>${details}</p>
    ${report.assam?.earthquakeLoss ? `<p>Earthquake damage · ${units(report.assam.earthquakeLoss - report.assam.bankRepairs)} lost</p>` : ""}
  </section>`;
}

function treasuryCard(report, previous) {
  const funding = Campaign.reportFunding(report);
  const earlier = previous && Campaign.reportFunding(previous);
  const allocationChange = funding && earlier ? funding.total - earlier.total : 0;
  const cashChange = report.cash - (previous?.cash ?? report.openingCash);
  const difference = Number.isFinite(cashChange) && cashChange !== 0
    ? `${signedMoney(cashChange)} ${previous ? "from last year" : "after planning"}`
    : "Closing balance";
  return `<section class="brief-card brief-treasury"><h3>Treasury</h3>
    <strong>${money(report.cash)}</strong><p>${difference}</p>
    ${funding ? `<div class="brief-allocation"><span>Public allocation</span><b>${money(funding.total)}</b></div>
      ${allocationChange ? `<p class="brief-allocation-change">${signedMoney(allocationChange)} vs ${previous.year}</p>` : ""}` : ""}
  </section>`;
}

function metricStrip(report, previous) {
  const earned = Campaign.earnedReceipts(report);
  const metrics = [
    ["Workshop output", "trade", report.output, previous?.output],
    ["Skills", "education", report.skills, previous?.skills],
    ["Connected towns", "trade", report.towns, previous?.towns],
    [report.prices ? "Earned receipts · nominal" : "Earned receipts", "trade", earned.total, previous && Campaign.earnedReceipts(previous).total, true],
  ];
  return `<dl class="brief-metrics" aria-label="Development indicators">${metrics.map(([label, sector, current, earlier, currency]) => {
    const change = Number.isFinite(current) && Number.isFinite(earlier) ? current - earlier : null;
    const trend = change === null ? "first" : change === 0 ? "same" : change > 0 ? "up" : "down";
    const value = Number.isFinite(current) ? (currency ? money(current) : number.format(current)) : "—";
    const delta = change === null ? "First report" : change === 0 ? "Steady" : currency ? signedMoney(change) : signed(change);
    const fromPrices = currency && report.prices?.receiptEffect;
    return `<div data-sector="${sector}"><dt>${label}</dt><dd><b>${value}</b>
      <span class="brief-metric-change" data-trend="${trend}">${delta}</span>
      ${fromPrices ? `<small class="brief-price-change">Prices ${signedMoney(fromPrices)}</small>` : ""}</dd></div>`;
  }).join("")}</dl>`;
}

function detailRows(rows) {
  return `<dl class="brief-ledger">${rows.map(([label, value]) => `<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join("")}</dl>`;
}

function partnershipEffect(partnership) {
  if (programmes[partnership.id]?.department === "food") {
    return `Project fields supplied ${units(partnership.food)}. The depot can store ${units(partnership.storage)}.`;
  }
  return `Project workshops produced ${partnership.output} output. ${partnership.linkedWorkshops} linked to market.`;
}

function revenueRows(report) {
  const funding = Campaign.reportFunding(report);
  if (!funding) return [["Local revenue", money(report.tax)]];
  const terminal = report.development?.marketReceipts ?? 0;
  const { workshops, markets } = Campaign.earnedReceipts(report);
  return [
    ["Public allocation · local", money(funding.local)],
    ["Public allocation · Union", money(funding.transfers)],
    ["Workshop receipts", money(workshops)],
    ["Market link receipts", money(markets - terminal)],
    ...(terminal ? [["Freight terminal receipts", money(terminal)]] : []),
  ];
}

function whyContent(report, previous) {
  const effect = report.attribution?.food;
  const industry = report.attribution?.industry;
  const development = report.development;
  const harvestRows = effect ? [
    ["Normal harvest", effect.normalHarvest], ["Irrigation potential", `+${effect.irrigationPotential}`],
    ...(effect.powerIrrigation ? [["Powered irrigation", `+${effect.powerIrrigation}`]] : []),
    ...(report.training?.food ? [["Agricultural extension", `+${report.training.food}`]] : []),
    ...(development?.researchFood ? [["Agricultural research", `+${development.researchFood}`]] : []),
    ...(development?.waterYield ? [["Regional water network", `+${development.waterYield}`]] : []),
    ...(effect.weatherLoss ? [["Weather losses before protection", `−${effect.weatherLoss}`]] : []),
    ...(report.assam?.earthquakeLoss ? [["Earthquake damage", `−${report.assam.earthquakeLoss}`]] : []),
    ...(report.assam?.bankRepairs ? [["Harvest protected by bank repairs", `+${report.assam.bankRepairs}`]] : []),
    ...(effect.protection ? [["Losses avoided by protection", `+${effect.protection}`]] : []),
    ...(report.training?.recovered ? [["Weather losses recovered by extension", `+${report.training.recovered}`]] : []),
    ...(development?.waterRecovery ? [["Weather losses recovered by water network", `+${development.waterRecovery}`]] : []),
    ...(report.cabinetPriority?.food ? [["Five-year food priority", `+${report.cabinetPriority.food}`]] : []),
    ...(report.cabinetPriority?.recovered ? [["Weather losses recovered by food priority", `+${report.cabinetPriority.recovered}`]] : []),
  ] : [["Baseline after seasonal effects", report.baseline], ["Irrigation after seasonal effects", `+${report.farms}`]];
  const food = detailRows([...harvestRows, ["Harvest delivered", report.harvest], ["Drawn from reserves", report.fromReserve],
    ...(report.foodCrisis?.delivered ? [["Union drought deliveries", report.foodCrisis.delivered]] : []),
    ...(report.regional?.emergencyFood ? [["Shared reserve deliveries", report.regional.emergencyFood]] : []),
    ...(report.unionReserve?.released ? [["Received from the Union reserve", report.unionReserve.released]] : []),
    ...(report.unionReserve?.shipped ? [["Shipped to the Union reserve", report.unionReserve.shipped]] : []),
    ["Emergency purchases", report.bought], ["Needs covered", `${Math.max(0, report.demand - report.shortage)} of ${report.demand}`], ["Reserves carried forward", report.reserve],
    ...(development?.storage ? [["Extra storage from reserve depots", `+${development.storage}`]] : []),
    ...(development?.importCapacity ? [["Extra purchase capacity from freight terminals", `+${development.importCapacity}`]] : []),
    ["Nearby market", report.market], ["Nearby stock after trade", report.marketStock]]);
  const works = (report.completed ?? []).map(({ hex, kind }) => {
    const tile = World.tiles[hex];
    const name = Campaign.projects[kind]?.name ?? kind;
    const location = tile?.town?.name ?? World.districts[tile?.district];
    return location ? `${name} · ${location}` : name;
  });
  const competition = report.regional?.freightCompetition;
  const contract = report.regional?.freightContract;
  const production = detailRows([
    ["Connected towns", report.towns], ["Skill points", report.skills],
    ...(development?.skills ? [["Skills from higher education", `+${development.skills}`]] : []),
    ...(report.technicalIntake?.skills ? [["Skills from the technical intake", `+${report.technicalIntake.skills}`]] : []),
    ...(industry?.workshops ? [["Workshop base output", industry.base], ["From mineral sites", `+${industry.minerals}`], ["From market access", `+${industry.marketAccess}`], ["From technical training", `+${industry.skills}`]] : []),
    ...(report.bhilai?.output ? [["Bhilai supplier contracts", `+${report.bhilai.output}`]] : []),
    ...(industry?.power ? [["From power supply", `+${industry.power}`]] : []),
    ...(industry?.workforce ? [["From trained workforce", `+${industry.workforce}`]] : []),
    ...(industry?.priority ? [["From production priority", `+${industry.priority}`]] : []),
    ...(report.training?.output ? [["From apprenticeships", `+${report.training.output}`]] : []),
    ...(report.technicalIntake?.output ? [["From technical intake placements", `+${report.technicalIntake.output}`]] : []),
    ...(development?.researchOutput ? [["From higher education and research", `+${development.researchOutput}`]] : []),
    ...(development?.parkOutput ? [["From industrial parks", `+${development.parkOutput}`]] : []),
    ...(report.jute ? [["Raw jute supply", report.jute.source]] : []),
    ...(report.jute?.lost ? [["Lost to raw jute shortages", `−${report.jute.lost}`]] : []),
    ...(report.assam?.teaOutput ? [["Tea processing supported by rail access", `+${report.assam.teaOutput}`]] : []),
    ["Workshop output", report.output],
  ]);
  const planningChange = report.openingCash - previous?.cash;
  const activityReceipts = Campaign.earnedReceipts(report);
  const earlierActivity = previous && Campaign.earnedReceipts(previous);
  const change = earlierActivity ? activityReceipts.workshops + activityReceipts.markets - earlierActivity.workshops - earlierActivity.markets : null;
  const receiptEffect = report.prices?.receiptEffect;
  const activityEffect = Number.isFinite(change) && Number.isFinite(receiptEffect) ? change - receiptEffect : null;
  const cash = detailRows([
    ...(Number.isFinite(planningChange) && planningChange ? [["Cash carried in", money(previous.cash)], ["Planning commitments and grants", signedMoney(planningChange)]] : []),
    ["Cash after planning", money(report.openingCash)], ...revenueRows(report),
    ["Food sales", money(report.sold)], ["Food purchases", money(report.bought * report.buyPrice)],
    ...(report.foodCrisis?.cost ? [["Union drought deliveries", money(report.foodCrisis.cost)]] : []),
    ...(report.unionReserve?.proceeds ? [["Union food shipments", money(report.unionReserve.proceeds)]] : []),
    ...(report.regionalCash ? [["Freight agreements", money(report.regionalCash - (report.regional?.jointFreightCash ?? 0))]] : []),
    ...(report.regional?.jointFreightCash ? [["Joint freight projects", money(report.regional.jointFreightCash)]] : []),
    ...(competition ? [["Competitive freight receipts", money(competition.player.earnings)]] : []),
    ...(contract?.winner?.id === "player" ? [["Freight contract payment", money(contract.payment)]] : []),
    ...(report.regional?.maritime?.receipt ? [[report.regional.maritime.id === "food" ? "Port Blair food procurement" : "Port Blair timber freight", money(report.regional.maritime.receipt)]] : []),
    ["Works upkeep", money(report.prices?.worksUpkeep ?? (report.maintenance - (report.training?.upkeep ?? 0) - (report.cabinetPriority?.spent ?? 0)))],
    ...(report.training?.upkeep ? [["Training charter upkeep", money(report.training.upkeep)]] : []),
    ...(report.cabinetPriority?.spent ? [["Five-year priority services", money(report.cabinetPriority.spent)]] : []),
    ...(report.upkeepShortfall ? [["Unfunded upkeep", money(report.upkeepShortfall)]] : []), ["Cash carried forward", money(report.cash)]]);
  const grant = report.grantAward;
  const delivery = report.attribution?.programme;
  const funding = delivery?.funding;
  const agreement = funding && basinAgreementsFor(delivery.id)?.[funding.agreement];
  const response = delivery?.floodResponse;
  const training = report.training;
  const partnership = report.partnership;
  const partnershipFunding = partnership?.funding;
  const served = [...new Set((training?.sites ?? []).map(({ name }) => name).filter(Boolean))];
  return `<details class="brief-why"><summary>Why this happened</summary>
    ${effect ? "" : '<p class="brief-note">This earlier report records the totals after weather. Separate losses and protection effects were not saved for this turn.</p>'}
    <section><h3>Food supply · ${escapeText(report.monsoon)}</h3>${food}</section>
    <section><h3>Investment and output</h3>${production}${works.length ? `<ul class="brief-works">${works.map((work) => `<li>${escapeText(work)}</li>`).join("")}</ul>` : ""}
      ${partnership ? `<p class="brief-note"><b>Union development partnership.</b> ${escapeText(partnershipEffect(partnership))}</p>` : ""}
      ${training ? `<p class="brief-note">${escapeText(training.title)} · ${served.length ? `Served ${escapeText(names.format(served))}.` : escapeText(training.message)}</p>` : ""}</section>
    <section><h3>Treasury</h3>${cash}
    ${activityEffect !== null && receiptEffect ? `<p class="brief-note">Price changes account for ${signedMoney(receiptEffect)} in workshop and market receipts.${activityEffect ? ` Changes in activity contributed ${signedMoney(activityEffect)}.` : " Activity contributed no change."}</p>` : ""}
    ${report.prices ? priceReferenceMarkup(report.year) : ""}
    ${fundingReferenceMarkup(Campaign.reportFunding(report))}${grant ? `<p class="brief-note">${escapeText(grant.title)} awarded ${money(grant.grant)} with a ${money(grant.match)} local match. Already included in cash after planning.</p>` : ""}
    ${training?.setup ? `<p class="brief-note">The charter’s ${money(training.setup)} setup cost is included in cash after planning.</p>` : ""}
    ${report.technicalIntake?.state ? `<p class="brief-note">The state’s ${money(report.technicalIntake.state)} technical intake share is included in cash after planning. The Union paid ${money(report.technicalIntake.union)} directly for equipment.</p>` : ""}
    ${report.relief ? `<p class="brief-note">Emergency purchase authorization was ${money(report.relief.budget)}. Purchases used ${money(report.relief.spent)}.</p>` : ""}
    ${partnershipFunding ? `<p class="brief-note">Union development partnership: ${money(partnershipFunding.state)} state share and ${money(partnershipFunding.union)} paid directly by the Union. The state share is included in cash after planning.</p>` : ""}
    ${agreement ? `<p class="brief-note">${escapeText(agreement.title)} · ${escapeText(funding.stateName ?? World.name)} committed ${money(funding.state ?? funding.bihar)}.${funding.union ? ` The Union committed ${money(funding.union)} directly to the works.` : ""} The state share is included in cash after planning.</p>` : ""}
    ${response?.cost ? `<p class="brief-note">Emergency work to keep the ${basinNameFor(delivery.id)} timetable cost ${money(response.cost)}. Included in cash after planning.</p>` : ""}</section>
    ${report.regional ? regionalLedger(report) : ""}
  </details>`;
}

function regionalLedger(report) {
  const partners = (report.regional.partners ?? []).map(({ name, access, bought, sold, offer }) =>
    [name, `${access} · ${sold ? `${sold} supplied` : bought ? `${bought} bought` : `${offer} offered`}`]);
  const market = report.regional.nationalMarket;
  if (market) partners.push(["Domestic food shipments", `${units(market.units)} shipped · ${units(market.localUnits)} through your neighbors`]);
  const signed = (report.signedAgreements ?? []).map(({ title, cost }) =>
    `<p class="brief-note">${escapeText(title)} cost ${money(cost)}. Included in cash after planning.</p>`).join("");
  const freight = report.regional.freightCompetition;
  const contract = report.regional.freightContract;
  const carrierRows = freight ? [
    ["Regional freight demand", freight.demand],
    ...(freight.linkedDemand ? [["Orders from last year’s domestic shipments", freight.linkedDemand]] : []),
    ["Unserved loads", freight.unserved],
    ["Your freight", `${freight.player.loads} / ${freight.player.capacity} capacity · ${money(freight.player.earnings)}`],
    ...(freight.partners ?? []).map(({ name, loads, capacity, earnings }) => [name, `${loads} / ${capacity} capacity · ${money(earnings)}`]),
    ...(freight.inland ?? []).map(({ name, via, loads, capacity, earnings }) => [`${name} via ${via}`, `${loads} / ${capacity} capacity · ${money(earnings)}`]),
    ...(freight.exportRival ? [[freight.exportRival.name, `${freight.exportRival.loads} / ${freight.exportRival.capacity} capacity`]] : []),
  ] : [];
  if (contract) {
    carrierRows.push([`Freight contract · ${contract.start}–${contract.end}`, contract.winner
      ? `${contract.winner.name} · ${money(contract.payment)} paid · Capacity ${contract.capacity}`
      : `No award · Minimum capacity ${contract.minimumCapacity}`]);
    if (contract.reason) carrierRows.push(["Contract status", contract.reason]);
  }
  return `<section><h3>Regional market</h3>${detailRows(partners)}${signed}</section>
    ${carrierRows.length ? `<section><h3>Freight competition</h3>${detailRows(carrierRows)}</section>` : ""}`;
}

function regionalContext(report) {
  const regional = report.regional;
  const flows = regional ? [
    regional.importUnits ? `${units(regional.importUnits)} bought from named partners` : "",
    regional.exportUnits ? `${units(regional.exportUnits)} sold to named partners` : "",
    regional.cash ? `${money(regional.cash)} from freight` : "",
    regional.migration ? `${Math.abs(regional.migration)} population units ${regional.migration > 0 ? "arrived" : "departed"}` : "",
  ].filter(Boolean) : [];
  const choices = (report.politicalEvents ?? []).map(({ label, effect }) => `<p><b>${escapeText(label)}</b> · ${escapeText(effect)}</p>`).join("");
  const developments = (regional?.developments ?? []).map(({ name, title, status, cost, effect, department, reason }) => `<section class="brief-rival-work"${department ? ` data-sector="${escapeText(department)}"` : ""}>
    ${department ? departmentBadge(department) : ""}<p><b>${escapeText(name)}</b> ${status === "open" ? `opened its ${escapeText(title.toLowerCase())}. ${escapeText(effect)}`
      : `committed ${money(cost)} to ${escapeText(title.toLowerCase())}.`}</p>${reason ? `<p class="brief-note">${escapeText(reason)}</p>` : ""}</section>`).join("");
  const projects = (regional?.jointProjects ?? []).map(({ name, title, status, playerCost, partnerCost, completionYear, effect }) => status === "open"
    ? `<p><b>${escapeText(title)} opened with ${escapeText(name)}.</b> ${escapeText(effect)}</p>`
    : `<p><b>${escapeText(title)} agreed with ${escapeText(name)}.</b> Your share ${money(playerCost)} · Partner share ${money(partnerCost)} · Due ${completionYear}.</p>`).join("");
  const projectPayoffs = [
    regional?.emergencyFood ? `${units(regional.emergencyFood)} supplied by shared reserves` : "",
    regional?.jointFreightCash ? `${money(regional.jointFreightCash)} earned from joint freight` : "",
  ].filter(Boolean);
  const entries = [
    ["Political decisions", choices],
    ["Neighbor investments", developments],
    ["Joint projects", projects + (projectPayoffs.length ? `<p>${projectPayoffs.join(" · ")}</p>` : "")],
    ["Across the border", flows.length ? `<p>${flows.join(" · ")}</p>` : ""],
  ].filter(([, content]) => content);
  if (!entries.length) return "";
  const summary = [choices && "Political decisions", (developments || projects || projectPayoffs.length || flows.length) && "Regional activity"].filter(Boolean).join(" · ");
  return `<details class="brief-context"><summary>${summary}</summary><div class="brief-context-grid">
    ${entries.map(([title, content]) => `<section><h3>${title}</h3>${content}</section>`).join("")}
  </div></details>`;
}

function changeRows(report, previous) {
  const changes = [];
  const add = (sector, title, description, programme) => changes.push({ sector, title, description, programme });
  const maritime = report.regional?.maritime;
  if (maritime) {
    const fee = maritime.fee ? ` ${money(maritime.fee)} paid at signing.` : "";
    if (maritime.status === "transferred") {
      if (previous?.regional?.maritime?.status !== "transferred") add(maritime.id, "Madras retained the port", "Your administration’s charter ended with the division.");
    } else if (maritime.id === "food") {
      const coverage = maritime.islandShortage ? `Port Blair still needed ${units(maritime.islandShortage)}.` : "Port Blair covered its food needs.";
      const delivery = maritime.food ? `${maritime.port} supplied ${units(maritime.food)} for ${money(maritime.receipt)}.` : maritime.reason;
      add("food", "Port Blair food charter", `${delivery} ${coverage}${fee}`);
    } else {
      add("trade", "Port Blair timber charter", `${maritime.reason ?? `${maritime.port} handled ${maritime.timber} timber ${maritime.timber === 1 ? "load" : "loads"} and earned ${money(maritime.receipt)}.`}${fee}`);
    }
  }
  const dispatch = report.reserveDispatch;
  if (dispatch?.sent) {
    const freight = dispatch.freightCapacityUsed ? ` ${dispatch.freightCapacityUsed} spot freight ${dispatch.freightCapacityUsed === 1 ? "slot" : "slots"} reassigned.` : "";
    const destinations = names.format(dispatch.deliveries.map(({ name, units: delivered, remaining }) =>
      `${name} received ${units(delivered)}${remaining ? ` (${units(remaining)} still needed)` : ""}`));
    add("food", "Reserve food shipped", `${destinations}. ${units(dispatch.reserve)} left at home.${freight}`);
  } else if (dispatch) {
    add("food", "Reserve offer was unused", dispatch.available ? "Routes with spare capacity reached no remaining shortfall." : "Stocks were held for home needs.");
  }
  const crisis = report.foodCrisis;
  if (crisis?.delivered) {
    const freight = crisis.freightCapacityUsed ? ` ${crisis.freightCapacityUsed} commercial freight slots reassigned.` : "";
    add("food", "Drought deliveries received", `${units(crisis.delivered)} for ${money(crisis.cost)}.${freight}`);
  } else if (crisis && report.fromReserve) {
    add("food", "Stores drawn down during drought", `${units(report.fromReserve)} used. ${units(report.reserve)} carried forward.`);
  }
  const neighbors = new Set(report.regional?.partners.map(({ id }) => id));
  for (const work of (report.regional?.developments ?? []).filter(({ id, partner, status }) =>
    neighbors.has(partner) && ["protection", "trainingSchool", "processing"].includes(id) && status === "open").slice(0, 3)) {
    const result = report.regional.partners.find(({ id }) => id === work.partner).development;
    const outcome = work.id === "processing" && result?.processingReceipts
      ? `Processing earned ${money(result.processingReceipts)} and added 1 freight bid capacity.`
      : work.id === "trainingSchool" ? `Teaching began. Receipts and freight bid capacity start in ${report.year + 1}.`
        : work.id === "protection" && result?.harvestSaved ? `Prevented ${units(result.harvestSaved)} of weather losses this year.` : work.effect;
    add(work.department, `${work.name} · ${work.title}`, outcome);
  }
  const intake = report.technicalIntake;
  if (intake?.state) {
    add("education", "Technical training intake funded", `${money(intake.state)} state share · ${money(intake.union)} Union equipment. First graduates in ${intake.first}.`);
  } else if (intake && report.year === intake.last + 1) {
    add("education", "Technical placements ended", `The first cohort’s workshop placements ended. Retained schools contribute ${intake.skills} Skills.`);
  } else if (intake && report.year >= intake.first && ["skills", "output"].some((key) => intake[key] !== previous?.technicalIntake?.[key])) {
    const places = intake.sites.map(({ name }) => name);
    const placement = places.length ? `Placements added ${intake.output} output at ${names.format(places)}.` : "No paired workshop produced placement output this year.";
    add("education", "Technical training intake", `+${intake.skills} Skills. ${placement}${intake.receipts ? ` Earned ${money(intake.receipts)} in additional workshop receipts.` : ""}`);
  }
  const union = report.unionReserve;
  if (union) {
    const result = union.released ? `Received ${units(union.released)} after state and shared reserves.`
      : union.shipped ? `Shipped ${units(union.shipped)} and earned ${money(union.proceeds)}.`
        : union.capacity ? "No food available to ship above the reserve floor." : "No connected depot available for shipments.";
    add("food", "Union food reserve", `${result} ${units(union.reserve)} remain in state reserves.`);
  }
  const contract = report.regional?.freightContract;
  if (contract?.awarded) {
    const { winner, start, end, fee, minimumCapacity, playerCapacity } = contract;
    add("trade", "Freight contract", winner
      ? `${winner.id === "player" ? "Your administration" : winner.name} won with bid capacity ${winner.capacity}.${winner.id === "player" ? "" : ` Your bid was ${playerCapacity}.`} ${money(fee)} per year through ${end} while eligible.`
      : `No award for ${start}–${end}. No bidder reached capacity ${minimumCapacity}.`);
  } else if (contract?.winner?.id === "player" && previous?.regional?.freightContract?.start === contract.start &&
      previous.regional.freightContract.payment !== contract.payment) {
    add("trade", "Freight contract", contract.payment
      ? `Payments resumed. Your administration earned ${money(contract.payment)} this year.`
      : `Payment suspended. ${contract.reason ?? `Capacity ${contract.capacity} is below ${contract.minimumCapacity}.`}`);
  }
  const completed = report.completed ?? [];
  const impact = report.attribution;
  const delivery = report.attribution?.programme;
  const plan = delivery && programmes[delivery.id];
  const sector = plan && programmeDepartment(World, null, delivery.id, plan)?.id;
  if (plan) {
    const followOn = programmes[delivery.followOn]?.title;
    const partnership = report.partnership?.id === delivery.id ? report.partnership : null;
    if (delivery.finish === report.year) add(sector, plan.title, partnership ? `${partnership.delivered ? "Completed. " : ""}${partnershipEffect(partnership)}`
      : followOn ? `Completed. ${followOn} is now available.` : "Completed and operating.", delivery.id);
    else if (delivery.nextWorkYear) add(sector, plan.title, `Next works due ${delivery.nextWorkYear}. Final delivery is scheduled for ${delivery.finish}.`, delivery.id);
  }
  const partnership = report.partnership;
  const partnershipDelivery = partnership && delivery && partnership.id === delivery.id && (delivery.finish === report.year || delivery.nextWorkYear);
  if (partnership?.protectedFood > 0 && report.monsoon === "Severe flood" && !partnershipDelivery &&
      partnership.protectedFood !== (previous?.partnership?.id === partnership.id ? previous.partnership.protectedFood : 0)) {
    add("food", programmes[partnership.id]?.title ?? "Union development partnership",
      `Protection at project farms prevented ${units(partnership.protectedFood)} of flood losses.`, partnership.id);
  }
  const response = delivery?.floodResponse;
  if (response) add("food", `${basinNameFor(delivery.id)} flood response`, response.response === "repair"
    ? "Emergency works kept the delivery timetable."
    : `Flood damage pushed final delivery to ${response.finish}.`);

  const freight = report.regional?.freightCompetition;
  const marketChapter = report.regional?.nationalMarket?.chapter;
  if (marketChapter) add("trade", "Domestic market routes", marketChapter);
  const islands = report.regional?.nationalMarket?.western?.islands;
  const priorIslands = previous?.regional?.nationalMarket?.western?.islands;
  if (islands && (islands.capacity < islands.sailingCapacity || islands.capacity !== priorIslands?.capacity)) {
    const weather = islands.capacity < islands.sailingCapacity ? "Monsoon weather cut one sailing slot. " : "";
    const shipped = (islands.administrationCargo ?? 0) + islands.delivered;
    add("food", "Calicut island supplies", `${weather}${shipped ? `Calicut shipped ${units(shipped)}. ` : ""}${islands.shortage ? `${units(islands.shortage)} still needed.` : "Island food needs covered."}`);
  }
  const assam = report.assam;
  if (assam?.earthquakeLoss) add("food", "Earthquake recovery", assam.bankRepairs
    ? `Bank repairs prevented ${units(assam.bankRepairs)} of harvest losses.` : "Emergency supplies went to reserves. The harvest absorbed the damage.");
  if (assam && (assam.railCapacity !== (previous?.assam?.railCapacity ?? 0) || assam.teaOutput !== (previous?.assam?.teaOutput ?? 0))) {
    const effect = assam.railCapacity > 0 ? "Capacity to buy 2 more food units each year." : assam.railCapacity < 0 ? "Capacity to buy food fell by 2 units." : "Food purchase capacity returned to normal.";
    add("trade", "Assam rail access", `${effect}${assam.teaOutput ? ` Connected tea workshops gained ${assam.teaOutput} output.` : ""}`,
      assam.railCapacity > 0 ? "assamRailLink" : undefined);
  }

  if (report.chambal && (report.chambal.food !== previous?.chambal?.food || report.chambal.output !== previous?.chambal?.output)) {
    const { allocation, food, output } = report.chambal;
    add(allocation === "irrigation" ? "food" : "trade", "Chambal allocation", food
      ? `Irrigation added ${units(food)} to the harvest.` : `Power added ${output} output at connected workshops.`, "chambal");
  }
  if (report.bhilai && (report.year === 1959 || report.bhilai.output !== previous?.bhilai?.output)) {
    const { output } = report.bhilai;
    add("trade", "Bhilai supplier contracts", output ? `Connected suppliers produced ${output} extra workshop output.`
      : "Connect workshops in the Chhattisgarh plain to supply the steel plant.");
  }
  if (report.bhakra && (!previous?.bhakra || report.bhakra.shared !== previous.bhakra.shared)) {
    const { allocation, shared, food, output } = report.bhakra;
    add(allocation === "irrigation" ? "food" : "trade", shared ? "Shared Bhakra power" : "Bhakra power in service",
      food ? `Powered pumps added ${units(food)} to the harvest.` : `Hydropower added ${output} output at connected workshops.`);
  } else if (report.southernPower && !previous?.southernPower) {
    const { id, agreement: terms, allocation, food, output } = report.southernPower;
    add(allocation === "irrigation" ? "food" : "trade", basinAgreementsFor(id)?.[terms]?.title ?? `${basinNameFor(id)} power in service`, food
      ? `Powered pumps added ${units(food)} to the harvest.` : `Power added ${output} output at connected workshops.`);
  } else if (completed.some(({ kind }) => kind === "power") && !report.bhakra && !report.southernPower) {
    add("food", `${World.basinName} power works opened`, "The cabinet can set where the new power goes.");
  }
  if (World.key === "punjab" && report.year === 1963) add("food", "Bhakra Dam opens", "The main dam and Gobind Sagar now appear on the regional map.");
  const schoolPlaces = completed.filter(({ kind }) => kind === "school").map(({ hex }) => World.tiles[hex]?.town?.name).filter(Boolean);
  if (schoolPlaces.length) {
    const skills = report.skills - (previous?.skills ?? 0);
    const trainingOutput = impact?.industry?.skills;
    const effects = [skills > 0 ? `Skills rose by ${skills}.` : "", trainingOutput ? `Training added ${trainingOutput} workshop output.` : ""].filter(Boolean);
    add("education", schoolPlaces.length === 1 ? "Technical school opened" : "Technical schools opened", [`${names.format(schoolPlaces)}.`, ...effects].join(" "));
  } else if (previous && impact?.industry?.workshops) {
    const { skills: trainingOutput, workshops } = impact.industry;
    const earlierRate = Campaign.workshopSkillBonus(previous.skills);
    const extra = trainingOutput - earlierRate * workshops;
    if (extra > 0) add("education", "Skills increased production", `Higher Skills added ${extra} output across ${workshops} ${workshops === 1 ? "workshop" : "workshops"}.`);
  }
  const connected = impact?.newlyConnected;
  if (connected?.length) add("trade", "Market links opened", `${names.format(connected)} joined the network.`);
  const newOutput = impact?.industry?.newWorkshops;
  if (newOutput) add("trade", "New workshops", `${newOutput} of the region’s ${report.output} output came from workshops opened this year.`);

  const newIrrigation = impact?.food?.newIrrigation;
  const stores = completed.filter(({ kind }) => kind === "granary").length;
  const protection = impact?.food?.basinProtection ?? impact?.food?.kosiProtection;
  if (newIrrigation > 0) add("food", "New irrigation", `${units(newIrrigation)} added to the harvest after weather effects.`);
  if (stores) add("food", "New food stores", `${units(stores * 10)} added to reserve capacity.`);
  if (protection && protection !== (previous?.attribution?.food?.basinProtection ?? previous?.attribution?.food?.kosiProtection)) {
    add("food", programmes[report.southernPower?.id ?? (World.key === "madras" ? delivery?.id : World.basinProgramme)]?.title ?? "Basin protection", `${units(protection)} of flood losses prevented.`);
  }

  const training = report.training;
  if (training && ["status", "output", "food", "recovered"].some((key) => training[key] !== previous?.training?.[key])) {
    const payoff = training.id === "apprenticeships"
      ? `${training.output} extra workshop output and ${money(training.receipts)} in receipts.`
      : `${units(training.food)} added to the harvest.${training.recovered ? ` ${units(training.recovered)} of weather losses recovered.` : ""}`;
    add("education", training.title, training.status === "operating" ? payoff : training.message);
  }

  const developed = report.development;
  const latestEffects = [
    ["education", "Higher education", "skills", (value) => `${value} skill points from colleges and research institutes.`],
    ["food", "Reserve depots", "storage", (value) => `${units(value)} of additional storage capacity.`],
    ["food", "Regional water works", "waterYield", (value) => `${units(value)} added to the harvest.`],
    ["trade", "Industrial parks", "parkOutput", (value) => `${value} extra workshop output from shared services.`],
    ["trade", "Freight terminals", "importCapacity", (value) => `Capacity to buy ${units(value)} more food when supplies are available.`],
  ];
  for (const [department, title, key, describe] of latestEffects) {
    if (developed?.[key] && developed[key] !== previous?.development?.[key]) add(department, title, describe(developed[key]));
  }

  const jute = report.jute;
  if (jute && (jute.source !== previous?.jute?.source || jute.lost !== previous?.jute?.lost)) {
    add("trade", "Raw jute", jute.lost ? `${jute.source} · ${jute.lost} workshop output lost.` : `${jute.source} · Mills supplied.`);
  }
  if (report.relief) add("food", "Emergency food plan", report.relief.bought
    ? `${units(report.relief.bought)} bought for ${money(report.relief.spent)} within the ${money(report.relief.budget)} authorization.`
    : `${money(report.relief.budget)} authorized. No emergency purchases were made.`);
  if (freight) {
    const inland = freight.inland?.reduce((total, row) => total + row.loads, 0) ?? 0;
    add("trade", "Freight competition",
      `You carried ${freight.player.loads} of ${freight.demand} loads and earned ${money(freight.player.earnings)}.${freight.exportRival?.loads ? ` Mormugao carried ${freight.exportRival.loads}.` : ""}${inland ? ` Inland rivals carried ${inland}.` : ""}${freight.unserved ? ` ${freight.unserved} went unserved.` : ""}`);
  }
  if (!changes.length && completed.length) add(null, "Works opened", `${completed.length} completed. See the investment ledger for their locations.`);
  return changes;
}

function changeList(changes) {
  return `<ul class="brief-changes">${changes.map(({ sector, title, description, programme }) => `<li${sector ? ` data-sector="${sector}"` : ""}>
    <div class="brief-change-title">${programme ? `<button type="button" class="brief-programme-link" data-brief-programme="${escapeText(programme)}">${escapeText(title)} <span aria-hidden="true">↗</span></button>` : `<b>${escapeText(title)}</b>`}${departmentBadge(sector)}</div>
    <p>${escapeText(description)}</p>
  </li>`).join("")}</ul>`;
}

function priorityCard(report, allowMap) {
  const plan = report.cabinetPriority;
  if (!plan) return "";
  const sector = plan.id ?? "education";
  const duration = plan.ends ? plan.ends - plan.starts + 1 : 0;
  const heading = plan.id ? `${plan.label} priority` : "Trained workforce";
  const status = plan.status === "paused" ? "Paused" : plan.id ? "Funded" : "Lasting benefit";
  const effectLabel = plan.id === "trade" ? "Production priority" : plan.id === "food" ? "Food added / saved" : "Training this term";
  const effectValue = plan.id === "trade" ? `+${plan.tradeOutput} output` : plan.id === "food" ? `+${plan.food} / +${plan.recovered}`
    : plan.newGraduates ? `${plan.newGraduates} ready next year` : plan.id ? plan.status === "paused" ? "No teaching funded" : "Teaching in progress" : "No new commitment";
  return `<section class="brief-priority" data-sector="${sector}" data-status="${plan.status}" aria-label="Five-year priority results">
    <div class="brief-card-header"><h3>${departmentBadge(sector, heading)}</h3><b>${status}</b></div>
    <dl><div><dt>Extra services</dt><dd>${money(plan.spent)}</dd></div>
      <div><dt>${effectLabel}</dt><dd>${effectValue}</dd></div>
      <div><dt>Earlier trained workforce</dt><dd>+${plan.trainingOutput} output</dd></div></dl>
    ${duration ? `<p>${plan.starts}–${plan.ends} · ${plan.paidYears} / ${duration} years funded${report.year === plan.ends ? " · Term ended" : ""}</p>` : ""}
    ${plan.newGraduates ? `<p class="brief-priority-graduation">${plan.newGraduates} trained ${plan.newGraduates === 1 ? "cohort enters" : "cohorts enter"} service in ${report.year + 1}.</p>` : ""}
    ${plan.skills ? `<p>Earlier training added ${plan.skills} Skills and ${plan.trainingOutput} direct workshop output.</p>` : ""}
    ${plan.status === "paused" ? `<p>${escapeText(plan.message)}</p>` : ""}
    ${allowMap ? '<button type="button" class="brief-programme-link" id="brief-priority-map">Locate priority sites <span aria-hidden="true">↗</span></button>' : ""}
  </section>`;
}

export function briefContent(report, previous, nextDecision, latest = true) {
  const changes = changeRows(report, previous);
  return `<div class="brief-outcomes">
    ${foodCoverage(report)}
    <div class="brief-year-facts">${weatherCard(report)}${treasuryCard(report, previous)}</div>
  </div>
  ${metricStrip(report, previous)}
  ${report.regionalMandate ? mandateProgressMarkup(report.regionalMandate, { compact: true, review: latest }) : ""}
  ${priorityCard(report, latest)}
  ${changes.length ? `<section class="brief-investment"><h3>What changed</h3>${changeList(changes.slice(0, 4))}
    ${changes.length > 4 ? `<details class="brief-more"><summary>${changes.length - 4} more ${changes.length === 5 ? "change" : "changes"}</summary>${changeList(changes.slice(4))}</details>` : ""}</section>` : ""}
  ${report.regional?.freightCompetition ? '<button type="button" class="brief-programme-link" id="brief-freight">View freight results <span aria-hidden="true">↗</span></button>' : ""}
  ${nextDecision ? `<aside class="brief-decision"><div><h3>Next decision</h3><p>${escapeText(nextDecision)}</p></div><div id="brief-action"></div></aside>` : ""}
  ${regionalContext(report)}
  ${whyContent(report, previous)}`;
}
