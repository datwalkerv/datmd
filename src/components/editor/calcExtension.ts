import { syntaxTree } from "@codemirror/language";
import { type EditorState, RangeSetBuilder, StateEffect } from "@codemirror/state";
import { Decoration, type DecorationSet, type EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { calcLine } from "@/lib/calculations/line";
import { getRates, requestRates } from "@/lib/calculations/rates";

/** Dispatch after exchange rates load so results are recomputed. */
export const ratesChanged = StateEffect.define<null>();

class ResultWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly pending: boolean,
  ) {
    super();
  }
  eq(other: ResultWidget) {
    return other.text === this.text && other.pending === this.pending;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = this.pending ? "cm-calc cm-calc-pending" : "cm-calc";
    el.textContent = this.pending ? "rates unavailable" : this.text;
    el.setAttribute("aria-label", this.pending ? "Exchange rates unavailable" : `equals ${this.text}`);
    return el;
  }
  ignoreEvent() {
    return true;
  }
}

// Calculations never run inside code, headings, tables or HTML.
const SKIP = /^(FencedCode|CodeBlock|ATXHeading\d|SetextHeading\d|Table|HTMLBlock|CommentBlock)$/;

function skipLine(state: EditorState, pos: number) {
  for (let n: ReturnType<typeof syntaxTree>["topNode"] | null = syntaxTree(state).resolveInner(pos, 1); n; n = n.parent) {
    if (SKIP.test(n.name)) return true;
  }
  return false;
}

function build(view: EditorView): DecorationSet {
  const rates = getRates();
  const builder = new RangeSetBuilder<Decoration>();
  let needRates = false;
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      if (line.length && /\d/.test(line.text) && !skipLine(view.state, line.from)) {
        const r = calcLine(line.text, rates);
        if (r) {
          needRates ||= r.kind === "rates";
          const widget = new ResultWidget(r.kind === "value" ? r.text : "", r.kind === "rates");
          builder.add(line.to, line.to, Decoration.widget({ widget, side: 1 }));
        }
      }
      pos = line.to + 1;
    }
  }
  if (needRates) requestRates();
  return builder.finish();
}

/** Shows `= result` after lines that are calculations. Widgets only; the document text is never changed. */
export const inlineCalculations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || u.transactions.some((t) => t.effects.some((e) => e.is(ratesChanged)))) {
        this.decorations = build(u.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);
