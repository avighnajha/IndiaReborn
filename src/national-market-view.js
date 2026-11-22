import { Fiscal } from "./fiscal.js";
import { departmentBadge, departmentIdentity } from "./department-presentation.js";
import { nationalCoverageMarkup } from "./national-coverage.js";
import snapshots from "./geography/founding.json";
import "./national-market-view.css";

// Hub and label coordinates use the founding atlas projection.
const hubs = new Map([
  ["up", { x: 281, y: 229, dx: 0, dy: -11, align: "middle", census: "Uttar Pradesh" }],
  ["bihar", { x: 333, y: 226, dx: 0, dy: -11, align: "middle", census: "Bihar" }],
  ["bengal", { x: 383, y: 276, dx: 11, dy: 4, census: "West Bengal" }],
  ["central", { x: 251, y: 266, dx: -10, dy: 3, align: "end", census: "Madhya Pradesh" }],
  ["orissa", { x: 344, y: 311, dx: 11, dy: 7, census: "Orissa" }],
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

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const quantity = (value) => Number.isFinite(value) ? Math.max(0, value) : 0;
const units = (value) => `${value} ${value === 1 ? "unit" : "units"}`;
const investmentDepartments = (node) => [...new Set((node.works ?? []).map(({ department }) => department)
  .filter((department) => Object.hasOwn(departmentIdentity, department)))];

function mapRoute({ from, to, moved, capacity, mode }, locations = hubs) {
  const source = locations.get(from.id);
  const destination = locations.get(to.id);
  if (!source || !destination) return "";
  const dx = destination.x - source.x;
  const dy = destination.y - source.y;
  const length = Math.hypot(dx, dy);
  if (!length) return "";
  const cx = (source.x + destination.x) / 2 - dy * .14;
  const cy = (source.y + destination.y) / 2 + dx * .14;
  const x = destination.x - 10 * dx / length;
  const y = destination.y - 10 * dy / length;
  const weight = capacity ? 2.2 + 2.3 * Math.min(1, moved / capacity) : 2.2;
  const description = `${moved ? `${from.market} to ${to.market}, ${units(moved)} carried` : `${from.market} and ${to.market}, idle`}${mode === "road" ? ", road freight" : ""}`;
  return `<path class="market-route" data-moving="${Boolean(moved)}"${mode === "road" ? ' data-mode="road"' : ""} d="M${source.x} ${source.y} Q${cx} ${cy} ${x} ${y}"${moved ? ` style="--route-weight:${weight}px" marker-end="url(#market-direction)"` : ""}>
    <title>${escapeText(description)}</title>
  </path>`;
}

function mapHub(node, hub, label = true) {
  const { x, y, dx, dy, align = "start" } = hub;
  const departments = investmentDepartments(node);
  const funded = departments.map((department) => departmentIdentity[department].label).join(", ");
  return `<g class="market-hub" data-market="${escapeText(node.id)}" data-connected="${node.local === true}">
    <title>${escapeText(node.name)} · ${escapeText(node.market)}${funded ? ` · Funded works in ${escapeText(funded)}` : ""}</title>
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

function marketMap(nodes, routes, year) {
  const census = year >= 1956 ? 1961 : year >= 1947 ? 1951 : 1941;
  const historicalLabels = census === 1941 ? { up: "United Province", bengal: "Bengal", central: "Central Province and Berar", rajasthan: "Rajputana Agency" } : {};
  const connected = new Set(nodes.filter(({ local }) => local).map(({ id }) => historicalLabels[id] ?? hubs.get(id)?.census));
  const fundedDepartments = new Set(nodes.flatMap(investmentDepartments));
  const outlines = snapshots[census];
  const zones = outlines.map(({ name, path }) => `<path class="market-zone${connected.has(name) ? " market-zone-connected" : ""}" d="${path}"/>`).join("");
  const expandedNortheast = nodes.filter(({ id }) => northeastHubs.has(id)).length > 2;
  const pins = nodes.map((node) => {
    const hub = hubs.get(node.id);
    if (!hub) return "";
    return mapHub(node, hub, !expandedNortheast || !northeastHubs.has(node.id));
  }).join("");
  return `<figure class="market-map">
    <svg viewBox="42 27 508 520" role="img" aria-label="Domestic food shipments${outlines.length ? ` on ${census} census outlines` : ""}. Route details follow the map.">
      <defs><marker id="market-direction" markerWidth="6" markerHeight="6" viewBox="0 0 8 8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <g fill-rule="evenodd">${zones}</g>
      <g class="market-map-context"><text x="66" y="379">ARABIAN SEA</text><text x="323" y="417">BAY OF BENGAL</text></g>
      ${expandedNortheast ? '<rect class="market-ne-frame" x="415" y="186" width="99" height="100" rx="4"/><text class="market-ne-caption" x="415" y="299">Northeast · expanded below</text>' : ""}
      <g>${routes.filter(({ moved }) => !moved).map((route) => mapRoute(route)).join("")}${routes.filter(({ moved }) => moved).map((route) => mapRoute(route)).join("")}</g>
      <g>${pins}</g>
    </svg>
    ${expandedNortheast ? northeastMap(nodes, routes) : ""}
    <figcaption>
      <ul class="market-map-key"><li data-key="moving">Food shipped</li><li data-key="idle">Idle route</li><li data-key="connected">Your neighbor</li>${routes.some(({ mode }) => mode === "road") ? '<li data-key="road">Road freight</li>' : ""}</ul>
      ${fundedDepartments.size ? `<div class="market-department-key"><span>Funded works</span>${Object.keys(departmentIdentity).filter((department) => fundedDepartments.has(department)).map((department) => departmentBadge(department)).join("")}</div>` : ""}
      <span>${outlines.length ? `${census} census reference · ` : ""}Schematic connections</span>
    </figcaption>
  </figure>`;
}

function routeRows(routes) {
  return `<ul class="market-route-list">${routes.map(({ from, to, moved, capacity, local, mode }) => `<li data-connected="${local}"${mode === "road" ? ' data-mode="road"' : ""}>
    <div class="market-route-label"><strong>${escapeText(from.market)} <span class="sr-only">${moved ? "to" : "and"}</span><span aria-hidden="true">${moved ? "→" : "·"}</span> ${escapeText(to.market)}</strong>
      <span>${mode === "road" ? '<b class="market-mode">Road</b> ' : ""}${moved ? `${moved} of ${units(capacity)}` : `${units(capacity)} capacity`}</span></div>
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
      <tbody>${nodes.map(({ name, market, reserve, shortage, cash, local, freight, freightContract, loadingYard, works, development }) => `<tr data-connected="${local === true}">
        <th scope="row">${escapeText(name)} <small>${escapeText(market)}${local ? " · Neighbor" : ""}</small>
          ${!works && loadingYard ? `<small>Loading yard ${loadingYard.open ? "operating" : `due ${quantity(loadingYard.completionYear)}`}</small>` : ""}
          ${freightContract ? `<small>Freight contract earned ${Fiscal.lakh(quantity(freightContract))}</small>` : ""}</th>
        <td>${units(quantity(reserve))}</td><td>${shortage > 0 ? units(quantity(shortage)) : "Covered"}</td><td>${Fiscal.lakh(quantity(cash))}</td>${hasFreight ? `<td>${Fiscal.lakh(quantity(freight))}</td>` : ''}
      </tr>${Array.isArray(works) && works.length ? `<tr class="market-investment-row"><td colspan="${hasFreight ? 5 : 4}">${investmentRows(works, name)}${developmentResults(development)}</td></tr>` : ""}`).join("")}</tbody>
    </table></div>
  </details>`;
}

export function nationalMarketMarkup(result) {
  if (!result?.nodes?.length) return `<p>Shipments appear here after the first resolved year in Standard politics.</p>`;
  const nodes = result.nodes.map((node) => ({ ...node, market: node.market || node.name }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const routes = (result.links ?? []).flatMap(({ from, to, units: moved, capacity, mode }) => {
    const source = byId.get(from);
    const destination = byId.get(to);
    return source && destination ? [{ from: source, to: destination, moved: quantity(moved), capacity: quantity(capacity), mode, local: Boolean(source.local || destination.local) }] : [];
  });
  const active = routes.filter(({ moved }) => moved > 0).sort((a, b) => Number(b.local) - Number(a.local) || b.moved - a.moved);
  const idle = routes.filter(({ moved }) => moved === 0);
  return `<section class="national-market" data-sector="trade">
    <dl class="market-totals"><div><dt>Food shipped</dt><dd>${units(quantity(result.units))}</dd></div>
      <div><dt>Involving your neighbors</dt><dd>${units(quantity(result.localUnits))}</dd></div>
      <div><dt>Routes in use</dt><dd>${active.length} / ${routes.length}</dd></div></dl>
    <div class="market-layout">
      ${marketMap(nodes, routes, result.year)}
      <div class="market-shipments"><h3>Shipments in ${quantity(result.year)}</h3>
        ${result.chapter ? `<p class="market-chapter">${escapeText(result.chapter)}</p>` : ""}
        ${active.length ? routeRows(active) : "<p>Domestic routes carried no food this year.</p>"}
        ${idle.length ? `<details class="market-detail"><summary>Idle routes (${idle.length})</summary>${routeRows(idle)}</details>` : ""}
      </div>
    </div>
    ${marketBalances(nodes)}
    ${nationalCoverageMarkup({ year: result.year, nodes })}
  </section>`;
}
