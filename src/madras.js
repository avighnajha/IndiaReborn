const hexId = (q, r) => `hex-${q}-${r}`;
const hexes = (ranges) => ranges.flatMap(([r, start, end]) =>
  Array.from({ length: end - start + 1 }, (_, offset) => hexId(start + offset, r)));

const andhraSites = hexes([
  [1, 15, 16], [2, 13, 16], [3, 11, 15], [4, 10, 13], [5, 6, 13], [6, 6, 11], [7, 7, 10], [8, 8, 10],
]);
const retainedSites = hexes([
  [9, 7, 10], [10, 5, 10], [11, 4, 10], [12, 5, 10], [13, 5, 10], [14, 6, 7], [14, 9, 9], [15, 6, 8],
]);
const telanganaSites = hexes([
  [0, 6, 9], [1, 6, 11], [2, 6, 11], [3, 6, 10], [4, 6, 9],
]);
const keralaSites = hexes([[9, 1, 1], [10, 2, 3], [11, 2, 3], [12, 3, 4], [13, 3, 4]]);
const mysoreSites = hexes([[6, 1, 2], [7, 1, 2], [8, 1, 2]]);
const bellarySites = hexes([[5, 4, 5], [6, 4, 5], [7, 5, 5]]);
const kanyakumariSites = hexes([[15, 5, 5], [16, 6, 7]]);
const pudukkottaiSites = [hexId(8, 14)];
const initialSites = [...andhraSites, ...retainedSites, ...keralaSites, ...mysoreSites, ...bellarySites];
const madrasSites = [...retainedSites, ...pudukkottaiSites, ...keralaSites, ...mysoreSites];
const tamilSites = [...retainedSites, ...pudukkottaiSites, ...kanyakumariSites];
const andhra = new Set(andhraSites);
const telangana = new Set(telanganaSites);
const malabar = new Set(keralaSites);
const canara = new Set(mysoreSites);
const bellary = new Set(bellarySites);
const travancore = new Set(kanyakumariSites);
const french = new Set([hexId(1, 11), hexId(11, 11), hexId(11, 13), hexId(14, 4)]);

