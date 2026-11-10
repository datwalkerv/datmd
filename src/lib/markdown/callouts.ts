import type { Blockquote, Paragraph, Root } from "mdast";
import { visit } from "unist-util-visit";

const TITLES = { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" } as const;
type CalloutType = keyof typeof TITLES;
const ALIASES: Record<string, CalloutType> = {
  note: "note",
  info: "note",
  tip: "tip",
  hint: "tip",
  success: "tip",
  important: "important",
  warning: "warning",
  attention: "warning",
  caution: "caution",
  danger: "caution",
  error: "caution",
};

const MARKER = /^\[!(\w+)\][+-]?[ \t]*([^\n]*)\n?/;

/** `> [!NOTE] Optional title` (GitHub / Obsidian style) → <div class="callout callout-note">. */
export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (first?.type !== "paragraph") return;
      const text = first.children[0];
      if (text?.type !== "text") return;
      const m = MARKER.exec(text.value);
      const type = m && ALIASES[m[1].toLowerCase()];
      if (!m || !type) return;

      text.value = text.value.slice(m[0].length);
      if (!text.value) first.children.shift();
      if (!first.children.length) node.children.shift();

      const title: Paragraph = {
        type: "paragraph",
        data: { hProperties: { className: ["callout-title"] } },
        children: [{ type: "text", value: m[2].trim() || TITLES[type] }],
      };
      node.children.unshift(title);
      node.data = { hName: "div", hProperties: { className: ["callout", `callout-${type}`] } };
    });
  };
}
