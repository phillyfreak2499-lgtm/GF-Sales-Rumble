import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { PageHead } from "@/components/arena/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { rewindToWeek1 } from "@/lib/server/rewind";
import { onTheBook, useBoard } from "@/lib/use-board";
import { deskUnlocked, readDeskPin, writeDeskPin, clearDeskPin } from "@/lib/circuit/desk-pin";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  WeekDesk,
  AcademyDesk,
  CodesDesk,
  RosterDesk,
  SeedsDesk,
  SettingsDesk,
  JobsDesk,
  HouseDesk,
} from "@/routes/desk-panels";

export const Route = createFileRoute("/desk")({
  component: DeskPage,
});

function pinOf() {
  return readDeskPin();
}

function DeskPage() {
  const { data: board, isPending, refetch } = useBoard();
  const { user, isPending: authPending } = useCurrentUserState();
  const [tab, setTab] = useState<
    "week" | "roster" | "codes" | "academy" | "seeds" | "jobs" | "house" | "settings"
  >("week");
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
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

  return (
    <Shell>
      <PageHead
        kicker="Commissioner desk"
        title={circuit.name}
        lede="Add people, seed, lock the week, and hand out passcodes. Edit anyone on the Week tab to mark scores."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="bone">
              Week {circuit.currentWeek}/{circuit.weeks}
            </Badge>
            <Badge>{circuit.status}</Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
            <Badge>Join {circuit.joinCode}</Badge>
            <Badge>{onTheBook(board.fighters).length} on the book</Badge>
          </div>
        }
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/new">New circuit</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/score">Open scoresheet</Link>
        </Button>
        <Button
          variant={confirmReset ? "outline" : "subtle"}
          className={confirmReset ? "border-rose/50 text-rose" : undefined}
          disabled={!open}
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              window.setTimeout(() => setConfirmReset(false), 5000);
              toast.message("Are you sure? Tap again. This still will not wipe anyone.");
              return;
            }
            setConfirmReset(false);
            toast.success("Nothing was reset. Players, lockers, and codes are still here.");
          }}
        >
          {confirmReset ? "Are you sure? Tap again — nothing will be wiped" : "Reset locker"}
        </Button>
        {circuit.status !== "setup" ? (
          <Button
            variant={confirmRewind ? "outline" : "subtle"}
            className={confirmRewind ? "border-amber/50 text-amber" : undefined}
            disabled={rewinding || !open}
            onClick={() => {
              if (!confirmRewind) {
                setConfirmRewind(true);
                window.setTimeout(() => setConfirmRewind(false), 5000);
                toast.message("Are you sure? Tap again to clear metric scores only.");
                return;
              }
              setConfirmRewind(false);
              setRewinding(true);
              void rewindToWeek1({ data: { slug: circuit.slug, pin: pinOf() } })
                .then(async () => {
                  toast.success("Scores cleared. Week 1 is open. Lockers and codes were not touched.");
                  await refetch();
                  setRewinding(false);
                })
                .catch((e) => {
                  setRewinding(false);
                  toast.error(e instanceof Error ? e.message : "Could not clear scores.");
                });
            }}
          >
            {rewinding
              ? "Clearing scores…"
              : confirmRewind
                ? "Are you sure? Tap again — scores only"
                : "Clear scores"}
          </Button>
        ) : null}
      </div>

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
      <p className="mt-2 text-xs text-subtle">
        Easiest score entry: Week tab, tap Edit next to a wrestler. Or open the scoresheet / My locker.
      </p>

      {!authPending && !user && !circuit.isDemo ? (
        <p className="mt-6 text-sm text-muted">
          Sign in to run your own circuit, or use the commissioner password on this desk.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {(["week", "roster", "codes", "academy", "seeds", "jobs", "house", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-sm border px-4 text-sm capitalize ${
              tab === t ? "border-bone bg-bone/10" : "border-line text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "week" ? <WeekDesk board={board} canClose={canClose} unlocked={open} /> : null}
      {tab === "roster" ? <RosterDesk board={board} /> : null}
      {tab === "codes" ? <CodesDesk board={board} unlocked={open} /> : null}
      {tab === "academy" ? <AcademyDesk board={board} /> : null}
      {tab === "seeds" ? <SeedsDesk board={board} /> : null}
      {tab === "jobs" ? <JobsDesk board={board} /> : null}
      {tab === "house" ? <HouseDesk board={board} unlocked={open} /> : null}
      {tab === "settings" ? <SettingsDesk board={board} /> : null}
    </Shell>
  );
}
