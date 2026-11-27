import { stateRevenueReferences } from "./state-revenue-references.js";

const plan1972 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1972_73_12022021.pdf#page=50";
const plan1980 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1980_81_12022021.pdf#page=27";
const islandReceipts = "https://eparlib.sansad.in/bitstream/123456789/2638332/1/01_II_16-12-1952_p21_p22_u699.pdf";
const plan1978 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1978_79_12022021.pdf#page=108";
const plan1985 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1985_86_12022021.pdf";
const plan = (name, fiscalYear, value, url) => ({ name, fiscalYear, value, url,
  metric: "Annual Plan outlay", status: fiscalYear === 1972 ? "Approved annual Plan allocation" : "Reported annual Plan allocation" });

// Copy the arrays before adding Union territory Plan observations.
export const marketFiscalReferences = Object.fromEntries(
  Object.entries(stateRevenueReferences).map(([id, rows]) => [id, [...rows]]),
);
marketFiscalReferences.arunachal = [plan("Arunachal Pradesh (Union territory)", 1972, 390.10, plan1972),
  plan("Arunachal Pradesh (Union territory)", 1980, 2621, plan1980),
  plan("Arunachal Pradesh (Union territory)", 1981, 3800, plan1980)];
marketFiscalReferences.delhi = [plan("Delhi (Union territory)", 1972, 4100, plan1972)];
marketFiscalReferences.andamans = [
  ...[[1949, 85.69], [1950, 79.292], [1951, 107.97]].map(([fiscalYear, value]) => ({
    name: "Andaman and Nicobar Islands", fiscalYear, value, url: islandReceipts,
    metric: "Revenue receipts", status: "Reported by the Home Minister to Parliament",
  })),
  plan("Andaman and Nicobar Islands", 1972, 363.17, plan1972),
  plan("Andaman and Nicobar Islands", 1978, 1057, "https://mha.gov.in/files/annual_reports_documents/REPORT_1978_79_12022021.pdf"),
  plan("Andaman and Nicobar Islands", 1985, 3350, "https://mha.gov.in/files/annual_reports_documents/REPORT_1986_87_12022021.pdf"),
];
const goa = "Goa, Daman and Diu (Union territory)";
marketFiscalReferences.goa = [
  { name: goa, fiscalYear: 1962, value: 501, metric: "Revenue receipts", status: "Estimate in the Union interim budget for 1962–63",
    url: "https://eparlib.sansad.in/bitstream/123456789/239/1/Budget_Speech_Interim_1962-63.pdf" },
  plan(goa, 1971, 835, plan1972), plan(goa, 1972, 980, plan1972),
  plan(goa, 1978, 2750, plan1978), plan(goa, 1985, 6400, plan1985),
];
marketFiscalReferences.lakshadweep = [
  plan("Laccadive, Minicoy and Amindivi Islands", 1972, 45, plan1972),
  plan("Lakshadweep", 1978, 244, plan1978), plan("Lakshadweep", 1985, 765, plan1985),
];
marketFiscalReferences.pondicherry = [
  { ...plan("Pondicherry", 1955, 73.96, "https://pandr.py.gov.in/sites/default/files/Sectoral%20Document%202019-2020.pdf#page=8"), status: "Annual Plan outlay recorded by Pondicherry's Planning Department" },
  plan("Pondicherry", 1968, 218, "https://www.publicationsdivision.nic.in/journals/Journalarchives/Yojana/Yojana-English/1968/August/Yojana_1968_August_pdf.pdf"),
  plan("Pondicherry", 1970, 264, "https://www.publicationsdivision.nic.in/journals/Journalarchives/Yojana/Yojana-English/1970/September/Yojana_1970_September_pdf.pdf"),
  plan("Pondicherry", 1972, 348.48, plan1972), plan("Pondicherry", 1978, 1090, plan1978), plan("Pondicherry", 1985, 3300, plan1985),
];
marketFiscalReferences.mizoram.unshift(plan("Mizoram (Union territory)", 1972, 437, plan1972));
