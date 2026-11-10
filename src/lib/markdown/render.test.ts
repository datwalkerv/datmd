import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render";

describe("renderMarkdown", () => {
  it("renders GFM: tables, task lists, strikethrough, footnotes", () => {
    const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n\n~~old~~ text[^1]\n\n[^1]: note");
    expect(html).toContain("<table");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<del>old</del>");
    expect(html).toContain("footnote");
  });

  it("strips script URLs and raw HTML", () => {
    const html = renderMarkdown('[x](javascript:alert(1))\n\n<script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });

  it("maps blocks to source lines", () => {
    const html = renderMarkdown("# Title\n\ntext\n\n## Sub");
    expect(html).toContain('<h1 data-line="1"');
    expect(html).toContain('<p data-line="3"');
    expect(html).toContain('<h2 data-line="5"');
  });
});
