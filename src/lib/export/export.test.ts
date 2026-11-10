import { Packer } from "docx";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import type { Doc, Folder } from "@/lib/storage/types";
import { markdownToDocx } from "./docx";
import { unzipNotes, zipNotes } from "./zip";

const MD = `# Report

Some **bold**, *italic*, ~~gone~~ and \`code\` with a [link](https://example.com).[^n]

- one
  - nested
- [x] done task

1. first
2. second

> [!WARNING] Careful
> Hot

> plain quote

\`\`\`js
const a = 1;
\`\`\`

| A | B |
|---|---|
| 1 | 2 |

$$
x^2
$$

Costs $5 and $6.

---

[^n]: The footnote.
`;

describe("docx export", () => {
  it("produces a valid Word document with the content", async () => {
    const buf = await Packer.toBuffer(markdownToDocx("Report", MD));
    const files = unzipSync(new Uint8Array(buf));
    const xml = strFromU8(files["word/document.xml"]);
    for (const text of ["Report", "bold", "italic", "nested", "☑ ", "first", "Careful", "plain quote", "const a = 1;", "x^2"]) {
      expect(xml).toContain(text);
    }
    expect(xml).toContain("<w:b/>"); // bold run
    expect(xml).toContain("<w:strike/>");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("<w:numPr>");
    expect(xml).toContain("w:footnoteReference");
    expect(strFromU8(files["word/footnotes.xml"])).toContain("The footnote.");
    expect(strFromU8(files["word/_rels/document.xml.rels"])).toContain("https://example.com");
  });

  it("adds a title when the note has no top heading", async () => {
    const xml = strFromU8(unzipSync(new Uint8Array(await Packer.toBuffer(markdownToDocx("My title", "just text"))))["word/document.xml"]);
    expect(xml).toContain('w:val="Title"');
    expect(xml).toContain("My title");
  });
});

describe("zip export/import", () => {
  const doc = (id: string, title: string, folderId: string | null): Doc => ({
    id, title, content: `# ${title}\n\nbody ${id}`, folderId, order: 0, pinned: false, createdAt: 0, updatedAt: 1_700_000_000_000,
  });
  const folders: Folder[] = [{ id: "f", name: "Work/Stuff", order: 0, createdAt: 0 }];

  it("round-trips notes with folders and de-duplicated names", () => {
    const zipped = zipNotes([doc("1", "Plan", "f"), doc("2", "Plan", "f"), doc("3", "Loose: note?", null)], folders);
    const notes = unzipNotes(zipped).sort((a, b) => a.content.localeCompare(b.content));
    expect(notes).toEqual([
      { title: "Loose- note-", content: "# Loose: note?\n\nbody 3", folder: null },
      { title: "Plan", content: "# Plan\n\nbody 1", folder: "Work-Stuff" },
      { title: "Plan (2)", content: "# Plan\n\nbody 2", folder: "Work-Stuff" },
    ]);
  });
});
