import { describe, expect, it } from "vitest";
import { extractHeadings } from "./markdown/outline";
import { textStats } from "./markdown/stats";
import { highlight, searchDocs } from "./search/search";
import type { Doc } from "./storage/types";
import { TEMPLATES } from "./templates";

const doc = (id: string, title: string, content: string, updatedAt = 0): Doc => ({
  id, title, content, folderId: null, order: 0, pinned: false, createdAt: 0, updatedAt,
});

describe("search", () => {
  const docs = [
    doc("a", "Groceries", "milk, eggs and árvíztűrő tükörfúrógép"),
    doc("b", "Meeting notes", "discussed groceries budget", 5),
    doc("c", "Ideas", "nothing here"),
  ];

  it("ranks title matches above content matches", () => {
    expect(searchDocs(docs, "groceries").map((h) => h.doc.id)).toEqual(["a", "b"]);
  });

  it("requires every term and ignores case and accents", () => {
    expect(searchDocs(docs, "ARVIZTURO milk").map((h) => h.doc.id)).toEqual(["a"]);
    expect(searchDocs(docs, "milk budget")).toEqual([]);
  });

  it("highlights original-text ranges even with accents", () => {
    expect(highlight("Árvíz tűrő", ["arviz"])).toEqual([[0, 5]]);
    expect(highlight("aXa xa", ["xa"])).toEqual([[1, 3], [4, 6]]);
  });

  it("builds a snippet around the match", () => {
    const [hit] = searchDocs([doc("x", "t", `${"lorem ".repeat(30)}needle end`)], "needle");
    expect(hit.snippet.startsWith("…")).toBe(true);
    expect(hit.snippet.slice(hit.snippetRanges[0][0], hit.snippetRanges[0][1])).toBe("needle");
  });
});

it("strips markdown syntax from snippets", () => {
  const [hit] = searchDocs([doc("x", "t", "## **Bold** [link](http://u) `code`[^1]")], "bold");
  expect(hit.snippet).toBe("Bold link code");
});

describe("outline", () => {
  it("finds ATX and setext headings, skipping code fences", () => {
    const md = "# One\n\ntext\n\n```\n# not\n```\n\n## Two **bold** [l](u)\n\nThree\n=====\n\n- item\n---";
    expect(extractHeadings(md)).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 2, text: "Two bold l", line: 9 },
      { level: 1, text: "Three", line: 11 },
    ]);
  });
});

describe("stats", () => {
  it("counts words, characters and reading time", () => {
    expect(textStats("# Hello, world!\n\nIt's **fine** — árvíz")).toEqual({ words: 5, characters: 36, readingMinutes: 1 });
    expect(textStats("")).toEqual({ words: 0, characters: 0, readingMinutes: 0 });
  });
});

describe("templates", () => {
  it("each builds a titled document", () => {
    for (const t of TEMPLATES) {
      const out = t.build(new Date(2026, 10, 10));
      expect(out.title).toBeTruthy();
      expect(out.content).toMatch(/^# /);
    }
    expect(TEMPLATES.find((t) => t.id === "daily")?.build(new Date(2026, 10, 10)).title).toBe("2026-11-10");
  });
});
