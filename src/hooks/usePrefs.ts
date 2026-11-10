"use client";
import { useSyncExternalStore } from "react";

export type EditorMode = "edit" | "preview" | "split";
export type Theme = "light" | "dark" | "system";

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
};

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
