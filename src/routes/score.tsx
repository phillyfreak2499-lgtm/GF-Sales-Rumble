import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { ScoreSheet } from "@/components/board/score-sheet";
import { LockerHub } from "@/components/board/locker-hub";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { PageHead, RingCard } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
import { lookupClaim } from "@/lib/server/circuit";
import { deskUnlocked, writeDeskPin, readDeskPin } from "@/lib/circuit/desk-pin";
import type { BoardPayload } from "@/lib/server/circuit";
import type { Fighter } from "@/lib/circuit/types";
import { normalizePasscode } from "@/lib/circuit/passcode";
import { readLockerPass, writeLockerPass } from "@/lib/circuit/locker-session";

export const Route = createFileRoute("/score")({ component: ScorePage });

function ScorePage() {
  const { data: board, isPending, error } = useBoard();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<{ fighter: Fighter; board: BoardPayload; passcode: string } | null>(null);
  const [looking, setLooking] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);

  useEffect(() => {
    const saved = readLockerPass();
    if (!saved) return;
    let cancelled = false;
    setLooking(true);
    lookupClaim({ data: { code: saved } })
      .then((res) => {
        if (cancelled || !res) return;
        setDeskOpen(false);
        setFound({ ...res, passcode: normalizePasscode(saved) });
        setCode(normalizePasscode(saved));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function openGate(e: React.FormEvent) {
    e.preventDefault();
    const raw = code.trim();
    if (await deskUnlocked(raw)) {
      writeDeskPin(raw);
      setDeskOpen(true);
      setFound(null);
      toast.success("Commissioner sheet unlocked.");
      return;
    }
    setLooking(true);
    try {
      const res = await lookupClaim({ data: { code: raw } });
      if (!res) {
        toast.error("That passcode is not on the book.");
        setFound(null);
        return;
      }
      const passcode = normalizePasscode(raw);
      writeLockerPass(passcode);
      setDeskOpen(false);
      setFound({ ...res, passcode });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That passcode is not on the book.");
      setFound(null);
    } finally {
      setLooking(false);
    }
  }

  return (
    <Shell>
      <PageHead
        kicker="Every store · your locker"
        title="Your locker"
        lede="Enter your passcode. That opens your stats, your card, your locker, and this week’s academy quiz — pass it for +1 on the card."
        action={
          <>
            <Badge tone="bone">
              Week {board.circuit.currentWeek}/{board.circuit.weeks}
            </Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "default"}>{week.status}</Badge> : null}
            <Button asChild variant="ghost">
              <Link to="/desk">Desk</Link>
            </Button>
          </>
        }
      />

      {!found || deskOpen ? (
        <>
          <form
            onSubmit={openGate}
            className="mt-8 flex max-w-lg flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Label htmlFor="pass">Your passcode</Label>
              <Input
                id="pass"
                className="mt-1.5 uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BELL-47"
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={looking || !code.trim()}>
              {looking ? "Opening…" : "Open my locker"}
            </Button>
          </form>
          <p className="mt-2 max-w-lg text-xs text-subtle">
            Ask the commissioner for your code. It looks like BELL-47. Commissioners can also enter the
            desk password here to mark the whole locker.
          </p>
        </>
      ) : null}

      {deskOpen ? (
        <div className="mt-8">
          <ScoreSheet
            key={`${board.circuit.id}-${board.circuit.currentWeek}`}
            board={board}
            pin={code.trim() || readDeskPin() || undefined}
          />
        </div>
      ) : found ? (
        <LockerHub
          board={found.board}
          fighter={found.fighter}
          passcode={found.passcode}
          onBoard={(next) => {
            const nextFighter = next.fighters.find((x) => x.id === found.fighter.id) ?? found.fighter;
            setFound({ ...found, board: next, fighter: nextFighter });
          }}
          onLeave={() => {
            setFound(null);
            setCode("");
          }}
        />
      ) : (
        <RingCard className="mt-10 p-5 sm:p-7">
          <p className="font-display text-3xl italic">The locker is locked.</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Enter the passcode the commissioner sent you. That opens your scores, your stats, and the
            weekly academy.
          </p>
        </RingCard>
      )}
    </Shell>
  );
}
