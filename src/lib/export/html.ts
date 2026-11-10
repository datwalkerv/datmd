import { hydrateMermaid } from "@/lib/markdown/mermaid";
import { renderMarkdown } from "@/lib/markdown/render";
import { EXPORT_CSS } from "./styles";

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/katex.min.css";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Rendered body for export: diagrams drawn as SVG, title added when the note doesn't start with one. */
export async function exportBody(title: string, markdown: string): Promise<string> {
  const root = document.createElement("div");
  root.innerHTML = renderMarkdown(markdown); // sanitized; no calculation results (presentation-only)
  await hydrateMermaid(root, false);
  for (const el of root.querySelectorAll("[data-line]")) el.removeAttribute("data-line");
  if (root.firstElementChild?.tagName !== "H1") root.insertAdjacentHTML("afterbegin", `<h1>${escapeHtml(title)}</h1>`);
  return root.innerHTML;
}

export function htmlDocument(title: string, body: string, extraHead = ""): string {
  const math = body.includes('class="katex') ? `<link rel="stylesheet" href="${KATEX_CSS}" crossorigin="anonymous">` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="datmd">
<title>${escapeHtml(title)}</title>
${math}${extraHead}
<style>${EXPORT_CSS}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

export async function exportHtml(title: string, markdown: string): Promise<string> {
  return htmlDocument(title, await exportBody(title, markdown));
}
