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

describe("renderMarkdown: phase 3", () => {
  it("renders inline and display math with KaTeX", () => {
    const html = renderMarkdown("Euler: $e^{i\\pi} + 1 = 0$\n\n$$\n\\int_0^1 x\\,dx\n$$");
    expect(html).toContain('class="katex"');
    expect(html).toContain("katex-display");
  });

  it("shows math errors inline instead of throwing", () => {
    expect(() => renderMarkdown("$\\frac{$")).not.toThrow();
  });

  it("highlights fenced code by language only", () => {
    const html = renderMarkdown("```js\nconst a = 1;\n```\n\n```\nplain\n```");
    expect(html).toContain('class="hljs-keyword"');
    expect(html).toContain("<code>plain\n</code>");
  });

  it("keeps mermaid source for client rendering", () => {
    expect(renderMarkdown("```mermaid\ngraph TD; A-->B\n```")).toContain('class="language-mermaid"');
  });

  it("turns [!TYPE] blockquotes into callouts", () => {
    const html = renderMarkdown("> [!WARNING] Careful\n> Hot surface\n\n> [!tip]\n> Use it\n\n> [!bogus]\n> plain quote");
    expect(html).toContain('<div class="callout callout-warning"');
    expect(html).toContain('<p class="callout-title">Careful</p>');
    expect(html).toContain('<p class="callout-title">Tip</p>');
    expect(html).toContain("<blockquote");
  });

  it("does not let users inject classes or handlers", () => {
    const html = renderMarkdown('```js" onmouseover="alert(1)\nx\n```');
    expect(html).not.toContain("onmouseover=");
  });

  it("appends calculation results only when asked", () => {
    const md = "20 + 30\n\n- 5 km in miles\n\nJust prose 2024";
    expect(renderMarkdown(md)).not.toContain("calc-result");
    const html = renderMarkdown(md, { calc: { rates: null, locale: "en-US" } });
    expect(html).toContain('<span class="calc-result" aria-label="equals 50">50</span>');
    expect(html).toContain("3.1069 mi");
    expect(html.match(/calc-result/g)).toHaveLength(2);
  });

  it("asks for rates when a currency conversion needs them", () => {
    let asked = false;
    const html = renderMarkdown("$30 in EUR", { calc: { rates: null, onNeedRates: () => (asked = true) } });
    expect(asked).toBe(true);
    expect(html).toContain("calc-pending");
  });
});
