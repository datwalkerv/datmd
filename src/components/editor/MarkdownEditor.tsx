"use client";

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { Compartment, EditorSelection, EditorState } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useImperativeHandle, useRef } from "react";
import { fenceLanguages, slashCommands } from "./completions";
import { insertCodeBlock, insertLink, setHeading, toggleLinePrefix, toggleWrap } from "./formatting";
import { editorHighlight, editorTheme } from "./theme";

interface Props {
  initial: string;
  onChange: (text: string) => void;
  /**
   * Top visible source line (1-based) and how far into it we are (0..1), for preview sync;
   * `reading` is the line a little below the top edge, where the eye is (for the outline).
   */
  onScrollLine?: (line: number, fraction: number, reading: number) => void;
  autoFocus?: boolean;
  typewriter?: boolean;
  ref?: React.Ref<EditorHandle>;
}

export interface EditorHandle {
  /** Puts the cursor at the start of `line` and scrolls it to the top. */
  scrollToLine: (line: number) => void;
}

const READING_OFFSET = 80; // px below the top edge; > the 48px margin scrollToLine leaves above a heading

// Keep the caret line vertically centred while typing or moving with the keyboard (not while mouse-selecting).
const typewriterMode = [
  EditorState.transactionExtender.of((tr) =>
    (tr.docChanged || tr.selection) && !tr.isUserEvent("select.pointer")
      ? { effects: EditorView.scrollIntoView(tr.newSelection.main.head, { y: "center" }) }
      : null,
  ),
  EditorView.editorAttributes.of({ class: "cm-typewriter" }),
];

/** Uncontrolled: mount with `key={docId}`; content flows out via onChange only. */
export function MarkdownEditor({ initial, onChange, onScrollLine, autoFocus, typewriter = false, ref }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);
  const typewriterSlot = useRef(new Compartment());
  const cb = useRef({ onChange, onScrollLine });
  cb.current = { onChange, onScrollLine };

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initial,
        extensions: [
          history(),
          drawSelection(),
          dropCursor(),
          closeBrackets(),
          autocompletion({ override: [slashCommands, fenceLanguages], icons: false }),
          typewriterSlot.current.of(typewriter ? typewriterMode : []),
          search({ top: false }),
          highlightSelectionMatches(),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": "Markdown source", spellcheck: "true", autocorrect: "on" }),
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          editorTheme,
          editorHighlight,
          placeholder("Start writing…"),
          keymap.of([
            { key: "Mod-b", run: toggleWrap("**") },
            { key: "Mod-i", run: toggleWrap("*") },
            { key: "Mod-Shift-x", run: toggleWrap("~~") },
            { key: "Mod-e", run: toggleWrap("`") },
            { key: "Mod-Shift-k", run: insertLink },
            { key: "Mod-Alt-1", run: setHeading(1) },
            { key: "Mod-Alt-2", run: setHeading(2) },
            { key: "Mod-Alt-3", run: setHeading(3) },
            { key: "Mod-Alt-4", run: setHeading(4) },
            { key: "Mod-Shift-8", run: toggleLinePrefix("bullet") },
            { key: "Mod-Shift-7", run: toggleLinePrefix("ordered") },
            { key: "Mod-Shift-9", run: toggleLinePrefix("task") },
            { key: "Mod-Shift-.", run: toggleLinePrefix("quote") },
            { key: "Mod-Alt-c", run: insertCodeBlock },
            ...completionKeymap,
            ...closeBracketsKeymap,
            ...markdownKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...defaultKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString());
          }),
        ],
      }),
    });

    const onScroll = () => {
      // Height of the viewport's top edge in document coordinates.
      const y = view.scrollDOM.getBoundingClientRect().top - view.documentTop;
      const lineAt = (h: number) => view.state.doc.lineAt(view.lineBlockAtHeight(h).from).number;
      const reading = lineAt(Math.max(0, y) + READING_OFFSET);
      if (y <= 0) return cb.current.onScrollLine?.(1, 0, reading);
      const block = view.lineBlockAtHeight(y);
      cb.current.onScrollLine?.(lineAt(y), block.height ? Math.min(1, (y - block.top) / block.height) : 0, reading);
    };
    view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });
    if (autoFocus) view.focus();
    viewRef.current = view;

    return () => {
      view.scrollDOM.removeEventListener("scroll", onScroll);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uncontrolled; remount via key to load another doc
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: typewriterSlot.current.reconfigure(typewriter ? typewriterMode : []) });
  }, [typewriter]);

  useImperativeHandle(ref, () => ({
    scrollToLine(line) {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.state.doc.line(Math.min(line, view.state.doc.lines)).from;
      view.dispatch({
        selection: EditorSelection.cursor(pos),
        effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 48 }),
        userEvent: "select.pointer", // don't let typewriter mode re-centre it
      });
      view.focus();
    },
  }));

  return <div ref={host} className="h-full min-h-0" />;
}
