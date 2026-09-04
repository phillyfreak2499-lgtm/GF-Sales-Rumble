import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { PageHead, RingCard } from "@/components/arena/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { finalizeWeek, lockWeek, resetDemo, rollRemaining, startCircuit } from "@/lib/server/circuit";
import { rewindToWeek1 } from "@/lib/server/rewind";
import { onTheBook, useBoard, useBoardMutation } from "@/lib/use-board";
import { deskUnlocked, readDeskPin, writeDeskPin, clearDeskPin } from "@/lib/circuit/desk-pin";

export const Route = createFileRoute("/desk")({
  component: DeskPage,
});

function pinOf() {
  return readDeskPin();
}

function DeskPage() {
  const { data: board, isPending } = useBoard();
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmRewind, setConfirmRewind] = useState(false);
  const [rewinding, setRewinding] = useState(false);

  useEffect(() => {
    const saved = readDeskPin();
    if (!saved) return;
    let cancelled = false;
    deskUnlocked(saved).then((ok) => {
      if (!cancelled) setOpen(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }

  const { circuit } = board;
  const week = board.weeks.find((w) => w.weekNumber === circuit.currentWeek);
  const canClose = (week?.status === "open" || week?.status === "locked") && circuit.status === "active";
  const finalize = useBoardMutation(() => finalizeWeek({ data: { slug: circuit.slug, pin: pinOf() } }));
  const roll = useBoardMutation(() => rollRemaining({ data: { slug: circuit.slug, pin: pinOf() } }));
  const start = useBoardMutation(() => startCircuit({ data: { slug: circuit.slug, pin: pinOf() } }));
  const lock = useBoardMutation((locked: boolean) => lockWeek({ data: { slug: circuit.slug, locked, pin: pinOf() } }));

  return (
    <Shell>
      <PageHead
        kicker="Commissioner desk"
        title={circuit.name}
        lede="Unlock the desk to rewind week 1, lock scores, or close a week. Lockers and passcodes are not reset from here."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="bone">
              Week {circuit.currentWeek}/{circuit.weeks}
            </Badge>
            <Badge>{circuit.status}</Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
            <Badge>{onTheBook(board.fighters).length} on the book</Badge>
          </div>
        }
      />

      <form
        className="mt-6 flex max-w-lg flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          writeDeskPin(pin);
          if (await deskUnlocked(pin)) {
            setOpen(true);
            toast.success("Desk unlocked.");
          } else {
            setOpen(false);
            toast.error("Wrong password.");
          }
        }}
      >
        <div className="flex-1">
          <Label htmlFor="desk-pin">Commissioner password</Label>
          <Input
            id="desk-pin"
            className="mt-1.5"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={open ? "Unlocked" : "Required for admin"}
            autoComplete="current-password"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{open ? "Re-lock check" : "Unlock desk"}</Button>
          {open ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clearDeskPin();
                setPin("");
                setOpen(false);
              }}
            >
              Lock desk
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/">Back to the ring</Link>
        </Button>
        {circuit.isDemo ? (
          <Button
            variant="subtle"
            onClick={async () => {
              try {
                await resetDemo({ data: { pin: pinOf() } });
                toast.success("Locker reset.");
                window.location.reload();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not reset.");
              }
            }}
          >
            Reset locker
          </Button>
        ) : null}
      </div>

      {circuit.status === "setup" ? (
        <RingCard className="mt-8 border-amber/40 bg-amber/10 p-5 sm:p-7">
          <p className="kicker !text-amber">The bell has not rung</p>
          <h2 className="mt-2 font-display text-3xl italic">Open week 1 to start the matches</h2>
          <Button
            className="mt-5"
            size="lg"
            disabled={start.isPending || !open}
            onClick={() =>
              start.mutate(undefined, {
                onSuccess: () => toast.success("Week 1 is open."),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {start.isPending ? "Opening…" : open ? "Seed and open week 1" : "Unlock the desk first"}
          </Button>
        </RingCard>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {canClose ? (
          <>
            <Button asChild variant="outline">
              <Link to="/score">Open scoresheet</Link>
            </Button>
            {week?.status === "open" ? (
              <>
                <Button
                  variant="outline"
                  disabled={roll.isPending}
                  onClick={() =>
                    roll.mutate(undefined, {
                      onSuccess: () => toast.success("Remaining cards rolled."),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                >
                  Fill remaining cards
                </Button>
                <Button
                  variant="outline"
                  disabled={lock.isPending}
                  onClick={() =>
                    lock.mutate(true, {
                      onSuccess: () => toast.success("Week locked."),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                >
                  Lock scores
                </Button>
              </>
            ) : null}
            {week?.status === "locked" ? (
              <Button
                variant="outline"
                disabled={lock.isPending}
                onClick={() =>
                  lock.mutate(false, {
                    onSuccess: () => toast.success("Week unlocked."),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                Unlock scores
              </Button>
            ) : null}
            <Button
              disabled={finalize.isPending}
              onClick={() =>
                finalize.mutate(undefined, {
                  onSuccess: () => toast.success("Week closed. Brackets advanced."),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Close week and advance
            </Button>
          </>
        ) : null}
        {circuit.status !== "setup" ? (
          <Button
            variant={confirmRewind ? "outline" : "subtle"}
            className={confirmRewind ? "border-rose/50 text-rose" : undefined}
            disabled={rewinding || !open}
            onClick={() => {
              if (!confirmRewind) {
                setConfirmRewind(true);
                window.setTimeout(() => setConfirmRewind(false), 5000);
                return;
              }
              setConfirmRewind(false);
              setRewinding(true);
              void rewindToWeek1({ data: { slug: circuit.slug, pin: pinOf() } })
                .then(() => {
                  toast.success("Back on week 1. Metric cards are blank. Lockers and codes are untouched.");
                  window.location.reload();
                })
                .catch((e) => {
                  setRewinding(false);
                  toast.error(e instanceof Error ? e.message : "Could not rewind.");
                });
            }}
          >
            {rewinding
              ? "Rewinding…"
              : confirmRewind
                ? "Tap again — clear metric scores, stay on week 1"
                : "Back to week 1, clear metric scores"}
          </Button>
        ) : null}
      </div>

      <p className="mt-4 max-w-xl text-sm text-muted">
        Rewind blanks every metric color on the cards and puts the building back on week 1. It does
        not erase players, passcodes, locker rooms, academy work, or floor jobs. Roster / codes /
        academy tabs will return on the next desk restore.
      </p>
    </Shell>
  );
}
