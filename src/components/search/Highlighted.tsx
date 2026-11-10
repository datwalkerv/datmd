import { Mark } from "datui";
import type { Range } from "@/lib/search/search";

/** Renders `text` with the given ranges wrapped in <mark>. */
export function Highlighted({ text, ranges }: { text: string; ranges: Range[] }) {
  if (!ranges.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const [s, e] of ranges) {
    if (s > at) parts.push(text.slice(at, s));
    parts.push(<Mark key={s}>{text.slice(s, e)}</Mark>);
    at = e;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}
