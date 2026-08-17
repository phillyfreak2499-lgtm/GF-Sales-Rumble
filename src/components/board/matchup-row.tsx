import type { BoardPayload } from "@/lib/server/circuit";
import { compareCards, scorecard } from "@/lib/circuit/engine";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { BRACKET_LABEL, type MetricStatus, type Placement } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";
import { fighterById } from "@/lib/use-board";
import { RingCard, VsMark } from "@/components/arena/ring";
import { BracketChip, FighterLink, MetricPips, MonoMark, Points, Seed } from "./pieces";

export function MatchupRow({
  board,
  matchupId,
}: {
  board: BoardPayload;
  matchupId: string;
}) {
  const m = board.matchups.find((x) => x.id === matchupId);
  if (!m) return null;
  const people = m.fighterIds.map((id) => fighterById(board, id)).filter(Boolean);
  const week = m.weekNumber;

  if (m.kind === "rumble") {
    const ranked = [...m.fighterIds]
      .map((id) => {
        const f = fighterById(board, id);
        const s = board.scores.find((x) => x.fighterId === id && x.weekNumber === week);
        return { f, card: s ? scorecard(s.statuses, s.reviews) : null, s };
      })
      .filter((x) => x.f)
      .sort((a, b) => {
        if (!a.card && !b.card) return 0;
        if (!a.card) return 1;
        if (!b.card) return -1;
        return compareCards(
          { ...a.card, seed: a.f?.seed ?? 99 },
          { ...b.card, seed: b.f?.seed ?? 99 },
        );
      });
    return (
      <RingCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <BracketChip id={m.bracket} />
          <span className="kicker text-subtle">Free-for-all</span>
        </div>
        <ul className="space-y-2">
          {ranked.map(({ f, card, s }) =>
            f ? (
              <li key={f.id} className="flex items-center gap-3">
                <Seed n={f.seed} />
                <MonoMark first={f.firstName} last={f.lastName} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <FighterLink fighter={f} slug={board.circuit.slug} className="block truncate font-display italic">
                    {f.nickname}
                  </FighterLink>
                  <p className="truncate text-xs text-muted">
                    {formatRecord(recordOf(f.id, board.placements))}
                    {f.hometown ? ` · ${f.hometown}` : ""}
                  </p>
                </div>
                {s ? <MetricPips statuses={s.statuses} /> : null}
                <span className="tabular text-sm">
                  <Points card={card} />
                </span>
              </li>
            ) : null,
          )}
        </ul>
      </RingCard>
    );
  }

  const a = people[0];
  const b = people[1];
  if (m.kind === "bye" && a) {
    return (
      <RingCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Seed n={a.seed} />
            <MonoMark first={a.firstName} last={a.lastName} />
            <div className="min-w-0">
              <FighterLink fighter={a} slug={board.circuit.slug} className="block truncate font-display text-lg italic">
                {a.nickname}
              </FighterLink>
              <p className="truncate text-sm text-muted">
                {formatRecord(recordOf(a.id, board.placements))}
                {a.hometown ? ` · ${a.hometown}` : ""}
              </p>
            </div>
          </div>
          <span className="kicker text-subtle">Bye</span>
        </div>
      </RingCard>
    );
  }
  if (!a || !b) return null;

  const sa = board.scores.find((x) => x.fighterId === a.id && x.weekNumber === week);
  const sb = board.scores.find((x) => x.fighterId === b.id && x.weekNumber === week);
  const ca = sa ? scorecard(sa.statuses, sa.reviews) : null;
  const cb = sb ? scorecard(sb.statuses, sb.reviews) : null;
  const done = m.status === "complete";
  const aWin = done && m.winnerId === a.id;
  const bWin = done && m.winnerId === b.id;

  return (
    <RingCard>
      <div className="mb-4 flex items-center justify-between">
        <span className="kicker">{BRACKET_LABEL[m.bracket]}</span>
        {done ? <span className="kicker">Final</span> : <span className="kicker text-subtle">Live</span>}
      </div>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Side
          fighter={a}
          slug={board.circuit.slug}
          placements={board.placements}
          card={ca}
          statuses={sa?.statuses}
          win={aWin}
          lose={bWin}
          align="left"
        />
        <VsMark className="hidden sm:grid" />
        <Side
          fighter={b}
          slug={board.circuit.slug}
          placements={board.placements}
          card={cb}
          statuses={sb?.statuses}
          win={bWin}
          lose={aWin}
          align="right"
        />
      </div>
    </RingCard>
  );
}

function Side({
  fighter,
  slug,
  placements,
  card,
  statuses,
  win,
  lose,
  align,
}: {
  fighter: NonNullable<ReturnType<typeof fighterById>>;
  slug: string;
  placements: Placement[];
  card: ReturnType<typeof scorecard> | null;
  statuses?: MetricStatus[];
  win: boolean;
  lose: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" && "sm:flex-row-reverse sm:text-right",
        lose && "opacity-50",
      )}
    >
      <MonoMark first={fighter.firstName} last={fighter.lastName} />
      <div className="min-w-0 flex-1">
        <div className={cn("flex items-baseline gap-2", align === "right" && "sm:justify-end")}>
          <Seed n={fighter.seed} />
          <FighterLink fighter={fighter} slug={slug} className="truncate font-display text-lg italic">
            {fighter.nickname}
          </FighterLink>
        </div>
        <p className="truncate text-sm text-muted">
          {formatRecord(recordOf(fighter.id, placements))}
          {fighter.hometown ? ` · ${fighter.hometown}` : ""}
        </p>
        <div className={cn("mt-1 flex items-center gap-2 text-sm", align === "right" && "sm:justify-end")}>
          {statuses ? <MetricPips statuses={statuses} /> : null}
          <Points card={card} />
          {win ? <span className="text-xs uppercase tracking-[0.12em] text-bone">Won</span> : null}
        </div>
      </div>
    </div>
  );
}
