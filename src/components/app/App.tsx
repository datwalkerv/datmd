"use client";

import { AppRoot, ConfigProvider, FocusTrap, Snackbar, VisuallyHidden, cn, useMediaQuery } from "datui";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Workspace } from "@/components/editor/Workspace";
import { SearchDialog } from "@/components/search/SearchDialog";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { TemplatePicker } from "@/components/templates/TemplatePicker";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { EDITOR_WIDTHS, type EditorMode, FONT_STACKS, setPrefs, usePrefs } from "@/hooks/usePrefs";
import { pickMarkdownFiles, readMarkdownFiles } from "@/lib/files";
import { db } from "@/lib/storage/db";
import { createDoc } from "@/lib/storage/docs";
import { createFolder } from "@/lib/storage/folders";
import { seedOnce } from "@/lib/storage/seed";
import { type AppState, AppContext } from "./context";

const MODES: EditorMode[] = ["edit", "preview", "split"];

export function App() {
  const prefs = usePrefs();
  const isMobile = useMediaQuery("(max-width: 767px)");
  // shortcut: loads every doc (with content) into memory; fine for hundreds of notes, split content into its own table past that.
  const docs = useLiveQuery(() => db.docs.toArray(), []);
  const folders = useLiveQuery(() => db.folders.orderBy("order").toArray(), []);

  const [activeId, setActiveId] = useState<string | null>(prefs.lastDocId);
  const [mode, setModeState] = useState<EditorMode>(prefs.defaultMode);
  const [focus, setFocus] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [snack, setSnack] = useState<{ id: number; text: string } | null>(null);

  const notify = useCallback((text: string) => setSnack({ id: Date.now(), text }), []);

  const open = useCallback((id: string | null) => {
    setActiveId(id);
    setPrefs({ lastDocId: id });
    setDrawerOpen(false);
  }, []);

  const newDoc = useCallback(
    async (folderId: string | null = null, init?: { title: string; content: string }) => {
      try {
        open((await createDoc({ ...init, folderId })).id);
      } catch {
        notify("Couldn't create the note. Storage may be full or blocked.");
      }
    },
    [open, notify],
  );

  const importFiles = useCallback(
    async (files?: Iterable<File>) => {
      try {
        const parsed = await readMarkdownFiles(files ?? (await pickMarkdownFiles()));
        if (!parsed.length) return notify(files ? "No Markdown files found." : "Nothing imported.");
        // Zip directories map onto folders: reuse one with the same name, otherwise create it.
        const folderIds = new Map((await db.folders.toArray()).map((f) => [f.name.toLowerCase(), f.id]));
        const created = [];
        for (const { folder, ...note } of parsed) {
          let folderId: string | null = null;
          if (folder) {
            folderId = folderIds.get(folder.toLowerCase()) ?? (await createFolder(folder)).id;
            folderIds.set(folder.toLowerCase(), folderId);
          }
          created.push(await createDoc({ ...note, folderId }));
        }
        open(created[0].id);
        notify(created.length === 1 ? `Imported “${created[0].title}”` : `Imported ${created.length} notes`);
      } catch (e) {
        notify(e instanceof Error && e.message === "Archive too large" ? "That archive is too large to import." : "Import failed. The file may be damaged or storage is full.");
      }
    },
    [open, notify],
  );

  const setMode = useCallback((m: EditorMode) => setModeState(m), []);
  const effectiveMode: EditorMode = isMobile && mode === "split" ? "edit" : mode;

  const sidebarVisible = isMobile ? drawerOpen : prefs.sidebarOpen && !focus;
  const toggleSidebar = useCallback(() => {
    if (isMobile) return setDrawerOpen((o) => !o);
    if (focus) return setFocus(false);
    setPrefs((p) => ({ sidebarOpen: !p.sidebarOpen }));
  }, [isMobile, focus]);

  // First run seeds a welcome note.
  useEffect(() => {
    seedOnce().then((id) => id && open(id));
  }, [open]);

  // Keep a valid document open: fall back to the most recently edited one when the active doc is gone.
  useEffect(() => {
    if (!docs) return;
    let cancelled = false;
    (async () => {
      // Check the DB, not `docs`: a just-created doc can be newer than the live query.
      if (activeId && (await db.docs.get(activeId))) return;
      if (cancelled) return;
      const next = [...docs].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? null;
      if (next !== activeId) open(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [docs, activeId, open]);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape" && focus && !settingsOpen && !searchOpen && !templatesOpen) return setFocus(false);
      if (!mod) return;
      const hit = (fn: () => void) => {
        e.preventDefault();
        fn();
      };
      if (e.altKey && e.code === "KeyN") hit(() => void newDoc());
      else if (!e.shiftKey && !e.altKey && e.code === "KeyK") hit(() => setSearchOpen(true));
      else if (e.altKey && e.code === "KeyT") hit(() => setPrefs((p) => ({ typewriter: !p.typewriter })));
      else if (e.altKey && e.code === "KeyO") hit(() => setPrefs((p) => ({ outlineOpen: !p.outlineOpen })));
      else if (e.shiftKey && e.code === "KeyF") hit(() => setFocus((f) => !f));
      else if (e.code === "Backslash") hit(toggleSidebar);
      else if (e.key === ",") hit(() => setSettingsOpen(true));
      else if (!e.shiftKey && !e.altKey && ["1", "2", "3"].includes(e.key)) hit(() => setMode(MODES[Number(e.key) - 1]));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, settingsOpen, searchOpen, templatesOpen, newDoc, toggleSidebar, setMode]);

  // Dropping .md files anywhere imports them (capture phase so the editor doesn't paste file text instead).
  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      void importFiles(e.dataTransfer!.files);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop, true);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop, true);
    };
  }, [importFiles]);

  const value = useMemo<AppState | null>(
    () =>
      docs && folders
        ? {
            docs,
            folders,
            activeId,
            open,
            newDoc,
            importFiles,
            notify,
            mode: effectiveMode,
            setMode,
            focus,
            setFocus,
            isMobile,
            toggleSidebar,
            sidebarVisible,
            openSettings: () => setSettingsOpen(true),
            openSearch: () => setSearchOpen(true),
            openTemplates: () => setTemplatesOpen(true),
          }
        : null,
    [docs, folders, activeId, open, newDoc, importFiles, notify, effectiveMode, setMode, focus, isMobile, toggleSidebar, sidebarVisible],
  );

  return (
    <ConfigProvider colorScheme={prefs.theme}>
      <AppRoot>
        <div
          className="flex h-dvh overflow-hidden bg-background text-foreground"
          style={
            {
              "--editor-font-size": `${prefs.fontSize}px`,
              "--editor-line-height": prefs.lineHeight,
              "--editor-width": EDITOR_WIDTHS[prefs.editorWidth],
              "--font-writing": FONT_STACKS[prefs.fontFamily],
            } as React.CSSProperties
          }
        >
          {/* Blank (not a spinner) for the few ms IndexedDB takes to answer. */}
          {value && (
            <AppContext.Provider value={value}>
              {!isMobile && (
                <aside
                  aria-label="Notes"
                  inert={!sidebarVisible}
                  className={cn(
                    "shrink-0 overflow-hidden border-separator bg-background-secondary transition-[width] duration-normal ease-standard",
                    sidebarVisible ? "w-[264px] border-r" : "w-0",
                  )}
                >
                  <div className="h-full w-[264px]">
                    <Sidebar />
                  </div>
                </aside>
              )}
              {isMobile && drawerOpen && (
                <div className="fixed inset-0 z-(--dt-z-modal)">
                  <button
                    type="button"
                    aria-label="Close sidebar"
                    className="absolute inset-0 bg-overlay"
                    onClick={() => setDrawerOpen(false)}
                  />
                  <FocusTrap
                    onEscape={() => setDrawerOpen(false)}
                    role="dialog"
                    aria-label="Notes"
                    className="absolute inset-y-0 left-0 w-[min(320px,86vw)] bg-background-secondary shadow-lg pt-[env(safe-area-inset-top)]"
                  >
                    <Sidebar />
                  </FocusTrap>
                </div>
              )}
              <main className="flex min-w-0 flex-1 flex-col">
                <VisuallyHidden as="h1">datmd</VisuallyHidden>
                <Workspace />
              </main>
              <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
              <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
              <TemplatePicker open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
            </AppContext.Provider>
          )}
        </div>
        {snack && (
          <Snackbar key={snack.id} onClosed={() => setSnack(null)} duration={3500}>
            {snack.text}
          </Snackbar>
        )}
      </AppRoot>
    </ConfigProvider>
  );
}
