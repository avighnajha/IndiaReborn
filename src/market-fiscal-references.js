// RBI Handbook of Statistics on State Government Finances 2010, Table 5.
// The first panel is FY 1980–81 through 1985–86, in nominal CRORE rupees.
// Missing cells remain missing; conversion to lakh happens once below.
const rbi = "https://www.rbi.org.in/scripts/PublicationsView.aspx?id=12315";
const lateReceipts = {
  "andhra": {
    "name": "Andhra Pradesh",
    "crore": [
      1265,
      1466,
      1639,
      1953,
      2294,
      2773
    ]
  },
  "bihar": {
    "name": "Bihar",
    "crore": [
      988,
      1160,
      1319,
      1504,
      1794,
      2396
    ]
  },
  "gujarat": {
    "name": "Gujarat",
    "crore": [
      1025,
      1160,
      1349,
      1565,
      1770,
      1903
    ]
  },
  "haryana": {
    "name": "Haryana",
    "crore": [
      460,
      536,
      612,
      699,
      791,
      960
    ]
  },
  "mysore": {
    "name": "Karnataka",
    "crore": [
      954,
      1167,
      1281,
      1490,
      1740,
      2013
    ]
  },
  "kerala": {
    "name": "Kerala",
    "crore": [
      640,
      851,
      810,
      934,
      1125,
      1371
    ]
  },
  "central": {
    "name": "Madhya Pradesh",
    "crore": [
      1134,
      1344,
      1516,
      1800,
      1813,
      2174
    ]
  },
  "maharashtra": {
    "name": "Maharashtra",
    "crore": [
      2038,
      2386,
      2838,
      3252,
      3668,
      4174
    ]
  },
  "orissa": {
    "name": "Orissa",
    "crore": [
      621,
      602,
      802,
      783,
      823,
      941
    ]
  },
  "punjab": {
    "name": "Punjab",
    "crore": [
      568,
      683,
      786,
      879,
      932,
      1170
    ]
  },
  "rajasthan": {
    "name": "Rajasthan",
    "crore": [
      753,
      857,
      1009,
      1143,
      1227,
      1506
    ]
  },
  "madras": {
    "name": "Tamil Nadu",
    "crore": [
      1280,
      1442,
      1678,
      1963,
      2228,
      2638
    ]
  },
  "up": {
    "name": "Uttar Pradesh",
    "crore": [
      1899,
      2260,
      2556,
      2656,
      3145,
      3877
    ]
  },
  "bengal": {
    "name": "West Bengal",
    "crore": [
      1092,
      1224,
      1379,
      1533,
      1779,
      2343
    ]
  },
  "assam": {
    "name": "Assam",
    "crore": [
      522,
      366,
      439,
      551,
      699,
      938
    ]
  },
  "himachal": {
    "name": "Himachal Pradesh",
    "crore": [
      292,
      234,
      272,
      317,
      382,
      519
    ]
  },
  "jammu": {
    "name": "Jammu and Kashmir",
    "crore": [
      258,
      299,
      325,
      376,
      438,
      602
    ]
  },
  "manipur": {
    "name": "Manipur",
    "crore": [
      111,
      95,
      113,
      130,
      171,
      226
    ]
  },
  "meghalaya": {
    "name": "Meghalaya",
    "crore": [
      90,
      82,
      97,
      124,
      148,
      183
    ]
  },
  "mizoram": {
    "name": "Mizoram",
    "crore": [
      null,
      null,
      null,
      null,
      null,
      130
    ]
  },
  "nagaland": {
    "name": "Nagaland",
    "crore": [
      144,
      108,
      134,
      162,
      201,
      265
    ]
  },
  "sikkim": {
    "name": "Sikkim",
    "crore": [
      37,
      39,
      48,
      56,
      77,
      92
    ]
  },
  "tripura": {
    "name": "Tripura",
    "crore": [
      123,
      97,
      124,
      145,
      183,
      231
    ]
  }
};
const plan1972 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1972_73_12022021.pdf#page=50";
const plan1980 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1980_81_12022021.pdf#page=27";
const plan = (name, fiscalYear, value, url) => ({ name, fiscalYear, value, url,
  metric: "Annual Plan outlay", status: fiscalYear === 1972 ? "Approved annual Plan allocation" : "Reported annual Plan allocation" });

export const marketFiscalReferences = Object.fromEntries(Object.entries(lateReceipts).map(([id, {name, crore}]) => [id,
  crore.flatMap((value, index) => value === null ? [] : [{ name, fiscalYear: 1980 + index, value: value * 100,
    metric: "Revenue receipts", status: "RBI reported receipts, rounded to crore in source table", url: rbi }]),
]));
marketFiscalReferences.arunachal = [plan("Arunachal Pradesh (Union territory)", 1972, 390.10, plan1972),
  plan("Arunachal Pradesh (Union territory)", 1980, 2621, plan1980),
  plan("Arunachal Pradesh (Union territory)", 1981, 3800, plan1980)];
marketFiscalReferences.delhi = [plan("Delhi (Union territory)", 1972, 4100, plan1972)];
marketFiscalReferences.mizoram.unshift(plan("Mizoram (Union territory)", 1972, 437, plan1972));
