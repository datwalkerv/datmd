"use client";

import { ModalPage, Search, cn } from "datui";
import { FileText } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/app/context";
import { type SearchHit, searchDocs } from "@/lib/search/search";
import { Highlighted } from "./Highlighted";

const RECENT = 8;
const when = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { docs, folders, open: openDoc } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const deferred = useDeferredValue(query);
  const list = useRef<HTMLUListElement>(null);

  const hits: SearchHit[] = useMemo(() => {
    if (deferred.trim()) return searchDocs(docs, deferred);
    return [...docs]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, RECENT)
      .map((doc) => ({ doc, score: 0, titleRanges: [], snippet: doc.content.slice(0, 140).replace(/\s+/g, " ").trim(), snippetRanges: [] }));
  }, [docs, deferred]);

  useEffect(() => setSelected(0), [deferred]);
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const choose = (hit?: SearchHit) => {
    if (!hit) return;
    openDoc(hit.doc.id);
    onClose();
  };

  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name;

  return (
    <ModalPage open={open} onClose={onClose} size="m" hideCloseButton aria-label="Search notes" className="md:mt-[10vh] md:self-start">
      <div className="border-b border-separator p-2">
        <Search
          // biome-ignore lint/a11y/noAutofocus: the palette exists to be typed into
          autoFocus
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          role="combobox"
          aria-expanded
          aria-controls="search-results"
          aria-activedescendant={hits[selected] ? `search-hit-${selected}` : undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const n = hits.length;
              if (n) setSelected((s) => (s + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(hits[selected]);
            }
          }}
        />
      </div>

      <div className="max-h-[min(60vh,520px)] overflow-y-auto p-1.5">
        {!query.trim() && hits.length > 0 && <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Recent</p>}
        <ul ref={list} id="search-results" role="listbox" aria-label="Results">
          {hits.map((hit, i) => (
            <li
              key={hit.doc.id}
              id={`search-hit-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === selected}
              onMouseMove={() => setSelected(i)}
              onClick={() => choose(hit)}
              className={cn("flex cursor-pointer gap-3 rounded-md px-3 py-2.5", i === selected && "bg-secondary")}
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-icon-tertiary" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[14px] font-medium">
                    <Highlighted text={hit.doc.title} ranges={hit.titleRanges} />
                  </span>
                  <span className="ml-auto shrink-0 text-[11.5px] text-subtle-foreground">
                    {[folderName(hit.doc.folderId), when(hit.doc.updatedAt)].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {hit.snippet && (
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                    <Highlighted text={hit.snippet} ranges={hit.snippetRanges} />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {query.trim() && !hits.length && (
          <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No notes match “{query.trim()}”.</p>
        )}
        {!query.trim() && !hits.length && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No notes yet.</p>}
      </div>

      <div className="flex gap-4 border-t border-separator px-4 py-2 text-[11.5px] text-subtle-foreground max-md:hidden">
        <span>↑↓ to navigate</span>
        <span>↵ to open</span>
        <span>esc to close</span>
      </div>
    </ModalPage>
  );
}
