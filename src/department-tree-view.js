import { departmentIcon } from "./department-icons.js";
import { departmentBadge } from "./department-presentation.js";
import "./department-tree-view.css";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const romanTiers = ["", "I", "II", "III", "IV", "V", "VI"];
const tierNumber = (value) => romanTiers[Number(value)] || String(value);

const statusIcons = {
  completed: "M5 12l4 4L19 6",
  available: "M12 4l8 8-8 8-8-8 8-8Z",
  locked: "M7 11h10v9H7zm2 0V8a3 3 0 0 1 6 0v3",
  active: "M12 6v6l4 2m4-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
};

function emblem(path) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
}

function tierGroups(nodes) {
  const grouped = new Map();
  for (const node of nodes) {
    const tier = String(node.tier);
    if (!grouped.has(tier)) grouped.set(tier, []);
    grouped.get(tier).push(node);
  }
  return [...grouped].sort(([a], [b]) => Number(a) - Number(b));
}

function routeDiagram(groups) {
  if (groups.length < 2) return "";
  const positions = new Map();
  const height = Math.max(53, 34 + 15 * Math.max(...groups.map(([, nodes]) => nodes.length)));
  const tierLabels = groups.map(([tier, nodes], column) => {
    const x = 21 + 174 * column / (groups.length - 1);
    for (const [row, node] of nodes.entries()) {
      positions.set(node.id, { x, y: 22 + (height - 30) * (row + .5) / nodes.length, status: node.status });
    }
    return `<text x="${x}" y="12">${escapeText(tierNumber(tier))}</text>`;
  });
  const links = groups.flatMap(([, nodes]) => nodes.flatMap((node) => (node.prerequisites ?? []).flatMap((prerequisite) => {
    const from = positions.get(prerequisite);
    const to = positions.get(node.id);
    if (!from || !to || from.x >= to.x) return [];
    const mid = (from.x + to.x) / 2;
    return `<path class="department-route-edge" data-from-status="${escapeText(from.status)}" d="M${from.x} ${from.y} C${mid} ${from.y} ${mid} ${to.y} ${to.x} ${to.y}"/>`;
  })));
  const markers = [...positions.values()].map(({ x, y, status }) => `<circle class="department-route-mark" cx="${x}" cy="${y}" r="4.2" data-status="${escapeText(status)}"/>`);
  return `<div class="department-route" aria-hidden="true">
    <svg viewBox="0 0 216 ${height}" focusable="false" preserveAspectRatio="xMidYMid meet">${tierLabels.join("")}${links.join("")}${markers.join("")}</svg>
  </div>`;
}

function nodeCard(node, index, showDistrict) {
  const id = escapeText(node.id);
  const summaryId = `department-node-summary-${index}`;
  const title = escapeText(node.facility ?? node.title);
  const district = showDistrict && node.district ? escapeText(node.district) : "";
  const statusIcon = Object.hasOwn(statusIcons, node.status) ? emblem(statusIcons[node.status]) : "";
  const action = node.actionLabel ?? "Review programme";
  const actionLabel = `${escapeText(action)} · ${title}${district ? ` · ${district}` : ""}`;
  return `<li class="department-node" data-status="${escapeText(node.status)}">
    <button type="button" class="department-node-button" data-tree-node="${id}" aria-label="${actionLabel}" aria-describedby="${summaryId}"${node.disabled ? " disabled" : ""}>
      <span class="department-facility-icon">${departmentIcon(node.icon)}</span>
      <span class="department-node-copy">
        <strong class="department-node-title">${title}</strong>
        ${district ? `<span class="department-node-district">${district}</span>` : ""}
        <span class="department-node-summary" id="${summaryId}">
          ${node.metric ? `<span class="department-node-metric">${escapeText(node.metric)}</span>` : ""}
          <span class="department-node-meta">
            <span class="department-node-status">${statusIcon}${escapeText(node.statusLabel)}</span>
            ${node.price ? `<span class="department-node-price">${escapeText(node.price)}</span>` : ""}
            ${node.time ? `<span class="department-node-time">${escapeText(node.time)}</span>` : ""}
            ${node.lockHint ? `<span class="department-node-lock">${escapeText(node.lockHint)}</span>` : ""}
          </span>
        </span>
      </span>
      <span class="department-node-arrow" aria-hidden="true">›</span>
    </button>
  </li>`;
}

export function departmentTreeMarkup(trees, selectedId, treasuryLabel) {
  const selected = trees.find(({ id }) => id === selectedId) ?? trees[0];
  if (!selected) return '<p class="department-tree-empty">No development plans are available for this campaign.</p>';

  const groups = tierGroups(selected.nodes);
  const total = groups.length;
  const completed = groups.filter(([, nodes]) => nodes.some(({ status }) => status === "completed")).length;
  const labels = new Map();
  for (const node of selected.nodes) {
    const label = node.facility ?? node.title;
    labels.set(label, (labels.get(label) ?? 0) + 1);
  }
  const tabs = trees.map(({ id, label }) => `<button type="button" data-department="${escapeText(id)}" data-sector="${escapeText(id)}" aria-pressed="${id === selected.id}" aria-controls="department-tree-panel">
    ${departmentBadge(id, label)}
  </button>`);
  let index = 0;
  const tiers = groups.map(([tier, nodes]) => `<li class="department-tier">
    <div class="department-tier-index"><h4><span>Tier</span> <b>${escapeText(tierNumber(tier))}</b></h4></div>
    <ul class="department-tier-nodes" role="list">${nodes.map((node) => nodeCard(node, index++, labels.get(node.facility ?? node.title) > 1)).join("")}</ul>
  </li>`);

  return `<div class="department-tree">
    <div class="department-tree-bar">
      <div class="department-picker" role="group" aria-label="Departments">${tabs.join("")}</div>
      ${treasuryLabel ? `<div class="department-treasury"><span>Treasury</span><strong>${escapeText(treasuryLabel)}</strong></div>` : ""}
    </div>
    <section class="department-tree-panel" id="department-tree-panel" data-sector="${escapeText(selected.id)}" aria-labelledby="department-tree-label">
      <h3 class="sr-only" id="department-tree-label">${escapeText(selected.label)}</h3>
      <div class="department-tree-overview">
        <div>
          ${selected.description ? `<p class="department-tree-description">${escapeText(selected.description)}</p>` : ""}
          ${total ? `<div class="department-tree-progress"><progress value="${completed}" max="${total}" aria-label="Department progress"></progress><span>${completed} of ${total} tiers reached</span></div>` : ""}
        </div>
        ${routeDiagram(groups)}
      </div>
      ${tiers.length ? `<ol class="department-tiers" role="list" aria-label="Development tiers">${tiers.join("")}</ol>` : '<p class="department-tree-empty">No development plans are available in this department.</p>'}
      ${selected.optionalProject ? `<section class="department-partnership" aria-label="Union development partnership">
        <h4>Union development partnership</h4>
        <ul class="department-tier-nodes" role="list">${nodeCard(selected.optionalProject, index, true)}</ul>
      </section>` : ""}
    </section>
  </div>`;
}
