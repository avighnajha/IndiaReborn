import { Fiscal } from "./fiscal.js";
import { departmentBadge, departmentIdentity } from "./department-presentation.js";
import { nationalCoverageMarkup } from "./national-coverage.js";
import { marketFundingMarkup } from "./market-finance-view.js";
import { islandMarket } from "./bay-shipping.js";
import snapshots from "./geography/founding.json";
import "./national-market-view.css";

// Hub and label coordinates use the founding atlas projection.
const hubs = new Map([
  ["up", { x: 281, y: 229, dx: 0, dy: -11, align: "middle", census: "Uttar Pradesh" }],
  ["bihar", { x: 333, y: 226, dx: 0, dy: -11, align: "middle", census: "Bihar" }],
  ["bengal", { x: 383, y: 276, dx: 11, dy: 4, census: "West Bengal" }],
  ["central", { x: 251, y: 266, dx: -10, dy: 3, align: "end", census: "Madhya Pradesh" }],
  ["orissa", { x: 344, y: 311, dx: 11, dy: 7, census: "Orissa" }],
  ["mayurbhanj", { x: 359, y: 288, dx: 11, dy: 4 }],
  ["rajasthan", { x: 186, y: 204, dx: -11, dy: 4, align: "end", census: "Rajasthan" }],
  ["mysore", { x: 214, y: 436, dx: -11, dy: 4, align: "end", census: "Mysore" }],
  ["maharashtra", { x: 140, y: 334, dx: -10, dy: 3, align: "end", census: "Maharashtra" }],
  ["gujarat", { x: 135, y: 269, dx: -10, dy: 3, align: "end", census: "Gujarat" }],
  ["bombay", { x: 140, y: 334, dx: -10, dy: 3, align: "end" }],
  ["punjab", { x: 188, y: 137, dx: -10, dy: 2, align: "end", census: "Punjab" }],
  ["haryana", { x: 201, y: 147, dx: 10, dy: 2 }],
  ["madras", { x: 256, y: 434, dx: 11, dy: 4, census: "Madras" }],
  ["andhra", { x: 262, y: 377, dx: 11, dy: 4, census: "Andhra Pradesh" }],
  ["kerala", { x: 193, y: 485, dx: -11, dy: 4, align: "end", census: "Kerala" }],
  ["travancore", { x: 193, y: 485, dx: -11, dy: 4, align: "end", census: "Travancore-Cochin" }],
  ["hyderabad", { x: 234, y: 353, dx: -10, dy: 4, align: "end", census: "Hyderabad" }],
  ["assam", { x: 436, y: 217, dx: 10, dy: 4, census: "Assam" }],
  ["nagaland", { x: 488, y: 228, dx: 8, dy: 0, census: "Naga Hills-Tuensang Area" }],
  ["meghalaya", { x: 437, y: 232, dx: -9, dy: 2, align: "end" }],
  ["mizoram", { x: 460, y: 268, dx: 10, dy: 3 }],
  ["manipur", { x: 470.7, y: 238.8, dx: 10, dy: 4 }],
  ["tripura", { x: 428.9, y: 255.2, dx: -10, dy: 4, align: "end" }],
  ["arunachal", { x: 446.6, y: 198.3, dx: 10, dy: 4 }],
  ["delhi", { x: 208, y: 176, dx: 11, dy: 4, census: "Delhi" }],
  ["jammu", { x: 171.8, y: 107.5, dx: -10, dy: 3, align: "end" }],
  ["himachal", { x: 203.6, y: 124.4, dx: 10, dy: -4 }],
  ["sikkim", { x: 387, y: 197.1, dx: -10, dy: -7, align: "end" }],
  ["goa", { x: 154.4, y: 395, dx: -10, dy: 4, align: "end" }],
  ["lakshadweep", { x: 136.2, y: 475.3, dx: -10, dy: 4, align: "end" }],
  ["pondicherry", { x: 248.8, y: 452.6, dx: 10, dy: 7 }],
  [islandMarket, { x: 450, y: 455, dx: 11, dy: 4, census: "Andaman and Nicobar Islands" }],
]);

