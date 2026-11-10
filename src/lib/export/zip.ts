import { type Zippable, strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { safeName } from "@/lib/files";
import type { Doc, Folder } from "@/lib/storage/types";

/** All notes as .md files, one directory per folder. Duplicate names get " (2)", " (3)"… */
export function zipNotes(docs: Doc[], folders: Folder[]): Uint8Array {
  const names = new Map(folders.map((f) => [f.id, safeName(f.name)]));
  const used = new Set<string>();
  const files: Zippable = {};
  for (const d of docs) {
    const dir = d.folderId && names.has(d.folderId) ? `${names.get(d.folderId)}/` : "";
    const base = safeName(d.title);
    let path = `${dir}${base}.md`;
    for (let n = 2; used.has(path.toLowerCase()); n++) path = `${dir}${base} (${n}).md`;
    used.add(path.toLowerCase());
    files[path] = [strToU8(d.content), { mtime: new Date(d.updatedAt) }];
  }
  return zipSync(files, { level: 6 });
}

export interface ImportedNote {
  title: string;
  content: string;
  folder: string | null;
}

const MD = /\.(md|markdown|mdown|txt)$/i;
const MAX_FILE = 5 * 1024 * 1024;
const MAX_TOTAL = 50 * 1024 * 1024;
const MAX_FILES = 2000;

/** Markdown files from a zip; the nearest directory becomes the folder. Guards against zip bombs. */
export function unzipNotes(data: Uint8Array): ImportedNote[] {
  let total = 0;
  let count = 0;
  const entries = unzipSync(data, {
    filter: (f) => {
      if (!MD.test(f.name) || f.name.startsWith("__MACOSX/") || f.name.split("/").pop()!.startsWith(".")) return false;
      total += f.originalSize;
      count++;
      if (f.originalSize > MAX_FILE || total > MAX_TOTAL || count > MAX_FILES) throw new Error("Archive too large");
      return true;
    },
  });
  return Object.entries(entries).map(([path, bytes]) => {
    const parts = path.split("/").filter(Boolean);
    return {
      title: parts[parts.length - 1].replace(MD, ""),
      content: strFromU8(bytes),
      folder: parts.length > 1 ? parts[parts.length - 2] : null,
    };
  });
}
