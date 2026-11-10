"use client";

import { ActionSheet, ActionSheetItem, Alert } from "datui";
import { Copy, Download, FolderInput, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { downloadFile, fileName } from "@/lib/files";
import { deleteDoc, duplicateDoc, moveDoc, setPinned } from "@/lib/storage/docs";
import type { Doc } from "@/lib/storage/types";
import { useApp } from "./context";

interface Props {
  doc: Doc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onRename: () => void;
  /** Extra items appended after the standard ones. */
  children?: React.ReactNode;
}

/** Actions for one document, shared by sidebar rows and the editor header. */
export function DocMenu({ doc, open, onOpenChange, anchorRef, onRename, children }: Props) {
  const { folders, open: openDoc, notify } = useApp();
  const [moving, setMoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fail = (what: string) => () => notify(`Couldn't ${what}. Please try again.`);

  return (
    <>
      <ActionSheet open={open} onOpenChange={onOpenChange} anchorRef={anchorRef} title={doc.title}>
        <ActionSheetItem before={<Pencil />} onClick={onRename}>
          Rename
        </ActionSheetItem>
        <ActionSheetItem
          before={doc.pinned ? <PinOff /> : <Pin />}
          onClick={() => setPinned(doc.id, !doc.pinned).catch(fail("update the note"))}
        >
          {doc.pinned ? "Unpin" : "Pin"}
        </ActionSheetItem>
        <ActionSheetItem before={<FolderInput />} onClick={() => setMoving(true)}>
          Move to…
        </ActionSheetItem>
        <ActionSheetItem
          before={<Copy />}
          onClick={() =>
            duplicateDoc(doc.id)
              .then((d) => d && openDoc(d.id))
              .catch(fail("duplicate the note"))
          }
        >
          Duplicate
        </ActionSheetItem>
        <ActionSheetItem before={<Download />} onClick={() => downloadFile(fileName(doc.title, "md"), doc.content)}>
          Export as Markdown
        </ActionSheetItem>
        {children}
        <ActionSheetItem before={<Trash2 />} mode="destructive" onClick={() => setConfirming(true)}>
          Delete
        </ActionSheetItem>
      </ActionSheet>

      <ActionSheet open={moving} onOpenChange={setMoving} anchorRef={anchorRef} title="Move to">
        {[{ id: null, name: "Notes (no folder)" }, ...folders].map((f) => (
          <ActionSheetItem
            key={f.id ?? "none"}
            selectable
            checked={doc.folderId === f.id}
            onClick={() => moveDoc(doc.id, f.id).catch(fail("move the note"))}
          >
            {f.name}
          </ActionSheetItem>
        ))}
      </ActionSheet>

      <Alert
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete “${doc.title}”?`}
        description="This note will be permanently removed from this device."
        actions={[
          { title: "Cancel", mode: "cancel" },
          { title: "Delete", mode: "destructive", action: () => void deleteDoc(doc.id).catch(fail("delete the note")) },
        ]}
      />
    </>
  );
}
