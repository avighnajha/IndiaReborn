const hexId = (q, r) => `hex-${q}-${r}`;
const hexes = (ranges) => ranges.flatMap(([r, start, end]) =>
  Array.from({ length: end - start + 1 }, (_, offset) => hexId(start + offset, r)));

const mahakoshalSites = hexes([
  [5, 9, 10], [6, 8, 12], [7, 9, 12], [8, 6, 14], [9, 5, 11], [10, 5, 8], [10, 12, 12],
]);
const plainSites = hexes([
  [7, 15, 15], [8, 15, 16], [9, 14, 16], [10, 13, 16], [11, 13, 16], [12, 13, 13], [12, 15, 15],
]);
const vidarbhaSites = hexes([
  [10, 4, 4], [10, 9, 11], [11, 3, 11], [12, 4, 11], [13, 7, 10],
]);
const chhattisgarhSites = hexes([
  [6, 17, 18], [7, 16, 19], [8, 17, 19], [9, 13, 13], [9, 17, 18], [10, 17, 18], [11, 12, 12],
  [11, 17, 17], [12, 14, 14], [13, 13, 16], [14, 12, 15], [15, 12, 15], [16, 13, 15],
]);
const makraiSites = [hexId(5, 8)];
const madhyaBharatSites = hexes([
  [1, 7, 9], [2, 7, 9], [3, 6, 9], [4, 3, 7], [5, 2, 6],
  [6, 2, 6], [7, 2, 5], [8, 2, 4], [9, 2, 4],
]);
const vindhyaPradeshSites = hexes([
  [3, 10, 11], [4, 8, 15], [5, 11, 15], [6, 13, 15], [7, 13, 14],
]);
const bhopalSites = hexes([[6, 7, 7], [7, 6, 8]]);
const sironjSites = [hexId(7, 5)];
const initialSites = [...mahakoshalSites, ...plainSites, ...vidarbhaSites];
const accessionSites = [...chhattisgarhSites, ...makraiSites];
const expansionSites = [...madhyaBharatSites, ...vindhyaPradeshSites, ...bhopalSites, ...sironjSites];
const vidarbha = new Set(vidarbhaSites);
const plain = new Set(plainSites);
const chhattisgarh = new Set(chhattisgarhSites);
const madhyaBharat = new Set(madhyaBharatSites);
const vindhyaPradesh = new Set(vindhyaPradeshSites);
const bhopal = new Set(bhopalSites);
const mineral = new Set([hexId(9, 9), hexId(10, 12), hexId(12, 10), hexId(13, 11), hexId(14, 8), hexId(16, 8),
  hexId(16, 7), hexId(17, 9), hexId(13, 14)]);

