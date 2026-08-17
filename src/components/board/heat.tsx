import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { RingCard } from "@/components/arena/ring";
import {
  BADGE_BY_ID,
  HONOR_LABEL,
  RANK_LABEL,
  type BadgeDef,
  type BadgeId,
  type FighterHeat,
  type Honor,
  type Mission,
  type RankId,
} from "@/lib/circuit/heat";
import { cn } from "@/lib/utils";

export function HeatBar({
  value,
  size = "md",
  label = "Heat",
}: {
  value: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const tone = v >= 70 ? "bg-amber" : v >= 40 ? "bg-bone" : "bg-steel";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-subtle">{label}</span>
        <span className={cn("tabular font-display italic", size === "md" ? "text-lg" : "text-sm")}>
          {v}
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 overflow-hidden rounded-full bg-raised",
          size === "md" ? "h-1.5" : "h-1",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)]",
            tone,
          )}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export function RankChip({ rank }: { rank: RankId }) {
  const tone =
    rank === "champion" || rank === "main-event" || rank === "title"
      ? "bone"
      : rank === "upper" || rank === "midcard"
        ? "steel"
        : "default";
  return <Badge tone={tone}>{RANK_LABEL[rank]}</Badge>;
}

export function HardwareMark({
  badge,
  earned,
  compact,
}: {
  badge: BadgeDef;
  earned: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        earned ? "border-bone/35 bg-bone/10" : "border-line bg-bg/40",
      )}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.16em]",
          earned ? "text-bone" : "text-subtle",
        )}
      >
        {badge.name}
      </p>
      {compact ? null : (
        <p className={cn("mt-1.5 text-sm leading-relaxed", earned ? "text-fg/85" : "text-muted")}>
          {badge.blurb}
        </p>
      )}
    </div>
  );
}

export function BadgeRack({ ids, limit }: { ids: BadgeId[]; limit?: number }) {
  const shown = typeof limit === "number" ? ids.slice(0, limit) : ids;
  if (shown.length === 0) {
    return <p className="text-sm text-subtle">No hardware yet. Score a week.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {shown.map((id) => (
        <li key={id}>
          <span className="inline-flex rounded-sm border border-bone/30 bg-bone/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-bone">
            {BADGE_BY_ID[id].name}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HonorCard({
  honor,
  nickname,
  slug,
  fighterId,
}: {
  honor: Honor;
  nickname: string;
  slug: string;
  fighterId: string;
}) {
  return (
    <RingCard>
      <p className="kicker">{HONOR_LABEL[honor.kind]}</p>
      <Link
        to="/fighter/$id"
        params={{ id: fighterId }}
        search={{ slug }}
        className="mt-2 block font-display text-2xl italic leading-tight hover:text-bone"
      >
        {nickname}
      </Link>
      <p className="mt-1.5 text-sm text-muted">{honor.note}</p>
    </RingCard>
  );
}

export function ChaseNote({ heat }: { heat: FighterHeat }) {
  if (!heat.chase) {
    return <p className="text-sm text-muted">Every listed plate is on the wall. Keep scoring.</p>;
  }
  const badge = BADGE_BY_ID[heat.chase.id];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Next plate</p>
      <p className="mt-1 font-display text-xl italic">{badge.name}</p>
      <p className="mt-1 text-sm text-muted">
        {heat.chase.have} of {heat.chase.need} · {badge.blurb}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-bone transition-[width] duration-500 ease-[var(--ease-out)]"
          style={{
            width: `${Math.min(100, Math.round((heat.chase.have / Math.max(1, heat.chase.need)) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

export function MissionList({ missions }: { missions: Mission[] }) {
  return (
    <ul className="space-y-2">
      {missions.map((m) => (
        <li
          key={m.id}
          className={cn(
            "rounded-lg border px-3 py-3",
            m.done ? "border-sage/30 bg-sage/10" : "border-line bg-bg/30",
          )}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className={cn("text-sm font-medium", m.done ? "text-sage" : "text-fg")}>{m.title}</p>
            <span className="tabular text-xs text-subtle">
              {Math.min(m.have, m.need)}/{m.need}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{m.blurb}</p>
        </li>
      ))}
    </ul>
  );
}

export function StreakLine({ heat }: { heat: FighterHeat }) {
  const bits = [
    heat.winStreak > 0 ? `${heat.winStreak}-win streak` : null,
    heat.scoreStreak > 0 ? `${heat.scoreStreak}-week card streak` : null,
    `Lv ${heat.level}`,
  ].filter(Boolean);
  return <p className="text-xs uppercase tracking-[0.14em] text-subtle">{bits.join(" · ")}</p>;
}
