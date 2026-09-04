import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScorePad } from "@/components/board/score-pad";
import { RingCard } from "@/components/arena/ring";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Seed } from "@/components/board/pieces";
import { weekAcceptsScores } from "@/lib/circuit/types";
import {
  addFighter,
  finalizeWeek,
  lockWeek,
  listPasscodes,
  rotatePasscode,
  rollRemaining,
  startCircuit,
  submitScore,
} from "@/lib/server/circuit";
import { onTheBook, useBoardMutation } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { awardedBonus } from "@/lib/circuit/training";
import { readDeskPin } from "@/lib/circuit/desk-pin";
import type { BoardPayload } from "@/lib/server/circuit";

function pinOf() {
  return readDeskPin();
}

export function WeekDesk({
  board,
  canClose,
  unlocked,
}: {
  board: BoardPayload;
  canClose: boolean;
  unlocked: boolean;
}) {
  const { circuit } = board;
  const [editing, setEditing] = useState<string | null>(null);
  const week = board.weeks.find((w) => w.weekNumber === circuit.currentWeek);
  const finalize = useBoardMutation(() => finalizeWeek({ data: { slug: circuit.slug, pin: pinOf() } }));
  const roll = useBoardMutation(() => rollRemaining({ data: { slug: circuit.slug, pin: pinOf() } }));
  const start = useBoardMutation(() => startCircuit({ data: { slug: circuit.slug, pin: pinOf() } }));
  const lock = useBoardMutation((locked: boolean) => lockWeek({ data: { slug: circuit.slug, locked, pin: pinOf() } }));
  const save = useBoardMutation((d: Parameters<typeof submitScore>[0]["data"]) => submitScore({ data: d }));

  const inWeek = board.matchups.filter((m) => m.weekNumber === circuit.currentWeek).flatMap((m) => m.fighterIds);
  const ids = [...new Set(inWeek)];
  const missing = ids.filter((id) => !board.scores.some((s) => s.fighterId === id && s.weekNumber === circuit.currentWeek));
  const list = ids.length ? ids : board.fighters.map((f) => f.id);

  return (
    <div className="mt-8 space-y-6">
      {circuit.status === "setup" ? (
        <RingCard className="border-amber/40 bg-amber/10 p-5 sm:p-7">
          <p className="kicker !text-amber">The bell has not rung</p>
          <h2 className="mt-2 font-display text-3xl italic">Open week 1 to start the matches</h2>
          <Button
            className="mt-5"
            size="lg"
            disabled={start.isPending || !unlocked}
            onClick={() =>
              start.mutate(undefined, {
                onSuccess: () => toast.success("Week 1 is open. The card is live."),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {start.isPending ? "Opening…" : unlocked ? "Seed and open week 1" : "Unlock the desk first"}
          </Button>
        </RingCard>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/score">Open scoresheet</Link>
        </Button>
        {canClose && week?.status === "open" ? (
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
        {canClose && week?.status === "locked" ? (
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
        {canClose ? (
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
        ) : null}
      </div>
      <p className="text-sm text-muted">
        {missing.length ? `${missing.length} cards still out.` : ids.length ? "Every card is in." : "Tap Edit next to a name to mark their metric colors."}
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {list.map((id) => {
          const f = board.fighters.find((x) => x.id === id);
          if (!f) return null;
          const s = board.scores.find((x) => x.fighterId === id && x.weekNumber === circuit.currentWeek);
          const card = s
            ? scorecard(s.statuses, s.reviews, s.trainingBonus)
            : awardedBonus(board.academy, id, circuit.currentWeek)
              ? scorecard([], 0, 1)
              : null;
          return (
            <li key={id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Seed n={f.seed} />
                <span className="min-w-0 flex-1 truncate font-medium">{f.nickname}</span>
                <span className="tabular text-sm">{card ? `${card.points} pts` : "—"}</span>
                <Button size="sm" variant="ghost" onClick={() => setEditing(editing === id ? null : id)}>
                  {editing === id ? "Close" : "Edit"}
                </Button>
              </div>
              {editing === id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <ScorePad
                    key={id + (s?.id ?? "x")}
                    metrics={board.metrics}
                    initialStatuses={s?.statuses}
                    initialReviews={s?.reviews}
                    initialNotes={s?.notes}
                    trainingBonus={awardedBonus(board.academy, id, circuit.currentWeek)}
                    disabled={!weekAcceptsScores(week?.status ?? "")}
                    pending={save.isPending}
                    onSubmit={(d) => {
                      save.mutate(
                        {
                          slug: circuit.slug,
                          fighterId: id,
                          weekNumber: circuit.currentWeek,
                          pin: pinOf(),
                          statuses: d.statuses,
                          reviews: d.reviews,
                          notes: d.notes,
                        },
                        {
                          onSuccess: () => {
                            toast.success("Saved.");
                            setEditing(null);
                          },
                          onError: (e) => toast.error(e.message),
                        },
                      );
                    }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CodesDesk({ board, unlocked }: { board: BoardPayload; unlocked: boolean }) {
  const [rows, setRows] = useState<Array<{ id: string; firstName: string; lastName: string; nickname: string; seed: number | null; passcode: string }>>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setBusy(true);
    listPasscodes({ data: { slug: board.circuit.slug, pin: pinOf() } })
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load passcodes."))
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked, board.circuit.id, board.fighters.length]);

  if (!unlocked) {
    return (
      <div className="mt-8 rounded-xl border border-line bg-surface p-6">
        <p className="font-display text-3xl italic">Passcodes stay in this desk.</p>
        <p className="mt-2 text-sm text-muted">Unlock to see every wrestler’s code.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="font-display text-3xl italic">{busy && !rows.length ? "Loading codes…" : `${rows.length} passcodes`}</h2>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 truncate font-display text-lg italic">{r.nickname}</span>
            <span className="text-sm text-muted">
              {r.firstName} {r.lastName}
            </span>
            <span className="rounded-sm border border-bone/30 bg-bone/10 px-2 py-1 font-mono text-sm">{r.passcode}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  const next = await rotatePasscode({ data: { slug: board.circuit.slug, fighterId: r.id, pin: pinOf() } });
                  setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, passcode: next.passcode } : x)));
                  toast.success(`New code for ${r.nickname}: ${next.passcode}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not rotate.");
                }
              }}
            >
              New code
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RosterDesk({ board }: { board: BoardPayload }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const add = useBoardMutation((d: Parameters<typeof addFighter>[0]["data"]) => addFighter({ data: d }));
  return (
    <div className="mt-8 space-y-6">
      <form
        className="space-y-3 rounded-lg border border-line bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(
            {
              slug: board.circuit.slug,
              pin: pinOf(),
              fighter: { firstName: first, lastName: last, nickname: "", hometown: "", funFact: "", store: "", seed: null, priorPoints: 0, priorBlues: 0, priorReviews: 0 },
            },
            {
              onSuccess: () => {
                toast.success("Added to the book.");
                setFirst("");
                setLast("");
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      >
        <h2 className="font-display text-2xl">Add anyone</h2>
        <Label>First</Label>
        <Input value={first} onChange={(e) => setFirst(e.target.value)} required />
        <Label>Last</Label>
        <Input value={last} onChange={(e) => setLast(e.target.value)} required />
        <Button type="submit" disabled={add.isPending}>
          Add fighter
        </Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {onTheBook(board.fighters).map((f) => (
          <li key={f.id} className="px-4 py-3">
            <p className="font-medium">{f.nickname}</p>
            <p className="text-sm text-muted">
              {f.firstName} {f.lastName}
              {f.store ? ` · ${f.store}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-6">
      <p className="font-display text-3xl italic">{title}</p>
      <p className="mt-2 max-w-xl text-sm text-muted">{body}</p>
    </div>
  );
}

export function AcademyDesk({ board }: { board: BoardPayload }) {
  return <PanelNote title="Academy" body={`${board.academy.length} academy records are still in the locker. This tab is coming back in the next pass.`} />;
}
export function SeedsDesk({ board }: { board: BoardPayload }) {
  return <PanelNote title="Seeds" body={`${board.fighters.length} people are still seeded on the book.`} />;
}
export function JobsDesk({ board }: { board: BoardPayload }) {
  return <PanelNote title="Jobs" body={`${board.floorWork.length} floor jobs are still saved. Nothing was erased.`} />;
}
export function HouseDesk({ board }: { board: BoardPayload; unlocked: boolean }) {
  return <PanelNote title="House" body="Challenges and house calls are still in the database. This tab is coming back next." />;
}
export function SettingsDesk({ board }: { board: BoardPayload }) {
  return (
    <PanelNote
      title="Settings"
      body={`${board.circuit.name} settings are intact. Use Clear scores on the top of the desk if you need week 1 again.`}
    />
  );
}
