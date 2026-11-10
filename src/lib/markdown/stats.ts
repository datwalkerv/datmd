const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const WPM = 230;

export function textStats(text: string) {
  const words = text.match(WORD)?.length ?? 0;
  return {
    words,
    characters: text.replace(/\n/g, "").length,
    readingMinutes: words ? Math.max(1, Math.round(words / WPM)) : 0,
  };
}