// Transfer points on the western routes, within their existing market areas.
const routeStops = new Map([
  ["Calicut", { x: 185.4, y: 464.1, dx: 9, dy: -5 }],
  ["Hospet–Bellary", { x: 195.1, y: 397.3, dx: 8, dy: 3 }],
]);

// Expanded schematic spacing keeps the seven northeastern labels readable.
const northeastHubs = new Map([
  ["assam", { x: 110, y: 70, dx: -8, dy: -10, align: "end" }],
  ["arunachal", { x: 160, y: 22, dx: 10, dy: 4 }],
  ["nagaland", { x: 256, y: 78, dx: 10, dy: 4 }],
  ["meghalaya", { x: 102, y: 114, dx: -8, dy: 4, align: "end" }],
  ["manipur", { x: 250, y: 132, dx: 10, dy: 4 }],
  ["tripura", { x: 95, y: 179, dx: -8, dy: 4, align: "end" }],
  ["mizoram", { x: 190, y: 180, dx: 10, dy: 4 }],
]);

const northernHubs = new Map([
  ["jammu", { x: 72, y: 33, dx: 9, dy: 4 }],
  ["himachal", { x: 212, y: 65, dx: 9, dy: 4 }],
  ["punjab", { x: 127, y: 103, dx: -10, dy: 5, align: "end" }],
  ["haryana", { x: 199, y: 130, dx: 9, dy: 4 }],
  ["delhi", { x: 233, y: 182, dx: 9, dy: 4 }],
]);

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const quantity = (value) => Number.isFinite(value) ? Math.max(0, value) : 0;
const units = (value) => `${value} ${value === 1 ? "unit" : "units"}`;
const routeEndpoint = (node, label) => label
  ? { ...node, market: label, ...(routeStops.has(label) ? { routeStop: label, works: [] } : {}) }
  : node;
const investmentDepartments = (node) => [...new Set((node.works ?? []).map(({ department }) => department)
  .filter((department) => Object.hasOwn(departmentIdentity, department)))];

function mapRoute({ from, to, moved, capacity, mode, relief, charter, ore, administration, textiles }, locations = hubs) {
  const source = routeStops.get(from.routeStop) ?? locations.get(from.id);
  const destination = routeStops.get(to.routeStop) ?? locations.get(to.id);
  if (!source || !destination) return "";
  const dx = destination.x - source.x;
  const dy = destination.y - source.y;
  const length = Math.hypot(dx, dy);
  if (!length) return "";
  const bend = textiles ? .60 : ore ? -.24 : relief ? -.21 : administration ? .42 : mode === "sea" ? .25 : .14;
  const cx = (source.x + destination.x) / 2 - dy * bend;
  const cy = (source.y + destination.y) / 2 + dx * bend;
  const x = destination.x - 10 * dx / length;
  const y = destination.y - 10 * dy / length;
  const weight = capacity ? 2.2 + 2.3 * Math.min(1, moved / capacity) : 2.2;
  const arrow = relief || administration || charter === "food" ? "relief-direction" : mode === "sea" && !charter ? "sea-direction" : "direction";
  const specializedCargo = ore ? "ore" : textiles ? "textiles" : administration ? "administration-rice" : "";
  const cargo = ore ? "ore" : textiles ? "textile" : charter === "trade" ? "timber" : relief ? "relief food" : administration ? "administration rice" : "food";
  const measure = ore || textiles || charter === "trade" ? "load" : "unit";
  const description = `${moved ? `${from.market} to ${to.market}, ${moved} ${cargo} ${measure}${moved === 1 ? "" : "s"}` : `${from.market} and ${to.market}, idle`}${mode ? `, ${mode} freight` : ""}`;
  return `<path class="market-route" data-moving="${Boolean(moved)}"${relief ? ' data-relief="true"' : ""}${charter ? ` data-charter="${charter}"` : ""}${specializedCargo ? ` data-cargo="${specializedCargo}"` : ""}${mode ? ` data-mode="${mode}"` : ""} d="M${source.x} ${source.y} Q${cx} ${cy} ${x} ${y}"${moved ? ` style="--route-weight:${weight}px" marker-end="url(#market-${arrow})"` : ""}>
    <title>${escapeText(description)}</title>
  </path>`;
}

