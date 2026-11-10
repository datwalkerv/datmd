import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "table", "hr", "section", "div"]);

/** Stamps `data-line` (1-based source line) on block elements so the preview can follow the editor. */
export function rehypeLineMap() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const line = node.position?.start.line;
      if (line && BLOCKS.has(node.tagName)) node.properties.dataLine = line;
    });
  };
}
