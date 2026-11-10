// Mermaid is ~1 MB, so it is only loaded once a document actually contains a ```mermaid block.
type Out = { svg: string } | { error: string };

const cache = new Map<string, Out>();
let queue: Promise<unknown> = Promise.resolve();
let seq = 0;

function render(src: string, dark: boolean): Promise<Out> {
  // mermaid's config is global, so renders run one at a time.
  const job = queue.then(async () => {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "neutral",
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--dt-font-sans") || "sans-serif",
    });
    const id = `mermaid-${++seq}`;
    try {
      const { svg } = await mermaid.render(id, src);
      return { svg };
    } catch (e) {
      document.getElementById(`d${id}`)?.remove(); // mermaid leaves its scratch node behind on errors
      return { error: e instanceof Error ? e.message.split("\n")[0] : "Invalid diagram" };
    }
  });
  queue = job.catch(() => {});
  return job;
}

function apply(pre: HTMLElement, out: Out) {
  pre.className = "mermaid-block";
  if ("svg" in out) pre.innerHTML = out.svg; // sanitized by mermaid (securityLevel: strict)
  else {
    const msg = document.createElement("span");
    msg.className = "mermaid-error";
    msg.textContent = `Diagram error: ${out.error}`;
    pre.replaceChildren(msg);
  }
}

/** Replaces ```mermaid code blocks inside `root` with rendered diagrams (cached by source + theme). */
export function hydrateMermaid(root: HTMLElement, dark: boolean) {
  for (const code of root.querySelectorAll<HTMLElement>("pre > code.language-mermaid")) {
    const pre = code.parentElement!;
    const src = code.textContent ?? "";
    const key = `${dark ? "d" : "l"}|${src}`;
    const hit = cache.get(key);
    if (hit) {
      apply(pre, hit);
      continue;
    }
    pre.classList.add("mermaid-loading");
    void render(src, dark).then((out) => {
      if (cache.size > 100) cache.clear();
      cache.set(key, out);
      if (pre.isConnected && pre.contains(code)) apply(pre, out);
    });
  }
}
