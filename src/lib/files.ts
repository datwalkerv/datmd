export function downloadFile(name: string, data: BlobPart | Blob, type = "text/markdown;charset=utf-8") {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** File-system-safe version of a title. */
export const safeName = (title: string) => title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").trim().slice(0, 120) || "Untitled";

export const fileName = (title: string, ext: string) => `${safeName(title)}.${ext}`;

const MARKDOWN = /\.(md|markdown|mdown|txt)$/i;

/**
 * Reads markdown/text files (title from the file name) and .zip archives of them (directories become folders).
 * Other files are skipped.
 */
export async function readMarkdownFiles(files: Iterable<File>): Promise<{ title: string; content: string; folder: string | null }[]> {
  const out = [];
  for (const f of files) {
    if (MARKDOWN.test(f.name)) out.push({ title: f.name.replace(MARKDOWN, ""), content: await f.text(), folder: null });
    else if (/\.zip$/i.test(f.name)) {
      const { unzipNotes } = await import("@/lib/export/zip");
      out.push(...unzipNotes(new Uint8Array(await f.arrayBuffer())));
    }
  }
  return out;
}

/** Opens the native file picker for markdown files. */
export function pickMarkdownFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement("input"), {
      type: "file",
      multiple: true,
      accept: ".md,.markdown,.mdown,.txt,.zip,text/markdown,text/plain,application/zip",
    });
    input.onchange = () => resolve([...(input.files ?? [])]);
    input.click();
  });
}
