import { inlandActors, marketHubs, nationalMarketActors } from "./national-market.js";
import "./national-coverage.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);

const starts = ["Bihar", "Orissa", "Mayurbhanj", "West Bengal", "Bombay", "Punjab", "Madras", "Assam", "C.P. and Berar"];
const names = {
  up: (year) => year < 1950 ? "United Provinces" : "Uttar Pradesh",
  bengal: (year) => year < 1947 ? "Bengal" : "West Bengal",
  central: (year) => year < 1950 ? "C.P. and Berar" : "Madhya Pradesh",
  rajasthan: (year) => year < 1950 ? "Rajputana markets" : "Rajasthan",
  mysore: (year) => year < 1973 ? "Mysore" : "Karnataka",
  bihar: () => "Bihar", orissa: () => "Orissa", hyderabad: () => "Hyderabad",
  maharashtra: () => "Maharashtra", gujarat: () => "Gujarat",
};

function marketName(id, year) {
  if (names[id]) return names[id](year);
  const actor = inlandActors[id];
  return actor ? year >= actor.renamed ? actor.later : actor.name : marketHubs[id] ?? id;
}

function outsideMarkets(year) {
  return [
    "Jammu and Kashmir",
    year < 1948 ? "Western Himalayan hill states" : "Himachal Pradesh",
    year < 1975 ? "Sikkim kingdom" : "Sikkim",
    year < 1962 ? "Portuguese coastal enclaves" : "Goa, Daman and Diu",
    year < 1954 ? "Dadra and Nagar Haveli under Portuguese rule" : "Dadra and Nagar Haveli",
    year < 1954 ? "French coastal enclaves" : "Pondicherry and associated enclaves",
    "Andaman and Nicobar Islands",
    year < 1973 ? "Laccadive, Minicoy and Amindivi Islands" : "Lakshadweep",
    ...(year < 1950 ? ["Manipur", "Tripura"] : []),
    ...(year < 1972 ? ["Northeastern frontier"] : []),
  ];
}

const chips = (items, kind) => `<ul class="coverage-chips" data-coverage-kind="${kind}">${items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>`;

// Report views pass their saved nodes. The atlas derives a preview from the same
// actor graph as the simulation, without changing a campaign or its saved years.
export function nationalCoverageMarkup({ year = 1946, preset = "standard", nodes = null } = {}) {
  const fixedSnapshot = Array.isArray(nodes);
  const standard = preset === "standard";
  const markets = fixedSnapshot ? nodes.map(({ id, name }) => ({ id, name: name || marketName(id, year) }))
    : standard ? nationalMarketActors({ year, journey: { preset } }, { key: "coverage" })
      .map((id) => ({ id, name: marketName(id, year) })) : [];
  const marketNames = [...markets].sort((a, b) => a.name.localeCompare(b.name, "en")).map(({ name }) => name);
  return `<details class="national-coverage" data-coverage-year="${year}" data-coverage-snapshot="${fixedSnapshot}">
    <summary><span>Beyond your borders</span><span class="coverage-summary"><b>${starts.length} starts</b><b>${standard ? `${markets.length} ${fixedSnapshot ? "other accounts" : "market areas"} · ${year}` : "Local neighbors · Light"}</b></span></summary>
    <div class="coverage-body">
      ${!fixedSnapshot ? `<label class="coverage-year">Market preview<select data-coverage-period aria-label="Preview national market year">${[1946, 1956, 1966, 1972, 1985].map((period) => `<option value="${period}"${period === year ? " selected" : ""}>${period}</option>`).join("")}</select></label>` : ""}
      <div class="coverage-cards">
        <section class="coverage-card" data-coverage-status="playable"><h3><span aria-hidden="true">⚑</span> Playable starts</h3><p>Choose a government in 1946.</p>${chips(starts, "starts")}<small>Successor states follow your campaign decisions.</small></section>
        <section class="coverage-card" data-coverage-status="simulated"><h3><span aria-hidden="true">↔</span> ${standard ? "Market governments" : "Local neighbors"}</h3><p>${standard ? "Own harvests, reserves, treasuries and investments." : "Nearby trade and agreements remain active."}</p>
          ${standard ? chips(marketNames, "markets") : "<small>Choose Standard for the wider domestic market.</small>"}
          ${standard ? `<small>${fixedSnapshot ? "Other administrations recorded in this annual report." : "National market preview. Your government uses the full campaign model."} Nearby agreements appear in Neighbors.</small>` : ""}</section>
        <section class="coverage-card" data-coverage-status="context"><h3><span aria-hidden="true">◇</span> Outside the market model</h3><p>No independent treasury or annual turn.</p>${chips(outsideMarkets(year), "context")}<small>Some smaller territories share a larger regional market. International trade follows campaign-specific agreements.</small></section>
      </div>
    </div>
  </details>`;
}
