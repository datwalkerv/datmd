import { db } from "./db";
import type { Folder } from "./types";

export async function createFolder(name: string): Promise<Folder> {
  const last = await db.folders.orderBy("order").last();
  const folder: Folder = {
    id: crypto.randomUUID(),
    name: name.trim() || "New folder",
    order: (last?.order ?? 0) + 1,
    createdAt: Date.now(),
  };
  await db.folders.add(folder);
  return folder;
}

export const renameFolder = (id: string, name: string) => db.folders.update(id, { name: name.trim() || "Untitled folder" });

/** Deletes the folder only; its documents become unfiled so no writing is lost. */
export function deleteFolder(id: string) {
  return db.transaction("rw", db.docs, db.folders, async () => {
    await db.docs.where("folderId").equals(id).modify({ folderId: null });
    await db.folders.delete(id);
  });
}
