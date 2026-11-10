import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  FootnoteReferenceRun,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { BlockContent, DefinitionContent, List, PhrasingContent, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { remarkCallouts } from "@/lib/markdown/callouts";
import { MATH_OPTIONS } from "@/lib/markdown/render";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath, MATH_OPTIONS).use(remarkCallouts).freeze();

const MONO = "Consolas";
const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
const CALLOUT_COLORS: Record<string, string> = { note: "0A58CA", tip: "1A7F37", important: "6F42C1", warning: "9A6700", caution: "CF222E" };

type Inline = TextRun | ExternalHyperlink | FootnoteReferenceRun;
type Block = Paragraph | Table;
interface Fmt {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  link?: boolean;
}
interface Ctx {
  /** Nesting depth inside lists (0 = top level). */
  level: number;
  quote: number;
  footnotes: Map<string, number>;
  nextList: () => number;
}

const run = (text: string, fmt: Fmt, extra: Record<string, unknown> = {}) =>
  new TextRun({ text, bold: fmt.bold, italics: fmt.italics, strike: fmt.strike, style: fmt.link ? "Hyperlink" : undefined, ...extra });

function inlines(nodes: PhrasingContent[], ctx: Ctx, fmt: Fmt = {}): Inline[] {
  return nodes.flatMap((n): Inline[] => {
    switch (n.type) {
      case "text":
        return [run(n.value.replace(/\n/g, " "), fmt)];
      case "strong":
        return inlines(n.children, ctx, { ...fmt, bold: true });
      case "emphasis":
        return inlines(n.children, ctx, { ...fmt, italics: true });
      case "delete":
        return inlines(n.children, ctx, { ...fmt, strike: true });
      case "inlineCode":
        return [run(n.value, fmt, { font: MONO, shading: { type: ShadingType.CLEAR, fill: "F2F2F4", color: "auto" } })];
      case "inlineMath":
        return [run(n.value, { ...fmt, italics: true }, { font: "Cambria Math" })];
      case "break":
        return [new TextRun({ break: 1 })];
      case "link":
        return /^(https?:|mailto:)/i.test(n.url)
          ? [new ExternalHyperlink({ link: n.url, children: inlines(n.children, ctx, { ...fmt, link: true }) as TextRun[] })]
          : inlines(n.children, ctx, fmt);
      case "image":
        return [run(`[${n.alt || "image"}]`, { ...fmt, italics: true })];
      case "footnoteReference": {
        const id = ctx.footnotes.get(n.identifier.toLowerCase());
        return id ? [new FootnoteReferenceRun(id)] : [run(`[^${n.label ?? n.identifier}]`, fmt)];
      }
      default:
        return "children" in n ? inlines(n.children as PhrasingContent[], ctx, fmt) : [];
    }
  });
}

const quoteStyle = (ctx: Ctx) =>
  ctx.quote
    ? {
        indent: { left: 360 * ctx.quote },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: "C7C7CC", space: 10 } },
      }
    : {};

function codeParagraph(text: string, ctx: Ctx, center = false) {
  const lines = text.split("\n");
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : undefined,
    shading: center ? undefined : { type: ShadingType.CLEAR, fill: "F6F6F8", color: "auto" },
    spacing: { before: 120, after: 160 },
    ...quoteStyle(ctx),
    children: lines.map((l, i) => new TextRun({ text: l, font: center ? "Cambria Math" : MONO, size: 19, break: i ? 1 : undefined })),
  });
}

function list(node: List, ctx: Ctx): Block[] {
  const instance = node.ordered ? ctx.nextList() : 0;
  return node.children.flatMap((item) => {
    const [first, ...rest] = item.children;
    const marker = item.checked === true ? "☑ " : item.checked === false ? "☐ " : "";
    const numbering = node.ordered ? { numbering: { reference: "ordered", level: Math.min(ctx.level, 8), instance } } : { bullet: { level: Math.min(ctx.level, 8) } };
    const head =
      first?.type === "paragraph"
        ? [new Paragraph({ ...numbering, ...quoteStyle(ctx), children: [run(marker, {}), ...inlines(first.children, ctx)] })]
        : [new Paragraph({ ...numbering, children: [run(marker, {})] }), ...blocks(first ? [first] : [], ctx)];
    return [...head, ...blocks(rest, { ...ctx, level: ctx.level + 1 })];
  });
}

