const hexId = (q, r) => `hex-${q}-${r}`;
const hexes = (ranges) => ranges.flatMap(([r, start, end]) =>
  Array.from({ length: end - start + 1 }, (_, offset) => hexId(start + offset, r)));

const accessionSites = hexes([
  [5, 5, 5], [5, 11, 11], [7, 9, 9], [8, 4, 4], [8, 6, 6], [8, 8, 10],
  [9, 4, 6], [9, 8, 9], [10, 7, 7], [10, 9, 9], [11, 9, 9], [15, 9, 9],
]);
const himachalSites = hexes([
  [0, 8, 13], [1, 8, 13], [2, 8, 13], [3, 8, 9], [5, 11, 12], [6, 11, 11],
]);
const unionSites = [hexId(10, 7)];
const haryanaSites = hexes([
  [7, 11, 13], [8, 11, 13], [9, 10, 13], [10, 8, 13], [11, 5, 13], [12, 5, 12],
  [13, 7, 12], [14, 8, 13], [15, 8, 11],
]);
const punjabSites = hexes([
  [1, 6, 7], [2, 4, 7], [3, 3, 7], [4, 3, 9], [5, 3, 10], [6, 3, 10],
  [7, 2, 9], [8, 2, 10], [9, 2, 9], [10, 4, 7],
]);
const allTerritories = [...punjabSites, ...haryanaSites, ...himachalSites, ...unionSites];
const accession = new Set(accessionSites);
const initialSites = allTerritories.filter((id) => !accession.has(id));
const haryana = new Set(haryanaSites);
const mountains = new Set(himachalSites);

// Sites model the eastern districts and their neighbors at campaign scale.
// The relief map draws the digitized census outlines independently of the grid.
export const punjabMap = {
  rows: [
    "     hhhrrrrrrr",
    "    pphhhhrrrrr",
    "   ppfphhhhrrrr",
    " ppppppphhhhrrr",
    "  fffppphhphrrr",
    "  ppfppphphhhhh",
    "  pffppppfphhpp",
    " pppppppppphppp",
    " pppptpppppppfp",
    " pppptpppppfpfp",
    " tttptpptppfpfp",
    "  tttptptppfpfp",
    "   ttppptppfpfp",
    "    ttpppppppfp",
    "     ttptpppffp",
    "      tttptppp",
  ],
  bounds: [
    [8, 13], [6, 13], [4, 13], [3, 9], [3, 9], [3, 12], [3, 11], [2, 13],
    [2, 13], [2, 13], [4, 13], [5, 13], [5, 12], [7, 12], [8, 13], [8, 11],
  ],
  towns: [
    { q: 9, r: 0, name: "Dalhousie" }, { q: 6, r: 1, name: "Pathankot" },
    { q: 8, r: 1, name: "Nurpur" }, { q: 10, r: 1, name: "Dharamsala" },
    { q: 5, r: 2, name: "Gurdaspur" }, { q: 10, r: 2, name: "Kangra" },
    { q: 13, r: 2, name: "Kulu" }, { q: 1, r: 3, name: "Lahore" },
    { q: 3, r: 3, name: "Amritsar", hub: true }, { q: 4, r: 3, name: "Batala" },
    { q: 6, r: 3, name: "Dasuya" }, { q: 8, r: 3, name: "Una" }, { q: 12, r: 3, name: "Mandi" },
    { q: 3, r: 4, name: "Tarn Taran" }, { q: 4, r: 4, name: "Beas" }, { q: 7, r: 4, name: "Hoshiarpur" },
    { q: 9, r: 4, name: "Nangal" }, { q: 10, r: 4, name: "Bhakra", era: 1963 },
    { q: 12, r: 4, name: "Bilaspur" }, { q: 5, r: 5, name: "Kapurthala" },
    { q: 6, r: 5, name: "Jullundur", hub: true }, { q: 8, r: 5, name: "Anandpur Sahib" },
    { q: 9, r: 5, name: "Kiratpur" }, { q: 11, r: 5, name: "Nalagarh" },
    { q: 12, r: 5, name: "Simla" }, { q: 3, r: 6, name: "Ferozepore" }, { q: 6, r: 6, name: "Phillaur" },
    { q: 7, r: 6, name: "Ludhiana", hub: true }, { q: 9, r: 6, name: "Ropar" }, { q: 11, r: 6, name: "Kasauli" },
    { q: 5, r: 7, name: "Moga" }, { q: 9, r: 7, name: "Sirhind" },
    { q: 10, r: 7, name: "Chandigarh", hub: true, era: 1953 }, { q: 11, r: 7, name: "Kalka" },
    { q: 2, r: 8, name: "Fazilka" }, { q: 3, r: 8, name: "Muktsar" }, { q: 4, r: 8, name: "Faridkot" },
    { q: 6, r: 8, name: "Barnala" }, { q: 8, r: 8, name: "Nabha" }, { q: 9, r: 8, name: "Patiala", hub: true },
    { q: 10, r: 8, name: "Rajpura" }, { q: 11, r: 8, name: "Ambala", hub: true }, { q: 13, r: 8, name: "Jagadhri" },
    { q: 2, r: 9, name: "Abohar" }, { q: 3, r: 9, name: "Malout" }, { q: 5, r: 9, name: "Bhatinda", hub: true },
    { q: 8, r: 9, name: "Sangrur" }, { q: 12, r: 9, name: "Kurukshetra" },
    { q: 7, r: 10, name: "Mansa" }, { q: 8, r: 10, name: "Tohana" }, { q: 9, r: 10, name: "Narwana" },
    { q: 10, r: 10, name: "Kaithal" }, { q: 12, r: 10, name: "Karnal", hub: true },
    { q: 5, r: 11, name: "Sirsa" }, { q: 6, r: 11, name: "Fatehabad" }, { q: 9, r: 11, name: "Jind" },
    { q: 12, r: 11, name: "Panipat" }, { q: 7, r: 12, name: "Hissar", hub: true }, { q: 12, r: 12, name: "Sonipat" },
    { q: 8, r: 13, name: "Bhiwani" }, { q: 10, r: 13, name: "Rohtak" }, { q: 13, r: 13, name: "Delhi" },
    { q: 10, r: 14, name: "Jhajjar" }, { q: 12, r: 14, name: "Gurgaon" },
    { q: 9, r: 15, name: "Narnaul" }, { q: 10, r: 15, name: "Rewari" },
  ],
  initialSites, accessionSites, punjabSites, haryanaSites, unionSites, himachalSites,
  district(q, r) {
    const id = hexId(q, r);
    if (mountains.has(id) || r <= 5 && q >= 10) return "foothills";
    if (haryana.has(id)) return q >= 11 ? "yamuna" : "hissar";
    if (accession.has(id)) return "patiala";
    return r < 5 ? "majha" : q < 7 ? "doaba" : "sutlej";
  },
  districtNames: {
    foothills: "Himalayan foothills", yamuna: "Ambala and the Yamuna plain", hissar: "Hissar and the western plains",
    patiala: "Patiala and the former princely districts", majha: "Amritsar and the Ravi plain", doaba: "Beas–Sutlej plain", sutlej: "Upper Sutlej and Ludhiana",
  },
  ownerOutside(q, r) {
    if (accession.has(hexId(q, r))) return "pepsu";
    if (q < 2 && r <= 8) return "westPunjab";
    if (q >= 10 && r <= 6) return "himachal";
    if (r === 13 && q === 13) return "delhi";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return r <= 7 && q <= 9 || r >= 8 && q >= 11 ? 2 : 1;
  },
  mineral() { return false; },
};