// The authored grid describes programme sites. The map art uses separately projected census boundaries.
export const centralMap = {
  rows: [
    "     hhhhhhh",
    "     hppppphhh",
    "    hhpppphhhhhhh",
    "   hhhpppppptthhhh",
    "  hhpthpttpppptthhhh",
    "  ttpttpthptppppthhhh",
    " ttppphtphptpphthhhht",
    "  tpptppptppttthphhtt",
    "  tthpffppfpthpphhttt",
    "  hppphhptthhfpptphtt",
    "   pppphhpphpfppfpht",
    "   tptttpttthppfphh",
    "    htppppttpfpfhht",
    "      tthtthhtttth",
    "         hthttptt",
    "           hhthth",
    "             hhh",
  ],
  bounds: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  towns: [
    { q: 7, r: 0, name: "Dholpur" }, { q: 10, r: 0, name: "Agra" },
    { q: 8, r: 1, name: "Morena" }, { q: 11, r: 1, name: "Etawah" },
    { q: 5, r: 2, name: "Kotah" }, { q: 8, r: 2, name: "Gwalior", hub: true }, { q: 9, r: 2, name: "Bhind" },
    { q: 10, r: 3, name: "Datia" }, { q: 12, r: 3, name: "Jhansi" }, { q: 15, r: 3, name: "Banda" },
    { q: 3, r: 4, name: "Gandhi Sagar", era: 1960 }, { q: 4, r: 4, name: "Mandsaur" },
    { q: 7, r: 4, name: "Goona" }, { q: 8, r: 4, name: "Tikamgarh" }, { q: 10, r: 4, name: "Chhatarpur" },
    { q: 16, r: 4, name: "Mirzapur" }, { q: 3, r: 5, name: "Ratlam" }, { q: 6, r: 5, name: "Rajgarh" },
    { q: 7, r: 5, name: "Sironj" }, { q: 12, r: 5, name: "Panna" }, { q: 13, r: 5, name: "Satna", hub: true },
    { q: 14, r: 5, name: "Rewa", hub: true }, { q: 15, r: 5, name: "Sidhi" },
    { q: 4, r: 6, name: "Ujjain" }, { q: 7, r: 6, name: "Berasia" }, { q: 9, r: 6, name: "Saugor", hub: true },
    { q: 10, r: 6, name: "Damoh" }, { q: 12, r: 6, name: "Katni" },
    { q: 2, r: 7, name: "Jhabua" }, { q: 3, r: 7, name: "Dhar" }, { q: 4, r: 7, name: "Indore", hub: true },
    { q: 5, r: 7, name: "Dewas" }, { q: 6, r: 7, name: "Sehore" }, { q: 7, r: 7, name: "Bhopal", hub: true },
    { q: 8, r: 7, name: "Raisen" }, { q: 11, r: 7, name: "Jubbulpore", hub: true }, { q: 14, r: 7, name: "Shahdol" },
    { q: 15, r: 7, name: "Pendra" }, { q: 16, r: 7, name: "Manendragarh" }, { q: 17, r: 7, name: "Ambikapur" },
    { q: 3, r: 8, name: "Barwani" }, { q: 5, r: 8, name: "Makrai" }, { q: 6, r: 8, name: "Harda" },
    { q: 7, r: 8, name: "Hoshangabad" }, { q: 8, r: 8, name: "Itarsi", hub: true }, { q: 9, r: 8, name: "Narsinghpur" },
    { q: 12, r: 8, name: "Mandla" }, { q: 15, r: 8, name: "Ratanpur" }, { q: 19, r: 8, name: "Jashpur" },
    { q: 3, r: 9, name: "Sendhwa" }, { q: 5, r: 9, name: "Khandwa", hub: true }, { q: 7, r: 9, name: "Betul" },
    { q: 9, r: 9, name: "Chhindwara" }, { q: 11, r: 9, name: "Seoni" }, { q: 13, r: 9, name: "Kawardha" },
    { q: 14, r: 9, name: "Tilda" }, { q: 15, r: 9, name: "Bilaspur", hub: true }, { q: 16, r: 9, name: "Janjgir" },
    { q: 17, r: 9, name: "Raigarh" }, { q: 19, r: 9, name: "Jharsuguda" },
    { q: 3, r: 10, name: "Jalgaon" }, { q: 6, r: 10, name: "Burhanpur" }, { q: 8, r: 10, name: "Multai" },
    { q: 9, r: 10, name: "Nagpur", hub: true }, { q: 10, r: 10, name: "Bhandara" }, { q: 11, r: 10, name: "Gondia" },
    { q: 12, r: 10, name: "Balaghat" }, { q: 13, r: 10, name: "Durg" }, { q: 14, r: 10, name: "Raipur", hub: true },
    { q: 15, r: 10, name: "Bhatapara" }, { q: 17, r: 10, name: "Sakti" }, { q: 18, r: 10, name: "Sarangarh" },
    { q: 4, r: 11, name: "Buldana" }, { q: 5, r: 11, name: "Akola" }, { q: 6, r: 11, name: "Amraoti", hub: true },
    { q: 8, r: 11, name: "Wardha" }, { q: 12, r: 11, name: "Raj Nandgaon" },
    { q: 13, r: 11, name: "Bhilai", era: 1955 }, { q: 14, r: 11, name: "Dhamtari" },
    { q: 15, r: 11, name: "Rajim" }, { q: 16, r: 11, name: "Mahasamund" },
    { q: 7, r: 12, name: "Yeotmal" }, { q: 9, r: 12, name: "Hinganghat" }, { q: 10, r: 12, name: "Chanda", hub: true },
    { q: 14, r: 12, name: "Kanker" }, { q: 16, r: 12, name: "Khariar" },
    { q: 6, r: 13, name: "Nanded" }, { q: 14, r: 13, name: "Kondagaon" },
    { q: 13, r: 14, name: "Dantewada" }, { q: 14, r: 14, name: "Jagdalpur", hub: true }, { q: 16, r: 14, name: "Jeypore" },
    { q: 11, r: 15, name: "Bhadrachalam" }, { q: 14, r: 15, name: "Sukma" },
  ],
  initialSites, accessionSites, expansionSites, departureSites: vidarbhaSites,
  vidarbhaSites, chhattisgarhSites, makraiSites, madhyaBharatSites, vindhyaPradeshSites, bhopalSites, sironjSites,
  district(q, r) {
    const id = hexId(q, r);
    if (vidarbha.has(id)) return q < 8 ? "berar" : "vidarbha";
    if (plain.has(id)) return "chhattisgarhPlain";
    if (chhattisgarh.has(id)) return r >= 12 ? "bastar" : r < 9 ? "easternHills" : "easternStates";
    if (madhyaBharat.has(id)) return r < 4 ? "chambal" : "malwa";
    if (vindhyaPradesh.has(id)) return "vindhyaPradesh";
    if (bhopal.has(id) || sironjSites.includes(id)) return "bhopal";
    if (r <= 6) return "saugor";
    if (q <= 10) return r < 9 ? "narmada" : "satpura";
    return "mahakoshal";
  },
  districtNames: {
    berar: "Berar cotton belt", vidarbha: "Nagpur and the Wardha basin", chhattisgarhPlain: "Chhattisgarh plain",
    bastar: "Bastar plateau", easternHills: "Surguja and the eastern hills", easternStates: "Eastern States and Raigarh",
    chambal: "Chambal valley", malwa: "Malwa plateau", vindhyaPradesh: "Vindhya and Baghelkhand",
    bhopal: "Bhopal and Sironj", saugor: "Saugor uplands", narmada: "Narmada valley", satpura: "Satpura and Nimar", mahakoshal: "Mahakoshal",
  },
  ownerOutside(q, r) {
    const id = hexId(q, r);
    if (chhattisgarh.has(id)) return "chhattisgarhStates";
    if (makraiSites.includes(id)) return "makrai";
    if (madhyaBharat.has(id)) return "madhyaBharat";
    if (vindhyaPradesh.has(id)) return "vindhyaPradesh";
    if (bhopal.has(id)) return "bhopal";
    if (sironjSites.includes(id) || (q <= 5 && r <= 4) || id === hexId(7, 0)) return "rajasthan";
    if (r <= 5) return "up";
    if (q >= 18 || (q >= 16 && r >= 12)) return "orissa";
    if (q <= 4 && r >= 10 && r < 13) return "bombay";
    if ((r >= 13 && q <= 11) || id === hexId(12, 13)) return "hyderabad";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return (r === 8 && q >= 6 && q <= 10) || (q >= 13 && r >= 9 && r <= 12) ? 2 : 1;
  },
  mineral(q, r) {
    return mineral.has(hexId(q, r));
  },
};
