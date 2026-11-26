import { stateRevenueReferences } from "./state-revenue-references.js";

const plan1972 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1972_73_12022021.pdf#page=50";
const plan1980 = "https://mha.gov.in/files/annual_reports_documents/REPORT_1980_81_12022021.pdf#page=27";
const islandReceipts = "https://eparlib.sansad.in/bitstream/123456789/2638332/1/01_II_16-12-1952_p21_p22_u699.pdf";
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
marketFiscalReferences.mizoram.unshift(plan("Mizoram (Union territory)", 1972, 437, plan1972));
