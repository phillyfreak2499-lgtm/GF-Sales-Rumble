import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { PlateMark, PlateSticker } from "@/components/board/nameplate";
import { TitantronChrome } from "@/components/board/titantron";

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
        "pointer-events-none absolute size-2.5 bg-rose shadow-[inset_0_0_0_1px_rgb(18_12_14_/_0.4)]",
        className,
      )}
    />
  );
}

export function Ticket({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center border border-amber/50 bg-amber/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-amber",
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
        "grid size-12 shrink-0 place-items-center rounded-full border border-rose/60 bg-rose/15 font-display text-sm italic tracking-[0.14em] text-rose shadow-[var(--shadow-ring)]",
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
  tone = "bone",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "bone" | "steel" | "rose" | "sage" | "amber";
}) {
  const wash =
    tone === "steel"
      ? "bg-steel/10"
      : tone === "rose"
        ? "bg-rose/10"
        : tone === "sage"
          ? "bg-sage/10"
          : tone === "amber"
            ? "bg-amber/10"
            : "bg-amber/5";
  const kick =
    tone === "steel"
      ? "!text-steel"
      : tone === "rose"
        ? "!text-rose"
        : tone === "sage"
          ? "!text-sage"
          : "!text-amber";
  return (
    <RingCard className={cn("overflow-hidden", wash)}>
      <p className={cn("kicker", kick)}>{label}</p>
      <p className="mt-3 font-display text-4xl italic leading-none">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-subtle">{hint}</p>
    </RingCard>
  );
}

export function FighterPoster({
  nickname,
  name,
  hometown,
  walkout,
  store,
  seed,
  fact,
  mark,
  footer,
  className,
  plateMark,
  plateSticker,
  titanWeeks,
}: {
  nickname: string;
  name: string;
  hometown?: string;
  walkout?: string;
  store?: string;
  seed?: number | null;
  fact?: string;
  mark: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  plateMark?: string;
  plateSticker?: string;
  titanWeeks?: number[];
}) {
  return (
    <RingCard className={cn("relative h-full overflow-hidden transition-[background-color,box-shadow] duration-150 hover:shadow-[var(--shadow-poster)]", (plateSticker || (titanWeeks && titanWeeks.length)) && "pb-14", titanWeeks && titanWeeks.length ? "titantron" : "", className)}>
      {titanWeeks && titanWeeks.length ? <TitantronChrome weeks={titanWeeks} compact /> : null}
      <PlateStickerMount sticker={plateSticker} />
      <div className="flex items-start justify-between gap-3">
        {mark}
        <span className="tabular text-xs tracking-[0.18em] text-subtle">
          {seed ? String(seed).padStart(2, "0") : "—"}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl italic leading-[1.05] sm:text-3xl">
        {plateMark ? <span className="mr-1.5 inline-flex align-middle font-sans not-italic"><PlateMarkInline mark={plateMark} /></span> : null}
        {nickname}
      </p>
      <p className="mt-1 truncate text-sm text-muted">{name}</p>
      {store ? <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-amber">{store}</p> : null}
      {hometown ? <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-subtle">{hometown}</p> : null}
      {walkout ? <p className="mt-2 line-clamp-1 text-sm italic text-bone">“{walkout}”</p> : null}
      {fact ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-fg/80">{fact}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
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


function PlateStickerMount({ sticker }: { sticker?: string }) {
  return <PlateSticker id={sticker} />;
}

function PlateMarkInline({ mark }: { mark?: string }) {
  return <PlateMark mark={mark} className="mr-0" />;
}
