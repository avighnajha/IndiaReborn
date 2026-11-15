const hexId = (q, r) => `hex-${q}-${r}`;
const accessionSites = [[9, 2], [10, 2], [11, 2], [9, 3], [10, 3], [11, 3]].map(([q, r]) => hexId(q, r));
const puruliaSites = [[1, 7], [2, 7], [1, 8], [2, 8], [3, 8], [2, 9], [3, 9]].map(([q, r]) => hexId(q, r));
const islampurSites = [[4, 3], [4, 4]].map(([q, r]) => hexId(q, r));

// The starting administration covers the western districts. The two accession
// groups retain their hex IDs as ownership changes during the campaign.
export const bengalMap = {
  rows: [
    "   rhhhhhh",
    "   rhhhpppppp",
    "   hppppppppp",
    "   pppppppppp",
    "    pppppfff",
    "    ppppffff",
    "  hhhppppppfff",
    " htttppppppfff",
    " hhtppfffpppff",
    " httpppppfpfff",
    "  thhpppppffff",
    "   hpppppfffff",
    "     pppfffffff",
    "       ffffffff",
    "         fffff",
  ],
  bounds: [
    null, [4, 7], [3, 8], [5, 8], [5, 8], [4, 8], [4, 10], [3, 11],
    [4, 12], [4, 13], [4, 13], [5, 13], [6, 14], [8, 13], [10, 12],
  ],
  towns: [
    { q: 5, r: 1, name: "Darjeeling" },
    { q: 5, r: 2, name: "Siliguri", hub: true },
    { q: 7, r: 2, name: "Jalpaiguri" },
    { q: 10, r: 2, name: "Cooch Behar", hub: true },
    { q: 4, r: 3, name: "Islampur" },
    { q: 5, r: 4, name: "Raiganj" },
    { q: 5, r: 5, name: "Malda" },
    { q: 7, r: 5, name: "Balurghat" },
    { q: 5, r: 6, name: "Suri" },
    { q: 7, r: 6, name: "Berhampore" },
    { q: 3, r: 7, name: "Asansol", hub: true },
    { q: 4, r: 7, name: "Raniganj" },
    { q: 5, r: 7, name: "Durgapur" },
    { q: 7, r: 7, name: "Bardhaman" },
    { q: 9, r: 7, name: "Krishnanagar" },
    { q: 2, r: 8, name: "Purulia" },
    { q: 9, r: 8, name: "Hooghly" },
    { q: 4, r: 9, name: "Bankura" },
    { q: 6, r: 9, name: "Bishnupur" },
    { q: 9, r: 9, name: "Howrah" },
    { q: 10, r: 9, name: "Calcutta", hub: true },
    { q: 12, r: 9, name: "Basirhat" },
    { q: 10, r: 11, name: "Diamond Harbour" },
    { q: 6, r: 11, name: "Midnapore" },
    { q: 7, r: 11, name: "Kharagpur", hub: true },
    { q: 8, r: 12, name: "Tamluk" },
  ],
  accessionSites,
  transferSites: [...puruliaSites, ...islampurSites],
  district(q, r) {
    const id = hexId(q, r);
    if (accessionSites.includes(id)) return "coochBehar";
    if (puruliaSites.includes(id)) return "purulia";
    if (islampurSites.includes(id)) return "islampur";
    if (r <= 3) return "foothills";
    if (r <= 6) return "north";
    if (r >= 11) return "delta";
    if (q <= 8) return "damodar";
    if (r === 7) return "nadia";
    return "hooghly";
  },
  districtNames: {
    coochBehar: "Cooch Behar", purulia: "Purulia", islampur: "Islampur corridor",
    foothills: "Himalayan foothills", north: "Northern river plains", damodar: "Damodar valley",
    nadia: "Nadia plains", hooghly: "Hooghly industrial belt", delta: "Lower delta",
  },
  ownerOutside(q, r) {
    const id = hexId(q, r);
    if (accessionSites.includes(id)) return "coochBehar";
    if (puruliaSites.includes(id) || islampurSites.includes(id)) return "bihar";
    return "neighbor";
  },
  flood(q, r, kind) {
    if (kind === "f") return 3;
    if (kind !== "p") return 0;
    return (r >= 8 && q >= 6) || (r >= 4 && r <= 7 && q >= 7) ? 2 : 1;
  },
  mineral(q, r, kind) {
    return r >= 7 && r <= 9 && q <= 4 && (kind === "t" || kind === "h");
  },
};
