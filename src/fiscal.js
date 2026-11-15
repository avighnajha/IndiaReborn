const firstCommission = "https://fincomindia.nic.in/asset/doc/commission-reports/1st-FC/digitized/1st%20FC%20-%20Digitised.pdf";
const secondCommission = "https://fincomindia.nic.in/asset/doc/commission-reports/2nd-FC/digitized/2nd%20FC%20-Digitised.pdf";
const thirdCommission = "https://fincomindia.nic.in/asset/doc/commission-reports/3rd-FC/digitized/3rd%20FC%20Scanned.pdf";
const fourthCommission = "https://fincomindia.nic.in/asset/doc/commission-reports/4th-FC/digitized/4th%20FC-Digitised.pdf";
const fifthCommission = "https://fincomindia.nic.in/asset/doc/commission-reports/5th-FC/digitized/5th%20FC%20-%20Digitised.pdf";
const developmentSource = "https://dspace.gipe.ac.in/xmlui/bitstream/handle/10973/39679/GIPE-022067.pdf?isAllowed=y&sequence=3";
const orissaAccounts = "https://cag.gov.in/uploads/state_accounts_report/account-report-FA-1960-61-067ab2a766160c9-30223549.pdf";
const bombayReorganizationAccounts = "https://dspace.gipe.ac.in/xmlui/bitstream/handle/10973/52260/GIPE-068896.pdf?isAllowed=y&sequence=1";
const punjabBudget1946 = "https://www.pap.gov.pk/uploads/verbatim/text/en/pb-legis-assembly-debates-vol-xxv-1946.pdf";
const punjabAccounts1977 = "https://saiindia.gov.in/uploads/state_accounts_report/account-report-FINANCE-ACCOUNTS-1977-78-0653f7f6f553042-86606385.pdf";
const punjabAccounts1983 = "https://cag.gov.in/uploads/state_accounts_report/account-report-FINANCE-ACCOUNTS-1983-84-0653f8c4a5e18c5-61144318.pdf";
const laterStateReceipts = "https://www.rbi.org.in/scripts/PublicationsView.aspx?id=6457";
const madrasBudget1946 = "https://tamildigitallibrary.in/assets/docs/uploads/catalogue_article_file/DOC/upload/2025/03/TVA_UoM_06154_Annual_financial_statement_Budget_of_the_Government_of_Madras_1946_47.pdf";
const madrasBudget1957 = "https://tamildigitallibrary.in/assets/docs/uploads/catalogue_article_file/DOC/upload/2025/03/Budget%20Speech%201957-1958_Eng.pdf";
const tamilNaduBudget1974 = "https://tamildigitallibrary.in/assets/docs/uploads/catalogue_article_file/DOC/upload/2025/03/Budget%20Speech%201974-1975_Eng.pdf";
const tamilNaduBudget1976 = "https://eparlib.sansad.in/bitstream/123456789/854225/1/05_XVI_19-03-1976_p80_p85_PII.pdf";
const andhraBudget = (year) => `https://apfinance.gov.in/pbs-${year}-middle.html`;
const andhraAccounts1970 = "https://d1jmc0u14z2tmp.cloudfront.net/uploads/state_accounts_report/account-report-1970-71-069da0d84c9b341-27517462.pdf";
const andhraAccounts1975 = "https://d1jmc0u14z2tmp.cloudfront.net/uploads/state_accounts_report/account-report-1975-76-069da10595cef26-34506315.pdf";
const assamBudget1946 = "https://aladigitallibrary.in/bitstream/123456789/2023/13/The_10th_March_1947.pdf";
const assamBudget1949 = "https://aladigitallibrary.in/bitstream/123456789/1694/1/Budget_Speech_%28Eng%29_%281949-50%29_10th_March.pdf";
const assamSurvey1972 = "https://aladigitallibrary.in/bitstream/123456789/2269/1/Economic%20Survey%20Assam%201972.pdf";
const assamSurvey1982 = "https://aladigitallibrary.in/bitstream/123456789/2267/1/Economic%20Survey%20Assam%201982-83.pdf";
const assamLaterReceipts = "https://rbi.org.in/SCRIPTS/PublicationsView.aspx?id=6457";
const centralPrewarReceipts = "https://www.scribd.com/document/436934673/comemmorative-volume-on-80-years-of-odisha-budget";
const centralStateFinances = "https://documents.worldbank.org/curated/en/320291468752761432/pdf/multi0page.pdf";
const mayurbhanjRevenue = 49;
const mayurbhanjSource = "https://link.springer.com/chapter/10.1057/9780230270763_5";

