import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { PrintPack } from "@/components/board/print-sheet";
import { useBoard, useHeat } from "@/lib/use-board";

export const Route = createFileRoute("/print/$id")({ component: PrintPage });

function PrintPage() {
  const { id } = Route.useParams();
  const { data: board, isPending } = useBoard();
  const heat = useHeat(board);

  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const fighter = board.fighters.find((f) => f.id === id);
  if (!fighter) {
    return (
      <Shell>
        <p className="text-muted">That locker is not on the book.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Take it home</p>
          <h1 className="mt-1 font-display text-4xl italic">Print {fighter.nickname}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Locker on page one. Score cards on page two. In the print box, turn on background
            graphics so the gold and the greens show.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
          <Button asChild variant="outline">
            <Link to="/score">Back to locker</Link>
          </Button>
        </div>
      </div>
      <PrintPack board={board} fighter={fighter} honors={heat?.honors} />
    </Shell>
  );
}
