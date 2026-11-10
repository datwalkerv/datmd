import { downloadFile, fileName } from "@/lib/files";
import type { Doc } from "@/lib/storage/types";

export type ExportFormat = "md" | "html" | "pdf" | "docx";

// Heavy exporters (docx, mermaid, KaTeX) load only when used.
export async function exportDoc(doc: Doc, format: ExportFormat) {
  switch (format) {
    case "md":
      return downloadFile(fileName(doc.title, "md"), doc.content);
    case "html": {
      const { exportHtml } = await import("@/lib/export/html");
      return downloadFile(fileName(doc.title, "html"), await exportHtml(doc.title, doc.content), "text/html;charset=utf-8");
    }
    case "pdf": {
      const { printPdf } = await import("@/lib/export/pdf");
      return printPdf(doc.title, doc.content);
    }
    case "docx": {
      const { docxBlob } = await import("@/lib/export/docx");
      return downloadFile(fileName(doc.title, "docx"), await docxBlob(doc.title, doc.content));
    }
  }
}
