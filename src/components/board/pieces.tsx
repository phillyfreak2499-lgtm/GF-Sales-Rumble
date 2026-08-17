import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { BRACKET_LABEL, type BracketId, type Fighter, type MetricStatus, type Scorecard } from "@/lib/circuit/types";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MonoMark({ first, last, className }: { first: string; last: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-sm border border-bone/25 bg-raised text-sm font-medium tracking-wide text-bone",
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
      <span className="text-fg">{card.points}</span>
      <span className="text-subtle">pts</span>
      {card.sweep ? <span className="text-[11px] uppercase tracking-[0.12em] text-sage">Sweep</span> : null}
    </span>
  );
}

export function statusClass(s: MetricStatus, filled: boolean) {
  if (!filled) return "border-line text-subtle hover:text-fg";
  if (s === "green") return "border-sage bg-sage/20 text-sage";
  if (s === "blue") return "border-steel bg-steel/20 text-steel";
  if (s === "orange") return "border-amber bg-amber/20 text-amber";
  return "border-rose bg-rose/20 text-rose";
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

export function BracketChip({ id }: { id: BracketId | "out" | "champ" | "unassigned" }) {
  if (id === "champ") return <Badge tone="bone">Champion</Badge>;
  if (id === "out") return <Badge tone="rose">Out</Badge>;
  if (id === "unassigned") return <Badge>Unseeded</Badge>;
  return <Badge tone={id === "main" ? "bone" : id === "redemption" ? "steel" : "default"}>{BRACKET_LABEL[id]}</Badge>;
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
