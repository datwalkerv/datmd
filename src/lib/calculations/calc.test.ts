import { describe, expect, it } from "vitest";
import { calcLine } from "./line";

const rates = { USD: 1.1214, HUF: 362.98, GBP: 0.83545, JPY: 177.38 };
const calc = (s: string, r: typeof rates | null = rates) => {
  const out = calcLine(s, r, "en-US");
  return out?.kind === "value" ? out.text : (out?.kind ?? null);
};

describe("calcLine: the brief's examples", () => {
  it.each([
    ["20 + 30", "50"],
    ["20% of 150", "30"],
    ["5 km in miles", "3.1069 mi"],
    ["sqrt(16)", "4"],
    ["255 in hex", "0xFF"],
  ])("%s = %s", (src, out) => expect(calc(src)).toBe(out));

  it("converts currency with rates", () => {
    expect(calc("$30 in EUR")).toBe("€26.75");
    expect(calc("30 USD to HUF")?.replace(/\s/g, " ")).toBe("HUF 9,710.54"); // Intl uses a no-break space
  });

  it("reports missing rates instead of guessing", () => {
    expect(calc("$30 in EUR", null)).toBe("rates");
    expect(calc("€30 + €5", null)).toBe("€35.00"); // same currency needs no rates
  });
});

describe("calcLine: arithmetic", () => {
  it.each([
    ["2 + 3 * 4", "14"],
    ["(2 + 3) * 4", "20"],
    ["2 ^ 10", "1,024"],
    ["2 ** 3", "8"],
    ["-2 ^ 2", "-4"],
    ["10 / 4", "2.5"],
    ["10 mod 3", "1"],
    ["1,000 * 3", "3,000"],
    ["7 × 6", "42"],
    ["round(2 / 3, 2)", "0.67"],
    ["max(3, 9, 4)", "9"],
    ["2 * pi", "6.2832"],
    ["0xFF + 1", "256"],
    ["10 in binary", "0b1010"],
    ["1e3 + 1", "1,001"],
    ["123456789 * 1000000000", "1.2346e17"],
  ])("%s = %s", (src, out) => expect(calc(src)).toBe(out));
});

describe("calcLine: percentages", () => {
  it.each([
    ["150 + 10%", "165"],
    ["150 - 10%", "135"],
    ["200 * 15%", "30"],
    ["20% off 80", "64"],
    ["$100 + 20%", "$120.00"],
    ["15% of $80", "$12.00"],
  ])("%s = %s", (src, out) => expect(calc(src)).toBe(out));
});

describe("calcLine: units", () => {
  it.each([
    ["100 °C in F", "212°F"],
    ["32 F to C", "0°C"],
    ["1 mi + 1 km", "1.6214 mi"],
    ["2 h + 30 min", "2.5 h"],
    ["90 min in hours", "1.5 h"],
    ["1 GiB in MB", "1,073.74 MB"],
    ["3 kg * 2", "6 kg"],
    ["10 km / 2 km", "5"],
    ["70 kg in lbs", "154.3236 lb"],
  ])("%s = %s", (src, out) => expect(calc(src)).toBe(out));

  it("rejects incompatible units", () => {
    expect(calc("5 km + 3 kg")).toBeNull();
    expect(calc("5 kg in miles")).toBeNull();
    expect(calc("3 + 5 km")).toBeNull();
  });
});

describe("calcLine: detection", () => {
  it("handles markdown prefixes, labels and trailing =", () => {
    expect(calc("- 20 + 30")).toBe("50");
    expect(calc("- [ ] 2 * 4")).toBe("8");
    expect(calc("> 1 + 1")).toBe("2");
    expect(calc("Rent: $1200 + $300")).toBe("$1,500.00");
    expect(calc("**Total:** 5 + 5")).toBe("10");
    expect(calc("20 + 30 =")).toBe("50");
  });

  it.each([
    "Hello world",
    "2026",
    "5 km",
    "$30",
    "20%",
    "2026-11-10",
    "10/11/2026",
    "555-1234",
    "1.2.3",
    "Version 2.0 is out",
    "I ate 3 apples",
    "http://example.com/1+2",
    "10 / 0",
    "",
  ])("%s is not a calculation", (src) => expect(calc(src)).toBeNull());

  it("never executes code", () => {
    expect(calc("constructor.constructor('return 1')() + 1")).toBeNull();
    expect(calc("__proto__ + 1")).toBeNull();
    expect(calc("alert(1) + 1")).toBeNull();
  });
});
