import { EditorSelection, type StateCommand } from "@codemirror/state";

/** Wraps each selection in `marker`, or unwraps it when already wrapped. Empty selection: insert and place cursor inside. */
export const toggleWrap =
  (marker: string): StateCommand =>
  ({ state, dispatch }) => {
    const n = marker.length;
    const tr = state.changeByRange((range) => {
      const before = state.sliceDoc(range.from - n, range.from);
      const after = state.sliceDoc(range.to, range.to + n);
      if (before === marker && after === marker) {
        return {
          changes: [
            { from: range.from - n, to: range.from },
            { from: range.to, to: range.to + n },
          ],
          range: EditorSelection.range(range.from - n, range.to - n),
        };
      }
      return {
        changes: [
          { from: range.from, insert: marker },
          { from: range.to, insert: marker },
        ],
        range: EditorSelection.range(range.from + n, range.to + n),
      };
    });
    dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };

/** `[selection](url)` with "url" selected, ready to paste over. */
export const insertLink: StateCommand = ({ state, dispatch }) => {
  const tr = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const insert = `[${text}](url)`;
    const urlFrom = range.from + text.length + 3;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: text ? EditorSelection.range(urlFrom, urlFrom + 3) : EditorSelection.cursor(range.from + 1),
    };
  });
  dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }));
  return true;
};

/** Lines touched by the selection, each once. */
function selectedLines(state: Parameters<StateCommand>[0]["state"]) {
  const seen = new Set<number>();
  const lines = [];
  for (const r of state.selection.ranges) {
    for (let n = state.doc.lineAt(r.from).number; n <= state.doc.lineAt(r.to).number; n++) {
      if (!seen.has(n)) {
        seen.add(n);
        lines.push(state.doc.line(n));
      }
    }
  }
  return lines;
}

const HEADING = /^#{1,6}\s+/;

/** Sets the heading level of the selected lines; same level again turns it back into a paragraph. */
export const setHeading =
  (level: number): StateCommand =>
  ({ state, dispatch }) => {
    const prefix = `${"#".repeat(level)} `;
    const changes = selectedLines(state).map((line) => {
      const m = HEADING.exec(line.text);
      const same = m?.[0].trim().length === level;
      return { from: line.from, to: line.from + (m?.[0].length ?? 0), insert: same ? "" : prefix };
    });
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input" }));
    return true;
  };

const LIST = /^(\s*)([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/;
const KINDS = {
  bullet: { test: /^\s*[-*+]\s+(?!\[[ xX]\])/, make: () => "- " },
  task: { test: /^\s*[-*+]\s+\[[ xX]\]\s+/, make: () => "- [ ] " },
  ordered: { test: /^\s*\d+[.)]\s+/, make: (i: number) => `${i + 1}. ` },
  quote: { test: /^\s*>/, make: () => "> " },
};

/** Toggles a list/quote marker on the selected lines, replacing any other marker. */
export const toggleLinePrefix =
  (kind: keyof typeof KINDS): StateCommand =>
  ({ state, dispatch }) => {
    const lines = selectedLines(state).filter((l, _, all) => all.length === 1 || l.text.trim());
    const { test, make } = KINDS[kind];
    const remove = lines.every((l) => test.test(l.text));
    const changes = lines.map((line, i) => {
      const m = LIST.exec(line.text);
      const indent = m?.[1].length ?? 0;
      return { from: line.from + indent, to: line.from + (m?.[0].length ?? 0), insert: remove ? "" : make(i) };
    });
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input" }));
    return true;
  };

/** Wraps the selected lines in a fenced code block and puts the cursor where the language goes. */
export const insertCodeBlock: StateCommand = ({ state, dispatch }) => {
  const r = state.selection.main;
  const from = state.doc.lineAt(r.from).from;
  const to = state.doc.lineAt(r.to).to;
  const body = state.sliceDoc(from, to);
  dispatch(
    state.update({
      changes: { from, to, insert: `\`\`\`\n${body}\n\`\`\`` },
      selection: EditorSelection.cursor(from + 3),
      scrollIntoView: true,
      userEvent: "input",
    }),
  );
  return true;
};
