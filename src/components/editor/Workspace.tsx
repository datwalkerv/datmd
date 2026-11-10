"use client";

import { Button, Placeholder, cn } from "datui";
import { FilePlus2, NotebookPen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app/context";
import { Preview, type PreviewHandle } from "@/components/preview/Preview";
import { useAutosave } from "@/hooks/useAutosave";
import { db } from "@/lib/storage/db";
import { EditorHeader, MOD } from "./EditorHeader";
import { MarkdownEditor } from "./MarkdownEditor";

const PREVIEW_DEBOUNCE = 150;

export function Workspace() {
  const { docs, activeId, mode, newDoc, isMobile, sidebarVisible, toggleSidebar } = useApp();
  const doc = docs.find((d) => d.id === activeId);
  const autosave = useAutosave();
  const { flush, schedule } = autosave;

  // Content is loaded once per document (after flushing the previous one), then owned by the editor.
  const [loaded, setLoaded] = useState<{ id: string; content: string } | null>(null);
  const [source, setSource] = useState("");
  const latest = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const preview = useRef<PreviewHandle>(null);

  useEffect(() => {
    let cancelled = false;
    if (!activeId) return setLoaded(null);
    flush()
      .then(() => db.docs.get(activeId))
      .then((d) => {
        if (cancelled || !d) return;
        latest.current = d.content;
        setSource(d.content);
        setLoaded({ id: d.id, content: d.content });
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, flush]);

  // Preview mode shows the newest text immediately.
  useEffect(() => {
    if (mode !== "edit") {
      clearTimeout(timer.current);
      setSource(latest.current);
    }
  }, [mode]);

  if (!doc) {
    return (
      <div className="flex h-full flex-col">
        {(!sidebarVisible || isMobile) && (
          <div className="flex h-12 items-center px-3">
            <Button variant="tertiary" appearance="neutral" size="s" onClick={toggleSidebar}>
              Show sidebar
            </Button>
          </div>
        )}
        <Placeholder
          className="m-auto"
          icon={<NotebookPen className="size-12 text-icon-tertiary" />}
          title="No note open"
          action={
            <Button before={<FilePlus2 />} onClick={() => void newDoc()}>
              New note
            </Button>
          }
        >
          Pick a note from the sidebar or start a new one ({MOD}⌥N).
        </Placeholder>
      </div>
    );
  }

  const ready = loaded?.id === doc.id;
  const showEditor = mode !== "preview";
  const showPreview = mode !== "edit";

  return (
    <>
      <EditorHeader doc={doc} status={autosave.status} />
      <div className="flex min-h-0 flex-1">
        {ready && (
          <div className={cn("min-w-0", mode === "split" ? "w-1/2 border-r border-separator" : "w-full", !showEditor && "hidden")}>
            {/* Stays mounted in preview mode so undo history and cursor survive. */}
            <MarkdownEditor
              key={doc.id}
              initial={loaded.content}
              autoFocus={!isMobile && !doc.content}
              onChange={(text) => {
                latest.current = text;
                schedule(doc.id, text);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setSource(text), PREVIEW_DEBOUNCE);
              }}
              onScrollLine={mode === "split" ? (line, f) => preview.current?.scrollToLine(line, f) : undefined}
            />
          </div>
        )}
        {ready && showPreview && (
          <div className={cn("min-w-0 bg-background", mode === "split" ? "w-1/2" : "w-full")}>
            <Preview ref={preview} source={source} />
          </div>
        )}
      </div>
    </>
  );
}
