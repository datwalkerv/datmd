export type Dim = "length" | "mass" | "volume" | "time" | "temperature" | "data";

export interface Unit {
  dim: Dim;
  label: string;
  /** base = value * factor + offset */
  factor: number;
  offset?: number;
}

// [label, factor, ...aliases]; short aliases (≤ 2 chars) are case-sensitive, longer ones are not.
const TABLE: Record<Dim, [string, number, ...string[]][]> = {
  length: [
    ["mm", 0.001, "millimeter", "millimeters", "millimetre", "millimetres"],
    ["cm", 0.01, "centimeter", "centimeters", "centimetre", "centimetres"],
    ["m", 1, "meter", "meters", "metre", "metres"],
    ["km", 1000, "kilometer", "kilometers", "kilometre", "kilometres"],
    ["in", 0.0254, "inch", "inches"],
    ["ft", 0.3048, "foot", "feet"],
    ["yd", 0.9144, "yard", "yards"],
    ["mi", 1609.344, "mile", "miles"],
    ["nmi", 1852, "nautical"],
  ],
  mass: [
    ["mg", 0.001, "milligram", "milligrams"],
    ["g", 1, "gram", "grams"],
    ["kg", 1000, "kilogram", "kilograms", "kilo", "kilos"],
    ["t", 1e6, "tonne", "tonnes", "ton", "tons"],
    ["oz", 28.349523125, "ounce", "ounces"],
    ["lb", 453.59237, "lbs", "pound", "pounds"],
    ["st", 6350.29318, "stone", "stones"],
  ],
  volume: [
    ["ml", 0.001, "mL", "milliliter", "milliliters", "millilitre", "millilitres"],
    ["cl", 0.01, "centiliter", "centiliters"],
    ["dl", 0.1, "deciliter", "deciliters"],
    ["l", 1, "L", "liter", "liters", "litre", "litres"],
    ["gal", 3.785411784, "gallon", "gallons"],
    ["qt", 0.946352946, "quart", "quarts"],
    ["pt", 0.473176473, "pint", "pints"],
    ["cup", 0.2365882365, "cups"],
    ["tbsp", 0.01478676478, "tablespoon", "tablespoons"],
    ["tsp", 0.00492892159, "teaspoon", "teaspoons"],
  ],
  time: [
    ["ms", 0.001, "millisecond", "milliseconds"],
    ["s", 1, "sec", "secs", "second", "seconds"],
    ["min", 60, "mins", "minute", "minutes"],
    ["h", 3600, "hr", "hrs", "hour", "hours"],
    ["days", 86400, "d", "day"],
    ["weeks", 604800, "wk", "week"],
    ["months", 2629746, "month"],
    ["years", 31556952, "yr", "yrs", "year"],
  ],
  temperature: [
    ["°C", 1, "C", "celsius"],
    ["°F", 5 / 9, "F", "fahrenheit"],
    ["K", 1, "kelvin"],
  ],
  data: [
    ["bit", 0.125, "bits"],
    ["B", 1, "byte", "bytes"],
    ["kB", 1e3, "KB"],
    ["MB", 1e6],
    ["GB", 1e9],
    ["TB", 1e12],
    ["KiB", 1024],
    ["MiB", 1024 ** 2],
    ["GiB", 1024 ** 3],
    ["TiB", 1024 ** 4],
  ],
};

const OFFSETS: Record<string, number> = { "°C": 273.15, "°F": 459.67 * (5 / 9) };

const exact = new Map<string, Unit>();
const folded = new Map<string, Unit>();
for (const [dim, rows] of Object.entries(TABLE) as [Dim, [string, number, ...string[]][]][]) {
  for (const [label, factor, ...aliases] of rows) {
    const unit: Unit = { dim, label, factor, offset: OFFSETS[label] };
    for (const name of [label, ...aliases]) {
      exact.set(name, unit);
      if (name.length > 2) folded.set(name.toLowerCase(), unit);
    }
  }
}

export const findUnit = (name: string): Unit | undefined => exact.get(name) ?? (name.length > 2 ? folded.get(name.toLowerCase()) : undefined);

export const convertUnit = (n: number, from: Unit, to: Unit) => (n * from.factor + (from.offset ?? 0) - (to.offset ?? 0)) / to.factor;

/** Currencies the rates API (ECB via Frankfurter) covers. */
export const CURRENCIES = new Set(
  "AUD BGN BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN RON SEK SGD THB TRY USD ZAR".split(" "),
);

export const CURRENCY_SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR", "₩": "KRW", "₺": "TRY", "₪": "ILS" };

const CURRENCY_WORDS: Record<string, string> = {
  dollar: "USD",
  dollars: "USD",
  euro: "EUR",
  euros: "EUR",
  ft: "HUF",
  forint: "HUF",
  yen: "JPY",
};

export function findCurrency(name: string): string | undefined {
  const upper = name.toUpperCase();
  if (name.length === 3 && CURRENCIES.has(upper)) return upper;
  return CURRENCY_WORDS[name.toLowerCase()];
}
