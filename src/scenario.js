import { biharMap } from "./bihar.js";
import { orissaMap } from "./orissa.js";
import { bengalMap } from "./west-bengal.js";
import { bombayMap } from "./bombay.js";
import { punjabMap } from "./punjab.js";
import { madrasMap } from "./madras.js";
import { assamMap } from "./assam.js";
import { centralMap } from "./central.js";

export const territories = {
  bihar: { name: "Bihar", number: "01", tagline: "Ganga floodplains and the mineral plateau", opening: "Protect food supplies, open northern markets, or link the southern workshops.", capital: [6, 6] },
  orissa: { name: "Orissa", number: "02", tagline: "A coastal delta and an upland interior", opening: "Balance delta food security against an inland market network and the promise of river power." },
  mayurbhanj: { name: "Mayurbhanj", number: "03", tagline: "A princely state between the plateau and the coastal plain", opening: "Build up Baripada and the interior while deciding which powers to share after independence.", capital: [12, 1] },
  "west-bengal": { name: "West Bengal", number: "04", tagline: "The Hooghly industrial belt, delta and Himalayan foothills", opening: "Govern the western districts of Bengal. Plan for Partition, protect the Damodar floodplain and keep mills supplied." },
  bombay: { name: "Bombay", number: "05", tagline: "Arabian Sea ports, cotton mills and Deccan farms", opening: "Develop the port and textile towns, then choose which successor state to govern in 1960." },
  punjab: { name: "Punjab", number: "06", tagline: "Sutlej canals, market towns and the Himalayan foothills", opening: "Lead Punjab’s eastern districts through Partition, choose what Bhakra serves first, and govern Punjab or Haryana after 1966." },
  madras: { name: "Madras", number: "07", tagline: "Southern ports, river deltas and the Deccan interior", opening: "Develop the southern province, choose Madras or Andhra in 1953, and manage the border changes that follow." },
  central: { name: "Central Provinces and Berar", number: "09", tagline: "Narmada farmland, inland railways and the Chhattisgarh plain", opening: "Develop an inland economy around Nagpur. Plan for Vidarbha’s transfer, then choose where Madhya Pradesh should invest after the move to Bhopal." },
  assam: { name: "Assam", number: "08", tagline: "Brahmaputra floodplains, tea districts and hill towns", opening: "Keep food and freight moving after Partition, rebuild after the earthquake, and govern through the formation of new northeastern states." },
};

const requested = new URLSearchParams(globalThis.location?.search).get("region");
const key = requested && Object.hasOwn(territories, requested) ? requested : "bihar";
export const campaignStorageKey = (region) => region === "bihar" ? "india-alternate-futures-campaign-1" : `india-alternate-futures-campaign-1-${region}`;

