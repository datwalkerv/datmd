export function downloadFile(name: string, text: string, type = "text/markdown;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileName = (title: string, ext: string) =>
  `${title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "Untitled"}.${ext}`;

const MARKDOWN = /\.(md|markdown|mdown|txt)$/i;

/** Reads markdown/text files; title comes from the file name. Other files are skipped. */
export async function readMarkdownFiles(files: Iterable<File>) {
  const picked = [...files].filter((f) => MARKDOWN.test(f.name));
  return Promise.all(picked.map(async (f) => ({ title: f.name.replace(MARKDOWN, ""), content: await f.text() })));
}

/** Opens the native file picker for markdown files. */
export function pickMarkdownFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement("input"), {
      type: "file",
      multiple: true,
      accept: ".md,.markdown,.mdown,.txt,text/markdown,text/plain",
    });
    input.onchange = () => resolve([...(input.files ?? [])]);
    input.click();
  });
}
