"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "datui";
import { ChevronRight } from "lucide-react";
import { setPrefs, toggleIn, usePrefs } from "@/hooks/usePrefs";

/** Collapsible sidebar group; collapsed state persists. */
export function Section({
  id,
  title,
  dropId,
  children,
}: {
  id: string;
  title: string;
  /** Makes the header a drag-and-drop target (e.g. "folder:none"). Needs a surrounding DndContext. */
  dropId?: string;
  children: React.ReactNode;
}) {
  const collapsed = usePrefs().collapsedSections.includes(id);
  const drop = useDroppable({ id: dropId ?? `section:${id}`, disabled: !dropId });
  return (
    <section className="mt-4 first:mt-1">
      <div
        ref={drop.setNodeRef}
        className={cn("group mx-1.5 flex h-7 items-center rounded-md pr-1 pl-2 transition-colors", drop.isOver && "bg-primary/10 ring-1 ring-primary/40")}
      >
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => setPrefs((p) => ({ collapsedSections: toggleIn(p.collapsedSections, id) }))}
          className="flex flex-1 items-center gap-1 rounded-xs text-left text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase outline-none hover:text-muted-foreground focus-visible:focus-ring"
        >
          {title}
          <ChevronRight className={cn("size-3 opacity-0 transition-[transform,opacity] group-hover:opacity-100", !collapsed && "rotate-90")} aria-hidden />
        </button>
      </div>
      {!collapsed && children}
    </section>
  );
}
