import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeLineMap } from "./lineMap";

const schema = {
  ...defaultSchema,
  attributes: { ...defaultSchema.attributes, "*": [...(defaultSchema.attributes?.["*"] ?? []), "dataLine"] },
};

// Raw HTML in the source is dropped (remark-rehype default) and URLs are sanitized: imported files are untrusted.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeLineMap)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify)
  .freeze();

export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(markdown));
}
