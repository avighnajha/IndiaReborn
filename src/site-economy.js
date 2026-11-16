import { World } from "./scenario.js";

export const economyRoles = {
  industry: { label: "Industry", color: "#e6a074", kinds: ["mill", "industrialPark"] },
  education: { label: "Education", color: "#8acbd5", kinds: ["school", "college", "university", "technicalInstitute", "agriculturalInstitute"] },
  food: { label: "Food & Water", color: "#b9cc79", kinds: ["irrigation", "juteFarm", "granary", "foodDepot", "waterNetwork", "levee", "power"] },
  trade: { label: "Freight", color: "#f0bf78", kinds: ["freightTerminal"] },
};

const roleForKind = new Map(Object.entries(economyRoles).flatMap(([role, { kinds }]) => kinds.map((kind) => [kind, role])));

export function economySites(game) {
  const sites = new Map();
  for (const { hex, kind, remaining } of game.assets) {
    const role = roleForKind.get(kind);
    if (!role || remaining || game.owners[hex] !== World.key) continue;
    const tile = World.tiles[hex];
    if ((tile.town?.era ?? World.start) > game.year) continue;
    if (!sites.has(hex)) sites.set(hex, new Set());
    sites.get(hex).add(role);
  }
  return [...sites].map(([hex, roles]) => ({ hex, roles: Object.keys(economyRoles).filter((role) => roles.has(role)) }));
}

const workshopSources = {
  base: "base production",
  market: "market access", skills: "Skills", research: "education and research", apprenticeship: "apprenticeships",
  minerals: "mineral deposits", power: "power", park: "industrial park", supplier: "Bhilai contracts", rail: "rail feeders",
  materialLoss: "raw material disruption",
};

export function siteResults(report, hex) {
  const workshops = report?.siteEconomy?.workshops.filter((site) => site.hex === hex) ?? [];
  const irrigation = report?.siteEconomy?.irrigation.filter((site) => site.hex === hex) ?? [];
  return {
    output: workshops.length ? workshops.reduce((total, site) => total + site.output, 0) : null,
    food: irrigation.length ? irrigation.reduce((total, site) => total + site.food, 0) : null,
    workshopEffects: Object.entries(workshopSources).flatMap(([key, label]) => {
      const units = workshops.reduce((total, site) => total + site[key], 0);
      return units ? [{ label, units: key === "materialLoss" ? -units : units }] : [];
    }),
  };
}