// Development spending from the 1949 Provincial Development Programme unless noted.
const development = {
  bombay: { 1946: [108, "reported expenditure"], 1947: [580, "reported expenditure"], 1948: [1735, "revised estimate"], 1949: [2350, "budget estimate"] },
  bihar: { 1946: [43, "accounts"], 1947: [101, "accounts"], 1948: [462, "revised estimate"], 1949: [892, "budget estimate"] },
  orissa: { 1946: [69, "accounts"], 1947: [170, "accounts"], 1948: [637, "revised estimate"], 1949: [1100, "original budget estimate"] },
  "west-bengal": { 1947: [165, "accounts from August 1947"], 1948: [722, "revised estimate"], 1949: [1462, "original budget estimate"] },
  "punjab-colonial": { 1946: [605, "budget provision for post-war schemes", punjabBudget1946] },
  "east-punjab": { 1947: [86, "accounts from August 1947"], 1948: [663, "revised estimate"], 1949: [740, "budget estimate adjusted for reduced Central lending"] },
  "punjab-enlarged": { 1965: [2330, "revenue Plan outlay", fifthCommission] },
  punjab: { 1968: [1472, "revenue Plan outlay", fifthCommission] },
  haryana: { 1968: [926, "revenue Plan outlay", fifthCommission] },
  madras: { 1946: [349, "capital account disbursements, budget estimate", `${madrasBudget1946}#page=5`] },
  "tamil-nadu": { 1957: [3170, "Second Plan outlay, budget estimate", madrasBudget1957] },
  "andhra-pradesh": { 1956: [2496, "Second Plan outlay, reported expenditure", andhraBudget(1958)],
    1957: [3520, "Second Plan outlay, budget provision", andhraBudget(1958)] },
  assam: { 1946: [43, "accounts"] },
  "assam-post-partition": { 1947: [122, "accounts"], 1948: [172, "revised estimate"], 1949: [239, "budget estimate"] },
  central: { 1946: [116, "accounts"], 1947: [256, "accounts"], 1948: [814, "revised estimate"], 1949: [1171, "budget estimate"] },
};
const closingCash1947 = { bihar: 107, orissa: 60, assam: 154, central: 241 };
const awardBasis = "The modeled split uses the Finance Commission award transfers. These figures cover the award’s tax shares and grants.";

