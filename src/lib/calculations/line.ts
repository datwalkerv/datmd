import { CalcError, type Rates, evaluate, formatValue, isComputation, parse } from "./engine";

export type CalcResult = { kind: "value"; text: string } | { kind: "rates" };

const PREFIX = /^\s*(?:>\s*)*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?/;
const LABEL = /^([^:=]{1,40}):(?:\*\*|__)?\s+(.+)$/; // "Rent: …", "**Total:** …"
// Look like calculations but usually aren't: dates, ranges, phone numbers, version numbers.
const NOT_MATH = [/^\d+(?:[-/.]\d+){2,}$/, /^\d+-\d+$/];

const cache = new Map<string, CalcResult | null>();
const CACHE_MAX = 1000;

function tryExpr(src: string, rates: Rates | null, locale?: string): CalcResult | null | undefined {
  const s = src.replace(/^(\*\*|__)\s*/, "").replace(/\s*=\s*$/, "").trim();
  if (!s || NOT_MATH.some((re) => re.test(s))) return null;
  let node: ReturnType<typeof parse>;
  try {
    node = parse(s);
  } catch {
    return undefined; // not an expression at all
  }
  if (!isComputation(node)) return null;
  try {
    return { kind: "value", text: formatValue(evaluate(node, rates), locale) };
  } catch (e) {
    return e instanceof CalcError && e.kind === "rates" ? { kind: "rates" } : null;
  }
}

/**
 * Result for one line of a document, or null when the line isn't a calculation.
 * Accepts markdown list/quote/task prefixes and an optional "Label: " before the expression.
 */
export function calcLine(line: string, rates: Rates | null, locale?: string): CalcResult | null {
  const text = line.replace(PREFIX, "").trim();
  if (!text || text.length > 200 || !/\d|\b(?:pi|e)\b/.test(text)) return null;
  const key = `${rates ? "r" : "-"}|${locale}|${text}`;
  if (cache.has(key)) return cache.get(key)!;

  let result = tryExpr(text, rates, locale);
  if (result === undefined) {
    const m = LABEL.exec(text);
    result = m ? (tryExpr(m[2], rates, locale) ?? null) : null;
  }

  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(key, result);
  return result;
}

/** Call when rates change so cached "rates unavailable" results are recomputed. */
export const clearCalcCache = () => cache.clear();
