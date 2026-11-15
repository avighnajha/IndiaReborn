const hexId = (q, r) => `hex-${q}-${r}`;
const hexes = (ranges) => ranges.flatMap(([r, start, end]) =>
  Array.from({ length: end - start + 1 }, (_, offset) => hexId(start + offset, r)));

const valleySites = hexes([[2, 15, 17], [3, 10, 17], [4, 5, 16], [5, 2, 15],
  [6, 2, 6], [6, 8, 13], [7, 9, 13], [8, 9, 12], [9, 8, 12], [10, 8, 10]]);
const sylhetSites = hexes([[9, 4, 7], [10, 4, 7]]);
const nagaSites = hexes([[7, 14, 16], [8, 14, 16]]);
const meghalayaSites = hexes([[7, 4, 8], [8, 3, 8]]);
const mizoSites = hexes([[11, 9, 11], [12, 9, 11], [13, 9, 10]]);
const initialSites = [...valleySites, ...sylhetSites, ...nagaSites, ...meghalayaSites, ...mizoSites];
const frontierSites = new Set([hexId(15, 1), hexId(17, 1), hexId(18, 1), hexId(19, 2), hexId(20, 2),
  hexId(8, 3), hexId(10, 2), hexId(18, 3)]);
const nagaContext = new Set([hexId(15, 6), hexId(16, 6)]);
const sylhet = new Set(sylhetSites);
const naga = new Set(nagaSites);
const meghalaya = new Set(meghalayaSites);
const mizo = new Set(mizoSites);

export const assamMap = {
  rows: [
    "         rrrrrrrrrrr",
    "       rrrrrrrrrrrrrrr",
    "     hhhhhrrrrpppffphr",
    "    hhhhhhhpppffpppphh",
    "   hpppppfpfpppppphhh",
    "  pppppffpppphhhhrhh",
    "  ppppphhhhphhhhhh",
    "   hhhhhhhphhphhhr",
    "   hhhhhhphhhhhhhr",
    "    ppppppppfhhhh",
    "    ffffppphhhhh",
    "   phhhhhhhhhh",
    "   phhhhhhhhh",
    "   phhhhhhhh",
  ],
  bounds: [null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  towns: [
    { q: 15, r: 1, name: "Pasighat" }, { q: 17, r: 1, name: "Roing" },
    { q: 18, r: 1, name: "Tezu" }, { q: 5, r: 2, name: "Samdrup Jongkhar" },
    { q: 10, r: 2, name: "Bomdila" }, { q: 16, r: 2, name: "Dhemaji" },
    { q: 19, r: 2, name: "Sadiya" }, { q: 20, r: 2, name: "Namsai" },
    { q: 6, r: 3, name: "Tamulpur" }, { q: 8, r: 3, name: "Bhalukpong" },
    { q: 10, r: 3, name: "Mangaldai" }, { q: 13, r: 3, name: "North Lakhimpur" },
    { q: 15, r: 3, name: "Dibrugarh", hub: true }, { q: 16, r: 3, name: "Tinsukia", hub: true },
    { q: 17, r: 3, name: "Digboi" }, { q: 18, r: 3, name: "Margherita" },
    { q: 5, r: 4, name: "Rangiya", hub: true }, { q: 9, r: 4, name: "Tezpur", hub: true },
    { q: 11, r: 4, name: "Bokakhat" }, { q: 13, r: 4, name: "Jorhat", hub: true },
    { q: 14, r: 4, name: "Sibsagar" }, { q: 16, r: 4, name: "Nazira" },
    { q: 2, r: 5, name: "Fakiragram" }, { q: 3, r: 5, name: "Kokrajhar" },
    { q: 4, r: 5, name: "Bongaigaon" }, { q: 5, r: 5, name: "Pandu" },
    { q: 6, r: 5, name: "Gauhati", hub: true }, { q: 8, r: 5, name: "Jagiroad" },
    { q: 9, r: 5, name: "Nowgong" }, { q: 12, r: 5, name: "Golaghat" },
    { q: 2, r: 6, name: "Dhubri", hub: true }, { q: 3, r: 6, name: "Goalpara" },
    { q: 4, r: 6, name: "Boko" }, { q: 6, r: 6, name: "Dispur", era: 1973 },
    { q: 9, r: 6, name: "Hojai" }, { q: 12, r: 6, name: "Diphu" },
    { q: 15, r: 6, name: "Mokokchung" }, { q: 16, r: 6, name: "Tuensang" },
    { q: 4, r: 7, name: "Tura" }, { q: 6, r: 7, name: "Nongstoin" },
    { q: 10, r: 7, name: "Lumding" }, { q: 14, r: 7, name: "Kohima", hub: true },
    { q: 6, r: 8, name: "Shillong", hub: true }, { q: 7, r: 8, name: "Cherrapunji" },
    { q: 8, r: 8, name: "Jowai" }, { q: 10, r: 8, name: "Haflong" },
    { q: 4, r: 9, name: "Sunamganj" }, { q: 5, r: 9, name: "Sylhet", hub: true },
    { q: 8, r: 9, name: "Karimganj" }, { q: 9, r: 9, name: "Badarpur" },
    { q: 10, r: 9, name: "Silchar", hub: true }, { q: 15, r: 9, name: "Imphal" },
    { q: 6, r: 10, name: "Habiganj" }, { q: 7, r: 10, name: "Maulvi Bazar" },
    { q: 8, r: 10, name: "Hailakandi" }, { q: 4, r: 11, name: "Agartala" },
    { q: 10, r: 11, name: "Aijal" }, { q: 10, r: 12, name: "Lungleh" },
  ],
  initialSites, sylhetSites, nagaSites, meghalayaSites, mizoSites,
  district(q, r) {
    const site = hexId(q, r);
    if (sylhet.has(site)) return "sylhet";
    if (naga.has(site) || nagaContext.has(site)) return "naga";
    if (meghalaya.has(site)) return "meghalaya";
    if (mizo.has(site)) return "mizo";
    if (r >= 9) return "barak";
    if (r >= 7) return "cacharHills";
    if (q <= 7) return "lowerValley";
    if (q <= 12) return "middleValley";
    return "upperValley";
  },
  districtNames: {
    sylhet: "Sylhet and the Surma valley", naga: "Naga Hills and Tuensang", meghalaya: "Khasi, Jaintia and Garo hills",
    mizo: "Mizo Hills", barak: "Barak valley", cacharHills: "North Cachar and the hill railway",
    lowerValley: "Lower Brahmaputra valley", middleValley: "Central Brahmaputra valley", upperValley: "Upper Brahmaputra valley",
  },
  ownerOutside(q, r) {
    const site = hexId(q, r);
    if (frontierSites.has(site) || r <= 2 && q > 7) return "nefa";
    if (nagaContext.has(site)) return "nagaland";
    if (r <= 3 && q <= 6) return "bhutan";
    if (q <= 5 && r >= 10) return "tripura";
    if (q >= 13 && r >= 8) return "manipur";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return r >= 3 && r <= 6 || r === 9 ? 2 : 1;
  },
  mineral(q, r) {
    return r === 3 && q >= 17 && q <= 18;
  },
};