function mapHub(node, hub, label = true) {
  const { x, y, dx, dy, align = "start" } = hub;
  const departments = investmentDepartments(node);
  const funded = departments.map((department) => departmentIdentity[department].label).join(", ");
  const role = node.reliefSource ? "Your relief dispatch" : node.charterPort ? "Your port" : null;
  return `<g class="market-hub" ${node.routeStop ? `data-route-stop="${escapeText(node.routeStop)}"` : `data-market="${escapeText(node.id)}"`} data-connected="${node.local === true}"${node.reliefSource ? ' data-relief-source="true"' : ""}${node.charterPort ? ' data-charter-port="true"' : ""}>
    <title>${escapeText(node.name)} · ${escapeText(node.market)}${role ? ` · ${role}` : ""}${funded ? ` · Funded works in ${escapeText(funded)}` : ""}</title>
    <circle cx="${x}" cy="${y}" r="4"/>${label ? `<text x="${x + dx}" y="${y + dy}" text-anchor="${align}">${escapeText(node.market)}</text>` : ""}
    ${departments.map((department, index) => `<circle class="market-investment-pip" data-sector="${department}" cx="${x + 5 * (index - (departments.length - 1) / 2)}" cy="${y + 9}" r="2"/>`).join("")}
  </g>`;
}

function northeastMap(nodes, routes) {
  const localNodes = nodes.filter(({ id }) => northeastHubs.has(id));
  const localRoutes = routes.filter(({ from, to }) => northeastHubs.has(from.id) && northeastHubs.has(to.id));
  return `<div class="market-northeast"><h4>Northeastern connections <span>Expanded schematic</span></h4>
    <svg viewBox="0 0 360 205" role="img" aria-label="Expanded northeastern markets and road freight routes. Shipment details follow the map.">
      <g>${localRoutes.filter(({ moved }) => !moved).map((route) => mapRoute(route, northeastHubs)).join("")}${localRoutes.filter(({ moved }) => moved).map((route) => mapRoute(route, northeastHubs)).join("")}</g>
      <g>${localNodes.map((node) => mapHub(node, northeastHubs.get(node.id))).join("")}</g>
    </svg>
    ${!localNodes.some(({ id }) => id === "assam") ? '<p class="market-local-note">Your Assam road trade is shown in Neighbors.</p>' : ""}
  </div>`;
}

function northernMap(nodes, routes) {
  const localNodes = nodes.filter(({ id }) => northernHubs.has(id));
  const localRoutes = routes.filter(({ from, to }) => northernHubs.has(from.id) && northernHubs.has(to.id));
  return `<div class="market-north"><h4>Northern connections <span>Expanded schematic</span></h4>
    <svg viewBox="0 0 360 205" role="img" aria-label="Northern exchanges. Jammu represents its market, without a territorial boundary claim.">
      <g>${localRoutes.filter(({ moved }) => !moved).map((route) => mapRoute(route, northernHubs)).join("")}${localRoutes.filter(({ moved }) => moved).map((route) => mapRoute(route, northernHubs)).join("")}</g>
      <g>${localNodes.map((node) => mapHub(node, northernHubs.get(node.id))).join("")}</g>
    </svg>
    <p class="market-local-note">Jammu marks an exchange. Trade with your administration is shown in Neighbors.</p>
  </div>`;
}

