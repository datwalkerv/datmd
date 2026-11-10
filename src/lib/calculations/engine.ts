import { CURRENCY_SYMBOLS, type Unit, convertUnit, findCurrency, findUnit } from "./units";

/* Safe arithmetic for inline calculations: tokenizer → recursive-descent parser → evaluator. No eval(). */

export type Rates = Record<string, number>; // units per 1 EUR

export class CalcError extends Error {
  constructor(public kind: "syntax" | "invalid" | "rates") {
    super(kind);
  }
}

type Tok = { k: "num"; v: number } | { k: "id"; v: string } | { k: "op"; v: string } | { k: "sym"; v: string };

const NUM = /^(?:0x[0-9a-f]+|0b[01]+|0o[0-7]+|(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)/i;
const ID = /^[\p{L}°_][\p{L}\p{N}_]*/u;
const SYM = /^[$€£¥₹₩₺₪]/u;
const OP = /^(?:\*\*|[-+−*×·/÷^%(),])/;

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let s = src.trim();
  while (s) {
    let m: RegExpExecArray | null;
    if ((m = /^\s+/.exec(s))) {
    } else if ((m = NUM.exec(s))) {
      const raw = m[0].replace(/,/g, "");
      out.push({ k: "num", v: /^0[box]/i.test(raw) ? Number(raw.toLowerCase()) : Number.parseFloat(raw) });
    } else if ((m = ID.exec(s))) out.push({ k: "id", v: m[0] });
    else if ((m = SYM.exec(s))) out.push({ k: "sym", v: m[0] });
    else if ((m = OP.exec(s))) {
      const v = { "**": "^", "−": "-", "×": "*", "·": "*", "÷": "/" }[m[0]] ?? m[0];
      out.push({ k: "op", v });
    } else throw new CalcError("syntax");
    s = s.slice(m[0].length);
  }
  return out;
}

type Target = { kind: "unit"; unit: Unit } | { kind: "cur"; code: string } | { kind: "base"; base: 2 | 8 | 10 | 16 } | { kind: "sci" };

export type Node =
  | { t: "num"; v: number }
  | { t: "const"; v: number }
  | { t: "unit"; e: Node; unit: Unit }
  | { t: "cur"; e: Node; code: string }
  | { t: "pct"; e: Node }
  | { t: "neg"; e: Node }
  | { t: "bin"; op: string; l: Node; r: Node }
  | { t: "of"; op: "of" | "off" | "on"; p: Node; e: Node }
  | { t: "call"; fn: string; args: Node[] }
  | { t: "conv"; e: Node; to: Target };

const KEYWORDS = new Set(["in", "to", "as", "into", "of", "off", "on", "mod"]);
const CONSTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };
const FNS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
  floor: Math.floor,
  ceil: Math.ceil,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  min: Math.min,
  max: Math.max,
};
/** Functions whose result keeps the first argument's unit/currency. */
const UNIT_PRESERVING = new Set(["abs", "round", "floor", "ceil", "min", "max"]);

