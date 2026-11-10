export interface Heading {
  level: number;
  text: string;
  /** 1-based source line. */
  line: number;
}

const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const BLOCK_START = /^ {0,3}([-*+]\s|\d+[.)]\s|>|#|\||$)/;

/** Inline markdown → plain text for the outline label. */
const plain = (s: string) =>
  s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .trim();

/** Headings (ATX and setext), ignoring anything inside fenced code. */
export function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split("\n");
  const out: Heading[] = [];
  let fence: string | null = null;

  lines.forEach((line, i) => {
    const f = FENCE.exec(line);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      return;
    }
    if (f) return void (fence = f[1]);

    const atx = ATX.exec(line);
    if (atx) return void out.push({ level: atx[1].length, text: plain(atx[2] ?? "") || "Untitled section", line: i + 1 });

    const s = SETEXT.exec(line);
    const prev = lines[i - 1];
    if (s && i > 0 && prev.trim() && !BLOCK_START.test(prev) && out.at(-1)?.line !== i) {
      out.push({ level: s[1][0] === "=" ? 1 : 2, text: plain(prev), line: i });
    }
  });
  return out;
}
