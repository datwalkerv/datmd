"use client";

import { Button, FormItem, Group, Header, ModalPage, ModalPageContent, ModalPageHeader, SegmentedControl, Slider, Switch } from "datui";
import { Archive, FileUp } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/app/context";
import { MOD } from "@/components/editor/EditorHeader";
import { type EditorMode, type EditorWidth, type FontFamily, setPrefs, type Theme, usePrefs } from "@/hooks/usePrefs";
import { downloadFile } from "@/lib/files";

const SHORTCUTS: [string, string][] = [
  [`${MOD}K`, "Search notes"],
  [`${MOD}⌥N`, "New note"],
  [`${MOD}S`, "Save now"],
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

const SAVE_DELAYS = [
  { value: 300, label: "Instantly" },
  { value: 1000, label: "After 1 s" },
  { value: 3000, label: "After 3 s" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Group mode="plain" header={<Header>{title}</Header>}>
      {children}
    </Group>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs();
  const { docs, folders, importFiles, notify } = useApp();
  const [zipping, setZipping] = useState(false);

  const exportAll = async () => {
    setZipping(true);
    try {
      const { zipNotes } = await import("@/lib/export/zip");
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`datmd-notes-${date}.zip`, new Blob([zipNotes(docs, folders) as Uint8Array<ArrayBuffer>], { type: "application/zip" }));
    } catch {
      notify("Couldn't create the archive.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <ModalPage open={open} onClose={onClose} size="m" header={<ModalPageHeader>Settings</ModalPageHeader>}>
      <ModalPageContent className="pb-6">
        <Section title="Appearance">
          <FormItem top="Theme">
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
        </Section>

        <Section title="Writing">
          <FormItem top="Font">
            <SegmentedControl
              aria-label="Writing font"
              value={prefs.fontFamily}
              onChange={(v) => setPrefs({ fontFamily: v as FontFamily })}
              options={[
                { value: "sans", label: <span className="font-sans">Sans</span> },
                { value: "serif", label: <span style={{ fontFamily: "var(--font-serif)" }}>Serif</span> },
                { value: "mono", label: <span className="font-mono">Mono</span> },
              ]}
            />
          </FormItem>
          <FormItem top={`Text size · ${prefs.fontSize}px`}>
            <Slider min={14} max={22} step={1} value={prefs.fontSize} onChange={(v) => setPrefs({ fontSize: v as number })} getAriaLabel={() => "Text size"} />
          </FormItem>
          <FormItem top={`Line height · ${prefs.lineHeight.toFixed(2)}`}>
            <Slider
              min={1.4}
              max={2.1}
              step={0.05}
              value={prefs.lineHeight}
              onChange={(v) => setPrefs({ lineHeight: v as number })}
              getAriaLabel={() => "Line height"}
            />
          </FormItem>
          <FormItem top="Text width">
            <SegmentedControl
              aria-label="Text width"
              value={prefs.editorWidth}
              onChange={(v) => setPrefs({ editorWidth: v as EditorWidth })}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "medium", label: "Medium" },
                { value: "wide", label: "Wide" },
                { value: "full", label: "Full" },
              ]}
            />
          </FormItem>
        </Section>

        <Section title="Editor">
          <FormItem top="Default view">
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
          <FormItem top="Automatic saving" bottom={`Notes always save automatically. Choose how long to wait after you stop typing; ${MOD}S saves immediately.`}>
            <SegmentedControl
              aria-label="Automatic saving delay"
              value={prefs.saveDelay}
              onChange={(v) => setPrefs({ saveDelay: Number(v) })}
              options={SAVE_DELAYS}
            />
          </FormItem>
          <FormItem
            top="Inline calculations"
            bottom="Shows results after lines like “20% of 150” or “$30 in EUR”. Your text is never changed. Currency rates come from the European Central Bank and are fetched only when a note uses currencies."
          >
            <label className="flex items-center justify-between gap-4 text-[14px]">
              Show results
              <Switch checked={prefs.calculations} onCheckedChange={(on) => setPrefs({ calculations: on })} />
            </label>
          </FormItem>
        </Section>

        <Section title="Your notes">
          <FormItem bottom="Notes are stored only in this browser. Export a backup now and then, or to move notes elsewhere.">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" appearance="neutral" before={<Archive className="size-4" />} loading={zipping} onClick={() => void exportAll()} disabled={!docs.length}>
                Export all as .zip
              </Button>
              <Button variant="secondary" appearance="neutral" before={<FileUp className="size-4" />} onClick={() => void importFiles()}>
                Import .md or .zip
              </Button>
            </div>
          </FormItem>
        </Section>

        <Section title="Keyboard shortcuts">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 px-4 text-[13px]">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={action} className="contents">
                <dt>
                  <kbd className="rounded-xs border border-separator bg-background-secondary px-1.5 py-0.5 font-mono text-[11.5px] text-muted-foreground">{keys}</kbd>
                </dt>
                <dd className="text-muted-foreground">{action}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </ModalPageContent>
    </ModalPage>
  );
}