// Nominal lakh rupees. Period jurisdictions, never modern state boundaries.
// Appendix VIII separates revenue from the Central income-tax share and grants.
const profiles = {
  bihar: { name: "Bihar", page: 153, rows: [[1949, 2595, 595, 46], [1950, 2897, 592, 39],
    [1951, 2830, 654, 225, secondCommission, 160, "reported figures"],
    [1952, 3022, 803, 200, secondCommission, 162, "reported figures"],
    [1953, 3325, 796, 305, secondCommission, 164, "reported figures"],
    [1954, 3580, 766, 698, secondCommission, 166, "reported figures"],
    [1955, 3774, 776, 597, secondCommission, 168, "reported figures"],
    [1957, 4345, null, null, secondCommission, 209, "budget estimate"],
    [1961, 8249, null, null, fourthCommission, 196, "accounts"],
    [1962, 9337, null, null, fourthCommission, 196, "accounts"],
    [1963, 10000, 2338, 1260, fourthCommission, 196, "accounts"],
    [1964, 10863, null, null, fourthCommission, 196, "revised estimate"],
    [1965, 11934, null, null, fourthCommission, 196, "budget estimate"]] },
  bombay: { name: "Bombay", page: 153, rows: [[1949, 6153, 961, 135], [1950, 6031, 995, 145], [1951, 6045, 1099, 145], [1952, 6503, 1060, 116],
    [1957, 10935, null, null, secondCommission, 209, "enlarged Bombay budget estimate"],
    [1958, 14116, null, null, bombayReorganizationAccounts, 19, "enlarged Bombay accounts"]] },
  maharashtra: { name: "Maharashtra", page: 196, rows: [
    ...[[1961, 11875, 1445, 1241], [1962, 14960, 2539, 1337], [1963, 18725, 2875, 1426]].map((row) => [...row, fourthCommission, 196, "accounts"]),
    [1964, 20015, 2921, 2248, fourthCommission, 196, "revised estimate"],
    [1965, 21547, 3011, 3019, fourthCommission, 196, "budget estimate, sum of reported components"]] },
  gujarat: { name: "Gujarat", page: 197, rows: [
    ...[[1961, 6569, 1801, 699], [1962, 8246, 1373, 1167], [1963, 9097, 1572, 1121]].map((row) => [...row, fourthCommission, 197, "accounts"]),
    [1964, 9689, 1533, 1460, fourthCommission, 197, "revised estimate"],
    [1965, 10657, 1578, 1914, fourthCommission, 197, "budget estimate"]] },
  "punjab-colonial": { name: "Undivided Punjab", rows: [
    [1946, 2190, null, null, punjabBudget1946, null, "budget estimate for undivided Punjab"],
  ] },
  "east-punjab": { name: "East Punjab", page: 154, rows: [
    [1949, 1695, 229, 175], [1950, 1687, 261, 75],
    ...[[1951, 1756, 288, 26], [1952, 1804, 270, 137], [1953, 2020, 269, 192],
      [1954, 2230, 252, 306], [1955, 2420, 255, 407]].map((row) => [...row, secondCommission, 150, "reported figures"]),
  ] },
  "punjab-enlarged": { name: "Punjab after the PEPSU merger", rows: [
    [1957, 3936, 554, 225, secondCommission, 209, "budget estimate before new tax proposals", awardBasis],
    ...[[1961, 7990, 818, 1215], [1962, 9130, 1214, 854], [1963, 11320, 1401, 1125]].map((row) => [...row, fourthCommission, 198, "accounts"]),
    [1964, 12222, 1384, 1457, fourthCommission, 198, "revised estimate"],
    [1965, 12965, 1463, 1777, fourthCommission, 198, "budget estimate"],
  ] },
  punjab: { name: "Punjab", rows: [
    [1967, 10546, 1133, 0, fifthCommission, null, "reported state budget figures", awardBasis],
    [1968, 12600, 1349, 0, fifthCommission, null, "revised estimate", awardBasis],
    [1976, 37641, 3953, 5731, punjabAccounts1977, null, "accounts"],
    [1977, 40612, 4221, 5186, punjabAccounts1977, null, "accounts"],
    [1980, 56770, null, null, laterStateReceipts, null, "RBI reported receipts"],
    [1981, 68250, null, null, laterStateReceipts, null, "RBI reported receipts"],
    [1982, 78605, 9923, 4928, punjabAccounts1983, null, "accounts"],
    [1983, 87913, 11166, 6698, punjabAccounts1983, null, "accounts"],
    [1984, 93200, null, null, laterStateReceipts, null, "RBI reported receipts"],
    [1985, 117020, null, null, laterStateReceipts, null, "RBI reported receipts"],
  ] },
  haryana: { name: "Haryana", rows: [
    [1967, 6181, 767, 0, fifthCommission, null, "reported state budget figures", awardBasis],
    [1968, 7456, 913, 0, fifthCommission, null, "revised estimate", awardBasis],
    ...[[1980, 45990], [1981, 53600], [1982, 61160], [1983, 69860], [1984, 79050], [1985, 96030]]
      .map(([year, revenue]) => [year, revenue, null, null, laterStateReceipts, null, "RBI reported receipts"]),
  ] },
  madras: { name: "Madras", page: 154, rows: [
    [1946, 4144, 294, 0, madrasBudget1946, 2, "March 1946 budget estimate, composite Madras"],
    [1949, 5589, 823, 0], [1950, 5816, 829, 0],
    [1951, 5875, 915, 108, secondCommission, 149, "reported figures, composite Madras"],
    [1952, 5802, 1231, 74, secondCommission, 149, "reported figures, composite Madras"],
  ] },
  "madras-residual": { name: "Madras", rows: [
    [1954, 4286, 734, 161, secondCommission, 149, "reported figures, Madras after Andhra's separation"],
    [1955, 5170, 743, 425, secondCommission, 149, "reported figures, Madras after Andhra's separation"],
  ] },
  "andhra-state": { name: "Andhra State", rows: [
    [1954, 1964, 422, 76, secondCommission, 147, "reported figures, first full fiscal year"],
    [1955, 2328, 426, 128, secondCommission, 147, "reported figures"],
  ] },
  "tamil-nadu": { name: "Tamil Nadu", rows: [
    [1957, 5649, 825, 0, madrasBudget1957, null, "budget estimate before new taxes, first full fiscal year", awardBasis],
    ...[[1961, 9991, 1473, 1082], [1962, 11825, 1682, 1514], [1963, 13502, 1943, 1695]]
      .map((row) => [...row, fourthCommission, 197, "accounts"]),
    [1964, 14731, 2059, 1828, fourthCommission, 197, "revised estimate"],
    ...[[1965, 17280], [1966, 19455], [1967, 23339], [1968, 27728]]
      .map(([year, revenue]) => [year, revenue, null, null, fifthCommission, 138, year === 1968 ? "revised estimate" : "reported state budget figures"]),
    [1973, 46800, null, null, tamilNaduBudget1974, null, "revised estimate"],
    [1974, 47069, null, null, tamilNaduBudget1974, null, "budget estimate"],
    [1976, 57563, null, null, tamilNaduBudget1976, null, "budget estimate"],
    ...[[1980, 128000, 29180, 11650], [1981, 144160, 32950, 12570], [1982, 167800, 35640, 14260],
      [1983, 196250, 40200, 22520], [1984, 222750, 44470, 26850], [1985, 263830, 51670, 33480]]
      .map((row) => [...row, laterStateReceipts, null, "RBI reported receipts"]),
  ] },
  "andhra-pradesh": { name: "Andhra Pradesh", rows: [
    [1957, 6108, 850, 400, andhraBudget(1958), null, "revised estimate, first full fiscal year", awardBasis],
    [1958, 6366, null, null, andhraBudget(1958), null, "budget estimate"],
    [1960, 8780, null, null, andhraBudget(1961), null, "reported receipts"],
    ...[[1961, 9675, 1632, 1232], [1962, 11288, 1781, 1712], [1963, 13636, 2034, 2142]]
      .map((row) => [...row, fourthCommission, 196, "accounts"]),
    [1964, 14269, 1993, 2605, fourthCommission, 196, "revised estimate"],
    ...[[1965, 15179], [1966, 17226], [1967, 18427], [1968, 20355]]
      .map(([year, revenue]) => [year, revenue, null, null, fifthCommission, 134, year === 1968 ? "revised estimate" : "reported state budget figures"]),
    [1969, 24820, 4719, 4146, andhraAccounts1970, 16, "accounts"],
    [1970, 29626, 5716, 4113, andhraAccounts1970, 16, "accounts"],
    [1974, 52635, 9847, 7952, andhraAccounts1975, 14, "accounts"],
    [1975, 65219, 12804, 9342, andhraAccounts1975, 14, "accounts"],
    [1976, 68807, null, null, andhraBudget(1977), null, "revised estimate"],
    [1977, 76909, null, null, andhraBudget(1977), null, "budget estimate"],
    ...[[1980, 126450, 29580, 16390], [1981, 146630, 33350, 16670], [1982, 163910, 36090, 21000],
      [1983, 195330, 40830, 27020], [1984, 229380, 44840, 30030], [1985, 277320, 58160, 36260]]
      .map((row) => [...row, laterStateReceipts, null, "RBI reported receipts"]),
  ] },
  assam: { name: "Undivided Assam", rows: [
    [1946, 515.59, null, null, assamBudget1946, null, "original budget estimate, before Partition"],
  ] },
  "assam-post-partition": { name: "Assam", page: 153, rows: [
    [1947, 662.06, null, null, assamBudget1949, null, "accounts, Partition fiscal year"],
    [1948, 794.67, null, null, assamBudget1949, null, "revised estimate, first full fiscal year after Partition"],
    [1949, 1030, 139, 88], [1950, 992, 142, 70],
    ...[[1951, 1129, 157, 163], [1952, 1428, 185, 278], [1953, 1434, 183, 329], [1954, 1623, 175, 398]]
      .map((row) => [...row, secondCommission, 147, "reported figures"]),
    [1955, 2317, 182, 533, assamSurvey1972, null, "accounts, Assam Economic Survey"],
    [1957, 2379, null, null, secondCommission, 209, "budget estimate"],
    [1960, 3799, 446, 1325, assamSurvey1972, null, "accounts, Assam Economic Survey"],
    [1961, 3706, 481, 1334, fourthCommission, 196, "accounts"],
    [1962, 4463, 729, 1610, fourthCommission, 196, "accounts"],
  ] },
  "assam-post-nagaland": { name: "Assam", rows: [
    [1963, 4956, 850, 1665, fourthCommission, 196, "accounts, Nagaland statehood fiscal year"],
    [1964, 6412, 839, 2750, fourthCommission, 196, "revised estimate"],
    [1965, 6623, 910, 2580, assamSurvey1972, null, "accounts, Assam Economic Survey"],
    ...[[1966, 7769], [1967, 8121], [1968, 9320]]
      .map((row) => [...row, null, null, fifthCommission, null, row[0] === 1968 ? "revised estimate" : "reported state budget figures"]),
    [1970, 10282, 1789, 4723, assamSurvey1972, null, "accounts, Assam Economic Survey"],
    [1971, 13313, 2219, 6533, assamSurvey1972, null, "revised estimate, reorganization fiscal year"],
  ] },
  "assam-reorganized": { name: "Assam", rows: [
    [1972, 11589, 2345, 4549, assamSurvey1972, null, "budget estimate, first full fiscal year after reorganization"],
    ...[[1977, 27077, 4686, 10429], [1978, 30605, 5108, 12330], [1979, 26929, 8808, 6542]]
      .map((row) => [...row, assamSurvey1982, null, "accounts, Assam Economic Survey"]),
    ...[[1980, 52220, 9830, 9340], [1981, 36550, 11310, 10540], [1982, 43910, 12200, 13510],
      [1983, 55070, 13750, 19970], [1984, 69910, 15160, 27540], [1985, 93750, 26560, 34670]]
      .map((row) => [...row, assamLaterReceipts, null, "RBI reported receipts"]),
  ] },
  central: { name: "Madhya Pradesh", page: 154, rows: [
    [1945, 1060, null, null, centralPrewarReceipts, null, "rounded historical reference, Central Provinces and Berar"],
    [1949, 1960, 274, 58], [1950, 1921, 284, 19],
    ...[[1951, 2280, 314, 84], [1952, 2366, 427, 43], [1953, 2439, 426, 107],
      [1954, 2551, 411, 189], [1955, 2826, 416, 355]]
      .map((row) => [...row, secondCommission, 149, "reported figures, before reorganization"]),
  ] },
  "central-reorganized": { name: "Madhya Pradesh", rows: [
    ...[[1957, 5227, 821, 790, 106], [1958, 6062, 1066, 902, 107],
      [1959, 6433, 1146, 1132, 108], [1960, 7216, 1352, 1222, 109]]
      .map(([year, revenue, tax, grants, page]) => [year, revenue, tax, grants, thirdCommission, page, "reported state budget figures"]),
    ...[[1961, 7830, 1305, 1524], [1962, 8142, 1558, 1460], [1963, 10470, 1809, 1465]]
      .map((row) => [...row, fourthCommission, 197, "accounts"]),
    ...[[1964, 11045, 1780, 1886], [1965, 12306, 1927, 1951], [1966, 13786, 2506, 1918],
      [1967, 16746, 2758, 3181], [1968, 17914, 3334, 2340], [1969, 21483, 4665, 3007],
      [1970, 22815, 5296, 2771], [1971, 26766, 6316, 4229], [1972, 29665, 6873, 5275],
      [1973, 35183, 8628, 4778], [1974, 42337, 9323, 3944], [1975, 54677, 12150, 4797],
      [1976, 61437, 12967, 6551], [1977, 67937, 13665, 7876]]
      .map((row) => [...row, centralStateFinances, 41, row[0] === 1977 ? "estimate, state report to the Seventh Finance Commission"
        : row[0] === 1976 ? "preliminary accounts, state report to the Seventh Finance Commission" : "reported state accounts"]),
    ...[[1980, 113390, 30290, 18130], [1981, 134410, 34140, 17680], [1982, 151620, 37220, 19070],
      [1983, 180000, 42310, 26000], [1984, 181290, 46380, 23810], [1985, 217350, 57070, 29420]]
      .map((row) => [...row, laterStateReceipts, null, "RBI reported receipts"]),
  ] },
  orissa: { name: "Orissa", page: 154, rows: [[1949, 1082, 137, 47], [1950, 1031, 142, 61],
    ...[[1951, 1196, 157, 134], [1952, 1262, 282, 172], [1953, 1227, 281, 150], [1954, 1399, 276, 281], [1955, 1611, 292, 491]].map((row) => [...row, secondCommission, 150, "accounts"]),
    ...[[1956, 1656, 291, 262], [1957, 2203, 448, 580], [1958, 2748, 562, 731], [1959, 2856, 589, 761], [1960, 3547, 625, 1201]].map((row) => [...row, orissaAccounts, 10, "accounts"]),
    ...[[1961, 4613, 652, 895], [1962, 6227, 1034, 1952], [1963, 6929, 1214, 2213]].map((row) => [...row, fourthCommission, 198, "accounts"]),
    [1964, 7721, 1193, 2440, fourthCommission, 198, "revised estimate"], [1965, 8135, 1265, 2714, fourthCommission, 198, "budget estimate"]] },
  up: { name: "Uttar Pradesh", page: 155, rows: [[1949, 5397, 869, 0], [1950, 5189, 853, 0], [1951, 5461, 942, 0], [1952, 6099, 909, 0]] },
  "west-bengal": { name: "West Bengal", page: 155, rows: [[1949, 3401, 549, 132], [1950, 3430, 640, 117], [1951, 3858, 706, 117], [1952, 3637, 682, 117],
    [1957, 5964, null, null, secondCommission, 209, "budget estimate"],
    ...[[1961, 10170, 1620, 1828], [1962, 10751, 1978, 979], [1963, 12591, 2300, 1163]].map((row) => [...row, fourthCommission, 198, "accounts"]),
    [1964, 13855, 2337, 1809, fourthCommission, 198, "revised estimate"], [1965, 15200, 2416, 2398, fourthCommission, 198, "budget estimate"]] },
};