function marketMap(nodes, routes, year) {
  const census = year >= 1956 ? 1961 : year >= 1947 ? 1951 : 1941;
  const historicalLabels = census === 1941 ? { up: "United Province", bengal: "Bengal", central: "Central Province and Berar", rajasthan: "Rajputana Agency" } : {};
  const connected = new Set(nodes.filter(({ local }) => local).map(({ id }) => historicalLabels[id] ?? hubs.get(id)?.census));
  const fundedDepartments = new Set(nodes.flatMap(investmentDepartments));
  const outlines = snapshots[census];
  const zones = outlines.map(({ name, path }) => `<path class="market-zone${connected.has(name) ? " market-zone-connected" : ""}" d="${path}"/>`).join("");
  const expandedNortheast = nodes.filter(({ id }) => northeastHubs.has(id)).length > 2;
  const expandedNorth = nodes.some(({ id }) => id === "himachal" || id === "jammu");
  const pins = nodes.map((node) => {
    const hub = hubs.get(node.id);
    if (!hub) return "";
    return mapHub(node, hub, (!expandedNortheast || !northeastHubs.has(node.id)) && (!expandedNorth || !northernHubs.has(node.id)));
  }).join("");
  const stops = new Map(routes.flatMap(({ from, to }) => [from, to]).filter(({ routeStop }) => routeStop)
    .map((node) => [node.routeStop, node]));
  return `<figure class="market-map">
    <svg viewBox="42 27 508 520" role="img" aria-label="Domestic shipments${outlines.length ? ` on ${census} census outlines` : ""}. Route details follow the map.">
      <defs><marker id="market-direction" markerWidth="6" markerHeight="6" viewBox="0 0 8 8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z"/></marker>
      <marker id="market-relief-direction" markerWidth="7" markerHeight="7" viewBox="0 0 8 8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z"/></marker>
      <marker id="market-sea-direction" markerWidth="7" markerHeight="7" viewBox="0 0 8 8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <g fill-rule="evenodd">${zones}</g>
      <g class="market-map-context"><text x="66" y="379">ARABIAN SEA</text><text x="323" y="417">BAY OF BENGAL</text></g>
      ${expandedNortheast ? '<rect class="market-ne-frame" x="415" y="186" width="99" height="100" rx="4"/><text class="market-ne-caption" x="415" y="299">Northeast · expanded below</text>' : ""}
      ${expandedNorth ? '<rect class="market-ne-frame" x="157" y="97" width="80" height="92" rx="4"/><text class="market-ne-caption" x="157" y="90">North · expanded below</text>' : ""}
      <g>${routes.filter(({ moved }) => !moved).map((route) => mapRoute(route)).join("")}${routes.filter(({ moved }) => moved).map((route) => mapRoute(route)).join("")}</g>
      <g>${pins}${[...stops.values()].map((node) => mapHub(node, routeStops.get(node.routeStop))).join("")}</g>
    </svg>
    ${expandedNorth ? northernMap(nodes, routes) : ""}
    ${expandedNortheast ? northeastMap(nodes, routes) : ""}
    <figcaption>
      <ul class="market-map-key">${routes.some(({ charter }) => charter) ? '<li data-key="charter">Your sea charter</li>' : ""}${routes.some(({ relief }) => relief) ? '<li data-key="relief">Your relief shipments</li>' : ""}<li data-key="moving">Food traded</li><li data-key="idle">Idle route</li><li data-key="connected">Your neighbor</li>${routes.some(({ mode }) => mode === "road") ? '<li data-key="road">Road freight</li>' : ""}${routes.some(({ mode }) => mode === "rail") ? '<li data-key="rail">Rail freight</li>' : ""}${routes.some(({ mode }) => mode === "sea") ? '<li data-key="sea">Sea freight</li>' : ""}${routes.some(({ ore }) => ore) ? '<li data-key="ore">Iron ore</li>' : ""}</ul>
      ${routes.some(({ administration, textiles }) => administration || textiles) ? `<ul class="market-map-key">${routes.some(({ administration }) => administration) ? '<li data-key="administration-rice">Administration rice</li>' : ""}${routes.some(({ textiles }) => textiles) ? '<li data-key="textiles">Textile consignments</li>' : ""}</ul>` : ""}
      ${fundedDepartments.size ? `<div class="market-department-key"><span>Funded works</span>${Object.keys(departmentIdentity).filter((department) => fundedDepartments.has(department)).map((department) => departmentBadge(department)).join("")}</div>` : ""}
      <span>${outlines.length ? `${census} census reference · ` : ""}Schematic connections</span>
    </figcaption>
  </figure>`;
}

