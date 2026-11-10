export interface Template {
  id: string;
  name: string;
  description: string;
  build: (now: Date) => { title: string; content: string };
}

const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const TEMPLATES: Template[] = [
  {
    id: "simple",
    name: "Simple Document",
    description: "A title and a blank page.",
    build: () => ({ title: "Untitled", content: "# Untitled\n\n" }),
  },
  {
    id: "daily",
    name: "Daily Note",
    description: "Today’s focus, tasks and notes.",
    build: (d) => ({
      title: isoDate(d),
      content: `# ${longDate(d)}\n\n## Focus\n\n- \n\n## Tasks\n\n- [ ] \n\n## Notes\n\n`,
    }),
  },
  {
    id: "meeting",
    name: "Meeting Notes",
    description: "Attendees, agenda, decisions, action items.",
    build: (d) => ({
      title: `Meeting ${isoDate(d)}`,
      content: `# Meeting — ${longDate(d)}\n\n**Attendees:** \n\n## Agenda\n\n1. \n\n## Notes\n\n\n## Decisions\n\n- \n\n## Action items\n\n- [ ] Owner — task — due\n`,
    }),
  },
  {
    id: "journal",
    name: "Journal",
    description: "A gentle prompt for reflection.",
    build: (d) => ({
      title: `Journal ${isoDate(d)}`,
      content: `# ${longDate(d)}\n\n## How I feel\n\n\n## What happened\n\n\n## Grateful for\n\n- \n\n## Tomorrow\n\n`,
    }),
  },
  {
    id: "project",
    name: "Project Planning",
    description: "Goal, scope, milestones and risks.",
    build: () => ({
      title: "Project plan",
      content: `# Project plan\n\n## Goal\n\nWhat does success look like?\n\n## Scope\n\n**In:**\n\n- \n\n**Out:**\n\n- \n\n## Milestones\n\n| Milestone | Owner | Date |\n|---|---|---|\n|  |  |  |\n\n## Risks\n\n- \n\n## Open questions\n\n- \n`,
    }),
  },
  {
    id: "article",
    name: "Article",
    description: "Headline, lede, sections and sources.",
    build: () => ({
      title: "Untitled article",
      content: `# Headline\n\n*A one-sentence summary that makes people want to read on.*\n\n## Introduction\n\n\n## Main point\n\n\n## Conclusion\n\n\n---\n\n### Sources\n\n1. \n`,
    }),
  },
];