const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const lakh = (value) => `₹${numberFormat.format(value)} lakh`;
const crore = (value) => `₹${numberFormat.format(value / 100)} crore`;
const yearLabel = (year) => `${year}–${String(year + 1).slice(-2)}`;
const status = (year) => year === 1950 ? "accounts" : year === 1951 ? "provisional figures" : year === 1952 ? "budget estimate" : "reported figures";

function reference(region, year) {
  if (region === "mayurbhanj") return {
    name: "Mayurbhanj", fiscalYear: 1947, sourcePeriod: "1947 yearbook", revenue: mayurbhanjRevenue,
    sharedTax: 0, grants: 0, transferShare: 0, transferYear: 1947,
    status: "approximate revenue, fiscal year unspecified", url: mayurbhanjSource,
  };
  const { name: profileName, page, rows } = profiles[region];
  const name = region === "tamil-nadu" && year < 1969 ? "Madras"
    : region === "central" && year < 1950 ? "Central Provinces and Berar" : profileName;
  const [fiscalYear, revenue, sharedTax, grants, source = firstCommission, sourcePage = page, basis = status(fiscalYear), transferBasis] =
    rows.findLast(([date]) => date <= year) ?? rows[0];
  const mix = rows.findLast(([date, , tax]) => date <= fiscalYear && tax !== null);
  const transferShare = mix ? (mix[2] + mix[3]) / mix[1] : 0;
  const transferYear = mix?.[0] ?? null;
  const transferNote = !mix ? "The budget source gives total receipts. The opening works allocation uses local funding for this turn."
    : sharedTax === null && mix[7] ? `The modeled split carries forward the FY ${yearLabel(transferYear)} Finance Commission award share.`
      : transferBasis;
  return { name, fiscalYear, revenue, sharedTax, grants, transferShare, transferYear, status: basis,
    url: sourcePage ? `${source}#page=${sourcePage}` : source, ...(transferNote ? { transferNote } : {}) };
}

