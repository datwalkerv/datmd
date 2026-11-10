"use client";

import { cn } from "datui";
import { Check } from "lucide-react";
import type { SaveStatus as Status } from "@/hooks/useAutosave";

export function SaveStatus({ status }: { status: Status }) {
  const label = { idle: "", pending: "Saving…", saving: "Saving…", saved: "Saved", error: "Not saved · retrying" }[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-1 text-[12px] whitespace-nowrap transition-opacity duration-normal",
        status === "error" ? "text-destructive" : "text-subtle-foreground",
        status === "idle" && "opacity-0",
      )}
    >
      {status === "saved" && <Check className="size-3.5" aria-hidden />}
      {label}
    </span>
  );
}
