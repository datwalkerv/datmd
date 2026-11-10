import type { Doc } from "@/lib/storage/types";

export type Range = [start: number, end: number];

/** Case- and accent-insensitive copy of `text`, plus a map from each folded index to its original index. */
function fold(text: string): { folded: string; orig: number[] } {
  let folded = "";
  const orig: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = text[i].normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    folded += f;
    for (let k = 0; k < f.length; k++) orig.push(i);
  }
  orig.push(text.length);
  return { folded, orig };
}

export const terms = (query: string) => fold(query).folded.split(/\s+/).filter(Boolean);

/** Every occurrence of every term in `text`, as merged original-index ranges. */
export function highlight(text: string, ts: string[]): Range[] {
  const { folded, orig } = fold(text);
  const raw: Range[] = [];
  for (const t of ts) {
    for (let i = folded.indexOf(t); i !== -1; i = folded.indexOf(t, i + t.length)) {
      raw.push([orig[i], orig[i + t.length - 1] + 1]);
    }
  }
  raw.sort((a, b) => a[0] - b[0]);
  const out: Range[] = [];
  for (const r of raw) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}

export interface SearchHit {
  doc: Doc;
  score: number;
  titleRanges: Range[];
  snippet: string;
  snippetRanges: Range[];
}

const BEFORE = 40;
const LENGTH = 160;

/** All terms must match (title or content). Title matches rank first, then content frequency, then recency. */
export function searchDocs(docs: Doc[], query: string, limit = 50): SearchHit[] {
  const ts = terms(query);
  if (!ts.length) return [];
  const q = ts.join(" ");
  const hits: SearchHit[] = [];

  for (const doc of docs) {
    const title = fold(doc.title).folded;
    const { folded: body, orig } = fold(doc.content);
    if (!ts.every((t) => title.includes(t) || body.includes(t))) continue;

    let score = 0;
    if (title.includes(q)) score += 100;
    if (title.startsWith(ts[0])) score += 40;
    for (const t of ts) {
      if (title.includes(t)) score += 20;
      score += Math.min(10, body.split(t).length - 1);
    }

    // Snippet around the earliest content match.
    const first = Math.min(...ts.map((t) => body.indexOf(t)).filter((i) => i >= 0));
    const at = Number.isFinite(first) ? orig[first] : 0;
    const start = Math.max(0, at - BEFORE);
    let snippet = doc.content
      .slice(start, start + LENGTH)
      .replace(/\[\^[^\]]*\]:?|!?\[([^\]]*)\]\([^)]*\)?|[#*_`~>|]+/g, "$1") // markdown syntax → plain text
      .replace(/\s+/g, " ")
      .trim();
    if (start > 0) snippet = `…${snippet}`;
    if (start + LENGTH < doc.content.length) snippet += "…";

    hits.push({ doc, score, titleRanges: highlight(doc.title, ts), snippet, snippetRanges: highlight(snippet, ts) });
  }

  return hits.sort((a, b) => b.score - a.score || b.doc.updatedAt - a.doc.updatedAt).slice(0, limit);
}
