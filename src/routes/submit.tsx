import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { ScorePad } from "@/components/board/score-pad";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { lookupClaim, submitScore } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import type { BoardPayload } from "@/lib/server/circuit";
import type { Fighter } from "@/lib/circuit/types";
import { MatchupRow } from "@/components/board/matchup-row";

export const Route = createFileRoute("/submit")({ component: SubmitPage });

function SubmitPage() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<{ fighter: Fighter; board: BoardPayload } | null>(null);
  const [looking, setLooking] = useState(false);
  const save = useBoardMutation((d: Parameters<typeof submitScore>[0]["data"]) =>
    submitScore({ data: d }),
  );

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLooking(true);
    try {
      const res = await lookupClaim({ data: { code } });
      if (!res) {
        toast.error("That code is not on the book.");
        setFound(null);
        return;
      }
      setFound(res);
    } finally {
      setLooking(false);
    }
  }

  const week = found?.board.circuit.currentWeek ?? 1;
  const existing = found
    ? found.board.scores.find((s) => s.fighterId === found.fighter.id && s.weekNumber === week)
    : null;
  const match = found
    ? found.board.matchups.find((m) => m.weekNumber === week && m.fighterIds.includes(found.fighter.id))
    : null;
  const weekState = found?.board.weeks.find((w) => w.weekNumber === week);

  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.16em] text-subtle">Score pad</p>
      <h1 className="mt-1 font-display text-4xl">Submit a card</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Enter a claim code to open one pad, or mark the whole locker on the scoresheet — no
        password either way. The commissioner locks the week when the cards are final.
      </p>

      <form onSubmit={lookup} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="code">Claim code</Label>
          <Input
            id="code"
            className="mt-1.5 uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="IRON01"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={looking || !code.trim()}>
          {looking ? "Looking…" : "Open pad"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-subtle">
        Demo codes look like ARCH01, SURE02 — first letters of the nickname plus a number. Or mark
        everyone on the{" "}
        <Link to="/score" className="text-bone hover:text-fg">
          scoresheet
        </Link>
        .
      </p>

      {found ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-subtle">
              {found.fighter.firstName} {found.fighter.lastName}
            </p>
            <h2 className="font-display text-3xl">{found.fighter.nickname}</h2>
            <p className="mt-1 text-sm text-muted">
              Week {week} · {weekState?.status ?? "—"}
            </p>
            <div className="mt-6">
              <ScorePad
                key={found.fighter.id + (existing?.id ?? "new")}
                metrics={found.board.metrics}
                initialStatuses={existing?.statuses}
                initialReviews={existing?.reviews}
                initialNotes={existing?.notes}
                disabled={weekState?.status !== "open"}
                pending={save.isPending}
                onSubmit={(d) => {
                  save.mutate(
                    {
                      claimCode: found.fighter.claimCode,
                      weekNumber: week,
                      statuses: d.statuses,
                      reviews: d.reviews,
                      notes: d.notes,
                    },
                    {
                      onSuccess: (board) => {
                        toast.success("Card posted.");
                        setFound({ fighter: found.fighter, board });
                      },
                      onError: (err) => toast.error(err.message),
                    },
                  );
                }}
              />
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-subtle">This week</h3>
            {match ? <MatchupRow board={found.board} matchupId={match.id} /> : <p className="text-muted">No matchup.</p>}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
