import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { MatchupRow } from "@/components/board/matchup-row";
import { Badge } from "@/components/ui/badge";
import { PageHead, RingCard } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
import { BRACKETS, FLOOR } from "@/lib/circuit/types";
import { weekCardProgress } from "@/lib/circuit/week-progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/card")({ component: CardPage });

function CardPage() {
  const { data: board, isPending } = useBoard();
  const [week, setWeek] = useState<number | null>(null);
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const current = week ?? board.circuit.currentWeek;
  const items = board.matchups.filter((m) => m.weekNumber === current);
  const w = board.weeks.find((x) => x.weekNumber === current);
  const byFloor = BRACKETS.map((id) => ({
    id,
    floor: FLOOR[id],
    bouts: items.filter((m) => m.bracket === id),
  })).filter((g) => g.bouts.length > 0);

  return (
    <Shell>
      <PageHead
        kicker="Three floors"
        title="The card"
        lede="Each week the floor reseeds: most points is seed 1, then stars, then socks if needed. Highest gets the bye. Highest wrestles lowest. Scores show as they land."
        action={w ? <Badge>{w.status}</Badge> : null}
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {board.weeks.map((wk) => (
          <button
            key={wk.weekNumber}
            type="button"
            onClick={() => setWeek(wk.weekNumber)}
            className={cn(
              "h-11 rounded-sm border px-3 text-sm",
              current === wk.weekNumber ? "border-bone bg-bone/10 text-fg" : "border-line text-muted",
            )}
          >
            Week {wk.weekNumber}
          </button>
        ))}
      </div>
      {(() => {
        const p = weekCardProgress(current, board.matchups, board.fighters, board.scores);
        if (!p.of) return null;
        return (
          <p className="mt-4 text-sm text-muted">
            <span className="font-display text-xl italic tabular text-fg">{p.in}</span>
            {" / "}
            {p.of} cards in this week
            {p.missing ? " · still taking cards" : " · every card is in. Close the week from the desk when you are ready."}
          </p>
        );
      })()}
      <div className="mt-8 space-y-10">
        {items.length === 0 ? (
          <RingCard>
            <p className="font-display text-2xl italic">No matchups this week yet.</p>
            <p className="mt-2 text-sm text-muted">Open week 1 from the desk when the locker is ready.</p>
          </RingCard>
        ) : (
          byFloor.map((g) => (
            <section key={g.id}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className={cn("kicker", g.id === "main" ? "text-amber" : g.id === "redemption" ? "text-steel" : "text-rose")}>{g.floor.short}</p>
                  <h2 className="mt-1 font-display text-3xl italic">{g.floor.name}</h2>
                  <p className="mt-1 text-sm text-muted">Still fighting for {g.floor.fightFor}.</p>
                </div>
                <Badge tone={g.id === "main" ? "bone" : g.id === "redemption" ? "steel" : "default"}>
                  {g.bouts.reduce((n, m) => n + m.fighterIds.length, 0)} on this floor
                </Badge>
              </div>
              <div className="space-y-3">
                {g.bouts.map((m) => (
                  <MatchupRow key={m.id} board={board} matchupId={m.id} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </Shell>
  );
}
