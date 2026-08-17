import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { ScoreSheet } from "@/components/board/score-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHead } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
import { SCORE_BLURB } from "@/lib/circuit/types";

export const Route = createFileRoute("/score")({ component: ScorePage });

function ScorePage() {
  const { data: board, isPending, error } = useBoard();

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
        <p className="text-rose">{error?.message ?? "Could not load the sheet."}</p>
      </Shell>
    );
  }

  const week = board.weeks.find((w) => w.weekNumber === board.circuit.currentWeek);

  return (
    <Shell>
      <PageHead
        kicker="Every store · no password"
        title="The scoresheet"
        lede={`Anyone on any floor can mark cards. The commissioner locks the week when the numbers are final. ${SCORE_BLURB}`}
        action={
          <>
            <Badge tone="bone">
              Week {board.circuit.currentWeek}/{board.circuit.weeks}
            </Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "default"}>{week.status}</Badge> : null}
            <Button asChild variant="outline">
              <Link to="/submit">I have a claim code</Link>
            </Button>
          </>
        }
      />
      <div className="mt-8">
        <ScoreSheet key={`${board.circuit.id}-${board.circuit.currentWeek}`} board={board} />
      </div>
    </Shell>
  );
}
