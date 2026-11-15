import { campaignStorageKey, World } from "./scenario.js";

export const campaignLengths = (region) => [region === "punjab" ? 1970 : 1965, 1985];
export const politicsModes = ["light", "standard"];
export const foundingSaveKey = (region) => `${campaignStorageKey(region)}-founding`;
export const campaignEnd = (game) => game.journey?.end ?? World.end;
export const settlement = (game) => game.journey?.jurisdiction?.settlement;
export const reorganization = (game) => game.journey?.jurisdiction?.reorganization;
export const bombaySuccessor = (game) => game.journey?.jurisdiction?.bombaySuccessor;
export const punjabSuccessor = (game) => game.journey?.jurisdiction?.punjabSuccessor;
export const madrasSuccessor = (game) => game.journey?.jurisdiction?.madrasSuccessor;
export const successorKey = (game) => bombaySuccessor(game) ?? punjabSuccessor(game) ?? madrasSuccessor(game);
export const successorRegion = (game) => World.successors?.[successorKey(game)];
export const campaignCapital = (game) => madrasSuccessor(game) === "andhra" && game.journey.jurisdiction.madrasReorganized
  ? World.madrasTransition.hyderabad
  : game.journey?.jurisdiction?.centralReorganized ? World.centralTransition.bhopal
  : game.journey?.jurisdiction?.assamDispur ? World.assamTransition.dispur
    : successorRegion(game)?.capital ?? (game.journey?.jurisdiction?.punjabCapital ? World.punjabCapital : World.capital);

export function southernName(game) {
  if (madrasSuccessor(game) === "andhra") return game.journey.jurisdiction.madrasReorganized ? "Andhra Pradesh" : "Andhra State";
  if (madrasSuccessor(game) === "madras" && game.year >= 1969) return "Tamil Nadu";
  return game.journey?.events.independence ? "Madras" : "Madras Province";
}

export function campaignName(game) {
  if (World.key === "madras") return southernName(game);
  if (World.key === "central" && game.journey?.events.constitution) return "Madhya Pradesh";
  if (World.key === "west-bengal" && game.journey && !game.journey.events.partition) return "Western Bengal districts";
  if (World.key === "mayurbhanj" && settlement(game) === "merger") return "Orissa";
  if (World.key === "bihar" && reorganization(game) === "split") return "Northern Bihar";
  if (World.key === "punjab" && !game.journey?.events.partition) return "Eastern Punjab districts";
  if (World.key === "punjab" && !game.journey?.jurisdiction?.punjabEnlarged) return game.year < 1950 ? "East Punjab" : "Punjab";
  return successorRegion(game)?.name ?? World.name;
}

export function journeySettings(end, preset, region = World.key) {
  const lengths = campaignLengths(region);
  return {
    end: lengths.includes(Number(end)) ? Number(end) : lengths[0],
    preset: politicsModes.includes(preset) ? preset : politicsModes[0],
  };
}

export function polityPhase(game) {
  if (game.year <= 1947 && !game.journey?.events?.independence) return World.key === "mayurbhanj" ? "Princely state" : "British Indian province";
  if (game.year < 1950 || (game.year === 1950 && !game.journey?.events?.constitution)) return "Dominion period";
  if (game.year < 1957) return "Republic of India";
  return "Regional development";
}

export function targets(game) {
  const goals = World.key === "mayurbhanj" && settlement(game) === "merger"
    ? { secureYears: 4, skills: 17, towns: 5, output: 68, cash: 100 }
    : reorganization(game) === "split"
      ? { secureYears: 4, skills: 14, towns: 4, output: 25, cash: 35 }
      : successorRegion(game)?.goals ?? World.goals;
  if (game.journey?.end !== 1985) return goals;
  return { ...goals, skills: goals.skills + 5, output: goals.output + 8, cash: goals.cash + 40 };
}
