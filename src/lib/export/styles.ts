/** Stand-alone, print-friendly document styles for HTML and PDF export (no app UI, fixed light palette). */
export const EXPORT_CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #fff; color: #1c1c1e; font: 11.5pt/1.65 "Iowan Old Style", "Charter", "Palatino Linotype", Georgia, serif; -webkit-font-smoothing: antialiased; }
main { max-width: 720px; margin: 56px auto 80px; padding: 0 28px; overflow-wrap: break-word; }
h1, h2, h3, h4, h5, h6 { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.25; letter-spacing: -0.01em; margin: 1.7em 0 0.55em; break-after: avoid; page-break-after: avoid; }
h1 { font-size: 2em; letter-spacing: -0.02em; margin-top: 0; }
h2 { font-size: 1.45em; padding-bottom: 0.2em; border-bottom: 1px solid #e5e5e7; }
h3 { font-size: 1.18em; }
h4 { font-size: 1.02em; }
h5, h6 { font-size: 0.95em; color: #555; }
p, ul, ol, blockquote, pre, table, .callout { margin: 0 0 1em; }
p, li { orphans: 3; widows: 3; }
a { color: #0a58ca; text-decoration-thickness: 1px; text-underline-offset: 2px; }
ul, ol { padding-left: 1.5em; }
li { margin: 0.2em 0; }
li::marker { color: #888; }
.contains-task-list { list-style: none; padding-left: 0.2em; }
.task-list-item input { margin: 0 0.55em 0 0; }
blockquote { margin-left: 0; padding: 0.05em 0 0.05em 1em; border-left: 3px solid #d1d1d6; color: #555; }
hr { border: 0; border-top: 1px solid #d1d1d6; margin: 2em 0; }
img, svg { max-width: 100%; height: auto; }
code, pre { font-family: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace; font-size: 0.86em; }
:not(pre) > code { background: #f2f2f4; padding: 0.12em 0.35em; border-radius: 4px; }
pre { background: #f6f6f8; border: 1px solid #e5e5e7; border-radius: 6px; padding: 0.9em 1.1em; overflow-x: auto; line-height: 1.5; white-space: pre-wrap; }
pre code { font-size: inherit; }
table { border-collapse: collapse; font-size: 0.93em; }
th, td { border: 1px solid #d1d1d6; padding: 0.4em 0.75em; text-align: left; }
th { background: #f6f6f8; font-family: -apple-system, "Inter", "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 600; }
thead { display: table-header-group; }
pre, table, blockquote, .callout, figure, img, svg, .katex-display, tr { break-inside: avoid; page-break-inside: avoid; }
.katex-display { overflow-x: auto; overflow-y: hidden; }
.footnotes { font-size: 0.88em; color: #555; border-top: 1px solid #e5e5e7; margin-top: 3em; padding-top: 0.5em; }
.footnotes h2 { font-size: 1em; border: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.callout { --c: #0a58ca; border-left: 3px solid var(--c); background: color-mix(in srgb, var(--c) 7%, #fff); padding: 0.7em 1em; border-radius: 6px; }
.callout > :last-child { margin-bottom: 0; }
.callout-title { font-family: -apple-system, "Inter", "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 650; color: var(--c); margin: 0 0 0.2em; }
.callout-tip { --c: #1a7f37; } .callout-important { --c: #6f42c1; } .callout-warning { --c: #9a6700; } .callout-caution { --c: #cf222e; }
pre.mermaid-block { display: flex; justify-content: center; background: none; border: 0; }
.mermaid-error { color: #cf222e; }
.hljs-comment, .hljs-quote { color: #6e7781; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-literal { color: #cf222e; }
.hljs-string, .hljs-regexp, .hljs-addition { color: #0a3069; }
.hljs-number, .hljs-symbol, .hljs-bullet { color: #0550ae; }
.hljs-title, .hljs-section, .hljs-type, .hljs-attr, .hljs-attribute, .hljs-name { color: #8250df; }
.hljs-deletion { color: #82071e; }
@page { size: A4; margin: 22mm 20mm 24mm; }
@media print {
  body { font-size: 10.5pt; }
  main { max-width: none; margin: 0; padding: 0; }
  a { color: inherit; text-decoration: underline; }
  pre { white-space: pre-wrap; }
  h1, h2 { break-before: auto; }
}
`;
