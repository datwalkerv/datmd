"use client";

import { ModalPage, ModalPageContent, ModalPageHeader, Tappable } from "datui";
import { BookOpen, CalendarDays, FileText, NotebookPen, Presentation, Users } from "lucide-react";
import { useApp } from "@/components/app/context";
import { TEMPLATES } from "@/lib/templates";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  simple: FileText,
  daily: CalendarDays,
  meeting: Users,
  journal: NotebookPen,
  project: Presentation,
  article: BookOpen,
};

export function TemplatePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { newDoc } = useApp();
  return (
    <ModalPage open={open} onClose={onClose} size="m" header={<ModalPageHeader>New from template</ModalPageHeader>}>
      <ModalPageContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const Icon = ICONS[t.id] ?? FileText;
          return (
            <Tappable
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                onClose();
                void newDoc(null, t.build(new Date()));
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              className="flex items-start gap-3 rounded-lg border border-separator p-3.5"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-icon-secondary" />
              <span>
                <span className="block text-[14px] font-medium">{t.name}</span>
                <span className="block text-[12.5px] text-muted-foreground">{t.description}</span>
              </span>
            </Tappable>
          );
        })}
      </ModalPageContent>
    </ModalPage>
  );
}
