import type { Element, ElementContent, Root, Text } from "hast";
import { visit } from "unist-util-visit";
import type { Rates } from "@/lib/calculations/engine";
import { calcLine } from "@/lib/calculations/line";

export interface CalcOptions {
  rates: Rates | null;
  locale?: string;
  /** Called when a line needs exchange rates that aren't loaded yet. */
  onNeedRates?: () => void;
}

const BLOCK = new Set(["ul", "ol", "p", "pre", "blockquote", "table", "div"]);

const resultSpan = (text: string, pending: boolean): Element => ({
  type: "element",
  tagName: "span",
  properties: { className: pending ? ["calc-result", "calc-pending"] : ["calc-result"], ariaLabel: pending ? "Exchange rates unavailable" : `equals ${text}` },
  children: [{ type: "text", value: pending ? "rates unavailable" : text }],
});

/**
 * Appends calculation results after lines that are expressions. Presentation only: it runs on the rendered tree,
 * never on the markdown source. Only blocks made of plain text are considered, so prose with formatting is left alone.
 */
export function addCalculations(tree: Root, { rates, locale, onNeedRates }: CalcOptions) {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "p" && node.tagName !== "li" && node.tagName !== "td") return;
    const inline = node.children.filter(
      (c) => !(c.type === "element" && (BLOCK.has(c.tagName) || (c.tagName === "input" && c.properties.type === "checkbox"))),
    );
    if (!inline.length || !inline.every((c) => c.type === "text")) return;

    const out: ElementContent[] = [];
    for (const child of node.children) {
      if (child.type !== "text") {
        out.push(child);
        continue;
      }
      const lines = (child as Text).value.split("\n");
      lines.forEach((line, i) => {
        out.push({ type: "text", value: line });
        const r = calcLine(line, rates, locale);
        if (r?.kind === "value") out.push(resultSpan(r.text, false));
        if (r?.kind === "rates") {
          out.push(resultSpan("", true));
          onNeedRates?.();
        }
        if (i < lines.length - 1) out.push({ type: "text", value: "\n" });
      });
    }
    node.children = out;
  });
}
