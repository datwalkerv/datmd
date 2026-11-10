import { exportBody, htmlDocument } from "./html";

/**
 * PDF via the browser's own print engine ("Save as PDF"): best typography, real text, no server.
 * shortcut: relies on the print dialog; add a server-side renderer only if one-click PDF files become a must.
 */
export async function printPdf(title: string, markdown: string) {
  const body = await exportBody(title, markdown);
  // Reuse the app's bundled KaTeX stylesheet so math prints offline too.
  await import("katex/dist/katex.min.css");
  const local = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
    .filter((l) => {
      try {
        return [...(l.sheet?.cssRules ?? [])].some((r) => r.cssText.startsWith(".katex"));
      } catch {
        return false;
      }
    })
    .map((l) => `<link rel="stylesheet" href="${l.href}">`)
    .join("");

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  frame.srcdoc = htmlDocument(title, body, local);
  document.body.append(frame);

  await new Promise<void>((resolve) => (frame.onload = () => resolve()));
  await frame.contentDocument?.fonts?.ready;
  const win = frame.contentWindow!;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  win.addEventListener("afterprint", cleanup, { once: true });
  win.focus();
  win.print();
  setTimeout(cleanup, 60_000); // some browsers never fire afterprint
}
