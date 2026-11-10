import { Button } from "datui";
import {
  ArrowRight,
  Calculator,
  Columns2,
  FileDown,
  HardDrive,
  type LucideIcon,
  Search,
  ShieldCheck,
  Sigma,
  UserX,
} from "lucide-react";
import type { Metadata } from "next";
import calculations from "@/assets/screenshots/calculations.webp";
import exportShot from "@/assets/screenshots/export.webp";
import focus from "@/assets/screenshots/focus.webp";
import heroDark from "@/assets/screenshots/hero-dark.webp";
import heroLight from "@/assets/screenshots/hero-light.webp";
import mobileDrawer from "@/assets/screenshots/mobile-drawer.webp";
import mobileEditor from "@/assets/screenshots/mobile-editor.webp";
import mobilePreview from "@/assets/screenshots/mobile-preview.webp";
import richDark from "@/assets/screenshots/rich-dark.webp";
import search from "@/assets/screenshots/search.webp";
import templates from "@/assets/screenshots/templates.webp";
import { Feature } from "@/components/landing/Feature";
import { LandingRoot } from "@/components/landing/LandingRoot";
import { PhoneShot, Shot } from "@/components/landing/Shot";

export const metadata: Metadata = {
  title: "datmd — a calm Markdown editor for the web",
  description:
    "Write in Markdown with live preview, ⌘K search, inline calculations, math, diagrams and export to PDF and Word. Free, no account, and your notes stay on your device.",
  openGraph: {
    title: "datmd — a calm Markdown editor for the web",
    description: "Live preview, ⌘K search, inline calculations, math, diagrams, PDF & Word export. Free, private, no account.",
    images: [{ url: "/og.jpg", width: 1200, height: 750, alt: "datmd split view with editor, preview and outline" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Columns2, title: "Edit, preview, split", text: "Source and rendered page side by side, scrolling together." },
  { icon: Search, title: "⌘K search", text: "Every title and every word, as fast as you can type." },
  { icon: Calculator, title: "Inline calculations", text: "Percentages, units and currencies, answered in place." },
  { icon: Sigma, title: "Math & diagrams", text: "KaTeX formulas and Mermaid diagrams, right in your notes." },
  { icon: FileDown, title: "PDF, Word & HTML", text: "Beautifully typeset exports, plus your whole library as .zip." },
  { icon: HardDrive, title: "Local-first", text: "Saved on your device as you type. Works offline." },
];

const CALC_EXAMPLES = [
  ["20 + 30", "50"],
  ["20% of 150", "30"],
  ["$30 in EUR", "€26.75"],
  ["5 km in miles", "3.1069 mi"],
  ["sqrt(16)", "4"],
  ["255 in hex", "0xFF"],
];

const SHORTCUTS = [
  ["⌘K", "Search everything"],
  ["⌘⌥N", "New note"],
  ["⌘1 · 2 · 3", "Edit · Preview · Split"],
  ["⌘⇧F", "Focus mode"],
  ["⌘⌥T", "Typewriter mode"],
  ["/", "Insert menu"],
  ["⌘B · ⌘I", "Bold · Italic"],
  ["⌘S", "Save now"],
];

const PRIVACY: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: HardDrive,
    title: "Stored on your device",
    text: "Notes live in your browser's own database. They're saved as you type and survive restarts — no server ever sees them.",
  },
  {
    icon: UserX,
    title: "No account, no tracking",
    text: "Open the page and write. There's nothing to sign up for and no analytics watching your keystrokes.",
  },
  {
    icon: ShieldCheck,
    title: "Plain text, forever",
    text: "Everything is Markdown. Export one note or your whole library as .zip at any time and take it anywhere.",
  },
];

const OPEN_APP = "/";

