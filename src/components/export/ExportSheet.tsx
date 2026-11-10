"use client";

import { ActionSheet, ActionSheetItem } from "datui";
import { FileCode2, FileText, FileType2, Printer } from "lucide-react";
import { useApp } from "@/components/app/context";
import type { Doc } from "@/lib/storage/types";
import { type ExportFormat, exportDoc } from "./exportDoc";

const FORMATS: { format: ExportFormat; label: string; hint: string; icon: React.ReactNode }[] = [
  { format: "md", label: "Markdown", hint: ".md", icon: <FileText /> },
  { format: "html", label: "Web page", hint: ".html", icon: <FileCode2 /> },
  { format: "pdf", label: "PDF", hint: "Print → Save as PDF", icon: <Printer /> },
  { format: "docx", label: "Word document", hint: ".docx", icon: <FileType2 /> },
];

interface Props {
  doc: Doc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function ExportSheet({ doc, open, onOpenChange, anchorRef }: Props) {
  const { notify } = useApp();
  return (
    <ActionSheet open={open} onOpenChange={onOpenChange} anchorRef={anchorRef} title="Export">
      {FORMATS.map((f) => (
        <ActionSheetItem
          key={f.format}
          before={f.icon}
          meta={f.hint}
          onClick={() => exportDoc(doc, f.format).catch(() => notify(`Couldn't export as ${f.label}.`))}
        >
          {f.label}
        </ActionSheetItem>
      ))}
    </ActionSheet>
  );
}
