import type { BoardPayload } from "@/lib/server/circuit";
import { compareCards } from "@/lib/circuit/engine";
import { displayCard } from "@/lib/circuit/training";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { BRACKET_LABEL, type MetricStatus, type Placement, type Scorecard } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";
import { fighterById } from "@/lib/use-board";
import { RingCard, Ticket, VsMark } from "@/components/arena/ring";
import { BoutVideoLink, BracketChip, FighterLink, MetricPips, MonoMark, Points, Seed } from "./pieces";

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
        const card = displayCard(id, week, board.scores, board.academy, board.metrics.length);
        return { f, card, s };
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
    const inCount = ranked.filter((x) => x.s).length;
    return (
      <RingCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <BracketChip id={m.bracket} />
          <Ticket>
            {m.status === "complete"
              ? "Final"
              : inCount === ranked.length
                ? "All cards in"
                : `${inCount} of ${ranked.length} in`}
          </Ticket>
        </div>
        <ul className="space-y-2">
          {ranked.map(({ f, card, s }, i) =>
            f ? (
              <li key={f.id} className="flex items-center gap-3">
                <Seed n={f.seed} />
                <MonoMark first={f.firstName} last={f.lastName} photo={f.photoUrl} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <FighterLink fighter={f} slug={board.circuit.slug} className="block truncate font-display italic">
                    {f.nickname}
                  </FighterLink>
                  <p className="truncate text-xs text-muted">
                    {formatRecord(recordOf(f.id, board.placements))}
                    {f.hometown ? ` · ${f.hometown}` : ""}
                  </p>
                </div>
                {s ? (
                  <MetricPips statuses={s.statuses} />
                ) : (
                  <span className="text-[11px] uppercase tracking-[0.12em] text-amber">Waiting</span>
                )}
                <span className="tabular text-sm">
                  <Points card={card} />
                </span>
                {m.status === "complete" && i === 0 ? (
                  <span className="text-[11px] uppercase tracking-[0.12em] text-bone">Won</span>
                ) : null}
              </li>
            ) : null,
          )}
        </ul>
        <BoutVideoLink url={m.videoUrl} />
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
            <MonoMark first={a.firstName} last={a.lastName} photo={a.photoUrl} />
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
          <Ticket>Bye</Ticket>
        </div>
      </RingCard>
    );
  }
  if (!a || !b) return null;

  const sa = board.scores.find((x) => x.fighterId === a.id && x.weekNumber === week);
  const sb = board.scores.find((x) => x.fighterId === b.id && x.weekNumber === week);
  const ca = displayCard(a.id, week, board.scores, board.academy, board.metrics.length);
  const cb = displayCard(b.id, week, board.scores, board.academy, board.metrics.length);
  const done = m.status === "complete";
  const both = Boolean(ca && cb);
  const liveLead =
    !done && both && ca && cb
      ? compareCards({ ...ca, seed: a.seed ?? 99 }, { ...cb, seed: b.seed ?? 99 }) < 0
        ? "a"
        : "b"
      : null;
  const aWin = done && m.winnerId === a.id;
  const bWin = done && m.winnerId === b.id;
  const ticket = done
    ? "Final"
    : both
      ? "Both cards in"
      : sa || sb
        ? "One card in"
        : "Waiting on cards";

  return (
    <RingCard>
      <div className="mb-5 flex items-center justify-between">
        <span className="kicker">{BRACKET_LABEL[m.bracket]}</span>
        <Ticket>{ticket}</Ticket>
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
          lead={liveLead === "a"}
          waiting={!sa}
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
          lead={liveLead === "b"}
          waiting={!sb}
          align="right"
        />
      </div>
      <BoutVideoLink url={m.videoUrl} />
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
  lead,
  waiting,
  align,
}: {
  fighter: NonNullable<ReturnType<typeof fighterById>>;
  slug: string;
  placements: Placement[];
  card: Scorecard | null;
  statuses?: MetricStatus[];
  win: boolean;
  lose: boolean;
  lead: boolean;
  waiting: boolean;
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
      <MonoMark first={fighter.firstName} last={fighter.lastName} photo={fighter.photoUrl} />
      <div className="min-w-0 flex-1">
        <div className={cn("flex items-baseline gap-2", align === "right" && "sm:justify-end")}>
          <Seed n={fighter.seed} />
          <FighterLink fighter={fighter} slug={slug} className="truncate font-display text-xl italic sm:text-2xl">
            {fighter.nickname}
          </FighterLink>
        </div>
        <p className="truncate text-sm text-muted">
          {formatRecord(recordOf(fighter.id, placements))}
          {fighter.hometown ? ` · ${fighter.hometown}` : ""}
        </p>
        <div className={cn("mt-2 flex flex-wrap items-center gap-2 text-sm", align === "right" && "sm:justify-end")}>
          {waiting ? (
            <span className="text-[11px] uppercase tracking-[0.14em] text-amber">Waiting</span>
          ) : (
            <>
              {statuses ? <MetricPips statuses={statuses} /> : null}
              <Points card={card} />
            </>
          )}
          {win ? <span className="text-xs uppercase tracking-[0.12em] text-bone">Won</span> : null}
          {lead ? <span className="text-xs uppercase tracking-[0.12em] text-amber">Leads</span> : null}
        </div>
      </div>
    </div>
  );
}
