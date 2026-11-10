import Dexie, { type EntityTable } from "dexie";
import type { Doc, Folder } from "./types";

export const db = new Dexie("datmd") as Dexie & {
  docs: EntityTable<Doc, "id">;
  folders: EntityTable<Folder, "id">;
};

db.version(1).stores({
  docs: "id, folderId, updatedAt, pinned",
  folders: "id, order",
});
