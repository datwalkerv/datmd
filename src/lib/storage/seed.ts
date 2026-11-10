import { db } from "./db";
import { createDoc } from "./docs";

const WELCOME = `# Welcome to datmd

A quiet place to write. Everything you type is saved on this device automatically.

## The basics

Write in **Markdown**: *italic*, **bold**, ~~strikethrough~~, \`inline code\` and [links](https://commonmark.org).

- Press ⌘K to search every note
- Type **/** at the start of a line for headings, lists, tables and more
- Switch between **Edit**, **Preview** and **Split** in the header (⌘1 · ⌘2 · ⌘3)
- Press ⌘⇧F for focus mode, ⌘⌥T for typewriter mode
- Drag notes in the sidebar to reorder them or drop them on a folder

### Tasks

- [x] Open datmd
- [ ] Write something worth keeping

> Writing is thinking on paper.

| Shortcut | Action |
|---|---|
| ⌘B | Bold |
| ⌘I | Italic |
| ⌘⇧K | Link |
| ⌘F | Find |

\`\`\`ts
const note = "Code blocks keep their formatting.";
\`\`\`

Footnotes work too.[^1]

[^1]: Like this one.
`;

const SEEDED = "datmd:seeded";

/** First visit only: one welcome note. Never re-seeds after the user deletes it. */
export async function seedOnce(): Promise<string | undefined> {
  if (localStorage.getItem(SEEDED)) return;
  localStorage.setItem(SEEDED, "1"); // set before any await so a concurrent call (StrictMode) bails out
  if ((await db.docs.count()) > 0) return;
  return (await createDoc({ title: "Welcome to datmd", content: WELCOME })).id;
}