function routeRows(routes) {
  const transport = { road: "Road", rail: "Rail", sea: "Sea" };
  return `<ul class="market-route-list">${routes.map(({ from, to, moved, capacity, local, mode, charter }) => `<li data-connected="${local}"${mode ? ` data-mode="${mode}"` : ""}>
    <div class="market-route-label"><strong>${escapeText(from.market)} <span class="sr-only">${moved ? "to" : "and"}</span><span aria-hidden="true">${moved ? "→" : "·"}</span> ${escapeText(to.market)}</strong>
      <span>${transport[mode] ? `<b class="market-mode">${transport[mode]}</b> ` : ""}${moved ? `${moved} of ${charter === "trade" ? `${capacity} timber ${capacity === 1 ? "load" : "loads"}` : units(capacity)}` : `${units(capacity)} capacity`}</span></div>
    ${moved && capacity ? `<progress max="${capacity}" value="${moved}" aria-hidden="true"></progress>` : ""}
  </li>`).join("")}</ul>`;
}

function investmentRows(works, name) {
  const building = works.filter(({ status }) => status !== "open").length;
  return `<details class="market-investments" aria-label="${escapeText(name)} investments"><summary>${works.length} ${works.length === 1 ? "investment" : "investments"}${building ? ` · ${building} building` : " · Operating"}</summary>
    <ul>${works.map(({ title, effect, department, status, started, completionYear, cost, reason }) => {
      const sector = Object.hasOwn(departmentIdentity, department) ? department : "trade";
      const timing = status === "open" ? `Opened ${quantity(completionYear)}` : `Due ${quantity(completionYear)}`;
      return `<li data-sector="${sector}">
        ${departmentBadge(sector)}<strong>${escapeText(title)}</strong>
        <small class="market-investment-terms">${timing} · ${Fiscal.lakh(quantity(cost))}${Number.isFinite(started) ? ` committed ${started}` : ""}</small>
        ${reason ? `<span class="market-investment-reason">${escapeText(reason)}</span>` : ""}
        ${effect ? `<span>${escapeText(effect)}</span>` : ""}
      </li>`;
    }).join("")}</ul>
  </details>`;
}

function developmentResults(development) {
  if (!development) return "";
  const { harvestSaved, trainingReceipts, processingReceipts } = development;
  const results = [
    harvestSaved > 0 ? `${units(harvestSaved)} of food losses prevented` : "",
    trainingReceipts > 0 ? `${Fiscal.lakh(trainingReceipts)} training receipts` : "",
    processingReceipts > 0 ? `${Fiscal.lakh(processingReceipts)} processing receipts` : "",
  ].filter(Boolean);
  return results.length ? `<small class="market-development-results">${results.join(" · ")}</small>` : "";
}

