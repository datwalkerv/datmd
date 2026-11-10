import { Check } from "lucide-react";

// datui marks its bundle "use client", so server components join classes themselves.
const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Text + screenshot row; `flip` puts the screenshot on the left. */
export function Feature({
  id,
  eyebrow,
  title,
  children,
  points,
  media,
  flip,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  points: string[];
  media: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div className={cn(flip && "lg:order-2")}>
          <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
          <h2 className="mt-3 text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance md:text-[36px]">{title}</h2>
          <div className="mt-4 text-[17px] leading-relaxed text-muted-foreground text-pretty">{children}</div>
          <ul className="mt-6 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-snug">
                <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={cn(flip && "lg:order-1")}>{media}</div>
      </div>
    </section>
  );
}
