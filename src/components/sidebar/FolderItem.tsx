"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ActionSheet, ActionSheetItem, Alert, IconButton, Tappable, cn } from "datui";
import { ChevronRight, FilePlus2, Folder as FolderIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/components/app/context";
import { setPrefs, toggleIn, usePrefs } from "@/hooks/usePrefs";
import { deleteFolder, renameFolder } from "@/lib/storage/folders";
import type { Doc, Folder } from "@/lib/storage/types";
import { SortableDocRow } from "./DocRow";
import { InlineRename } from "./InlineRename";

interface Props {
  folder: Folder;
  docs: Doc[];
  renaming: string | null;
  setRenaming: (id: string | null) => void;
}

export function FolderItem({ folder, docs, renaming, setRenaming }: Props) {
  const { newDoc, notify } = useApp();
  const collapsed = usePrefs().collapsedFolders.includes(folder.id);
  const { setNodeRef, isOver } = useDroppable({ id: `folder:${folder.id}` });
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggle = () => setPrefs((p) => ({ collapsedFolders: toggleIn(p.collapsedFolders, folder.id) }));

  return (
    <div>
      <div ref={setNodeRef} className="group relative px-1.5">
        {renaming === folder.id ? (
          <div className="py-0.5 pl-1">
            <InlineRename
              label="Folder name"
              value={folder.name}
              onDone={(next) => {
                setRenaming(null);
                if (next !== null && next.trim() !== folder.name) void renameFolder(folder.id, next);
              }}
            />
          </div>
        ) : (
          <Tappable
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed}
            onClick={toggle}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
              if (e.key === "F2") setRenaming(folder.id);
            }}
            onDoubleClick={() => setRenaming(folder.id)}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              setMenuOpen(true);
            }}
            className={cn(
              "flex h-8 w-full items-center gap-1.5 rounded-md pr-8 pl-1 text-[13.5px] text-muted-foreground hover:text-foreground",
              isOver && "bg-primary/10 text-foreground ring-1 ring-primary/40",
            )}
          >
            <ChevronRight className={cn("size-3.5 shrink-0 text-icon-tertiary transition-transform", !collapsed && "rotate-90")} aria-hidden />
            <FolderIcon className="size-4 shrink-0 text-icon-tertiary" aria-hidden />
            <span className="truncate">{folder.name}</span>
            <span className="ml-auto pl-2 text-[11px] text-subtle-foreground tabular-nums">{docs.length || ""}</span>
          </Tappable>
        )}
        {renaming !== folder.id && (
          <IconButton
            ref={menuRef}
            size="s"
            label={`Actions for folder ${folder.name}`}
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
      </div>

      {!collapsed && (
        <SortableContext items={docs.map((d) => `doc:${d.id}`)} strategy={verticalListSortingStrategy}>
          {docs.map((d) => (
            <SortableDocRow key={d.id} doc={d} dndId={`doc:${d.id}`} indent renaming={renaming === d.id} setRenaming={setRenaming} />
          ))}
          {!docs.length && <p className="py-1 pl-12 text-[12px] text-subtle-foreground">Empty — drop notes here</p>}
        </SortableContext>
      )}

      <ActionSheet open={menuOpen} onOpenChange={setMenuOpen} anchorRef={menuRef} title={folder.name}>
        <ActionSheetItem before={<FilePlus2 />} onClick={() => void newDoc(folder.id)}>
          New note in folder
        </ActionSheetItem>
        <ActionSheetItem before={<Pencil />} onClick={() => setRenaming(folder.id)}>
          Rename
        </ActionSheetItem>
        <ActionSheetItem before={<Trash2 />} mode="destructive" onClick={() => setConfirming(true)}>
          Delete folder
        </ActionSheetItem>
      </ActionSheet>
      <Alert
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete “${folder.name}”?`}
        description={docs.length ? `Its ${docs.length === 1 ? "note moves" : `${docs.length} notes move`} to Notes. Nothing is deleted.` : undefined}
        actions={[
          { title: "Cancel", mode: "cancel" },
          {
            title: "Delete folder",
            mode: "destructive",
            action: () => void deleteFolder(folder.id).catch(() => notify("Couldn't delete the folder.")),
          },
        ]}
      />
    </div>
  );
}