function marketBalances(nodes) {
  const hasFreight = nodes.some(({ freight }) => freight > 0);
  return `<details class="market-detail"><summary>Reserves and treasuries</summary>
    <div class="market-table-wrap" tabindex="0" role="region" aria-label="Administration balances and investments"><table class="market-table">
      <thead><tr><th scope="col">Administration</th><th scope="col">Food reserve</th><th scope="col">Shortfall</th><th scope="col">Treasury</th>${hasFreight ? '<th scope="col">Freight earnings</th>' : ''}</tr></thead>
      <tbody>${nodes.map(({ id, name, market, reserve, shortage, cash, local, freight, freightContract, loadingYard, works, development, funding, unionFood }) => `<tr data-market="${escapeText(id)}" data-connected="${local === true}">
        <th scope="row">${escapeText(name)} <small>${escapeText(market)}${local ? " · Neighbor" : ""}</small>
          ${id === "goa" ? "<small>Mormugao anchors the combined Union territory account.</small>" : ""}
          ${!works && loadingYard ? `<small>Loading yard ${loadingYard.open ? "operating" : `due ${quantity(loadingYard.completionYear)}`}</small>` : ""}
          ${freightContract ? `<small>Freight contract earned ${Fiscal.lakh(quantity(freightContract))}</small>` : ""}
          ${unionFood ? `<small>${units(unionFood)} in routine Union supplies</small>` : ""}</th>
        <td>${units(quantity(reserve))}</td><td>${shortage > 0 ? units(quantity(shortage)) : "Covered"}</td><td>${Fiscal.lakh(quantity(cash))}</td>${hasFreight ? `<td>${Fiscal.lakh(quantity(freight))}</td>` : ''}
      </tr>${funding || Array.isArray(works) && works.length ? `<tr class="market-investment-row" data-market="${escapeText(id)}"><td colspan="${hasFreight ? 5 : 4}">${marketFundingMarkup(funding)}${Array.isArray(works) && works.length ? investmentRows(works, name) : ""}${developmentResults(development)}</td></tr>` : ""}`).join("")}</tbody>
    </table></div>
  </details>`;
}

function railMeter(freight, capacity, reserved = freight) {
  const total = Math.max(1, quantity(capacity));
  const used = 100 * Math.min(total, quantity(freight)) / total;
  const held = Math.max(0, 100 * Math.min(total, quantity(reserved)) / total - used);
  return `<div class="market-rail-meter" aria-hidden="true"><span style="width:${used}%"></span>${held ? `<span class="market-rail-unused" style="width:${held}%"></span>` : ""}</div>`;
}

function westernMarkets({ ore, islands, rival } = {}, year) {
  if (!ore && !islands && !rival) return "";
  const monsoonDelay = islands?.seasonal && islands.sailingCapacity > islands.capacity;
  return `${ore || rival ? `<section data-sector="trade" aria-label="Mormugao freight">
      <header><h3>Mormugao freight</h3>${departmentBadge("trade")}</header>
      ${ore ? `<dl><div><dt>Rail slots reserved for ore</dt><dd>${quantity(ore.loads)} / ${quantity(ore.railCapacity)}</dd></div>
        <div><dt>Rail capacity for food</dt><dd>${units(quantity(ore.foodCapacity))}</dd></div></dl>
        ${railMeter(ore.loads, ore.railCapacity)}` : ""}
      ${rival ? `<p>${quantity(rival.loads)} of ${quantity(rival.capacity)} commercial loads won by Mormugao carriers.</p>` : ""}
    </section>` : ""}
    ${islands ? `<section data-sector="food" aria-label="Island food supply">
      <header><h3>Island food supply</h3>${departmentBadge("food")}</header>
      <dl><div><dt>${year < 1958 ? "Administration rice" : "Food shipped from Calicut"}</dt><dd>${year < 1958 ? units(quantity(islands.provisioned)) : `${quantity(islands.administrationCargo) + quantity(islands.delivered) + quantity(islands.relief)} / ${quantity(islands.capacity)} sea slots`}</dd></div>
        <div><dt>Island food needs</dt><dd>${islands.shortage > 0 ? `${units(quantity(islands.shortage))} short` : "Covered"}</dd></div></dl>
      ${year >= 1958 ? `<p>${monsoonDelay ? "Monsoon cut sailing capacity" : islands.seasonal ? "Fair-weather service" : "All-weather service"} · ${units(quantity(islands.administrationCargo))} of administration rice aboard${islands.relief ? ` · ${units(quantity(islands.relief))} in interstate relief` : ""}</p>` : ""}
    </section>` : ""}`;
}

