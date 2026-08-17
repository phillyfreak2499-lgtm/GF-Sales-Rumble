import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: ComponentProps<"span"> & {
  tone?: "default" | "steel" | "sage" | "rose" | "bone" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]",
        tone === "default" && "bg-raised text-fg/80",
        tone === "steel" && "bg-steel/25 text-steel",
        tone === "sage" && "bg-sage/25 text-sage",
        tone === "amber" && "bg-amber/25 text-amber",
        tone === "rose" && "bg-rose/25 text-rose",
        tone === "bone" && "bg-bone/20 text-bone",
        className,
      )}
      {...props}
    />
  );
}
