"use client";

import { ActionSheetItem, IconButton, SegmentedControl, Tooltip, cn } from "datui";
import { BookOpen, Download, FileUp, ListTree, Maximize2, Minimize2, MoreHorizontal, PanelLeft, PenLine, Type } from "lucide-react";
import { useRef, useState } from "react";
import { DocMenu } from "@/components/app/DocMenu";
import { useApp } from "@/components/app/context";
import type { SaveStatus as Status } from "@/hooks/useAutosave";
import { type EditorMode, setPrefs, usePrefs } from "@/hooks/usePrefs";
import { ExportSheet } from "@/components/export/ExportSheet";
import type { Doc } from "@/lib/storage/types";
import { SaveStatus } from "./SaveStatus";
import { TitleInput } from "./TitleInput";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? "⌘" : "Ctrl+";

function HeaderButton({ label, shortcut, ...rest }: React.ComponentProps<typeof IconButton> & { label: string; shortcut?: string }) {
  return (
    <Tooltip title={shortcut ? `${label}  ${shortcut}` : label} hoverDelay={400}>
      <IconButton label={label} size="s" {...rest} />
    </Tooltip>
  );
}

export function EditorHeader({ doc, status, outlineAvailable }: { doc: Doc; status: Status; outlineAvailable: boolean }) {
  const app = useApp();
  const prefs = usePrefs();
  const { folders, mode, setMode, focus, setFocus, isMobile, sidebarVisible, toggleSidebar, importFiles } = app;
  const folder = folders.find((f) => f.id === doc.folderId);
  const moreRef = useRef<HTMLElement>(null);
  const exportRef = useRef<HTMLElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Phones get icon-only modes so the title keeps its room.
  const modes = isMobile
    ? [
        { value: "edit", label: <PenLine className="size-4" aria-label="Edit" /> },
        { value: "preview", label: <BookOpen className="size-4" aria-label="Preview" /> },
      ]
    : [
        { value: "edit", label: "Edit" },
        { value: "preview", label: "Preview" },
        { value: "split", label: "Split" },
      ];

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 px-3 transition-opacity duration-normal",
        !focus && "border-b border-separator",
        focus && "opacity-0 hover:opacity-100 focus-within:opacity-100",
      )}
    >
      {(!sidebarVisible || isMobile) && (
        <HeaderButton label={isMobile ? "Open sidebar" : "Show sidebar"} shortcut={`${MOD}\\`} onClick={toggleSidebar}>
          <PanelLeft />
        </HeaderButton>
      )}

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-[14px]">
        {!isMobile && (
          <>
            <span className="shrink-0 truncate text-muted-foreground">{folder?.name ?? "Notes"}</span>
            <span className="text-subtle-foreground" aria-hidden>
              /
            </span>
          </>
        )}
        <TitleInput key={doc.id} doc={doc} ref={titleRef} />
      </nav>

      <SaveStatus status={status} compact={isMobile} />

      <SegmentedControl
        aria-label="Editor view"
        className={cn("shrink-0", isMobile ? "w-[92px]" : "w-[252px]")}
        options={modes}
        value={mode}
        onChange={(v) => setMode(v as EditorMode)}
      />

      {!isMobile && (
        <HeaderButton
          label={focus ? "Exit focus mode" : "Focus mode"}
          shortcut={`${MOD}⇧F`}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          {focus ? <Minimize2 /> : <Maximize2 />}
        </HeaderButton>
      )}
      {outlineAvailable && (
        <HeaderButton
          label={prefs.outlineOpen ? "Hide outline" : "Show outline"}
          shortcut={`${MOD}⌥O`}
          aria-pressed={prefs.outlineOpen}
          onClick={() => setPrefs({ outlineOpen: !prefs.outlineOpen })}
          className={cn(prefs.outlineOpen && "text-foreground")}
        >
          <ListTree />
        </HeaderButton>
      )}
      {!isMobile && (
        <HeaderButton label="Export" ref={exportRef} aria-haspopup="menu" onClick={() => setExportOpen(true)}>
          <Download />
        </HeaderButton>
      )}
      <HeaderButton label="More actions" ref={moreRef} aria-haspopup="menu" onClick={() => setMenuOpen(true)}>
        <MoreHorizontal />
      </HeaderButton>
      <ExportSheet doc={doc} open={exportOpen} onOpenChange={setExportOpen} anchorRef={exportRef} />
      <DocMenu
        doc={doc}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        anchorRef={moreRef}
        onRename={() => titleRef.current?.focus()}
      >
        <ActionSheetItem
          before={<Type />}
          selectable
          checked={prefs.typewriter}
          onClick={() => setPrefs({ typewriter: !prefs.typewriter })}
        >
          Typewriter mode
        </ActionSheetItem>
        <ActionSheetItem before={<FileUp />} onClick={() => void importFiles()}>
          Import Markdown or .zip…
        </ActionSheetItem>
      </DocMenu>
    </header>
  );
}