export function parse(src: string): Node {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const isOp = (v: string) => peek()?.k === "op" && peek()!.v === v;
  const isId = (...vs: string[]) => peek()?.k === "id" && vs.includes(String(peek()!.v).toLowerCase());
  const expect = (v: string) => {
    if (!isOp(v)) throw new CalcError("syntax");
    i++;
  };

  function expr(): Node {
    const e = add();
    if (isId("in", "to", "as", "into")) {
      i++;
      return { t: "conv", e, to: target() };
    }
    return e;
  }

  function target(): Target {
    const tok = toks[i++];
    if (tok?.k === "sym") return { kind: "cur", code: CURRENCY_SYMBOLS[tok.v] };
    if (tok?.k !== "id") throw new CalcError("syntax");
    const name = tok.v.toLowerCase();
    if (name === "hex" || name === "hexadecimal") return { kind: "base", base: 16 };
    if (name === "bin" || name === "binary") return { kind: "base", base: 2 };
    if (name === "oct" || name === "octal") return { kind: "base", base: 8 };
    if (name === "dec" || name === "decimal") return { kind: "base", base: 10 };
    if (name === "sci" || name === "scientific") return { kind: "sci" };
    const unit = findUnit(tok.v);
    if (unit) return { kind: "unit", unit };
    const code = findCurrency(tok.v);
    if (code) return { kind: "cur", code };
    throw new CalcError("syntax");
  }

  function add(): Node {
    let l = mul();
    while (isOp("+") || isOp("-")) {
      const op = String(toks[i++].v);
      l = { t: "bin", op, l, r: mul() };
    }
    return l;
  }

  function mul(): Node {
    let l = of();
    while (isOp("*") || isOp("/") || isId("mod")) {
      const op = String(toks[i++].v).toLowerCase();
      l = { t: "bin", op, l, r: of() };
    }
    return l;
  }

  function of(): Node {
    const p = unary();
    if (isId("of", "off", "on")) {
      const op = String(toks[i++].v).toLowerCase() as "of" | "off" | "on";
      return { t: "of", op, p, e: of() };
    }
    return p;
  }

  function unary(): Node {
    if (isOp("-") || isOp("+")) {
      const neg = toks[i++].v === "-";
      const e = unary();
      return neg ? { t: "neg", e } : e;
    }
    return pow();
  }

  function pow(): Node {
    const b = postfix();
    if (isOp("^")) {
      i++;
      return { t: "bin", op: "^", l: b, r: unary() };
    }
    return b;
  }

  function postfix(): Node {
    let e = primary();
    const tok = peek();
    if (tok?.k === "id" && !KEYWORDS.has(tok.v.toLowerCase())) {
      const unit = findUnit(tok.v);
      const code = unit ? undefined : findCurrency(tok.v);
      if (unit) e = { t: "unit", e, unit };
      else if (code) e = { t: "cur", e, code };
      if (unit || code) i++;
    } else if (tok?.k === "sym") {
      i++;
      e = { t: "cur", e, code: CURRENCY_SYMBOLS[tok.v] };
    }
    if (isOp("%")) {
      i++;
      e = { t: "pct", e };
    }
    return e;
  }

  function primary(): Node {
    const tok = toks[i++];
    if (!tok) throw new CalcError("syntax");
    if (tok.k === "num") return { t: "num", v: tok.v };
    if (tok.k === "sym") {
      const inner = primary();
      return { t: "cur", e: inner, code: CURRENCY_SYMBOLS[tok.v] };
    }
    if (tok.k === "op" && tok.v === "(") {
      const e = expr();
      expect(")");
      return e;
    }
    if (tok.k === "id") {
      const name = tok.v.toLowerCase();
      if (FNS[name] && isOp("(")) {
        i++;
        const args = [expr()];
        while (isOp(",")) {
          i++;
          args.push(expr());
        }
        expect(")");
        return { t: "call", fn: name, args };
      }
      if (name in CONSTS) return { t: "const", v: CONSTS[name] };
    }
    throw new CalcError("syntax");
  }

  const root = expr();
  if (i !== toks.length) throw new CalcError("syntax");
  return root;
}

/** Whether a line is a calculation rather than just a number or a quantity. */
export function isComputation(n: Node): boolean {
  switch (n.t) {
    case "bin":
    case "of":
    case "call":
    case "conv":
      return true;
    case "num":
    case "const":
      return false;
    default:
      return isComputation(n.e);
  }
}

export interface Value {
  n: number;
  unit?: Unit;
  cur?: string;
  pct?: boolean;
  fmt?: "hex" | "bin" | "oct" | "sci";
}

function convertCurrency(n: number, from: string, to: string, rates: Rates | null): number {
  if (from === to) return n;
  const a = from === "EUR" ? 1 : rates?.[from];
  const b = to === "EUR" ? 1 : rates?.[to];
  if (!rates) throw new CalcError("rates");
  if (!a || !b) throw new CalcError("invalid");
  return (n / a) * b;
}

const plain = (v: Value) => !v.unit && !v.cur && !v.pct;
const check = (n: number): number => {
  if (!Number.isFinite(n)) throw new CalcError("invalid");
  return n;
};

/** Brings b into a's unit/currency so they can be added or compared. */
function align(a: Value, b: Value, rates: Rates | null): number {
  if (a.unit && b.unit) {
    if (a.unit.dim !== b.unit.dim) throw new CalcError("invalid");
    return convertUnit(b.n, b.unit, a.unit);
  }
  if (a.cur && b.cur) return convertCurrency(b.n, b.cur, a.cur, rates);
  if ((a.unit && b.cur) || (a.cur && b.unit)) throw new CalcError("invalid");
  if (!a.unit && !a.cur && (b.unit || b.cur)) throw new CalcError("invalid"); // 3 + 5 km is ambiguous
  return b.n; // b is plain: "5 km + 3" means 3 km
}

