import { Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FLOOR, type Fighter, type FloorId, type MetricStatus, type Scorecard } from "@/lib/circuit/types";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Renders nothing until the commissioner has attached a video to the bout. */
export function BoutVideoLink({ url, className }: { url: string; className?: string }) {
  if (!url) return null;
  return (
    <p className={cn("mt-4", className)}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-amber/50 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-amber hover:bg-amber/10"
      >
        <PlayCircle className="size-4" />
        Watch this bout
      </a>
    </p>
  );
}

export function MonoMark({
  first,
  last,
  photo,
  className,
}: {
  first: string;
  last: string;
  photo?: string;
  className?: string;
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={cn("size-11 shrink-0 rounded-sm object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-sm border border-bone/30 bg-raised font-display text-sm italic tracking-wide text-bone",
        className,
      )}
    >
      {initials(first, last)}
    </span>
  );
}

export function Seed({ n }: { n: number | null }) {
  return (
    <span className="tabular text-[11px] font-medium tracking-[0.14em] text-subtle">
      {n ? String(n).padStart(2, "0") : "—"}
    </span>
  );
}

export function Points({ card }: { card: Scorecard | null | undefined }) {
  if (!card) return <span className="text-subtle">No card</span>;
  return (
    <span className="inline-flex items-baseline gap-1.5 tabular">
      <span className="font-display text-lg italic text-fg">{card.points}</span>
      <span className="text-subtle">pts</span>
      {card.sweep ? <span className="text-[11px] uppercase tracking-[0.12em] text-sage">Sweep</span> : null}
      {card.trainingBonus ? (
        <span className="text-[11px] uppercase tracking-[0.12em] text-steel">Academy</span>
      ) : null}
    </span>
  );
}

export function statusClass(s: MetricStatus, filled: boolean) {
  if (!filled) return "border-line text-subtle hover:text-fg";
  if (s === "green") return "border-sage bg-sage/30 text-sage";
  if (s === "blue") return "border-steel bg-steel/30 text-steel";
  if (s === "orange") return "border-amber bg-amber/30 text-amber";
  return "border-rose bg-rose/30 text-rose";
}

export function MetricPips({ statuses }: { statuses: MetricStatus[] }) {
  return (
    <span className="inline-flex gap-1" aria-label="metric statuses">
      {statuses.map((s, i) => (
        <span
          key={i}
          className={cn(
            "size-2 rounded-full",
            s === "green" && "bg-sage",
            s === "blue" && "bg-steel",
            s === "orange" && "bg-amber",
            s === "red" && "bg-rose",
          )}
        />
      ))}
    </span>
  );
}

export function BracketChip({ id, compact }: { id: FloorId; compact?: boolean }) {
  const floor = FLOOR[id];
  const tone = id === "champ" || id === "main" ? "amber" : id === "redemption" ? "steel" : id === "rumble" || id === "out" ? "rose" : "default";
  const label = compact && floor.n ? floor.short : floor.n ? `${floor.short} · ${floor.name}` : floor.name;
  return <Badge tone={tone}>{label}</Badge>;
}

export function FloorLine({ id }: { id: FloorId }) {
  return <p className="text-sm leading-relaxed text-muted">{FLOOR[id].stillIn}</p>;
}

export function FighterLink({
  fighter,
  slug,
  children,
  className,
}: {
  fighter: Fighter;
  slug: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/fighter/$id"
      params={{ id: fighter.id }}
      search={{ slug }}
      className={cn("hover:text-bone", className)}
    >
      {children ?? (
        <>
          <span className="text-subtle">{fighter.firstName}</span> {fighter.nickname}
        </>
      )}
    </Link>
  );
}
