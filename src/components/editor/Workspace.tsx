"use client";

import { Button, Placeholder, cn, useMediaQuery } from "datui";
import { FilePlus2, NotebookPen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/app/context";
import { Outline } from "@/components/outline/Outline";
import { Preview, type PreviewHandle } from "@/components/preview/Preview";
import { useAutosave } from "@/hooks/useAutosave";
import { usePrefs } from "@/hooks/usePrefs";
import { type Heading, extractHeadings } from "@/lib/markdown/outline";
import { db } from "@/lib/storage/db";
import { EditorHeader, MOD } from "./EditorHeader";
import { type EditorHandle, MarkdownEditor } from "./MarkdownEditor";
import { StatusBar } from "./StatusBar";

const PREVIEW_DEBOUNCE = 150;

export function Workspace() {
  const { docs, activeId, mode, newDoc, isMobile, sidebarVisible, toggleSidebar, focus } = useApp();
  const prefs = usePrefs();
  const wide = useMediaQuery("(min-width: 1100px)");
  const doc = docs.find((d) => d.id === activeId);
  const autosave = useAutosave();
  const { flush, schedule } = autosave;

  // Content is loaded once per document (after flushing the previous one), then owned by the editor.
  const [loaded, setLoaded] = useState<{ id: string; content: string } | null>(null);
  const [source, setSource] = useState("");
  const latest = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const preview = useRef<PreviewHandle>(null);
  const editor = useRef<EditorHandle>(null);

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

  // Outline: headings of the (debounced) text, and the section at the top of the visible pane.
  const headings = useMemo(() => extractHeadings(source), [source]);
  const headingsRef = useRef<Heading[]>(headings);
  headingsRef.current = headings;
  const [activeHeading, setActiveHeading] = useState(0);
  const track = useCallback((line: number) => {
    const hs = headingsRef.current;
    let i = 0;
    while (i + 1 < hs.length && hs[i + 1].line <= line) i++;
    setActiveHeading(i);
  }, []);
  useEffect(() => setActiveHeading(0), [activeId]);

  const goTo = (h: Heading, i: number) => {
    setActiveHeading(i);
    if (mode === "preview") preview.current?.scrollToLine(h.line, 0);
    else editor.current?.scrollToLine(h.line);
  };

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
  const outlineAvailable = wide && !focus;

  return (
    <>
      <EditorHeader doc={doc} status={autosave.status} outlineAvailable={outlineAvailable} />
      <div className="flex min-h-0 flex-1">
        {ready && (
          <div className={cn("min-w-0", mode === "split" ? "flex-1 border-r border-separator" : "flex-1", !showEditor && "hidden")}>
            {/* Stays mounted in preview mode so undo history and cursor survive. */}
            <MarkdownEditor
              key={doc.id}
              ref={editor}
              initial={loaded.content}
              autoFocus={!isMobile && !doc.content}
              typewriter={prefs.typewriter}
              onChange={(text) => {
                latest.current = text;
                schedule(doc.id, text);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setSource(text), PREVIEW_DEBOUNCE);
              }}
              onScrollLine={(line, f, reading) => {
                if (mode === "split") preview.current?.scrollToLine(line, f);
                track(reading);
              }}
            />
          </div>
        )}
        {ready && showPreview && (
          <div className="min-w-0 flex-1 bg-background">
            <Preview ref={preview} source={source} onScrollLine={mode === "preview" ? track : undefined} />
          </div>
        )}
        {ready && outlineAvailable && prefs.outlineOpen && <Outline headings={headings} active={activeHeading} onSelect={goTo} />}
      </div>
      <StatusBar text={source} focus={focus} showTypewriter={showEditor} />
    </>
  );
}
