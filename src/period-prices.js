// RBI, "Wholesale Price Index – 1952-53 to 2004-05", 3 March 2006.
// All Commodities, annual average of weeks; every observation below is from
// this one edition. FY labels use the starting year, as campaign turns do.
const url = "https://www.rbi.org.in/scripts/PublicationsView.aspx?id=8241";
export const openingPriceYear = 1952;

// The standalone siting challenge keeps its original prices.
export const campaignPriceYear = (game) => game.journey ? game.year : openingPriceYear;

const series1952 = [100.0, 104.6, 97.5, 92.4, 105.3, 108.4, 112.8, 117.1, 124.8, 125.1];
const series1961 = [100.0, 103.8, 110.2, 122.3, 131.6, 149.9, 167.3, 165.4, 171.6, 181.1];
const series1970 = [100.0, 105.6, 116.2, 139.7, 174.9, 173.0, 176.6, 185.8, 185.8, 217.6, 257.3, 281.3];
const series1981 = [100.0, 104.9, 112.8, 120.1, 125.4];

// Link at the overlapping FY1961, FY1970 and FY1981 observations, rather
// than comparing numbers with different base years. The display base is
// FY1970–71 = 100. Retain precision until a transaction is rounded.
const index = new Map();
const link1961 = series1961.at(-1);
const link1952 = series1952.at(-1);
const link1981 = series1970.at(-1);
series1952.forEach((value, offset) => index.set(1952 + offset, value / link1952 * 100 / link1961 * 100));
series1961.forEach((value, offset) => index.set(1961 + offset, value / link1961 * 100));
series1970.forEach((value, offset) => index.set(1970 + offset, value));
series1981.forEach((value, offset) => index.set(1981 + offset, value / 100 * link1981));

// This linked broad-price series is a modeling proxy, not an observed
// construction, wage, food or programme-cost series. RBI notes changes in
// commodity classifications between bases. Before FY1952–53 the model holds
// its earliest observation; after FY1985–86 it holds the last covered year.
export function priceBasis(year) {
  if (!Number.isInteger(year)) throw new RangeError("A price year must be an integer fiscal starting year.");
  const referenceYear = Math.min(1985, Math.max(1952, year));
  return { year, index: index.get(referenceYear), referenceYear, url, assumed: referenceYear !== year };
}

export function periodAmount(baseLakh, priceYear, year, rounding = Math.round) {
  if (!Number.isFinite(baseLakh) || baseLakh < 0) throw new RangeError("A base amount must be a non-negative number of lakh rupees.");
  const basis = priceBasis(priceYear);
  const current = priceBasis(year);
  if (baseLakh === 0) return 0;
  const converted = baseLakh * (current.index / basis.index);
  const nearest = Math.round(converted);
  return rounding(Math.abs(converted - nearest) <= Number.EPSILON * Math.max(1, converted) * 4 ? nearest : converted);
}
