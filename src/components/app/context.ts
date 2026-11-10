"use client";
import { createContext, useContext } from "react";
import type { EditorMode } from "@/hooks/usePrefs";
import type { Doc, Folder } from "@/lib/storage/types";

export interface AppState {
  docs: Doc[];
  folders: Folder[];
  activeId: string | null;
  open: (id: string | null) => void;
  newDoc: (folderId?: string | null) => Promise<void>;
  importFiles: (files?: Iterable<File>) => Promise<void>;
  notify: (message: string) => void;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  focus: boolean;
  setFocus: (on: boolean) => void;
  isMobile: boolean;
  /** Desktop: collapse/expand the sidebar. Mobile: open/close the drawer. */
  toggleSidebar: () => void;
  sidebarVisible: boolean;
  openSettings: () => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside <App>");
  return ctx;
}
