"use client";

import { useImperativeHandle, useMemo, useRef } from "react";
import { renderMarkdown } from "@/lib/markdown/render";

export interface PreviewHandle {
  scrollToLine: (line: number, fraction: number) => void;
}

const PAD = 48; // matches the editor's top padding so line N sits at the same height in both panes

export function Preview({ source, ref }: { source: string; ref?: React.Ref<PreviewHandle> }) {
  const root = useRef<HTMLDivElement>(null);
  const html = useMemo(() => renderMarkdown(source), [source]);

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
    <div ref={root} className="h-full overflow-y-auto" tabIndex={-1}>
      {source.trim() ? (
        // Sanitized in renderMarkdown.
        <article className="prose-datmd" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="prose-datmd text-subtle-foreground">Nothing to preview yet.</p>
      )}
    </div>
  );
}
