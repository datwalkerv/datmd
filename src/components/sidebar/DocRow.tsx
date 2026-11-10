"use client";

import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton, Tappable, cn } from "datui";
import { FileText, MoreHorizontal, Pin } from "lucide-react";
import { useRef, useState } from "react";
import { DocMenu } from "@/components/app/DocMenu";
import { useApp } from "@/components/app/context";
import { renameDoc } from "@/lib/storage/docs";
import type { Doc } from "@/lib/storage/types";
import { InlineRename } from "./InlineRename";

interface RowProps {
  doc: Doc;
  /** Unique per section, e.g. "doc:<id>" or "pin:<id>"; the same doc can appear in several sections. */
  dndId: string;
  indent?: boolean;
  renaming: boolean;
  setRenaming: (id: string | null) => void;
}

/** Row inside a folder/notes list: reorderable. */
export function SortableDocRow(props: RowProps) {
  const s = useSortable({ id: props.dndId, data: { docId: props.doc.id } });
  return (
    <DocRowView
      {...props}
      dragRef={s.setNodeRef}
      dragProps={{ ...s.attributes, ...s.listeners }}
      style={{ transform: CSS.Translate.toString(s.transform), transition: s.transition }}
      dragging={s.isDragging}
    />
  );
}

/** Row in Pinned/Recent: can be dragged onto a folder but not reordered there. */
export function DraggableDocRow(props: RowProps) {
  const d = useDraggable({ id: props.dndId, data: { docId: props.doc.id } });
  return <DocRowView {...props} dragRef={d.setNodeRef} dragProps={{ ...d.attributes, ...d.listeners }} dragging={d.isDragging} />;
}

interface ViewProps extends RowProps {
  dragRef?: (el: HTMLElement | null) => void;
  dragProps?: React.HTMLAttributes<HTMLElement>;
  style?: React.CSSProperties;
  dragging?: boolean;
}

export function DocRowView({ doc, indent, renaming, setRenaming, dragRef, dragProps, style, dragging }: ViewProps) {
  const { activeId, open } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const active = doc.id === activeId;

  return (
    <div ref={dragRef} style={style} className={cn("group relative px-1.5", dragging && "opacity-40")}>
      {renaming ? (
        <div className={cn("py-0.5", indent ? "pl-6" : "pl-1")}>
          <InlineRename
            label="Note title"
            value={doc.title}
            onDone={(next) => {
              setRenaming(null);
              if (next !== null && next.trim() !== doc.title) void renameDoc(doc.id, next);
            }}
          />
        </div>
      ) : (
        <Tappable
          {...dragProps}
          role="button"
          tabIndex={0}
          aria-current={active ? "page" : undefined}
          onClick={() => open(doc.id)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open(doc.id);
            }
            if (e.key === "F2") setRenaming(doc.id);
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            setMenuOpen(true);
          }}
          onDoubleClick={() => setRenaming(doc.id)}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md pr-8 text-[13.5px] touch-manipulation",
            indent ? "pl-6" : "pl-2",
            active ? "bg-foreground/[0.07] font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className={cn("size-4 shrink-0", active ? "text-foreground" : "text-icon-tertiary")} aria-hidden />
          <span className="truncate">{doc.title}</span>
          {doc.pinned && <Pin className="size-3 shrink-0 text-icon-tertiary" aria-label="Pinned" />}
        </Tappable>
      )}
      {!renaming && (
        <IconButton
          ref={menuRef}
          size="s"
          label={`Actions for ${doc.title}`}
          aria-haspopup="menu"
          onClick={() => setMenuOpen(true)}
          className={cn(
            "absolute top-0.5 right-2 size-7 min-h-7 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60",
            menuOpen && "opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </IconButton>
      )}
      <DocMenu doc={doc} open={menuOpen} onOpenChange={setMenuOpen} anchorRef={menuRef} onRename={() => setRenaming(doc.id)} />
    </div>
  );
}
