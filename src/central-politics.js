import { Fiscal } from "./fiscal.js";

const sources = {
  independence: "https://www.legislation.gov.uk/ukpga/Geo6/10-11/30/section/1/enacted",
  integration: "https://upload.wikimedia.org/wikipedia/commons/a/a8/White_Paper_on_Indian_States_%281948%29.pdf",
  reorganization: "https://www.indiacode.nic.in/bitstream/123456789/1680/1/a1956-37.pdf",
  bhilai: "https://www.sail.co.in/index.php/en/plants/about-bhilai-steel-plant",
  bombayDivision: "https://www.indiacode.nic.in/indiacode/handle/123456789/1535?view_type=browse",
};

// Census of India 1951, Table A-I. Eight districts transferred to Bombay.
const vidarbhaShare = (5_557_763 + 977_618 + 1_071_657) / 21_247_533;

function schoolAt(game, world, town) {
  const hex = Object.values(world.tiles).find((tile) => tile.town?.name === town)?.id;
  if (!hex || game.assets.some((asset) => asset.hex === hex && asset.kind === "school")) return null;
  return { id: `${hex}:school`, hex, kind: "school", started: game.year, remaining: 2 };
}

function integration(game, world) {
  const terms = { transfer: world.centralTransition.accession, population: 5, jurisdictionChanges: { centralIntegrated: true } };
  const work = schoolAt(game, world, "Jagdalpur");
  return {
    id: "central-eastern-states", title: "Integrate the eastern princely states",
    description: "Fourteen Eastern States and Makrai join Central Provinces and Berar in 1948. The province takes responsibility for their schools, food supplies and local works.",
    source: sources.integration,
    options: {
      ...(work ? { centralDistrictSchool: { ...terms, label: "Fund a district technical school", price: 10, work,
        effect: ["Jagdalpur gains a technical school in two years.", "The new districts join the provincial works office."] } } : {}),
      centralDistrictServices: { ...terms, label: "Continue district services",
        effect: ["The new districts join the provincial works office.", "Keep the development funds available."] },
    },
  };
}

function reorganization(game, world) {
  const { departure, expansion } = world.centralTransition;
  const transferredCash = Math.floor(game.cash * vidarbhaShare);
  const transferredReserve = Math.floor(game.reserve * vidarbhaShare);
  const transferredWorks = game.assets.filter(({ hex }) => departure.includes(hex)).length;
  const terms = {
    transfer: expansion, ownerChanges: Object.fromEntries(departure.map((hex) => [hex, "bombay"])),
    cash: -transferredCash, reserve: -transferredReserve, population: 9,
    partnerTransfers: { bombay: { cash: transferredCash, reserve: transferredReserve } },
    jurisdictionChanges: { centralReorganized: true },
  };
  const effect = [
    "The state gains western and northern districts. The capital moves to Bhopal.",
    `Bombay gains Vidarbha, ${transferredWorks} works, ${Fiscal.lakh(transferredCash)} and ${transferredReserve} food units.`,
  ];
  const corridorCost = 9;
  const canSign = !game.journey.agreements?.bombay && game.cash - transferredCash >= corridorCost;
  return {
    id: "central-reorganization", title: "Form the new Madhya Pradesh",
    description: "On 1 November 1956, Vidarbha joins Bombay. Madhya Bharat, Vindhya Pradesh, Bhopal and Sironj join the new Madhya Pradesh. Projects and ongoing contracts stay where they were built.",
    source: sources.reorganization,
    options: {
      ...(canSign ? { centralNagpurCorridor: { ...terms, label: "Sign the Nagpur freight agreement", price: corridorCost,
        agreement: { partner: "bombay", kind: "corridor", title: "Nagpur freight agreement", cost: corridorCost },
        effect: [...effect, "Earn freight receipts when Bombay can keep the route open."] } } : {}),
      centralTransfer: { ...terms, label: game.journey.agreements?.bombay ? "Keep the existing agreement" : "Continue without a new agreement", effect },
    },
  };
}

function bhilai(game, world) {
  const work = schoolAt(game, world, "Bhilai");
  return {
    id: "central-bhilai", title: "Build around the Bhilai steel plant",
    description: "The Union steel plant commissions its first blast furnace in 1959. The state can train its workforce or help existing workshops supply the new plant.",
    source: sources.bhilai,
    options: {
      ...(work ? { centralBhilaiSchool: { label: "Open a technical school", price: 14, work,
        effect: ["The school opens in two years and trains workers for the regional economy."] } } : {}),
      centralBhilaiSuppliers: { label: "Back local suppliers", price: 11,
        effect: ["Connected workshops around Durg and Raipur gain 2 output each year."] },
      centralBhilaiLocal: { label: "Keep funds for other programmes",
        effect: ["The Union plant opens. Your development budget stays available."] },
    },
  };
}

function bombayDivision(game, world) {
  const previous = game.journey.agreements?.bombay;
  const ownerChanges = Object.fromEntries(world.centralTransition.departure.map((hex) => [hex, "maharashtra"]));
  return {
    id: "central-bombay-division", title: "Vidarbha joins Maharashtra",
    description: "Bombay State divides in 1960. Maharashtra takes responsibility for Vidarbha and its works, including the Nagpur freight route.",
    source: sources.bombayDivision,
    options: {
      centralMaharashtra: { label: previous ? "Continue the agreement with Maharashtra" : "Continue district trade", ownerChanges,
        partnerSuccession: { from: "bombay", to: "maharashtra" },
        effect: ["Maharashtra inherits the works in Vidarbha.", previous ? "The existing agreement continues without a new fee." : "The Nagpur route remains available for negotiation."] },
    },
  };
}

export function centralDecision(game, world) {
  const { events } = game.journey;
  if (game.year === 1947 && events.independence && !events.partition) return {
    id: "partition", title: "Prepare inland relief at independence",
    description: "Partition displaces families across the new borders. The inland province can receive households or support distribution through its markets.",
    source: sources.independence,
    options: {
      centralReceiveFamilies: { label: "Receive displaced families", population: 2, reserve: 3,
        effect: ["Population grows by 2 units and raises future demand.", "Add 3 food units to reserves."] },
      centralReliefMarkets: { label: "Support district food markets", price: 5, reserve: 2, marketStock: 3,
        effect: ["Add 2 food units to reserves and 3 to local markets."] },
    },
  };
  if (game.year === 1948 && !events["central-eastern-states"]) return integration(game, world);
  if (game.year === 1956 && !events["central-reorganization"]) return reorganization(game, world);
  if (game.year === 1959 && !events["central-bhilai"]) return bhilai(game, world);
  if (game.year === 1960 && !events["central-bombay-division"]) return bombayDivision(game, world);
  return null;
}
