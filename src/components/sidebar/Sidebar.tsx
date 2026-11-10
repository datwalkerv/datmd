"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button, IconButton, Placeholder, Tooltip } from "datui";
import { FileText, FileUp, FolderPlus, PanelLeftClose, Settings, SquarePen } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app/context";
import { MOD } from "@/components/editor/EditorHeader";
import { moveDoc, setOrder } from "@/lib/storage/docs";
import { createFolder } from "@/lib/storage/folders";
import { orderForDrop } from "@/lib/storage/order";
import type { Doc } from "@/lib/storage/types";
import { DocRowView, DraggableDocRow, SortableDocRow } from "./DocRow";
import { FolderItem } from "./FolderItem";
import { Section } from "./Section";

const RECENT = 5;
const byOrder = (a: Doc, b: Doc) => a.order - b.order;

// Folder headers win when the pointer is over them; otherwise snap to the nearest row.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args).filter((c) => String(c.id).startsWith("folder:"));
  return hits.length ? hits : closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => String(c.id).startsWith("doc:")) });
};

export function Sidebar() {
  const { docs, folders, newDoc, importFiles, openSettings, toggleSidebar, isMobile, notify } = useApp();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Doc | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
  );

  const { pinned, recent, byFolder } = useMemo(() => {
    const byFolder = new Map<string | null, Doc[]>();
    for (const d of [...docs].sort(byOrder)) {
      if (d.pinned) continue; // pinned notes live in Pinned only, like Apple Notes
      const list = byFolder.get(d.folderId) ?? [];
      list.push(d);
      byFolder.set(d.folderId, list);
    }
    return {
      pinned: docs.filter((d) => d.pinned).sort(byOrder),
      recent: [...docs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, RECENT),
      byFolder,
    };
  }, [docs]);
  const unfiled = byFolder.get(null) ?? [];

  const onDragStart = ({ active }: DragStartEvent) => setDragging(docs.find((d) => d.id === active.data.current?.docId) ?? null);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const doc = docs.find((d) => d.id === active.data.current?.docId);
    if (!doc || !over) return;
    const overId = String(over.id);
    const fail = () => notify("Couldn't move the note.");
    if (overId.startsWith("folder:")) {
      const folderId = overId === "folder:none" ? null : overId.slice(7);
      if (doc.folderId !== folderId) void moveDoc(doc.id, folderId).catch(fail);
      return;
    }
    const target = docs.find((d) => `doc:${d.id}` === overId);
    if (!target || target.id === doc.id) return;
    const list = byFolder.get(target.folderId) ?? [];
    void setOrder(doc.id, target.folderId, orderForDrop(list, doc.id, list.findIndex((d) => d.id === target.id))).catch(fail);
  };

  const addFolder = async () => {
    try {
      setRenaming((await createFolder("New folder")).id);
    } catch {
      notify("Couldn't create the folder.");
    }
  };

  const rowProps = { renaming: false, setRenaming };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 pr-2 pl-4">
        <img src="/icon.svg" alt="" className="size-5 rounded-[5px] ring-1 ring-separator" />
        <span className="text-[15px] font-semibold tracking-tight">datmd</span>
        {isMobile ? (
          // No tooltip here: the drawer focuses this button on open and the tooltip would pop up.
          <IconButton size="s" label="Close sidebar" className="ml-auto text-muted-foreground" onClick={toggleSidebar}>
            <PanelLeftClose />
          </IconButton>
        ) : (
          <Tooltip title={`Hide sidebar  ${MOD}\\`} hoverDelay={400}>
            <IconButton size="s" label="Hide sidebar" className="ml-auto text-muted-foreground" onClick={toggleSidebar}>
              <PanelLeftClose />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div className="flex shrink-0 gap-1.5 px-3 pb-2">
        <Button size="s" variant="secondary" appearance="neutral" stretched before={<SquarePen className="size-4" />} onClick={() => void newDoc()}>
          New note
        </Button>
        <Tooltip title="New folder" hoverDelay={400}>
          <IconButton size="s" label="New folder" className="text-muted-foreground" onClick={() => void addFolder()}>
            <FolderPlus />
          </IconButton>
        </Tooltip>
      </div>

      <nav aria-label="Note list" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
        {!docs.length && !folders.length ? (
          <Placeholder icon={<FileText className="size-10 text-icon-tertiary" />} title="No notes yet" className="py-10">
            Create one or drop .md files here.
          </Placeholder>
        ) : (
          <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
            {pinned.length > 0 && (
              <Section id="pinned" title="Pinned">
                {pinned.map((d) => (
                  <DraggableDocRow key={d.id} doc={d} dndId={`pin:${d.id}`} {...rowProps} renaming={renaming === d.id} />
                ))}
              </Section>
            )}

            {docs.length > RECENT && (
              <Section id="recent" title="Recent">
                {recent.map((d) => (
                  <DraggableDocRow key={d.id} doc={d} dndId={`recent:${d.id}`} {...rowProps} />
                ))}
              </Section>
            )}

            <Section id="folders" title="Folders">
              {folders.map((f) => (
                <FolderItem key={f.id} folder={f} docs={byFolder.get(f.id) ?? []} renaming={renaming} setRenaming={setRenaming} />
              ))}
              {!folders.length && (
                <button type="button" onClick={() => void addFolder()} className="ml-4 py-1 text-[12px] text-subtle-foreground outline-none hover:text-muted-foreground focus-visible:focus-ring rounded-xs">
                  + Create a folder
                </button>
              )}
            </Section>

            <Section id="notes" title="Notes" dropId="folder:none">
                <SortableContext items={unfiled.map((d) => `doc:${d.id}`)} strategy={verticalListSortingStrategy}>
                  {unfiled.map((d) => (
                    <SortableDocRow key={d.id} doc={d} dndId={`doc:${d.id}`} {...rowProps} renaming={renaming === d.id} />
                  ))}
                </SortableContext>
                {!unfiled.length && <p className="py-1 pl-4 text-[12px] text-subtle-foreground">No unfiled notes</p>}
            </Section>

            <DragOverlay dropAnimation={null}>
              {dragging && (
                <div className="rounded-md bg-popover shadow-md">
                  <DocRowView doc={dragging} dndId="overlay" renaming={false} setRenaming={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1 border-t border-separator px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button size="s" variant="tertiary" appearance="neutral" before={<Settings className="size-4" />} className="text-muted-foreground" onClick={openSettings}>
          Settings
        </Button>
        <Tooltip title="Import Markdown files" hoverDelay={400}>
          <IconButton size="s" label="Import Markdown files" className="ml-auto text-muted-foreground" onClick={() => void importFiles()}>
            <FileUp />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