function envelope(region, year, share = 1) {
  const historic = reference(region, year);
  const spending = development[region]?.[year];
  const developmentRecord = spending ? { lakh: spending[0], basis: spending[1], url: spending[2] ?? developmentSource } : null;
  const limit = developmentRecord ? developmentRecord.lakh * 0.30 : Infinity;
  // Local-scale works in the princely campaign use a larger playable share of a much smaller revenue base.
  const developmentShare = region === "mayurbhanj" ? 0.10 : 0.005;
  const total = Math.round(Math.min(historic.revenue * developmentShare, limit) * share);
  const transfers = Math.round(total * historic.transferShare);
  return { historic, developmentRecord, local: total - transfers, transfers, total };
}

function openingBalance(region, year) {
  if (region === "mayurbhanj") return Math.round(mayurbhanjRevenue * 0.16);
  if (year === 1946 && region === "madras") return Math.round(50.63105);
  if (year === 1946 && (region === "punjab" || region === "punjab-colonial")) return 57;
  return closingCash1947[region] && year === 1946 ? Math.round(closingCash1947[region] * 0.32) : Math.round(reference(region, year).revenue * 0.013);
}

const comparison = Object.keys(profiles).filter((region) => profiles[region].rows.some(([year]) => year === 1950))
  .map((region) => ({ ...reference(region, 1950), development: envelope(region, 1950).total }));

export const Fiscal = { reference, envelope, openingBalance, comparison, lakh, crore, yearLabel };
