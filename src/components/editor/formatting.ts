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
