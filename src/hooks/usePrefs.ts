"use client";
import { useSyncExternalStore } from "react";

export type EditorMode = "edit" | "preview" | "split";
export type Theme = "light" | "dark" | "system";
export type FontFamily = "sans" | "serif" | "mono";
export type EditorWidth = "narrow" | "medium" | "wide" | "full";

export interface Prefs {
  theme: Theme;
  defaultMode: EditorMode;
  fontSize: number;
  sidebarOpen: boolean;
  lastDocId: string | null;
  collapsedFolders: string[];
  collapsedSections: string[];
  typewriter: boolean;
  outlineOpen: boolean;
  calculations: boolean;
  fontFamily: FontFamily;
  lineHeight: number;
  editorWidth: EditorWidth;
  /** Autosave debounce in ms. */
  saveDelay: number;
}

const KEY = "datmd:prefs";
const DEFAULTS: Prefs = {
  theme: "system",
  defaultMode: "edit",
  fontSize: 17,
  sidebarOpen: true,
  lastDocId: null,
  collapsedFolders: [],
  collapsedSections: [],
  typewriter: false,
  outlineOpen: true,
  calculations: true,
  fontFamily: "sans",
  lineHeight: 1.75,
  editorWidth: "medium",
  saveDelay: 400,
};

export const FONT_STACKS: Record<FontFamily, string> = {
  sans: "var(--dt-font-sans)",
  serif: 'var(--font-serif), "Iowan Old Style", Charter, Georgia, serif',
  mono: "var(--dt-font-mono)",
};

export const EDITOR_WIDTHS: Record<EditorWidth, string> = { narrow: "600px", medium: "720px", wide: "880px", full: "100%" };

let current: Prefs = DEFAULTS;
const listeners = new Set<() => void>();

function load(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}
if (typeof window !== "undefined") current = load();

export function setPrefs(patch: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) {
  current = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode / quota: prefs just won't survive a reload.
  }
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const usePrefs = () => useSyncExternalStore(subscribe, () => current, () => DEFAULTS);

export const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
