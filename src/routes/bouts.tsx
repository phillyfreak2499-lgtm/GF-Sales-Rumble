import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { Badge } from "@/components/ui/badge";
import { PageHead, RingCard } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bouts")({ component: BoutsPage });

function BoutsPage() {
  const { data: board, isPending, error } = useBoard();
  const [week, setWeek] = useState<number | null>(null);

  if (isPending) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  if (error || !board) {
    return (
      <Shell>
        <p className="text-rose">{error?.message ?? "Could not load the card."}</p>
      </Shell>
    );
  }

  const current = week ?? board.circuit.currentWeek;
  const w = board.weeks.find((x) => x.weekNumber === current);
  const count = board.matchups.filter((m) => m.weekNumber === current).length;

  return (
    <Shell>
      <PageHead
        kicker="Tale of the tape"
        title="This week’s bouts"
        lede="Who is in the ring, their records, where they came from, and the one thing the locker room already knows about them."
        action={
          <>
            {w ? <Badge>{w.status}</Badge> : null}
            <span className="kicker text-subtle">
              {count} bout{count === 1 ? "" : "s"}
            </span>
          </>
        }
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
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
      <div className="mt-8">
        {count === 0 ? (
          <RingCard>
            <p className="font-display text-2xl italic">The aisle is empty.</p>
            <p className="mt-2 text-sm text-muted">Write-ups print the moment week 1 is seeded and opened.</p>
          </RingCard>
        ) : (
          <BoutList board={board} week={current} />
        )}
      </div>
    </Shell>
  );
}
