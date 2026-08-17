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
      <span aria-hidden className="pointer-events-none absolute inset-2 rounded-lg ring-1 ring-bone/20" />
      <span aria-hidden className="pointer-events-none absolute inset-3 hidden rounded-md ring-1 ring-bone/10 sm:block" />
      <Turnbuckle className="left-2 top-2" />
      <Turnbuckle className="right-2 top-2" />
      <Turnbuckle className="bottom-2 left-2" />
      <Turnbuckle className="bottom-2 right-2" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Turnbuckle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute size-2.5 bg-bone/80 shadow-[inset_0_0_0_1px_rgb(11_11_12_/_0.35)]",
        className,
      )}
    />
  );
}

export function Ticket({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center border border-bone/35 bg-bone/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-bone",
        className,
      )}
    >
      <span aria-hidden className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-bg" />
      <span aria-hidden className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-bg" />
      {children}
    </span>
  );
}

export function VsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full border border-bone/40 bg-bg font-display text-sm italic tracking-[0.14em] text-bone shadow-[var(--shadow-ring)]",
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
        <h1 className="mt-2 font-display text-4xl italic leading-[1.02] sm:text-6xl">{title}</h1>
        {lede ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{lede}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function ChampionshipPlate({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <RingCard className="overflow-hidden">
      <p className="kicker">{label}</p>
      <p className="mt-3 font-display text-4xl italic leading-none">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-subtle">{hint}</p>
    </RingCard>
  );
}

export function FighterPoster({
  nickname,
  name,
  hometown,
  seed,
  fact,
  mark,
}: {
  nickname: string;
  name: string;
  hometown?: string;
  seed?: number | null;
  fact?: string;
  mark: React.ReactNode;
}) {
  return (
    <RingCard className="h-full transition-[background-color,box-shadow] duration-150 hover:bg-raised hover:shadow-[var(--shadow-poster)]">
      <div className="flex items-start justify-between gap-3">
        {mark}
        <span className="tabular text-xs tracking-[0.18em] text-subtle">
          {seed ? String(seed).padStart(2, "0") : "—"}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl italic leading-[1.05] sm:text-3xl">{nickname}</p>
      <p className="mt-1 truncate text-sm text-muted">{name}</p>
      {hometown ? <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-subtle">{hometown}</p> : null}
      {fact ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-fg/80">{fact}</p> : null}
    </RingCard>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const line = items.join("  ·  ");
  return (
    <div className="overflow-hidden border-y border-line/80 bg-surface/80">
      <div className="rope-rule opacity-70" />
      <div className="relative py-2">
        <div className="marquee-track gap-10 px-6 text-[11px] uppercase tracking-[0.22em] text-bone/80">
          <span>{line}</span>
          <span aria-hidden>{line}</span>
        </div>
      </div>
    </div>
  );
}

export function SectionRule() {
  return <div className="rope-rule my-2 opacity-60" />;
}
