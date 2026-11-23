import { Fiscal } from "./fiscal.js";
import { marketFiscalReferences } from "./market-fiscal-references.js";

// An AI exchange administers one tenth of the playable regional works envelope.
// Historical state receipts are a reference, not money credited in full to it.
const marketShare = .10;
const rates = { "Annual Plan outlay": .005, "Revenue receipts": .0005 };

function profileFor(id, year) {
  if (["bihar", "orissa", "up", "mayurbhanj", "maharashtra", "gujarat", "haryana"].includes(id)) return id;
  if (id === "bengal") return year >= 1947 ? "west-bengal" : null;
  if (id === "bombay") return "bombay";
  if (id === "central") return year < 1956 ? "central" : "central-reorganized";
  if (id === "punjab") return year < 1947 ? "punjab-colonial" : year < 1956 ? "east-punjab" : year < 1966 ? "punjab-enlarged" : "punjab";
  if (id === "madras") return year < 1953 ? "madras" : year < 1956 ? "madras-residual" : "tamil-nadu";
  if (id === "andhra") return year < 1956 ? "andhra-state" : "andhra-pradesh";
  if (id === "assam") return year < 1947 ? "assam" : year < 1963 ? "assam-post-partition" : year < 1972 ? "assam-post-nagaland" : "assam-reorganized";
  return null;
}

export function marketFunding(id, year) {
  const profile = profileFor(id, year);
  const regional = profile ? Fiscal.envelope(profile, year) : null;
  const knownRegional = regional?.historic.fiscalYear <= year ? regional : null;
  const record = marketFiscalReferences[id]?.findLast(({ fiscalYear }) => fiscalYear <= year);
  if (record && (!knownRegional || record.fiscalYear > knownRegional.historic.fiscalYear)) {
    const share = rates[record.metric];
    if (!share) throw new RangeError(`Unsupported market fiscal measure: ${record.metric}`);
    return { allocation: Math.max(1, Math.round(record.value * share)), year,
      reference: { ...record }, share,
      basis: record.metric === "Annual Plan outlay" ? "0.5% of the recorded annual Plan outlay" : "0.05% of recorded revenue receipts" };
  }
  if (knownRegional) {
    const { historic, total } = knownRegional;
    return { allocation: Math.max(1, Math.round(total * marketShare)), year,
      reference: { name: historic.name, fiscalYear: historic.fiscalYear, value: historic.revenue,
        metric: "Revenue receipts", status: historic.status, url: historic.url },
      share: marketShare, basis: "10% of the modeled regional works allocation" };
  }
  return { allocation: 1, year, reference: null, share: null, basis: "Modeled allowance; no fiscal reference is recorded for this period" };
}
