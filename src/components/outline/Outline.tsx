"use client";

import { cn } from "datui";
import type { Heading } from "@/lib/markdown/outline";

export function Outline({ headings, active, onSelect }: { headings: Heading[]; active: number; onSelect: (h: Heading, i: number) => void }) {
  const min = Math.min(...headings.map((h) => h.level));
  return (
    <aside aria-label="Outline" className="w-[232px] shrink-0 overflow-y-auto border-l border-separator px-2 py-5">
      <h2 className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Outline</h2>
      {headings.length ? (
        <ul>
          {headings.map((h, i) => (
            <li key={`${h.line}-${h.text}`}>
              <button
                type="button"
                aria-current={i === active ? "location" : undefined}
                onClick={() => onSelect(h, i)}
                style={{ paddingLeft: 8 + (h.level - min) * 12 }}
                className={cn(
                  "relative block w-full truncate rounded-sm py-1 pr-2 text-left text-[12.5px] leading-snug outline-none transition-colors hover:text-foreground focus-visible:focus-ring",
                  i === active ? "font-medium text-foreground" : "text-muted-foreground",
                  i === active && "before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
                )}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 text-[12.5px] leading-snug text-subtle-foreground">Headings you write will show up here.</p>
      )}
    </aside>
  );
}
