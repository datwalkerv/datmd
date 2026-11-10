"use client";

import { useEffect, useRef, useState } from "react";
import { renameDoc } from "@/lib/storage/docs";
import type { Doc } from "@/lib/storage/types";

/** Inline-editable document title. Commits on Enter/blur, Esc reverts. */
export function TitleInput({ doc, ref }: { doc: Doc; ref?: React.Ref<HTMLInputElement> }) {
  const [value, setValue] = useState(doc.title);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setValue(doc.title);
  }, [doc.title]);

  const commit = () => {
    editing.current = false;
    if (value.trim() !== doc.title) void renameDoc(doc.id, value);
    if (!value.trim()) setValue("Untitled");
  };

  return (
    <input
      ref={ref}
      aria-label="Document title"
      value={value}
      onFocus={(e) => {
        editing.current = true;
        e.currentTarget.select();
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(doc.title);
          editing.current = false;
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
        }
      }}
      size={Math.max(8, value.length)}
      className="min-w-0 max-w-full truncate rounded-sm bg-transparent px-1 py-0.5 text-[14px] font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:focus-ring"
    />
  );
}
