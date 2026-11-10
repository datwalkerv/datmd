import { db } from "./db";
import { between } from "./order";
import type { Doc } from "./types";

const topOrder = async (folderId: string | null) => {
  const siblings = await db.docs.filter((d) => d.folderId === folderId).toArray();
  return between(undefined, siblings.length ? Math.min(...siblings.map((d) => d.order)) : undefined);
};

export async function createDoc(init: Partial<Pick<Doc, "title" | "content" | "folderId">> = {}): Promise<Doc> {
  const now = Date.now();
  const folderId = init.folderId ?? null;
  const doc: Doc = {
    id: crypto.randomUUID(),
    title: init.title?.trim() || "Untitled",
    content: init.content ?? "",
    folderId,
    order: await topOrder(folderId),
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.docs.add(doc);
  return doc;
}

export const saveContent = (id: string, content: string) => db.docs.update(id, { content, updatedAt: Date.now() });

export const renameDoc = (id: string, title: string) =>
  db.docs.update(id, { title: title.trim() || "Untitled", updatedAt: Date.now() });

export const setPinned = (id: string, pinned: boolean) => db.docs.update(id, { pinned });

export const setOrder = (id: string, folderId: string | null, order: number) => db.docs.update(id, { folderId, order });

export async function moveDoc(id: string, folderId: string | null) {
  await db.docs.update(id, { folderId, order: await topOrder(folderId) });
}

export async function duplicateDoc(id: string): Promise<Doc | undefined> {
  const src = await db.docs.get(id);
  if (!src) return;
  return createDoc({ title: `${src.title} copy`, content: src.content, folderId: src.folderId });
}

export const deleteDoc = (id: string) => db.docs.delete(id);