export default function HomePage() {
  return (
    <LandingRoot>
      <div className="min-h-dvh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only rounded-md bg-foreground px-3 py-2 text-background focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-separator bg-background/90 backdrop-blur-sm">
          <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 md:px-8">
            <a href="#top" className="flex items-center gap-2 rounded-sm text-[16px] font-semibold tracking-tight outline-none focus-visible:focus-ring">
              <img src="/icon.svg" alt="" className="size-6 rounded-md ring-1 ring-separator" />
              datmd
            </a>
            <div className="hidden items-center gap-6 text-[14px] text-muted-foreground md:flex">
              {[
                ["Features", "#features"],
                ["Calculations", "#calculations"],
                ["Export", "#export"],
                ["Privacy", "#privacy"],
              ].map(([label, href]) => (
                <a key={href} href={href} className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:focus-ring">
                  {label}
                </a>
              ))}
            </div>
            <Button href={OPEN_APP} size="s" className="ml-auto" after={<ArrowRight className="size-4" />}>
              Open datmd
            </Button>
          </nav>
        </header>

        <main id="main">
          {/* Hero */}
          <section id="top" className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-5 pt-16 text-center md:px-8 md:pt-24">
              <p className="inline-flex items-center gap-2 rounded-full border border-separator bg-background-secondary px-3 py-1 text-[13px] text-muted-foreground">
                Free · No account · Works offline
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl text-[44px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[68px]">
                Write in Markdown.{" "}
                <span className="font-normal italic" style={{ fontFamily: "var(--font-serif)" }}>
                  Think in peace.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-muted-foreground text-pretty md:text-[20px]">
                datmd is a calm, fast writing app that lives in your browser. Your notes stay on your device, your words stay plain
                text, and the interface stays out of the way.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button href={OPEN_APP} size="l" after={<ArrowRight className="size-4" />}>
                  Start writing
                </Button>
                <Button href="#features" size="l" variant="secondary" appearance="neutral">
                  See what it does
                </Button>
              </div>
              <p className="mt-4 text-[13px] text-muted-foreground">Nothing to install. Open it and write.</p>
            </div>
            <div className="mx-auto mt-12 w-64 sm:hidden">
              <PhoneShot src={mobilePreview} alt="datmd on a phone showing a rendered product launch plan with a callout and a table." />
            </div>
            <div className="mx-auto mt-14 hidden max-w-6xl px-3 sm:block md:mt-20 md:px-8">
              <Shot
                light={heroLight}
                dark={heroDark}
                priority
                sizes="(min-width: 1152px) 1088px, 100vw"
                alt="datmd in split view: the Markdown source of a product launch plan on the left, the rendered page with a callout and table on the right, folders in the sidebar and an outline panel."
              />
            </div>
          </section>

          {/* Highlights */}
          <section aria-labelledby="highlights" className="py-20 md:py-28">
            <h2 id="highlights" className="sr-only">
              Highlights
            </h2>
            <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-10 px-5 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-separator bg-background-secondary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-semibold">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-separator" />

          <Feature
            id="features"
            eyebrow="Writing"
            title="Built for the act of writing"
            points={[
              "Focus mode hides everything but your words",
              "Typewriter mode keeps the current line at eye level",
              "Sans, serif or mono — with your own size, line height and width",
              "Live word count, character count and reading time",
            ]}
            media={<Shot light={focus} alt="Focus mode: an essay in a serif typeface on an otherwise empty page." />}
          >
            Open a note and the page is yours. No toolbars, no ribbons — just Markdown, generous margins and type set for reading.
            Everything saves automatically, a fraction of a second after you stop typing.
          </Feature>

          <Feature
            flip
            eyebrow="Search"
            title="Find anything in a keystroke"
            points={[
              "Searches titles and the full text of every note",
              "Forgiving: ignores case and accents",
              "Highlighted matches with a preview of the context",
              "Arrow keys and Enter — your hands never leave the keyboard",
            ]}
            media={<Shot light={search} alt="The ⌘K search palette showing two notes that match “launch”, with matches highlighted." />}
          >
            Press ⌘K from anywhere. Results appear as you type, ranked so the note you mean is at the top.
          </Feature>

          <section id="calculations" className="scroll-mt-20 border-y border-separator bg-background-secondary py-16 md:py-24">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
              <div>
                <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Inline calculations</p>
                <h2 className="mt-3 text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance md:text-[36px]">
                  Numbers that do the math
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground text-pretty">
                  Write a calculation on its own line and the answer appears beside it — in the editor and the preview. Budgets,
                  recipes, conversions: no calculator tab required.
                </p>
                <ul className="mt-6 grid gap-2" aria-label="Examples">
                  {CALC_EXAMPLES.map(([expr, result]) => (
                    <li key={expr} className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-background px-3.5 py-2 text-[14px] whitespace-nowrap">
                      <code className="font-mono text-[13px]">{expr}</code>
                      <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[13px] tabular-nums">= {result}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">
                  Results are display-only — your text is never changed. Currency rates come from the European Central Bank and are
                  fetched only when a note uses them. Expressions are parsed safely; nothing is ever executed.
                </p>
              </div>
              <Shot light={calculations} alt="A budget note with results such as €3,048.00 and HUF 3,557,204 shown beside each line." />
            </div>
          </section>

          <Feature
            eyebrow="Markdown, complete"
            title="Everything Markdown can do — and then some"
            points={[
              "Tables, task lists, footnotes and strikethrough (GFM)",
              "Syntax highlighting for 35+ languages",
              "KaTeX math, inline and display",
              "Mermaid flowcharts, sequences and more",
              "Note, tip, warning and caution callouts",
            ]}
            media={
              <Shot light={richDark} alt="Dark theme preview of engineering notes with a Mermaid diagram, a KaTeX formula, a warning callout and highlighted code." />
            }
          >
            The preview renders the way a well-made book does: clear hierarchy, comfortable measure, and code, formulas and
            diagrams that look like they belong.
          </Feature>

          <Feature
            flip
            eyebrow="Organisation"
            title="Organised, never cluttered"
            points={[
              "Folders, pinned notes and recent notes in one sidebar",
              "Drag and drop to reorder or move notes",
              "Templates: daily note, meeting notes, journal, project plan, article",
              "Type / for headings, lists, tables and code blocks",
              "An outline that tracks where you are in long notes",
            ]}
            media={<Shot light={templates} alt="The template picker with six templates over the datmd workspace." />}
          >
            Structure stays light. Make a folder when you need one, pin what you return to, and start from a template when a blank
            page is the hard part.
          </Feature>

          <Feature
            id="export"
            eyebrow="Export"
            title="Your words, anywhere"
            points={[
              "Markdown — the plain-text original",
              "Web page — a standalone, styled .html file",
              "PDF — print-quality typography with proper page breaks",
              "Word — headings, lists, tables and real footnotes in .docx",
              "Your whole library as a .zip, folders included — and back again",
            ]}
            media={<Shot light={exportShot} alt="The export menu offering Markdown, Web page, PDF and Word document." />}
          >
            Exports contain your writing and nothing else — no interface, no watermarks. Import .md files or a .zip whenever you
            move in.
          </Feature>

          {/* Mobile */}
          <section className="border-t border-separator py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
              <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Mobile</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance md:text-[36px]">
                At home on your phone
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                A layout designed for small screens — not a shrunken desktop. Notes slide in from a drawer, and the page is all yours.
              </p>
              <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 items-start gap-8 sm:grid-cols-3">
                <PhoneShot src={mobileEditor} alt="Editing a budget note on a phone with calculation results." />
                <div className="sm:mt-12">
                  <PhoneShot src={mobilePreview} alt="The rendered launch plan on a phone." />
                </div>
                <PhoneShot src={mobileDrawer} alt="The notes drawer on a phone with folders and pinned notes." />
              </div>
            </div>
          </section>

          {/* Shortcuts */}
          <section className="border-t border-separator bg-background-secondary py-16 md:py-20">
            <div className="mx-auto max-w-6xl px-5 md:px-8">
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] md:text-[30px]">Made for the keyboard</h2>
              <p className="mt-2 max-w-xl text-[16px] text-muted-foreground">Every action is a shortcut away. A few favourites:</p>
              <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {SHORTCUTS.map(([keys, label]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-background px-4 py-3">
                    <dt className="text-[14px]">{label}</dt>
                    <dd>
                      <kbd className="rounded-sm border border-separator bg-background-secondary px-2 py-0.5 font-mono text-[12.5px]">{keys}</kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Privacy */}
          <section id="privacy" className="scroll-mt-20 py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-5 md:px-8">
              <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Privacy</p>
              <h2 className="mt-3 max-w-2xl text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] md:text-[36px]">
                Your notes never leave your device
              </h2>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {PRIVACY.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-separator p-6">
                    <Icon className="size-6" aria-hidden />
                    <h3 className="mt-4 text-[17px] font-semibold">{title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[14px] text-muted-foreground">
                The only network request datmd makes on its own is for exchange rates — and only when a note converts currencies.
                Because notes live in this browser, export a backup now and then.
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="border-t border-separator">
            <div className="mx-auto max-w-6xl px-5 py-20 text-center md:px-8 md:py-28">
              <h2 className="mx-auto max-w-2xl text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance md:text-[48px]">
                Your next thought deserves{" "}
                <span className="font-normal italic" style={{ fontFamily: "var(--font-serif)" }}>
                  a quiet page.
                </span>
              </h2>
              <div className="mt-9 flex justify-center">
                <Button href={OPEN_APP} size="l" after={<ArrowRight className="size-4" />}>
                  Start writing — it's free
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-separator">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[13px] text-muted-foreground sm:flex-row sm:items-center md:px-8">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <img src="/icon.svg" alt="" className="size-5 rounded-[5px] ring-1 ring-separator" />
              datmd
            </span>
            <span>A calm Markdown editor. Notes stay in your browser.</span>
            <a href={OPEN_APP} className="rounded-sm outline-none hover:text-foreground focus-visible:focus-ring sm:ml-auto">
              Open the app →
            </a>
          </div>
        </footer>
      </div>
    </LandingRoot>
  );
}
