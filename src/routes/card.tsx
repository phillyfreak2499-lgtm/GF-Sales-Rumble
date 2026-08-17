import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { MatchupRow } from "@/components/board/matchup-row";
import { Badge } from "@/components/ui/badge";
import { PageHead, RingCard } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
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

  return (
    <Shell>
      <PageHead
        kicker="Brackets"
        title="The card"
        lede="Main Event stays. A loss drops you one floor. Royal Rumble is everyone left, scored as a free-for-all."
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
      <div className="mt-8 space-y-3">
        {items.length === 0 ? (
          <RingCard>
            <p className="font-display text-2xl italic">No matchups this week yet.</p>
            <p className="mt-2 text-sm text-muted">Open week 1 from the desk when the locker is ready.</p>
          </RingCard>
        ) : (
          items.map((m) => <MatchupRow key={m.id} board={board} matchupId={m.id} />)
        )}
      </div>
    </Shell>
  );
}
