import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createDoc, moveDoc } from "./docs";
import { createFolder, deleteFolder } from "./folders";
import { between, orderForDrop } from "./order";

describe("order", () => {
  it("places between neighbours and at edges", () => {
    expect(between()).toBe(0);
    expect(between(undefined, 3)).toBe(2);
    expect(between(3)).toBe(4);
    expect(between(1, 2)).toBe(1.5);
  });

  it("matches arrayMove semantics", () => {
    const list = [{ id: "a", order: 1 }, { id: "b", order: 2 }, { id: "c", order: 3 }];
    expect(orderForDrop(list, "a", 2)).toBe(4); // a → end
    expect(orderForDrop(list, "c", 0)).toBe(0); // c → start
    expect(orderForDrop(list, "a", 1)).toBe(2.5); // a → between b and c
    expect(orderForDrop(list, "x", 1)).toBe(1.5); // foreign item inserted before b
  });
});

describe("storage", () => {
  beforeEach(async () => {
    await db.docs.clear();
    await db.folders.clear();
  });

  it("new docs go to the top of their folder", async () => {
    const a = await createDoc({ title: "a" });
    const b = await createDoc({ title: "b" });
    expect(b.order).toBeLessThan(a.order);
  });

  it("deleting a folder keeps its documents", async () => {
    const f = await createFolder("Work");
    const d = await createDoc({ title: "x", folderId: f.id });
    await deleteFolder(f.id);
    expect(await db.folders.count()).toBe(0);
    expect((await db.docs.get(d.id))?.folderId).toBeNull();
  });

  it("moves documents between folders", async () => {
    const f = await createFolder("Work");
    const d = await createDoc({ title: "x" });
    await moveDoc(d.id, f.id);
    expect((await db.docs.get(d.id))?.folderId).toBe(f.id);
  });
});
