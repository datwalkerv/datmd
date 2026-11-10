"use client";

import { useRef, useState } from "react";

/** Text field that replaces a label while renaming. Enter/blur commits, Esc cancels. */
export function InlineRename({ value, onDone, label }: { value: string; onDone: (next: string | null) => void; label: string }) {
  const [text, setText] = useState(value);
  const done = useRef(false);
  const finish = (next: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(next);
  };
  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: rename was explicitly requested
      autoFocus
      aria-label={label}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => finish(text)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish(text);
        if (e.key === "Escape") finish(null);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="h-7 w-full min-w-0 rounded-sm border border-ring bg-input px-1.5 text-[13.5px] text-foreground outline-none"
    />
  );
}
