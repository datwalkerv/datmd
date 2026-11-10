import { type Completion, type CompletionContext, type CompletionResult, snippet } from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";
import { syntaxTree } from "@codemirror/language";

interface Command {
  name: string;
  keywords: string;
  template: string;
  hint: string;
}

const today = () => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

// ${name} marks a tab stop, ${} the final cursor.
const COMMANDS: Command[] = [
  { name: "Heading 1", keywords: "h1 title", template: "# ${heading}", hint: "#" },
  { name: "Heading 2", keywords: "h2 subtitle", template: "## ${heading}", hint: "##" },
  { name: "Heading 3", keywords: "h3", template: "### ${heading}", hint: "###" },
  { name: "Bullet list", keywords: "ul unordered", template: "- ${item}", hint: "-" },
  { name: "Numbered list", keywords: "ol ordered", template: "1. ${item}", hint: "1." },
  { name: "Task list", keywords: "todo checkbox", template: "- [ ] ${task}", hint: "- [ ]" },
  { name: "Quote", keywords: "blockquote", template: "> ${quote}", hint: ">" },
  { name: "Code block", keywords: "fence pre", template: "```${lang}\n${}\n```", hint: "```" },
  { name: "Table", keywords: "grid", template: "| ${Column} | Column |\n|---|---|\n| ${} |  |", hint: "| |" },
  { name: "Link", keywords: "url href", template: "[${text}](${url})", hint: "[ ]( )" },
  { name: "Image", keywords: "picture img", template: "![${alt}](${url})", hint: "![ ]( )" },
  { name: "Divider", keywords: "hr rule line", template: "---\n${}", hint: "---" },
  { name: "Bold", keywords: "strong", template: "**${text}**", hint: "**" },
  { name: "Italic", keywords: "emphasis", template: "*${text}*", hint: "*" },
  { name: "Strikethrough", keywords: "delete", template: "~~${text}~~", hint: "~~" },
  { name: "Inline code", keywords: "mono", template: "`${code}`", hint: "`" },
  { name: "Footnote", keywords: "note reference", template: "[^${1}]\n\n[^1]: ${}", hint: "[^1]" },
];

const inCode = (ctx: CompletionContext) => {
  for (let n: ReturnType<typeof syntaxTree>["topNode"] | null = syntaxTree(ctx.state).resolveInner(ctx.pos, -1); n; n = n.parent) {
    if (n.name === "FencedCode" || n.name === "InlineCode" || n.name === "CodeBlock") return true;
  }
  return false;
};

/** "/" at line start or after a space opens a Markdown insert menu. */
export function slashCommands(ctx: CompletionContext): CompletionResult | null {
  const m = ctx.matchBefore(/(?:^|\s)\/[\w ]*$/);
  if (!m || inCode(ctx)) return null;
  const slash = m.from + m.text.indexOf("/");
  const query = ctx.state.sliceDoc(slash + 1, ctx.pos).toLowerCase().trim();
  if (query.length > 20) return null;
  const options: Completion[] = COMMANDS.filter((c) => !query || `${c.name} ${c.keywords}`.toLowerCase().includes(query)).map((c, i) => ({
    label: c.name,
    detail: c.hint,
    boost: -i,
    apply: snippet(c.template),
  }));
  options.push(
    ...(!query || "date today".includes(query) ? [{ label: "Today’s date", detail: today(), apply: today() } as Completion] : []),
  );
  return options.length ? { from: slash, options, filter: false } : null;
}

const LANGS = [...new Set(languages.flatMap((l) => [l.name.toLowerCase(), ...l.alias]))].filter((l) => /^[\w+#-]+$/.test(l));

/** Language names after an opening ``` fence. */
export function fenceLanguages(ctx: CompletionContext): CompletionResult | null {
  const m = ctx.matchBefore(/^\s*(```|~~~)[\w+#-]*$/);
  if (!m) return null;
  const from = m.from + m.text.search(/[`~]{3}/) + 3;
  return { from, options: LANGS.map((label) => ({ label, type: "keyword" })), validFor: /^[\w+#-]*$/ };
}