// The hexes represent programme sites and links. The atlas uses projected census district boundaries.
export const madrasMap = {
  rows: [
    "    tttttthhh",
    "    ttttttthhttpp",
    "    ttttttthhpppp",
    "    tttttttppppp",
    "   ttttttptffpp",
    "   tttptpppfff",
    " hhtttttppfp",
    " hhhtttttpp",
    " phhhttttpp",
    " phhhtthppp",
    " phhhtthppp",
    " pphhhpppptp",
    "  ppppppfff",
    "  ppphppfffp",
    "   pphpppp",
    "    phppp",
    "     ppp",
  ],
  bounds: [
    null, null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
  ],
  towns: [
    { q: 7, r: 0, name: "Adilabad" }, { q: 7, r: 1, name: "Nizamabad" },
    { q: 9, r: 1, name: "Karimnagar" }, { q: 16, r: 1, name: "Palasa" },
    { q: 7, r: 2, name: "Medak" }, { q: 8, r: 2, name: "Secunderabad" },
    { q: 9, r: 2, name: "Warangal", hub: true }, { q: 11, r: 2, name: "Yellandu" },
    { q: 15, r: 2, name: "Vizianagaram" }, { q: 16, r: 2, name: "Srikakulam" },
    { q: 8, r: 3, name: "Hyderabad", hub: true }, { q: 9, r: 3, name: "Nalgonda" },
    { q: 10, r: 3, name: "Khammam" }, { q: 12, r: 3, name: "Eluru" },
    { q: 15, r: 3, name: "Visakhapatnam", hub: true },
    { q: 7, r: 4, name: "Mahbubnagar" }, { q: 11, r: 4, name: "Vijayawada", hub: true },
    { q: 12, r: 4, name: "Rajahmundry", hub: true }, { q: 13, r: 4, name: "Kakinada" },
    { q: 14, r: 4, name: "Yanam" }, { q: 6, r: 5, name: "Adoni" },
    { q: 7, r: 5, name: "Kurnool", hub: true }, { q: 8, r: 5, name: "Nandyal" },
    { q: 10, r: 5, name: "Guntur", hub: true }, { q: 1, r: 6, name: "Kundapur" },
    { q: 4, r: 6, name: "Hospet" }, { q: 5, r: 6, name: "Bellary" },
    { q: 10, r: 6, name: "Ongole" }, { q: 1, r: 7, name: "Udupi" },
    { q: 7, r: 7, name: "Anantapur", hub: true }, { q: 8, r: 7, name: "Cuddapah" },
    { q: 10, r: 7, name: "Nellore" }, { q: 1, r: 8, name: "Mangalore", hub: true },
    { q: 8, r: 8, name: "Chittoor" }, { q: 9, r: 8, name: "Tirupati" },
    { q: 1, r: 9, name: "Kasaragod" }, { q: 2, r: 9, name: "Mercara" },
    { q: 3, r: 9, name: "Mysore" }, { q: 5, r: 9, name: "Bangalore", hub: true },
    { q: 10, r: 9, name: "Madras", hub: true }, { q: 2, r: 10, name: "Cannanore" },
    { q: 8, r: 10, name: "Vellore" }, { q: 9, r: 10, name: "Kanchipuram" },
    { q: 10, r: 10, name: "Chingleput" }, { q: 1, r: 11, name: "Mahe" },
    { q: 2, r: 11, name: "Tellicherry" }, { q: 4, r: 11, name: "Ootacamund" },
    { q: 6, r: 11, name: "Mettur" }, { q: 7, r: 11, name: "Salem", hub: true },
    { q: 9, r: 11, name: "Neyveli" }, { q: 10, r: 11, name: "Cuddalore" },
    { q: 11, r: 11, name: "Pondicherry" }, { q: 3, r: 12, name: "Calicut", hub: true },
    { q: 4, r: 12, name: "Malappuram" }, { q: 5, r: 12, name: "Coimbatore", hub: true },
    { q: 6, r: 12, name: "Erode" }, { q: 7, r: 12, name: "Karur" },
    { q: 8, r: 12, name: "Trichinopoly", hub: true }, { q: 9, r: 12, name: "Tanjore", hub: true },
    { q: 10, r: 12, name: "Nagapattinam" }, { q: 3, r: 13, name: "Ponnani" },
    { q: 4, r: 13, name: "Palghat" }, { q: 5, r: 13, name: "Pollachi" },
    { q: 6, r: 13, name: "Palani" }, { q: 7, r: 13, name: "Dindigul" },
    { q: 11, r: 13, name: "Karaikal" }, { q: 3, r: 14, name: "Trichur" },
    { q: 4, r: 14, name: "Cochin" }, { q: 6, r: 14, name: "Theni" },
    { q: 7, r: 14, name: "Madura", hub: true }, { q: 8, r: 14, name: "Pudukkottai" },
    { q: 9, r: 14, name: "Ramnad" }, { q: 4, r: 15, name: "Quilon" },
    { q: 5, r: 15, name: "Shencottah" }, { q: 6, r: 15, name: "Tinnevelly" },
    { q: 7, r: 15, name: "Kovilpatti" }, { q: 8, r: 15, name: "Tuticorin", hub: true },
    { q: 5, r: 16, name: "Trivandrum" }, { q: 6, r: 16, name: "Nagercoil", hub: true },
    { q: 7, r: 16, name: "Kanyakumari" },
  ],
  initialSites, andhraSites, madrasSites, tamilSites, telanganaSites, keralaSites, mysoreSites,
  bellarySites, kanyakumariSites, pudukkottaiSites,
  district(q, r) {
    const id = hexId(q, r);
    if (telangana.has(id)) return "telangana";
    if (andhra.has(id)) return q >= 10 ? "andhraCoast" : "rayalaseema";
    if (bellary.has(id)) return "bellary";
    if (canara.has(id)) return "canara";
    if (malabar.has(id)) return "malabar";
    if (travancore.has(id)) return "southTravancore";
    if (r <= 10 || r === 11 && q >= 9) return "coromandel";
    if (q >= 8 && r <= 13) return "cauveryDelta";
    if (q <= 6 && r <= 13) return "westernGhats";
    return "southernPlain";
  },
  districtNames: {
    telangana: "Telangana", andhraCoast: "Coastal Andhra", rayalaseema: "Rayalaseema",
    bellary: "Bellary district", canara: "South Kanara", malabar: "Malabar and Kasaragod", southTravancore: "Southern Travancore",
    coromandel: "Coromandel Coast and Arcot", cauveryDelta: "Cauvery delta", westernGhats: "Nilgiris and Coimbatore", southernPlain: "Southern Tamil districts",
  },
  ownerOutside(q, r) {
    const id = hexId(q, r);
    if (telangana.has(id)) return "hyderabad";
    if (travancore.has(id) || q <= 5 && r >= 14) return "travancore";
    if (pudukkottaiSites.includes(id)) return "pudukkottai";
    if (french.has(id)) return "pondicherry";
    if (q <= 6 && r >= 5 && r <= 10) return "mysore";
    if (q >= 13 && r <= 2) return "orissa";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return q >= 10 && r >= 3 && r <= 5 || q >= 8 && r >= 12 && r <= 13 ? 2 : 1;
  },
  mineral(q, r) {
    return q === 9 && r === 11 || q === 8 && r === 7;
  },
};
