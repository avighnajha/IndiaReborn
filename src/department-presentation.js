import { departmentTracks } from "./department-content.js";
import { departmentIcon } from "./department-icons.js";

export const departmentIdentity = {
  education: { label: "Education", icon: "school", color: 0x8acbd5 },
  food: { label: "Food & Water", icon: "irrigation", color: 0xb9cc79 },
  trade: { label: "Trade & Industry", icon: "freight", color: 0xf0bf78 },
};

const openingTiers = {
  skills: ["education", 1], northSkills: ["education", 1],
  food: ["food", 1], kosi: ["food", 2], mahanadi: ["food", 2], damodar: ["food", 2], tanks: ["food", 2], bombayWater: ["food", 2], water: ["food", 2],
  trade: ["trade", 1], industry: ["trade", 2], northIndustry: ["trade", 2], applied: ["trade", 2], juteSupply: ["trade", 2],
};

const themes = { "Skills and prosperity": "education", "Food and water": "food", "Transport and industry": "trade" };

export function programmeDepartment(world, game, id, plan) {
  if (game) {
    for (const track of departmentTracks(world, game)) {
      const index = track.tiers.findIndex((ids) => ids.includes(id));
      if (index !== -1) return { id: track.id, label: track.label, tier: index + 1 };
    }
  }
  const canonical = id?.replace(/^(orissa|mh|gj)_/, "");
  const [sector, tier] = openingTiers[canonical] ?? [plan?.department ?? themes[plan?.theme], plan?.tier ?? null];
  return departmentIdentity[sector] ? { id: sector, label: departmentIdentity[sector].label, tier } : null;
}

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function departmentBadge(id, label = departmentIdentity[id]?.label) {
  const identity = departmentIdentity[id];
  if (!identity) return "";
  const safeLabel = String(label).replace(/[&<>"']/g, (character) => entities[character]);
  return `<span class="department-badge" data-sector="${id}">${departmentIcon(identity.icon)}<span>${safeLabel}</span></span>`;
}
