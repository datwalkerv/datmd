import Image, { type StaticImageData } from "next/image";

// datui marks its bundle "use client", so server components join classes themselves.
const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** App screenshot in a quiet window frame. Pass `dark` to swap images with the theme. */
export function Shot({
  light,
  dark,
  alt,
  priority,
  className,
  sizes = "(min-width: 1024px) 820px, 100vw",
}: {
  light: StaticImageData;
  dark?: StaticImageData;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-xl border border-separator bg-background shadow-lg ring-1 ring-black/[0.03]", className)}>
      <Image src={light} alt={alt} priority={priority} sizes={sizes} placeholder="blur" className={cn("block h-auto w-full", dark && "dark:hidden")} />
      {dark && <Image src={dark} alt={alt} sizes={sizes} placeholder="blur" className="hidden h-auto w-full dark:block" />}
    </figure>
  );
}

/** Phone screenshot. */
export function PhoneShot({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-[2rem] border-[7px] border-foreground/85 bg-background shadow-lg">
      <Image src={src} alt={alt} sizes="(min-width: 768px) 260px, 70vw" placeholder="blur" className="block h-auto w-full" />
    </figure>
  );
}
