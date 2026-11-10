"use client";

import { FormItem, ModalPage, ModalPageContent, ModalPageHeader, SegmentedControl, Slider, Switch } from "datui";
import { MOD } from "@/components/editor/EditorHeader";
import { type EditorMode, setPrefs, type Theme, usePrefs } from "@/hooks/usePrefs";

const SHORTCUTS: [string, string][] = [
  [`${MOD}K`, "Search notes"],
  [`${MOD}⌥N`, "New note"],
  [`${MOD}1 / 2 / 3`, "Edit / Preview / Split"],
  [`${MOD}⇧F`, "Focus mode"],
  [`${MOD}⌥T`, "Typewriter mode"],
  [`${MOD}⌥O`, "Toggle outline"],
  [`${MOD}\\`, "Toggle sidebar"],
  [`${MOD}B`, "Bold"],
  [`${MOD}I`, "Italic"],
  [`${MOD}⇧X`, "Strikethrough"],
  [`${MOD}E`, "Inline code"],
  [`${MOD}⇧K`, "Link"],
  [`${MOD}⌥1 – 4`, "Heading 1 – 4"],
  [`${MOD}⇧8`, "Bullet list"],
  [`${MOD}⇧7`, "Numbered list"],
  [`${MOD}⇧9`, "Task list"],
  [`${MOD}⇧.`, "Quote"],
  [`${MOD}⌥C`, "Code block"],
  ["/", "Insert menu (at line start)"],
  [`${MOD}F`, "Find in note"],
  [`${MOD},`, "Settings"],
  ["F2", "Rename selected note"],
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs();
  return (
    <ModalPage open={open} onClose={onClose} size="m" header={<ModalPageHeader>Settings</ModalPageHeader>}>
      <ModalPageContent className="pb-6">
        <FormItem top="Appearance">
          <SegmentedControl
            aria-label="Theme"
            value={prefs.theme}
            onChange={(v) => setPrefs({ theme: v as Theme })}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "System" },
            ]}
          />
        </FormItem>
        <FormItem top="Default view for new sessions">
          <SegmentedControl
            aria-label="Default editor view"
            value={prefs.defaultMode}
            onChange={(v) => setPrefs({ defaultMode: v as EditorMode })}
            options={[
              { value: "edit", label: "Edit" },
              { value: "preview", label: "Preview" },
              { value: "split", label: "Split" },
            ]}
          />
        </FormItem>
        <FormItem top={`Text size · ${prefs.fontSize}px`}>
          <Slider
            min={14}
            max={22}
            step={1}
            value={prefs.fontSize}
            onChange={(v) => setPrefs({ fontSize: v as number })}
            getAriaLabel={() => "Text size"}
          />
        </FormItem>
        <FormItem top="Inline calculations" bottom="Shows results after lines like “20% of 150” or “$30 in EUR”. Your text is never changed. Currency rates come from the European Central Bank and are fetched only when a note uses currencies.">
          <label className="flex items-center justify-between gap-4 text-[14px]">
            Show results
            <Switch checked={prefs.calculations} onCheckedChange={(on) => setPrefs({ calculations: on })} />
          </label>
        </FormItem>
        <FormItem top="Keyboard shortcuts">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={action} className="contents">
                <dt>
                  <kbd className="rounded-xs border border-separator bg-background-secondary px-1.5 py-0.5 font-mono text-[11.5px] text-muted-foreground">
                    {keys}
                  </kbd>
                </dt>
                <dd className="text-muted-foreground">{action}</dd>
              </div>
            ))}
          </dl>
        </FormItem>
        <p className="px-4 pt-2 text-[12px] text-subtle-foreground">
          Notes are stored only in this browser. Export anything you want to keep elsewhere.
        </p>
      </ModalPageContent>
    </ModalPage>
  );
}
