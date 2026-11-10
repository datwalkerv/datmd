import type { Root } from "hast";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema, type Options as Schema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { type CalcOptions, addCalculations } from "./calc";
import { remarkCallouts } from "./callouts";
import { rehypeLineMap } from "./lineMap";

const attrs = defaultSchema.attributes ?? {};
const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...attrs,
    "*": [...(attrs["*"] ?? []), "dataLine"],
    code: [["className", /^language-./, "math-inline", "math-display"] as const],
    div: [...(attrs.div ?? []), ["className", "callout", /^callout-[a-z]+$/] as const],
    p: [...(attrs.p ?? []), ["className", "callout-title"] as const],
  },
};

// Raw HTML in the source is dropped (remark-rehype default) and everything is sanitized: imported files are untrusted.
// KaTeX and highlighting run after sanitizing; they only produce markup from text they escape themselves.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkCallouts)
  .use(remarkRehype)
  .use(rehypeLineMap)
  .use(rehypeSanitize, schema)
  .use(rehypeKatex, { throwOnError: false, strict: false, errorColor: "var(--dt-destructive)" })
  .use(rehypeHighlight, { detect: false, plainText: ["math", "mermaid", "text", "txt", "plain"] })
  .use(rehypeStringify)
  .freeze();

export interface RenderOptions {
  /** Show inline calculation results (preview only; exports keep the plain text). */
  calc?: CalcOptions;
}

export function renderMarkdown(markdown: string, options: RenderOptions = {}): string {
  const tree = processor.runSync(processor.parse(markdown)) as Root;
  if (options.calc) addCalculations(tree, options.calc);
  return processor.stringify(tree);
}
