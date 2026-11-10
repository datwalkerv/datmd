"use client";

import "katex/dist/katex.min.css";
import { useColorScheme } from "datui";
import { useImperativeHandle, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { getRates, requestRates, subscribeRates } from "@/lib/calculations/rates";
import { hydrateMermaid } from "@/lib/markdown/mermaid";
import { renderMarkdown } from "@/lib/markdown/render";

export interface PreviewHandle {
  scrollToLine: (line: number, fraction: number) => void;
}

const PAD = 48; // matches the editor's top padding so line N sits at the same height in both panes

export function Preview({
  source,
  ref,
  onScrollLine,
  calculations = true,
}: {
  source: string;
  calculations?: boolean;
  ref?: React.Ref<PreviewHandle>;
  /** Source line of the first block visible at the top. */
  onScrollLine?: (line: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const reportScroll = () => {
    if (!onScrollLine) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = root.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + PAD + 8; // just below where scrollToLine puts a block
      for (const n of el.querySelectorAll<HTMLElement>("[data-line]")) {
        if (n.getBoundingClientRect().bottom > top) return onScrollLine(Number(n.dataset.line));
      }
    });
  };
  const rates = useSyncExternalStore(subscribeRates, getRates, () => null);
  const dark = useColorScheme() === "dark";
  const html = useMemo(
    () => renderMarkdown(source, calculations ? { calc: { rates, onNeedRates: requestRates } } : {}),
    [source, rates, calculations],
  );

  // Diagrams are drawn after each render (from cache when unchanged, so typing doesn't flicker them).
  useLayoutEffect(() => {
    if (root.current && html.includes("language-mermaid")) void hydrateMermaid(root.current, dark);
  }, [html, dark]);

  useImperativeHandle(ref, () => ({
    scrollToLine(line, fraction) {
      const el = root.current;
      if (!el) return;
      const base = el.getBoundingClientRect().top - el.scrollTop;
      const top = (n: HTMLElement) => n.getBoundingClientRect().top - base;
      let a: HTMLElement | undefined;
      let b: HTMLElement | undefined;
      for (const n of el.querySelectorAll<HTMLElement>("[data-line]")) {
        if (Number(n.dataset.line) <= line) a = n;
        else {
          b = n;
          break;
        }
      }
      if (!a) return void (el.scrollTop = 0);
      const la = Number(a.dataset.line);
      const t = b ? top(a) + (top(b) - top(a)) * ((line + fraction - la) / (Number(b.dataset.line) - la)) : top(a);
      el.scrollTop = t - PAD;
    },
  }));

  return (
    <div ref={root} className="h-full overflow-y-auto" tabIndex={-1} onScroll={reportScroll}>
      {source.trim() ? (
        // Sanitized in renderMarkdown.
        <article className="prose-datmd" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="prose-datmd text-subtle-foreground">Nothing to preview yet.</p>
      )}
    </div>
  );
}
