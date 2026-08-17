import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function RingCard({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface p-4 shadow-[var(--shadow-ring)] sm:p-5",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="pointer-events-none absolute inset-2 rounded-lg ring-1 ring-bone/25" />
      <span aria-hidden className="pointer-events-none absolute left-2 top-2 size-1.5 bg-bone/70" />
      <span aria-hidden className="pointer-events-none absolute right-2 top-2 size-1.5 bg-bone/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 size-1.5 bg-bone/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 size-1.5 bg-bone/70" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function Ticket({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-bone/30 bg-bone/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-bone",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border border-bone/35 bg-bg font-display text-xs italic tracking-[0.16em] text-bone",
        className,
      )}
    >
      vs
    </span>
  );
}

export function PageHead({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-2 font-display text-4xl italic leading-[1.05] sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{lede}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