function coromandelMarket({ phase, railCapacity, foodCapacity, textileLoads, compact, settlement, closure, receipt }) {
  const sector = compact === "food" ? "food" : "trade";
  const textileSlots = Math.max(0, quantity(railCapacity) - quantity(foodCapacity));
  const status = [phase === "union" ? "Union territory" : "Transfer administration",
    compact === "food" ? "Food access compact" : compact === "textiles" ? "Textile orders compact" : "",
    receipt > 0 ? `${Fiscal.lakh(quantity(receipt))} in receipts for Madras` : ""].filter(Boolean).join(" · ");
  const foodTrade = settlement && [settlement.foodBought > 0 ? `bought ${units(quantity(settlement.foodBought))}` : "",
    settlement.foodSold > 0 ? `sold ${units(quantity(settlement.foodSold))}` : ""].filter(Boolean).join(" · ");
  const foodAid = settlement && [settlement.relief > 0 ? `${units(quantity(settlement.relief))} of aid received` : "",
    settlement.aidSent > 0 ? `${units(quantity(settlement.aidSent))} of aid sent` : ""].filter(Boolean).join(" · ");
  return `<section data-sector="${sector}" aria-label="Pondicherry rail freight">
    <header><h3>Pondicherry rail</h3>${departmentBadge(sector)}</header>
    <dl><div><dt>Textile loads shipped</dt><dd>${textileSlots ? `${quantity(textileLoads)} / ${textileSlots} reserved` : "0 loads"}</dd></div>
      <div><dt>Rail capacity for food</dt><dd>${units(quantity(foodCapacity))}</dd></div></dl>
    ${railMeter(textileLoads, railCapacity, textileSlots)}<p>${status}</p>
    ${closure ? "<p>Orders from former French markets fell.</p>" : ""}
    ${foodTrade ? `<p>Madras ${foodTrade}.</p>` : ""}
    ${foodAid ? `<p>Madras · ${foodAid}</p>` : ""}
  </section>`;
}