export const World = (() => {
  const isBihar = key === "bihar";
  const isMayurbhanj = key === "mayurbhanj";
  const isBengal = key === "west-bengal";
  const isBombay = key === "bombay";
  const isPunjab = key === "punjab";
  const isMadras = key === "madras";
  const isAssam = key === "assam";
  const isCentral = key === "central";
  const mapKey = isMayurbhanj ? "orissa" : key;
  const map = { bihar: biharMap, orissa: orissaMap, "west-bengal": bengalMap, bombay: bombayMap, punjab: punjabMap, madras: madrasMap, assam: assamMap, central: centralMap }[mapKey];
  const terrain = {
    p: { name: "Alluvial plain", color: "#a9a66c", fertility: 4 },
    f: { name: "Flood basin", color: "#769978", fertility: 6 },
    h: { name: "Foothills", color: "#979463", fertility: 2 },
    t: { name: "Plateau", color: "#ad8a63", fertility: 2 },
    r: { name: "Rocky upland", color: "#ad886e", fertility: 1 },
  };
  const id = (q, r) => `hex-${q}-${r}`;
  // Campaign-scale sites within the digitized 1941 state, retaining Orissa hex identities.
  const localSites = new Set([[12, 0], [10, 1], [11, 1], [12, 1], [13, 1], [10, 2], [11, 2], [12, 2], [13, 2], [10, 3]].map(([q, r]) => id(q, r)));
  const localTowns = [{ q: 12, r: 1, name: "Baripada", hub: true }, { q: 10, r: 1, name: "Jashipur" },
    { q: 10, r: 2, name: "Karanjia" }, { q: 12, r: 2, name: "Udala" }];
  const valleySites = { [id(12, 1)]: "p", [id(13, 1)]: "p", [id(12, 2)]: "p", [id(13, 2)]: "f" };
  const townsById = Object.fromEntries([...map.towns, ...(isMayurbhanj ? localTowns : [])].map((town) => [id(town.q, town.r), town]));
  const tiles = {};
  const startingOwners = {};
  const mergerSites = [];
  const accessionSites = [];
  const initialSites = map.initialSites && new Set(map.initialSites);
  for (const [r, row] of map.rows.entries()) {
    for (const [q, sourceKind] of [...row].entries()) {
      if (sourceKind === " ") continue;
      const hexId = id(q, r);
      const bounds = map.bounds[r];
      const core = initialSites ? initialSites.has(hexId) : bounds && q >= bounds[0] && q <= bounds[1];
      const local = mapKey === "orissa" && localSites.has(hexId);
      const valley = isMayurbhanj && valleySites[hexId];
      const kind = valley || sourceKind;
      tiles[hexId] = {
        id: hexId, q, r, kind, district: isMayurbhanj && local ? valley ? "baripada" : "similipal" : map.district(q, r),
        town: townsById[hexId], mineral: map.mineral(q, r, kind), flood: valley ? kind === "f" ? 3 : 2 : map.flood(q, r, kind),
      };
      if (local && core) accessionSites.push(hexId);
      if (isMayurbhanj && core && !local) mergerSites.push(hexId);
      startingOwners[hexId] = isMayurbhanj && local ? key : core ? mapKey : map.ownerOutside(q, r);
    }
  }

  function neighbors(hexId) {
    const { q, r } = tiles[hexId];
    const west = r % 2 ? 0 : -1;
    return [[q - 1, r], [q + 1, r], [q + west, r - 1], [q + west + 1, r - 1],
      [q + west, r + 1], [q + west + 1, r + 1]].map(([x, y]) => id(x, y)).filter((candidate) => tiles[candidate]);
  }

  const info = territories[key];
  const city = (name) => Object.values(tiles).find(({ town }) => town?.name === name)?.id;
  const capitalName = isCentral ? "Nagpur" : isAssam ? "Shillong" : isMadras ? "Madras" : isPunjab ? "Jullundur" : isBombay ? "Bombay" : isBengal ? "Calcutta" : "Cuttack";
  const capital = info.capital ? id(...info.capital) : city(capitalName);
  const successors = isBombay ? {
    maharashtra: { name: "Maharashtra", capital, sites: map.maharashtraSites,
      economy: { harvest: 50, demandFloor: 36, floodLoss: 8 }, goals: { secureYears: 4, skills: 19, towns: 7, output: 56, cash: 105 } },
    gujarat: { name: "Gujarat", capital: city("Ahmedabad"), sites: map.gujaratSites,
      economy: { harvest: 27, demandFloor: 18, floodLoss: 6 }, goals: { secureYears: 4, skills: 17, towns: 12, output: 46, cash: 70 } },
  } : isPunjab ? {
    punjab: { name: "Punjab", capital: city("Chandigarh"), sites: map.punjabSites,
      economy: { harvest: 35, demandFloor: 28, floodLoss: 6, dryLoss: 7 }, goals: { secureYears: 4, skills: 18, towns: 6, output: 49, cash: 90 } },
    haryana: { name: "Haryana", capital: city("Chandigarh"), sites: map.haryanaSites,
      economy: { harvest: 25, demandFloor: 20, floodLoss: 6, dryLoss: 8 }, goals: { secureYears: 4, skills: 16, towns: 5, output: 42, cash: 65 } },
  } : isMadras ? {
    madras: { name: "Madras", capital, sites: map.madrasSites,
      economy: { harvest: 38, demandFloor: 30, floodLoss: 6, dryLoss: 8 },
      reorganizedEconomy: { harvest: 34, demandFloor: 28, floodLoss: 6, dryLoss: 7 }, goals: { secureYears: 4, skills: 19, towns: 8, output: 54, cash: 110 } },
    andhra: { name: "Andhra State", capital: city("Kurnool"), sites: map.andhraSites,
      economy: { harvest: 27, demandFloor: 23, floodLoss: 7, dryLoss: 5 },
      reorganizedEconomy: { harvest: 42, demandFloor: 32, floodLoss: 8, dryLoss: 7 }, goals: { secureYears: 4, skills: 18, towns: 7, output: 50, cash: 90 } },
  } : undefined;
  return {
    key, mapKey, name: info.name, number: info.number, opening: info.opening, capital, terrain, tiles, startingOwners, id, neighbors, mergerSites, accessionSites,
    foundingOnly: isMayurbhanj || isBengal || isBombay || isPunjab || isMadras || isAssam || isCentral,
    coochBeharSites: isBengal ? map.accessionSites : undefined, bengalTransferSites: isBengal ? map.transferSites : undefined,
    bombayAccessionSites: isBombay ? map.accessionSites : undefined, bombayEarlySites: isBombay ? map.earlyAccessionSites : undefined,
    bombayDepartureSites: isBombay ? map.departureSites ?? [] : undefined, successors,
    punjabAccessionSites: isPunjab ? map.accessionSites : undefined,
    punjabUnionSites: isPunjab ? map.unionSites : undefined, punjabHimachalSites: isPunjab ? map.himachalSites : undefined,
    punjabCapital: isPunjab ? city("Chandigarh") : undefined,
    madrasTransition: isMadras ? {
      bellary: map.bellarySites, telangana: map.telanganaSites, kerala: map.keralaSites, mysore: map.mysoreSites,
      kanyakumari: map.kanyakumariSites, pudukkottai: map.pudukkottaiSites, tamil: map.tamilSites, hyderabad: city("Hyderabad"),
    } : undefined,
    centralTransition: isCentral ? { accession: map.accessionSites, departure: map.departureSites,
      expansion: map.expansionSites, bhopal: city("Bhopal") } : undefined,
    assamTransition: isAssam ? { sylhet: map.sylhetSites, nagaland: map.nagaSites,
      meghalaya: map.meghalayaSites, mizoram: map.mizoSites, dispur: city("Dispur") } : undefined,
    districts: isMayurbhanj ? { ...map.districtNames, baripada: "Baripada and the eastern lowlands", similipal: "Similipal and the interior" } : map.districtNames,
    basinName: isCentral ? "Chambal" : isAssam ? "Brahmaputra" : isBihar ? "Kosi" : isBengal ? "Damodar" : isBombay ? "Deccan" : isPunjab ? "Bhakra" : isMadras ? "Cauvery" : "Mahanadi",
    basinProgramme: isCentral ? "chambal" : isAssam ? "brahmaputra" : isBihar ? "kosi" : isBengal ? "damodar" : isBombay ? "bombayWater" : isPunjab ? "bhakra" : isMadras ? "cauvery" : isMayurbhanj ? "orissa_mahanadi" : "mahanadi",
    owners: { [key]: `${info.name} administration`, ...(isBihar ? { council: "Southern district council", nepal: "Nepal" }
      : isBengal ? { coochBehar: "Cooch Behar", bihar: "Bihar administration", eastBengal: "Eastern Bengal" }
        : isBombay ? { gujarat: "Gujarat administration", maharashtra: "Maharashtra administration", mysore: "Mysore administration", saurashtra: "Saurashtra", hyderabad: "Hyderabad State", madhyaPradesh: "Central India", kutch: "Kutch", baroda: "Baroda State", kolhapur: "Kolhapur State" }
        : isPunjab ? { haryana: "Haryana administration", punjabState: "Punjab administration", pepsu: "Patiala and East Punjab States Union", chandigarh: "Chandigarh Union Territory", himachal: "Himachal Pradesh", westPunjab: "Western Punjab", delhi: "Delhi", rajasthan: "Rajasthan", up: "United Provinces" }
        : isMadras ? { andhra: "Andhra administration", madrasState: "Madras administration", mysore: "Mysore", kerala: "Kerala", hyderabad: "Hyderabad State", travancore: "Travancore–Cochin", pudukkottai: "Pudukkottai State", pondicherry: "Pondicherry", orissa: "Orissa" }
        : isCentral ? { chhattisgarhStates: "Eastern princely states", makrai: "Makrai State", madhyaBharat: "Madhya Bharat", vindhyaPradesh: "Vindhya Pradesh", bhopal: "Bhopal State", rajasthan: "Rajasthan", bombay: "Bombay", maharashtra: "Maharashtra", orissa: "Orissa", up: "United Provinces", hyderabad: "Hyderabad State", andhra: "Andhra Pradesh" }
        : isAssam ? { eastBengal: "Eastern Bengal", nagaHills: "Naga Hills–Tuensang Area", nagaland: "Nagaland", meghalaya: "Meghalaya", mizoram: "Mizoram", manipur: "Manipur", tripura: "Tripura", nefa: "Northeastern frontier", bhutan: "Bhutan" }
        : isMayurbhanj ? { orissa: "Orissa administration" } : { mayurbhanj: "Mayurbhanj State" }), neighbor: "Adjacent territory" },
    economy: isBihar ? { population: 34, reserve: 3, harvest: 33, demandFloor: 26, floodLoss: 8, marketStock: 7 }
      : isBengal ? { population: 41, reserve: 4, harvest: 39, demandFloor: 30, floodLoss: 9, marketStock: 9 }
      : isBombay ? { population: 59, reserve: 5, harvest: 56, demandFloor: 44, floodLoss: 8, marketStock: 10 }
      : isPunjab ? { population: 35, reserve: 4, harvest: 36, demandFloor: 27, floodLoss: 7, dryLoss: 7, marketStock: 8 }
      : isMadras ? { population: 58, reserve: 5, harvest: 57, demandFloor: 46, floodLoss: 9, dryLoss: 7, marketStock: 9 }
      : isCentral ? { population: 36, reserve: 4, harvest: 38, demandFloor: 32, floodLoss: 6, dryLoss: 9, marketStock: 8 }
      : isAssam ? { population: 32, reserve: 4, harvest: 34, demandFloor: 24, floodLoss: 10, dryLoss: 5, marketStock: 6 }
      : isMayurbhanj ? { population: 10, reserve: 3, harvest: 10, demandFloor: 8, floodLoss: 3, marketStock: 4 }
        : { population: 26, reserve: 3, harvest: 24, demandFloor: 18, floodLoss: 8, marketStock: 5 },
    goals: isBihar ? { secureYears: 4, skills: 20, towns: 5, output: 36, cash: 35 }
      : isBengal ? { secureYears: 4, skills: 21, towns: 11, output: 53, cash: 90 }
      : isBombay ? { secureYears: 4, skills: 21, towns: 8, output: 63, cash: 110 }
      : isPunjab ? { secureYears: 4, skills: 20, towns: 8, output: 50, cash: 75 }
      : isMadras ? { secureYears: 4, skills: 20, towns: 10, output: 61, cash: 100 }
      : isCentral ? { secureYears: 4, skills: 21, towns: 10, output: 58, cash: 95 }
      : isAssam ? { secureYears: 4, skills: 19, towns: 7, output: 46, cash: 60 }
      : isMayurbhanj ? { secureYears: 4, skills: 14, towns: 3, output: 26, cash: 12 }
        : { secureYears: 4, skills: 17, towns: 5, output: 68, cash: 100 },
    start: 1946, end: 1965,
  };
})();
