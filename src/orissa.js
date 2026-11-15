// Stable site IDs and scenario rules for Orissa. Visual geography is separate.
export const orissaMap = {
  rows: [
    "    hhhhtttth",
    "  tthtthtttphh",
    " ttthtttrrthhppp",
    " hhttthttttppfpp",
    "thtpptttthppfff",
    "hppptphtthpffff",
    "httptphthhffff",
    "hthttphprhppp",
    " hthttrhhppp",
    " htrtrrrhpf",
    " htrrrhhpp",
    " htrrthhp",
    " htthrrh",
    "  hhhhh",
  ],
  bounds: [null, [3, 13], [2, 14], [2, 14], [1, 14], [1, 14], [1, 13], [1, 12], [2, 11], [2, 10], [2, 9], [2, 8], [2, 6], [2, 5]],
  towns: [
    { q: 4, r: 1, name: "Rourkela" },
    { q: 2, r: 2, name: "Sundargarh" },
    { q: 12, r: 1, name: "Baripada" },
    { q: 14, r: 2, name: "Balasore" },
    { q: 9, r: 3, name: "Keonjhar" },
    { q: 12, r: 4, name: "Bhadrak" },
    { q: 3, r: 5, name: "Sambalpur", hub: true },
    { q: 2, r: 6, name: "Bargarh" },
    { q: 8, r: 5, name: "Talcher" },
    { q: 9, r: 5, name: "Dhenkanal" },
    { q: 11, r: 6, name: "Cuttack", hub: true },
    { q: 10, r: 7, name: "Bhubaneswar" },
    { q: 5, r: 7, name: "Sonepur" },
    { q: 7, r: 7, name: "Boudh" },
    { q: 11, r: 8, name: "Puri" },
    { q: 4, r: 9, name: "Bhawanipatna" },
    { q: 8, r: 10, name: "Berhampur" },
    { q: 3, r: 11, name: "Koraput" },
  ],
  district(q, r) {
    if (r <= 3 && q < 14) return "northern";
    if (q >= 10 && r >= 5 && r <= 7) return "delta";
    if (q >= 12 || (r >= 8 && q >= 8)) return "coast";
    if (r >= 8) return "ghats";
    return "tableland";
  },
  districtNames: {
    northern: "Northern plateau",
    delta: "Mahanadi delta",
    coast: "Coastal plains",
    ghats: "Eastern Ghats",
    tableland: "Central tableland",
  },
  ownerOutside() { return "neighbor"; },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return (q >= 10 && r >= 4) || (r === 5 && q <= 3) || (r === 7 && q <= 7) ? 2 : 1;
  },
  mineral(q, r, kind) {
    if (kind === "p" || kind === "f") return false;
    const northernOre = r <= 4 && ((q >= 2 && q <= 4) || (q >= 7 && q <= 11));
    const talcherCoal = r >= 4 && r <= 6 && q >= 7 && q <= 9;
    const southernBauxite = r >= 9 && q >= 2 && q <= 6 && (kind === "r" || kind === "t");
    return northernOre || talcherCoal || southernBauxite;
  },
};