export function nationalMarketMarkup(result) {
  if (!result?.nodes?.length) return `<p>Shipments appear here after the first resolved year in Standard politics.</p>`;
  const nodes = result.nodes.map((node) => ({ ...node, market: node.market || node.name }));
  const origin = result.relief?.source && { ...result.relief.source, reliefSource: true };
  const mapNodes = origin ? [...nodes, origin] : nodes;
  const coromandel = result.coromandel;
  const byId = new Map(mapNodes.map((node) => [node.id, node]));
  const resolveRoutes = (links, relief) => links.flatMap(({ from, to, units: moved, capacity, mode, fromMarket, toMarket }) => {
    const source = byId.get(from);
    const destination = byId.get(to);
    return source && destination ? [{ from: routeEndpoint(source, fromMarket), to: routeEndpoint(destination, toMarket),
      moved: quantity(moved), capacity: quantity(capacity), mode, local: Boolean(source.local || destination.local), relief }] : [];
  });
  const routes = resolveRoutes(result.links ?? [], false);
  const reliefRoutes = resolveRoutes(result.relief?.routes ?? [], true);
  const charter = result.charter;
  const island = byId.get(islandMarket);
  const port = charter && { id: charter.portId, name: charter.port, market: charter.port, charterPort: true };
  const charterRoutes = port && island ? [{ from: charter.id === "food" ? port : island, to: charter.id === "food" ? island : port,
    mode: "sea", moved: charter.food + charter.timber, capacity: charter.capacity, charter: charter.id, local: true }] : [];
  const ore = result.western?.ore;
  const oreSource = byId.get("mysore");
  const orePort = byId.get("goa");
  const oreRoutes = ore?.loads && oreSource && orePort ? [{ from: routeEndpoint(oreSource, "Hospet–Bellary"), to: orePort,
    mode: "rail", moved: ore.loads, capacity: ore.railCapacity, ore: true }] : [];
  const islandShipping = result.western?.islands;
  const calicut = byId.get("kerala");
  const kavaratti = byId.get("lakshadweep");
  const riceRoutes = islandShipping?.administrationCargo && calicut && kavaratti ? [{ from: routeEndpoint(calicut, islandShipping.base), to: kavaratti,
    mode: "sea", moved: islandShipping.administrationCargo, capacity: islandShipping.capacity, administration: true }] : [];
  const home = coromandel?.settlement && !byId.has("madras") ? { id: "madras", name: "Your administration", market: "Madras", local: true } : null;
  const madras = home ?? byId.get("madras");
  const pondicherry = byId.get("pondicherry");
  const textileRoutes = madras && pondicherry && coromandel?.textileLoads ? [
    { from: pondicherry, to: routeEndpoint(madras, "Madras via Villupuram"), mode: "rail",
      moved: quantity(coromandel.textileLoads), capacity: quantity(coromandel.railCapacity), textiles: true },
  ] : [];
  const localRail = madras && pondicherry && coromandel?.settlement ? [
    { from: pondicherry, to: madras, moved: quantity(coromandel.settlement.foodBought) + quantity(coromandel.settlement.relief) },
    { from: madras, to: pondicherry, moved: quantity(coromandel.settlement.foodSold) + quantity(coromandel.settlement.aidSent) },
  ].filter(({ moved }) => moved).map((leg) => ({ ...leg, mode: "rail", capacity: quantity(coromandel.foodCapacity), local: true })) : [];
  const active = routes.filter(({ moved }) => moved > 0).sort((a, b) => Number(b.local) - Number(a.local) || b.moved - a.moved);
  const idle = routes.filter(({ moved }) => moved === 0);
  const corridors = westernMarkets(result.western, result.year) + (coromandel ? coromandelMarket(coromandel) : "");
  return `<section class="national-market" data-sector="trade">
    <dl class="market-totals"><div><dt>Food traded</dt><dd>${units(quantity(result.units))}</dd></div>
      <div><dt>Trade involving neighbors</dt><dd>${units(quantity(result.localUnits))}</dd></div>
      <div><dt>Commercial routes in use</dt><dd>${active.length} / ${routes.length}</dd></div></dl>
    ${corridors ? `<div class="market-corridors" role="group" aria-label="Coastal freight">${corridors}</div>` : ""}
    <div class="market-layout">
      ${marketMap([...mapNodes, ...[port, home].filter(Boolean)], [...routes, ...oreRoutes, ...riceRoutes, ...textileRoutes, ...localRail, ...reliefRoutes, ...charterRoutes], result.year)}
      <div class="market-shipments">
        ${charterRoutes.length ? `<section class="market-relief" data-sector="${charter.id}"><h3>Port Blair charter</h3>${routeRows(charterRoutes)}
          <p>${charter.islandShortage ? `${units(charter.islandShortage)} still needed on the islands` : "Island food needs covered"} · ${units(charter.islandReserve)} in island reserves</p></section>` : ""}
        ${reliefRoutes.length ? `<section class="market-relief" data-sector="food"><h3>Relief from your reserves</h3>${routeRows(reliefRoutes)}</section>` : ""}
        <h3>Commercial shipments in ${quantity(result.year)}</h3>
        ${result.chapter ? `<p class="market-chapter">${escapeText(result.chapter)}</p>` : ""}
        ${active.length ? routeRows(active) : "<p>Domestic routes carried no food this year.</p>"}
        ${idle.length ? `<details class="market-detail"><summary>Idle routes (${idle.length})</summary>${routeRows(idle)}</details>` : ""}
      </div>
    </div>
    ${marketBalances(nodes)}
    ${nationalCoverageMarkup({ year: result.year, nodes })}
  </section>`;
}