function blocks(nodes: (RootContent | BlockContent | DefinitionContent)[], ctx: Ctx): Block[] {
  return nodes.flatMap((n): Block[] => {
    switch (n.type) {
      case "heading":
        return [new Paragraph({ heading: HEADINGS[n.depth - 1], children: inlines(n.children, ctx) })];
      case "paragraph":
        return [new Paragraph({ spacing: { after: 160 }, ...quoteStyle(ctx), children: inlines(n.children, ctx) })];
      case "list":
        return list(n, ctx);
      case "blockquote": {
        const cls = (n.data as { hProperties?: { className?: string[] } } | undefined)?.hProperties?.className;
        const type = cls?.[1]?.replace("callout-", "");
        if (type && n.children[0]?.type === "paragraph") {
          const [title, ...body] = n.children;
          const color = CALLOUT_COLORS[type] ?? "0A58CA";
          const shade = { type: ShadingType.CLEAR, fill: "F5F7FA", color: "auto" };
          const border = { left: { style: BorderStyle.SINGLE, size: 18, color, space: 10 } };
          return [
            new Paragraph({ shading: shade, border, children: inlines((title as { children: PhrasingContent[] }).children, ctx, { bold: true }) }),
            ...blocks(body, ctx),
          ];
        }
        return blocks(n.children, { ...ctx, quote: ctx.quote + 1 });
      }
      case "code":
        return [codeParagraph(n.value, ctx)];
      case "math":
        return [codeParagraph(n.value, ctx, true)];
      case "thematicBreak":
        return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C7C7CC", space: 1 } }, children: [] })];
      case "table":
        return [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: n.children.map(
              (row, r) =>
                new TableRow({
                  tableHeader: r === 0,
                  children: row.children.map(
                    (cell) =>
                      new TableCell({
                        shading: r === 0 ? { type: ShadingType.CLEAR, fill: "F2F2F4", color: "auto" } : undefined,
                        children: [new Paragraph({ children: inlines(cell.children, ctx, { bold: r === 0 }) })],
                      }),
                  ),
                }),
            ),
          }),
          new Paragraph({ children: [] }),
        ];
      default:
        return []; // html, definitions, footnote definitions (collected separately)
    }
  });
}

/** Builds a Word document from markdown. Footnotes become real Word footnotes. */
export function markdownToDocx(title: string, markdown: string): Document {
  const tree = parser.runSync(parser.parse(markdown)) as Root;
  let lists = 0;
  const footnotes = new Map<string, number>();
  const defs = tree.children.filter((n) => n.type === "footnoteDefinition");
  defs.forEach((d, i) => footnotes.set(d.identifier.toLowerCase(), i + 1));
  const ctx: Ctx = { level: 0, quote: 0, footnotes, nextList: () => ++lists };

  const body = blocks(tree.children, ctx);
  const startsWithTitle = tree.children[0]?.type === "heading" && tree.children[0].depth === 1;

  return new Document({
    creator: "datmd",
    title,
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    numbering: {
      config: [
        {
          reference: "ordered",
          levels: Array.from({ length: 9 }, (_, level) => ({
            level,
            format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level % 3],
            text: `%${level + 1}.`,
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    footnotes: Object.fromEntries(
      defs.map((d, i) => [i + 1, { children: blocks(d.children, ctx).filter((b): b is Paragraph => b instanceof Paragraph) }]),
    ),
    sections: [
      {
        properties: { page: { margin: { top: 1247, bottom: 1361, left: 1134, right: 1134 } } },
        children: [...(startsWithTitle ? [] : [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] })]), ...body],
      },
    ],
  });
}

export const docxBlob = (title: string, markdown: string) => Packer.toBlob(markdownToDocx(title, markdown));
