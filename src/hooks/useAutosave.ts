"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveContent } from "@/lib/storage/docs";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const RETRY = 2000;

/** Debounced content writes. `flush()` resolves once everything queued is on disk (or failed). */
export function useAutosave(delay = 400) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef<{ id: string; content: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef<Promise<void>>(Promise.resolve());
  const delayRef = useRef(delay);
  delayRef.current = delay;

  const write = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    inflight.current = inflight.current.then(async () => {
      const job = pending.current;
      if (!job) return;
      pending.current = null;
      setStatus("saving");
      try {
        await saveContent(job.id, job.content);
        if (!pending.current) setStatus("saved");
      } catch {
        pending.current ??= job; // keep the newest text, never drop it
        setStatus("error");
        timer.current = setTimeout(write, RETRY);
      }
    });
    return inflight.current;
  }, []);

  const schedule = useCallback(
    (id: string, content: string) => {
      if (pending.current && pending.current.id !== id) void write();
      pending.current = { id, content };
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(write, delayRef.current);
    },
    [write],
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void write();
    // Unsaved text when the tab closes: start the write and ask the browser to confirm leaving.
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!pending.current) return;
      void write();
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", write);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", write);
      window.removeEventListener("beforeunload", onUnload);
      void write();
    };
  }, [write]);

  return { status, schedule, flush: write };
}