export function evaluate(node: Node, rates: Rates | null): Value {
  const ev = (n: Node) => evaluate(n, rates);
  switch (node.t) {
    case "num":
    case "const":
      return { n: node.v };
    case "neg": {
      const v = ev(node.e);
      return { ...v, n: -v.n };
    }
    case "unit": {
      const v = ev(node.e);
      if (!plain(v)) throw new CalcError("invalid");
      return { n: v.n, unit: node.unit };
    }
    case "cur": {
      const v = ev(node.e);
      if (!plain(v)) throw new CalcError("invalid");
      return { n: v.n, cur: node.code };
    }
    case "pct": {
      const v = ev(node.e);
      if (!plain(v)) throw new CalcError("invalid");
      return { n: v.n, pct: true };
    }
    case "of": {
      const p = ev(node.p);
      const e = ev(node.e);
      if (!p.pct || e.pct) throw new CalcError("invalid");
      const k = node.op === "of" ? p.n / 100 : node.op === "off" ? 1 - p.n / 100 : 1 + p.n / 100;
      return { ...e, n: check(e.n * k) };
    }
    case "call": {
      const args = node.args.map(ev);
      const first = args[0];
      if (UNIT_PRESERVING.has(node.fn)) {
        const ns = args.map((a) => (a === first ? a.n : align(first, a, rates)));
        return { ...first, n: check(FNS[node.fn](...ns)) };
      }
      if (!args.every(plain)) throw new CalcError("invalid");
      return { n: check(FNS[node.fn](...args.map((a) => a.n))) };
    }
    case "bin": {
      const a = ev(node.l);
      const b = ev(node.r);
      switch (node.op) {
        case "+":
        case "-": {
          const sign = node.op === "+" ? 1 : -1;
          if (b.pct && !a.pct) return { ...a, n: check(a.n * (1 + (sign * b.n) / 100)) };
          if (a.pct !== b.pct) throw new CalcError("invalid");
          return { ...a, n: check(a.n + sign * align(a, b, rates)) };
        }
        case "*": {
          if (b.pct && !a.pct) return { ...a, n: check((a.n * b.n) / 100) };
          if (a.pct && !b.pct) return { ...b, n: check((a.n * b.n) / 100) };
          if (!plain(a) && !plain(b)) throw new CalcError("invalid");
          return { ...(plain(a) ? b : a), n: check(a.n * b.n) };
        }
        case "/": {
          if (b.n === 0) throw new CalcError("invalid");
          if (plain(b)) return { ...a, n: check(a.n / b.n) };
          if (plain(a) || a.pct || b.pct) throw new CalcError("invalid");
          return { n: check(a.n / align(a, b, rates)) }; // same kind → ratio
        }
        case "mod": {
          if (!plain(b) || b.n === 0) throw new CalcError("invalid");
          return { ...a, n: check(a.n % b.n) };
        }
        case "^": {
          if (!plain(a) || !plain(b)) throw new CalcError("invalid");
          return { n: check(a.n ** b.n) };
        }
      }
      throw new CalcError("syntax");
    }
    case "conv": {
      const v = ev(node.e);
      const to = node.to;
      if (to.kind === "unit") {
        if (!v.unit || v.unit.dim !== to.unit.dim) throw new CalcError("invalid");
        return { n: check(convertUnit(v.n, v.unit, to.unit)), unit: to.unit };
      }
      if (to.kind === "cur") {
        if (!v.cur) throw new CalcError("invalid");
        return { n: check(convertCurrency(v.n, v.cur, to.code, rates)), cur: to.code };
      }
      if (!plain(v)) throw new CalcError("invalid");
      if (to.kind === "sci") return { n: v.n, fmt: "sci" };
      if (to.base === 10) return { n: v.n };
      if (!Number.isInteger(v.n)) throw new CalcError("invalid");
      return { n: v.n, fmt: ({ 16: "hex", 2: "bin", 8: "oct" } as const)[to.base] };
    }
  }
}

const exp = (n: number, digits: number) => n.toExponential(digits).replace(/\.?0+e/, "e").replace("e+", "e");

export function formatNumber(value: number, locale?: string): string {
  const n = Number(value.toPrecision(12)); // drop float noise: 32 °F → 0 °C, not 5.7e-14
  const abs = Math.abs(n);
  if (abs < 1e-9) return "0";
  if (abs >= 1e15 || abs < 1e-6) return exp(n, 4);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}

export function formatValue(v: Value, locale?: string): string {
  if (v.fmt === "hex" || v.fmt === "bin" || v.fmt === "oct") {
    const base = { hex: 16, bin: 2, oct: 8 }[v.fmt];
    const prefix = { hex: "0x", bin: "0b", oct: "0o" }[v.fmt];
    return `${v.n < 0 ? "-" : ""}${prefix}${Math.abs(v.n).toString(base).toUpperCase()}`;
  }
  if (v.fmt === "sci") return exp(v.n, 6);
  if (v.cur) {
    return new Intl.NumberFormat(locale, { style: "currency", currency: v.cur, maximumFractionDigits: 2 }).format(v.n);
  }
  const num = formatNumber(v.n, locale);
  if (v.pct) return `${num}%`;
  if (v.unit) return v.unit.label.startsWith("°") ? `${num}${v.unit.label}` : `${num} ${v.unit.label}`;
  return num;
}

/** Whether evaluating this needs exchange rates (any currency conversion between different codes). */
export function usesCurrency(n: Node): boolean {
  switch (n.t) {
    case "cur":
      return true;
    case "num":
    case "const":
      return false;
    case "bin":
      return usesCurrency(n.l) || usesCurrency(n.r);
    case "of":
      return usesCurrency(n.p) || usesCurrency(n.e);
    case "call":
      return n.args.some(usesCurrency);
    default:
      return usesCurrency(n.e);
  }
}
