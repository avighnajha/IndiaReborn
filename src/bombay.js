const hexId = (q, r) => `hex-${q}-${r}`;
const hexes = (ranges) => ranges.flatMap(([r, start, end]) =>
  Array.from({ length: end - start + 1 }, (_, offset) => hexId(start + offset, r)));

const kutch = hexes([[0, 1, 5], [1, 1, 5], [2, 1, 5]]);
const saurashtra = hexes([[3, 2, 5], [4, 2, 5], [5, 2, 5], [6, 3, 5]]);
const vidarbha = hexes([[6, 12, 15], [7, 12, 15], [8, 12, 15], [9, 14, 15]]);
const marathwada = hexes([[9, 12, 13], [10, 12, 15], [11, 12, 15], [12, 12, 14]]);
const baroda = [hexId(8, 2), hexId(9, 4), hexId(10, 4)];
const kolhapur = [hexId(8, 13)];
const departureSites = [hexId(8, 14), hexId(9, 14), hexId(10, 14), hexId(11, 14), hexId(11, 13)];

// The hexes represent campaign districts and corridors. Census polygons
// provide the geographic outline independently of the site's game owner.
export const bombayMap = {
  rows: [
    " ttttthhhhrr",
    " ttttthppphh",
    " ttptthpppphhh",
    "  tttthpppphhhh",
    "  httthpppphtthh",
    "  httthfffphttth",
    "   tttfffphtttth",
    "     hhpfttfttth",
    "     hhhthftttth",
    "     hpphtptttth",
    "      hhptftttth",
    "      hhpftttttf",
    "       hpftptttt",
    "       hhftttt",
    "        hhttt",
  ],
  bounds: [
    null, [7, 9], [9, 10], [7, 10], [7, 8], [7, 10], [6, 10], [6, 11],
    [6, 11], [6, 11], [7, 11], [7, 11], [7, 11], [9, 11], [8, 11],
  ],
  towns: [
    { q: 2, r: 1, name: "Bhuj" },
    { q: 3, r: 2, name: "Kandla", hub: true },
    { q: 8, r: 2, name: "Mehsana" },
    { q: 3, r: 3, name: "Jamnagar" },
    { q: 8, r: 3, name: "Ahmedabad", hub: true },
    { q: 4, r: 4, name: "Rajkot", hub: true },
    { q: 8, r: 4, name: "Anand" },
    { q: 9, r: 4, name: "Baroda" },
    { q: 4, r: 5, name: "Junagadh" },
    { q: 5, r: 5, name: "Bhavnagar" },
    { q: 8, r: 5, name: "Bharuch" },
    { q: 7, r: 6, name: "Surat", hub: true },
    { q: 7, r: 7, name: "Valsad" },
    { q: 10, r: 7, name: "Dhule" },
    { q: 11, r: 7, name: "Jalgaon" },
    { q: 13, r: 7, name: "Akola" },
    { q: 14, r: 7, name: "Amravati" },
    { q: 15, r: 7, name: "Nagpur", hub: true },
    { q: 9, r: 8, name: "Nasik" },
    { q: 14, r: 8, name: "Wardha" },
    { q: 6, r: 9, name: "Bombay", hub: true },
    { q: 7, r: 9, name: "Thana" },
    { q: 10, r: 9, name: "Ahmednagar" },
    { q: 12, r: 9, name: "Aurangabad" },
    { q: 13, r: 9, name: "Jalna" },
    { q: 14, r: 9, name: "Yavatmal" },
    { q: 15, r: 9, name: "Chanda" },
    { q: 8, r: 10, name: "Poona" },
    { q: 13, r: 10, name: "Parbhani" },
    { q: 12, r: 11, name: "Osmanabad" },
    { q: 15, r: 11, name: "Nanded" },
    { q: 7, r: 12, name: "Ratnagiri" },
    { q: 8, r: 12, name: "Satara" },
    { q: 11, r: 12, name: "Sholapur", hub: true },
    { q: 13, r: 12, name: "Latur" },
    { q: 8, r: 13, name: "Kolhapur" },
    { q: 11, r: 13, name: "Bijapur" },
    { q: 9, r: 14, name: "Belgaum" },
    { q: 10, r: 14, name: "Dharwar" },
  ],
  earlyAccessionSites: [...baroda, ...kolhapur],
  accessionSites: [...kutch, ...saurashtra, ...vidarbha, ...marathwada],
  departureSites,
  district(q, r) {
    const id = hexId(q, r);
    if (kutch.includes(id)) return "kutch";
    if (saurashtra.includes(id)) return "saurashtra";
    if (vidarbha.includes(id)) return "vidarbha";
    if (marathwada.includes(id)) return "marathwada";
    if (departureSites.includes(id)) return "mysore";
    if (r <= 4) return "gujaratPlain";
    if (r <= 6 || (r === 7 && q <= 8)) return "narmadaTapti";
    if (r <= 8) return "khandesh";
    if (q <= 7) return "konkan";
    if (r >= 12 && q <= 9) return "sugarBelt";
    return "deccan";
  },
  districtNames: {
    kutch: "Kutch", saurashtra: "Saurashtra", vidarbha: "Vidarbha", marathwada: "Marathwada",
    mysore: "Southern districts", gujaratPlain: "Gujarat plain", narmadaTapti: "Narmada and Tapti valleys",
    khandesh: "Khandesh", konkan: "Konkan coast", sugarBelt: "Western sugar belt", deccan: "Western Deccan",
  },
  ownerOutside(q, r) {
    const id = hexId(q, r);
    if (kutch.includes(id)) return "kutch";
    if (saurashtra.includes(id)) return "saurashtra";
    if (vidarbha.includes(id)) return "madhyaPradesh";
    if (marathwada.includes(id)) return "hyderabad";
    if (baroda.includes(id)) return "baroda";
    if (kolhapur.includes(id)) return "kolhapur";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return ((r >= 5 && r <= 7 && q <= 9) || (r >= 9 && r <= 10 && q <= 7)) ? 2 : 1;
  },
  mineral(q, r, kind) {
    return q >= 14 && r >= 7 && r <= 9 && (kind === "t" || kind === "h");
  },
};

const provinceSites = bombayMap.bounds.flatMap((range, r) => range ? hexes([[r, ...range]]) : []);
const enlargedSites = [...provinceSites, ...bombayMap.earlyAccessionSites, ...bombayMap.accessionSites]
  .filter((id) => !departureSites.includes(id));
const gujarat = new Set(enlargedSites.filter((id) => {
  const [, q, r] = id.split("-").map(Number);
  return r <= 6 && !vidarbha.includes(id) || r === 7 && q <= 8;
}));
bombayMap.gujaratSites = [...gujarat];
bombayMap.maharashtraSites = enlargedSites.filter((id) => !gujarat.has(id));
