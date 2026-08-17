import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { BoothDemo } from "@/components/board/booth-demo";
import { Badge } from "@/components/ui/badge";
import { PageHead } from "@/components/arena/ring";
import { AnnouncerPlate, StyleRail } from "@/components/arena/announcer";
import { useAnnounceStyle } from "@/lib/use-announce";
import { useBoard } from "@/lib/use-board";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bouts")({ component: BoutsPage });

function BoutsPage() {
  const { data: board, isPending, error } = useBoard();
  const [week, setWeek] = useState<number | null>(null);
  const { style, choose, meta } = useAnnounceStyle();

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
        kicker={`Write-ups · ${meta.desk}`}
        title="This week’s bouts"
        lede="A short paragraph for each match — records, hometowns, and the one thing the locker already knows. Flip the style if you want a different voice."
        action={
          <>
            {w ? <Badge>{w.status}</Badge> : null}
            <span className="kicker text-subtle">
              {count} bout{count === 1 ? "" : "s"}
            </span>
          </>
        }
      />
      <div className="mt-6">
        <AnnouncerPlate compact line={meta.intro} />
      </div>
      <div className="mt-8">
        <StyleRail value={style} onChange={choose} />
      </div>
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
        <BoothDemo board={board} style={style} />
      </div>
      <div className="mt-8">
        {count === 0 ? (
          <p className="text-sm text-muted">
            That was a sample from the locker. Live write-ups print when week 1 opens.
          </p>
        ) : (
          <BoutList board={board} week={current} style={style} />
        )}
      </div>
    </Shell>
  );
}