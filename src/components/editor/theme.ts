import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// Every colour is a datui token, so light/dark follows data-theme without a second theme.
export const editorTheme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "transparent", color: "var(--dt-foreground)", fontSize: "var(--editor-font-size)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-writing)", lineHeight: "1.75", overflowX: "hidden" },
  ".cm-content": {
    maxWidth: "var(--editor-width)",
    margin: "0 auto",
    padding: "48px 32px 40vh",
    caretColor: "var(--dt-primary)",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--dt-primary)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklab, var(--dt-primary) 22%, transparent) !important",
  },
  ".cm-placeholder": { color: "var(--dt-subtle-foreground)" },
  ".cm-searchMatch": { backgroundColor: "var(--dt-mark)" },
  "&.cm-typewriter .cm-content": { paddingTop: "45vh", paddingBottom: "50vh" },
  ".cm-tooltip": {
    backgroundColor: "var(--dt-popover)",
    color: "var(--dt-popover-foreground)",
    border: "1px solid var(--dt-separator)",
    borderRadius: "var(--dt-radius-md)",
    boxShadow: "var(--dt-shadow-md)",
    overflow: "hidden",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "var(--dt-font-sans)", fontSize: "13px", maxHeight: "280px", padding: "4px" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "5px 10px", borderRadius: "var(--dt-radius-sm)", lineHeight: "1.4" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--dt-secondary)", color: "var(--dt-foreground)" },
  ".cm-completionDetail": { marginLeft: "12px", color: "var(--dt-subtle-foreground)", fontStyle: "normal", fontFamily: "var(--dt-font-mono)", fontSize: "11.5px" },
  ".cm-completionMatchedText": { textDecoration: "none", fontWeight: "600" },
  ".cm-snippetField": { backgroundColor: "color-mix(in oklab, var(--dt-primary) 12%, transparent)", borderRadius: "2px" },
  ".cm-panels": { backgroundColor: "var(--dt-background-secondary)", color: "var(--dt-foreground)" },
  ".cm-panels-bottom": { borderTop: "1px solid var(--dt-separator)" },
  ".cm-panel.cm-search": { padding: "8px 12px", fontFamily: "var(--dt-font-sans)", fontSize: "13px" },
  ".cm-panel.cm-search input, .cm-panel.cm-search button": {
    borderRadius: "var(--dt-radius-sm)",
    border: "1px solid var(--dt-input-border)",
    background: "var(--dt-input)",
    color: "inherit",
  },
});

const markdownHighlight = HighlightStyle.define([
  { tag: t.heading1, fontWeight: "700", fontSize: "1.3em" },
  { tag: t.heading2, fontWeight: "700", fontSize: "1.15em" },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], fontWeight: "650" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--dt-muted-foreground)" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--dt-subtle-foreground)" },
  { tag: t.link, color: "var(--dt-link)" },
  { tag: t.url, color: "var(--dt-muted-foreground)" },
  { tag: t.quote, color: "var(--dt-muted-foreground)" },
  { tag: t.monospace, fontFamily: "var(--dt-font-mono)", fontSize: "0.92em" },
  // fenced code languages
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "var(--dt-primary)" },
  { tag: [t.string, t.special(t.string)], color: "var(--dt-positive)" },
  { tag: [t.number, t.bool, t.atom], color: "var(--dt-warning)" },
  { tag: t.comment, color: "var(--dt-subtle-foreground)", fontStyle: "italic" },
  { tag: [t.typeName, t.className], color: "var(--dt-link)" },
]);

export const editorHighlight = syntaxHighlighting(markdownHighlight);
