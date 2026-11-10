"use client";

import { cn } from "datui";
import { useMemo } from "react";
import { setPrefs, usePrefs } from "@/hooks/usePrefs";
import { textStats } from "@/lib/markdown/stats";
import { MOD } from "./EditorHeader";

const fmt = (n: number) => n.toLocaleString();

export function StatusBar({ text, focus, showTypewriter }: { text: string; focus: boolean; showTypewriter: boolean }) {
  const { typewriter } = usePrefs();
  const s = useMemo(() => textStats(text), [text]);
  return (
    <footer
      className={cn(
        "flex h-8 shrink-0 items-center gap-4 px-4 text-[12px] text-subtle-foreground tabular-nums transition-opacity duration-normal",
        focus && "opacity-0 hover:opacity-100 focus-within:opacity-100",
      )}
    >
      {showTypewriter && (
        <button
          type="button"
          aria-pressed={typewriter}
          title={`Typewriter mode (${MOD}⌥T)`}
          onClick={() => setPrefs({ typewriter: !typewriter })}
          className={cn("rounded-xs outline-none transition-colors hover:text-foreground focus-visible:focus-ring", typewriter && "text-foreground")}
        >
          Typewriter {typewriter ? "on" : "off"}
        </button>
      )}
      <span className="ml-auto" aria-live="off">
        {fmt(s.words)} {s.words === 1 ? "word" : "words"}
      </span>
      <span className="max-sm:hidden">{fmt(s.characters)} characters</span>
      <span>{s.readingMinutes ? `${s.readingMinutes} min read` : "—"}</span>
    </footer>
  );
}
