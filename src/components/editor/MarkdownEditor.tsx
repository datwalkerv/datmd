"use client";

import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { insertLink, toggleWrap } from "./formatting";
import { editorHighlight, editorTheme } from "./theme";

interface Props {
  initial: string;
  onChange: (text: string) => void;
  /** Top visible source line (1-based) plus how far into it we are (0..1), for preview sync. */
  onScrollLine?: (line: number, fraction: number) => void;
  autoFocus?: boolean;
}

/** Uncontrolled: mount with `key={docId}`; content flows out via onChange only. */
export function MarkdownEditor({ initial, onChange, onScrollLine, autoFocus }: Props) {
  const host = useRef<HTMLDivElement>(null);
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
            { key: "Mod-k", run: insertLink },
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
      if (y <= 0) return cb.current.onScrollLine?.(1, 0);
      const block = view.lineBlockAtHeight(y);
      const line = view.state.doc.lineAt(block.from).number;
      cb.current.onScrollLine?.(line, block.height ? Math.min(1, (y - block.top) / block.height) : 0);
    };
    view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });
    if (autoFocus) view.focus();

    return () => {
      view.scrollDOM.removeEventListener("scroll", onScroll);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uncontrolled; remount via key to load another doc
  }, []);

  return <div ref={host} className="h-full min-h-0" />;
}
