import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { ScorePad } from "@/components/board/score-pad";
import { PageHead, RingCard } from "@/components/arena/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MonoMark, Seed } from "@/components/board/pieces";
import { PhotoField } from "@/components/board/photo-field";
import { StoreSelect } from "@/components/board/store-select";
import { BRACKET_LABEL, weekAcceptsScores, type Matchup } from "@/lib/circuit/types";
import { SITE_THEMES } from "@/lib/circuit/themes";
import { cn } from "@/lib/utils";
import {
  addFighter,
  addFightersBulk,
  addFloorJob,
  removeFloorJob,
  finalizeWeek,
  lockWeek,
  removeFighter,
  restoreFighter,
  listPasscodes,
  rotatePasscode,
  resetDemo,
  rewriteStory,
  rollRemaining,
  saveSeeds,
  seedFromPrior,
  startCircuit,
  submitScore,
  updateFighter,
  updateSettings,
  postChallenge,
  saveHouseCall,
  setMatchupVideo,
  resetFloorStars,
} from "@/lib/server/circuit";
import { onTheBook, useBoard, useBoardMutation } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { awardedBonus } from "@/lib/circuit/training";
import { WEEKLY_MODULES, LOCKER_GAMES, weekAcademyProgress } from "@/lib/circuit/training";
import { DEFAULT_TICKER, SCORE_BLURB } from "@/lib/circuit/types";
import { deskUnlocked, readDeskPin, writeDeskPin, clearDeskPin } from "@/lib/circuit/desk-pin";
import { storeLabel } from "@/lib/circuit/stores";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { BoardPayload } from "@/lib/server/circuit";
import type { Fighter } from "@/lib/circuit/types";

export const Route = createFileRoute("/desk")({ component: DeskPage });

function pinOf() {
  return readDeskPin();
}

function DeskPage() {
  const { data: board, isPending, refetch } = useBoard();
  const { user, isPending: authPending } = useCurrentUserState();
  const [tab, setTab] = useState<"week" | "roster" | "codes" | "academy" | "seeds" | "jobs" | "house" | "settings">("week");
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(false);

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
        lede="Add people, seed, lock the week, and hand out passcodes. Each wrestler uses their own code to mark scores and update their locker."
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
          {circuit.isDemo ? (
            <Button
              variant="subtle"
              onClick={async () => {
                try {
                  await resetDemo({ data: { pin: pinOf() } });
                  await refetch();
                  toast.success("Locker reset. Add anyone, then open week 1.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not reset.");
                }
              }}
            >
              Reset locker
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
        Scores need each wrestler’s passcode. This password unlocks the desk, the full sheet, and
        the passcode list.
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

function WeekDesk({ board, canClose, unlocked }: { board: BoardPayload; canClose: boolean; unlocked: boolean }) {
  const { circuit } = board;
  const [editing, setEditing] = useState<string | null>(null);
  const week = board.weeks.find((w) => w.weekNumber === circuit.currentWeek);
  const finalize = useBoardMutation(() =>
    finalizeWeek({ data: { slug: circuit.slug, pin: pinOf() } }),
  );
  const roll = useBoardMutation(() => rollRemaining({ data: { slug: circuit.slug, pin: pinOf() } }));
  const start = useBoardMutation(() => startCircuit({ data: { slug: circuit.slug, pin: pinOf() } }));
  const lock = useBoardMutation((locked: boolean) =>
    lockWeek({ data: { slug: circuit.slug, locked, pin: pinOf() } }),
  );
  const save = useBoardMutation((d: Parameters<typeof submitScore>[0]["data"]) =>
    submitScore({ data: d }),
  );

  const inWeek = board.matchups
    .filter((m) => m.weekNumber === circuit.currentWeek)
    .flatMap((m) => m.fighterIds);
  const ids = [...new Set(inWeek)];
  const missing = ids.filter(
    (id) => !board.scores.some((s) => s.fighterId === id && s.weekNumber === circuit.currentWeek),
  );

  return (
    <div className="mt-8 space-y-6">
      {circuit.status === "setup" ? (
        <RingCard className="border-amber/40 bg-amber/10 p-5 sm:p-7">
          <p className="kicker !text-amber">The bell has not rung</p>
          <h2 className="mt-2 font-display text-3xl italic">Open week 1 to start the matches</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            When every card in a match is in, the week closes itself and the next one books. You can still close early. Pairings, the card, and the gazette print when you
            open week 1. Unlock the desk first if the button is grey.
          </p>
          <Button
            className="mt-5"
            size="lg"
            onClick={() =>
              start.mutate(undefined, {
                onSuccess: () => toast.success("Week 1 is open. The card is live."),
                onError: (e) => toast.error(e.message),
              })
            }
            disabled={start.isPending || !unlocked}
          >
            {start.isPending ? "Opening…" : unlocked ? "Seed and open week 1" : "Unlock the desk first"}
          </Button>
        </RingCard>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canClose ? (
          <>
            <Button asChild variant="outline">
              <Link to="/score">Open scoresheet</Link>
            </Button>
            {week?.status === "open" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    roll.mutate(undefined, {
                      onSuccess: () => toast.success("Remaining cards rolled."),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                  disabled={roll.isPending}
                >
                  Fill remaining cards
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    lock.mutate(true, {
                      onSuccess: () => toast.success("Week locked. Nobody can change cards."),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                  disabled={lock.isPending}
                >
                  Lock scores
                </Button>
              </>
            ) : null}
            {week?.status === "locked" ? (
              <Button
                variant="outline"
                onClick={() =>
                  lock.mutate(false, {
                    onSuccess: () => toast.success("Week unlocked. Cards can change again."),
                    onError: (e) => toast.error(e.message),
                  })
                }
                disabled={lock.isPending}
              >
                Unlock scores
              </Button>
            ) : null}
            <Button
              onClick={() =>
                finalize.mutate(undefined, {
                  onSuccess: () => toast.success("Week closed. Brackets advanced."),
                  onError: (e) => toast.error(e.message),
                })
              }
              disabled={finalize.isPending}
            >
              Close week and advance
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-sm text-muted">
        {circuit.status === "setup"
          ? `${board.fighters.length} people on the book. Add new hires any time — there is no cap. Open week 1 when you are ready.`
          : missing.length
            ? `${missing.length} card${missing.length === 1 ? "" : "s"} still out.`
            : ids.length
              ? "Every card is in."
              : "No matchups this week."}
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {(ids.length ? ids : board.fighters.map((f) => f.id)).map((id) => {
          const f = board.fighters.find((x) => x.id === id);
          if (!f) return null;
          const s = board.scores.find(
            (x) => x.fighterId === id && x.weekNumber === circuit.currentWeek,
          );
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
                {awardedBonus(board.academy, id, circuit.currentWeek) ? (
                  <span className="text-[11px] uppercase tracking-[0.12em] text-sage">Academy</span>
                ) : null}
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
      <BoutVideos board={board} />
    </div>
  );
}

function BoutVideos({ board }: { board: BoardPayload }) {
  const week = board.circuit.currentWeek;
  const items = board.matchups.filter((m) => m.weekNumber === week && m.kind !== "bye");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const save = useBoardMutation((d: Parameters<typeof setMatchupVideo>[0]["data"]) =>
    setMatchupVideo({ data: d }),
  );
  if (!items.length) return null;

  const nameOf = (id: string) => board.fighters.find((f) => f.id === id)?.nickname ?? "—";
  const labelOf = (m: Matchup) =>
    m.kind === "rumble"
      ? `${BRACKET_LABEL[m.bracket]} rumble`
      : m.fighterIds.map(nameOf).join(" vs ");
  const submit = (m: Matchup, url: string) => {
    save.mutate(
      { slug: board.circuit.slug, matchupId: m.id, url, pin: pinOf() },
      {
        onSuccess: () => {
          setDrafts((d) => {
            const next = { ...d };
            delete next[m.id];
            return next;
          });
          toast.success(url ? "Video is on the bout." : "Video pulled from the bout.");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div>
      <p className="kicker">Bout videos</p>
      <p className="mt-1 mb-3 text-sm text-muted">
        Paste a link to a bout&rsquo;s video. The card and bouts pages only show a watch link once one
        is added.
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {items.map((m) => {
          const value = drafts[m.id] ?? m.videoUrl;
          const dirty = value !== m.videoUrl;
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {labelOf(m)}
                {m.videoUrl ? <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-amber">Video on</span> : null}
              </span>
              <Input
                className="h-9 w-full sm:w-80"
                placeholder="https://…"
                value={value}
                onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
              />
              <Button size="sm" disabled={save.isPending || !dirty} onClick={() => submit(m, value.trim())}>
                Save
              </Button>
              {m.videoUrl ? (
                <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => submit(m, "")}>
                  Remove
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AcademyDesk({ board }: { board: BoardPayload }) {
  const weekly = WEEKLY_MODULES;
  const games = LOCKER_GAMES;
  const passed = (fighterId: string, moduleId: string) =>
    board.academy.find((r) => r.fighterId === fighterId && r.moduleId === moduleId);
  const countFor = (moduleId: string) =>
    board.academy.filter((r) => r.moduleId === moduleId && r.passed).length;

  return (
    <div className="mt-8 space-y-6">
      <p className="text-sm text-muted">
        Four trainings a week. The first pass while scores are open is +1 on that week’s card. The
        other three are still required work. Locker games are practice. The quiz grades itself.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...weekly, ...games].map((m) => (
          <div key={m.id} className="rounded-lg border border-line bg-surface px-4 py-3">
            <p className="kicker">{m.kicker}</p>
            <p className="mt-1 font-display text-xl italic">{m.title}</p>
            <p className="mt-2 text-sm text-muted">
              {countFor(m.id)} passed
              {m.weekNumber ? " · bonus week" : " · no bonus"}
            </p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-raised text-left text-xs uppercase tracking-[0.12em] text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Wrestler</th>
              {[1, 2, 3, 4].map((w) => (
                <th key={w} className="px-3 py-3 font-medium">
                  W{w}
                </th>
              ))}
              {games.map((m) => (
                <th key={m.id} className="px-3 py-3 font-medium">
                  {m.title.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.fighters.map((f) => (
              <tr key={f.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <p className="font-display italic">{f.nickname}</p>
                  <p className="text-xs text-muted">
                    {f.firstName} {f.lastName}
                  </p>
                </td>
                {[1, 2, 3, 4].map((w) => {
                  const prog = weekAcademyProgress(board.academy, f.id, w);
                  return (
                    <td key={w} className="px-3 py-3 tabular text-xs uppercase tracking-[0.1em]">
                      <span className={prog.bonus ? "text-sage" : prog.have ? "text-steel" : "text-subtle"}>
                        {prog.have}/{prog.need}
                        {prog.bonus ? " +1" : ""}
                      </span>
                    </td>
                  );
                })}
                {games.map((m) => {
                  const rec = passed(f.id, m.id);
                  return (
                    <td key={m.id} className="px-3 py-3 tabular text-xs uppercase tracking-[0.1em] text-subtle">
                      {rec?.passed ? <span className="text-steel">ok</span> : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodesDesk({ board, unlocked }: { board: BoardPayload; unlocked: boolean }) {
  const [rows, setRows] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    nickname: string;
    seed: number | null;
    passcode: string;
  }>>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!unlocked) return;
    setBusy(true);
    try {
      const list = await listPasscodes({ data: { slug: board.circuit.slug, pin: pinOf() } });
      setRows(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load passcodes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, board.circuit.id, board.fighters.length]);

  function sheetText() {
    return rows
      .map((r) => `${r.nickname} (${r.firstName} ${r.lastName}) — ${r.passcode}`)
      .join("\n");
  }

  if (!unlocked) {
    return (
      <div className="mt-8 rounded-xl border border-line bg-surface p-6">
        <p className="font-display text-3xl italic">Passcodes stay in this desk.</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Unlock with the commissioner password to see every wrestler’s code. Hand them out store by
          store. Nobody else can see this list.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Hand these out</p>
          <h2 className="mt-1 font-display text-3xl italic">{rows.length} passcodes</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            One code per person. They use it on the scoresheet to mark their card and update hometown,
            fun fact, and photo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sheetText());
                toast.success("Copied every passcode.");
              } catch {
                toast.error("Could not copy.");
              }
            }}
          >
            Copy all
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead className="bg-raised text-left text-xs uppercase tracking-[0.12em] text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Seed</th>
              <th className="px-4 py-3 font-medium">Wrestler</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Passcode</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 tabular text-subtle">{r.seed ?? "—"}</td>
                <td className="px-4 py-3 font-display text-lg italic">{r.nickname}</td>
                <td className="px-4 py-3 text-muted">
                  {r.firstName} {r.lastName}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-sm border border-bone/30 bg-bone/10 px-2 py-1 font-mono text-sm tracking-wide">
                    {r.passcode}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const next = await rotatePasscode({
                          data: { slug: board.circuit.slug, fighterId: r.id, pin: pinOf() },
                        });
                        setRows((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, passcode: next.passcode } : x)),
                        );
                        toast.success(`New code for ${r.nickname}: ${next.passcode}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not rotate.");
                      }
                    }}
                  >
                    New code
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {busy && rows.length === 0 ? <p className="text-sm text-subtle">Loading codes…</p> : null}
    </div>
  );
}

function RosterDesk({ board }: { board: BoardPayload }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [nick, setNick] = useState("");
  const [hometown, setHometown] = useState("");
  const [funFact, setFunFact] = useState("");
  const [store, setStore] = useState("");
  const [seed, setSeed] = useState("");
  const [pts, setPts] = useState("0");
  const [blues, setBlues] = useState("0");
  const [revs, setRevs] = useState("0");
  const [csv, setCsv] = useState("");
  const add = useBoardMutation((d: Parameters<typeof addFighter>[0]["data"]) => addFighter({ data: d }));
  const bulk = useBoardMutation((d: Parameters<typeof addFightersBulk>[0]["data"]) =>
    addFightersBulk({ data: d }),
  );
  const drop = useBoardMutation((d: Parameters<typeof removeFighter>[0]["data"]) =>
    removeFighter({ data: d }),
  );
  const back = useBoardMutation((d: Parameters<typeof restoreFighter>[0]["data"]) =>
    restoreFighter({ data: d }),
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-8">
        <form
          className="space-y-3 rounded-lg border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate(
              {
                slug: board.circuit.slug,
                pin: pinOf(),
                fighter: {
                  firstName: first,
                  lastName: last,
                  nickname: nick,
                  hometown,
                  funFact,
                  store,
                  seed: seed ? Number(seed) : null,
                  priorPoints: Number(pts) || 0,
                  priorBlues: Number(blues) || 0,
                  priorReviews: Number(revs) || 0,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Added to the book.");
                  setFirst("");
                  setLast("");
                  setNick("");
                  setHometown("");
                  setFunFact("");
                  setSeed("");
                },
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <h2 className="font-display text-2xl">Add anyone</h2>
          <p className="text-sm text-muted">
            No cap. New hires can join any time. Before week 1 they land in the main field. After
            the bell they drop into the rumble.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="First" value={first} onChange={setFirst} required />
            <Field label="Last" value={last} onChange={setLast} required />
          </div>
          <Field label="Nickname (optional)" value={nick} onChange={setNick} />
          <Field label="Hometown" value={hometown} onChange={setHometown} />
          <div><Label>Home store</Label><div className="mt-1.5"><StoreSelect value={store} onChange={setStore} /></div></div>
          <Field label="One fun fact" value={funFact} onChange={setFunFact} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Seed" value={seed} onChange={setSeed} />
            <Field label="Prior pts" value={pts} onChange={setPts} />
            <Field label="Greens / blues" value={blues} onChange={setBlues} />
            <Field label="Reviews" value={revs} onChange={setRevs} />
          </div>
          <Button type="submit" disabled={add.isPending}>
            Add fighter
          </Button>
        </form>

        <form
          className="space-y-3 rounded-lg border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            bulk.mutate(
              { slug: board.circuit.slug, csv, pin: pinOf() },
              {
                onSuccess: () => {
                  toast.success("Roster pasted.");
                  setCsv("");
                },
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <h2 className="font-display text-2xl">Paste a roster</h2>
          <p className="text-sm text-muted">first, last, nickname, prior points, blues, reviews</p>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="First, Last, Nickname, 0, 0, 0"
          />
          <Button type="submit" variant="outline" disabled={bulk.isPending}>
            Import
          </Button>
        </form>
      </div>

      <ul className="space-y-2">
        {board.fighters
          .slice()
          .sort((a, b) => Number(a.departed) - Number(b.departed) || (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
          .map((f) => (
            <FighterAdminRow
              key={f.id}
              fighter={f}
              slug={board.circuit.slug}
              onRemove={() => {
                const name = f.nickname || `${f.firstName} ${f.lastName}`;
                if (!window.confirm(`Take ${name} off the card? Past weeks stay in the book. You can put them back.`)) return;
                drop.mutate(
                  { slug: board.circuit.slug, fighterId: f.id, pin: pinOf() },
                  {
                    onSuccess: () => toast.success(`${name} is off the card.`),
                    onError: (e) => toast.error(e.message),
                  },
                );
              }}
              onRestore={() =>
                back.mutate(
                  { slug: board.circuit.slug, fighterId: f.id, pin: pinOf() },
                  {
                    onSuccess: () => toast.success("They are back on the rumble card."),
                    onError: (e) => toast.error(e.message),
                  },
                )
              }
            />
          ))}
      </ul>
    </div>
  );
}

function FighterAdminRow({
  fighter,
  slug,
  onRemove,
  onRestore,
}: {
  fighter: Fighter;
  slug: string;
  onRemove: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hometown, setHometown] = useState(fighter.hometown);
  const [funFact, setFunFact] = useState(fighter.funFact);
  const [store, setStore] = useState(fighter.store);
  const [seed, setSeed] = useState(fighter.seed ? String(fighter.seed) : "");
  const [socks, setSocks] = useState(String(fighter.socksSold ?? 0));
  const [story, setStory] = useState(fighter.backstory);
  const save = useBoardMutation((d: Parameters<typeof updateFighter>[0]["data"]) =>
    updateFighter({ data: d }),
  );
  const rewrite = useBoardMutation((d: Parameters<typeof rewriteStory>[0]["data"]) =>
    rewriteStory({ data: d }),
  );

  return (
    <li className={`rounded-lg border px-3 py-2 ${fighter.departed ? "border-rose/30 bg-rose/5" : "border-line bg-surface"}`}>
      <div className="flex items-center gap-3">
        <PhotoField fighter={fighter} slug={slug} compact markClassName="size-11 text-xs" pin={pinOf()} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <Seed n={fighter.seed} /> {fighter.nickname}
          </p>
          <p className="truncate text-xs text-muted">
            {fighter.firstName} {fighter.lastName}
            {fighter.departed ? " · left the team" : fighter.hometown ? ` · ${fighter.hometown}` : ""}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Edit"}
        </Button>
        {fighter.departed ? (
          <Button size="sm" variant="outline" onClick={onRestore}>
            Put back
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      {open ? (
        <form
          className="mt-3 space-y-2 border-t border-line pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(
              {
                slug,
                fighterId: fighter.id,
                pin: pinOf(),
                patch: {
                  hometown,
                  funFact,
                  store,
                  seed: seed ? Number(seed) : null,
                  socksSold: Number(socks) || 0,
                  backstory: story,
                },
              },
              {
                onSuccess: () => toast.success("Locker updated."),
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <PhotoField fighter={fighter} slug={slug} markClassName="size-16 text-base" />
          <Field label="Hometown" value={hometown} onChange={setHometown} />
          <div><Label>Home store</Label><div className="mt-1.5"><StoreSelect value={store} onChange={setStore} /></div></div>
          <Field label="Fun fact" value={funFact} onChange={setFunFact} />
          <Field label="Seed" value={seed} onChange={setSeed} />
          <Field label="Socks sold · tiebreak" value={socks} onChange={setSocks} />
          <div>
            <Label>Backstory</Label>
            <Textarea className="mt-1.5" value={story} onChange={(e) => setStory(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={save.isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rewrite.isPending}
              onClick={() =>
                rewrite.mutate(
                  { slug, fighterId: fighter.id, pin: pinOf() },
                  {
                    onSuccess: (board) => {
                      const next = board.fighters.find((x) => x.id === fighter.id);
                      if (next) setStory(next.backstory);
                      toast.success("New story written.");
                    },
                    onError: (err) => toast.error(err.message),
                  },
                )
              }
            >
              Write story
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

function SeedsDesk({ board }: { board: BoardPayload }) {
  const [seeds, setSeeds] = useState<Record<string, string>>(() =>
    Object.fromEntries(board.fighters.map((f) => [f.id, f.seed ? String(f.seed) : ""])),
  );
  const save = useBoardMutation((d: Parameters<typeof saveSeeds>[0]["data"]) => saveSeeds({ data: d }));
  const auto = useBoardMutation(() => seedFromPrior({ data: { slug: board.circuit.slug, pin: pinOf() } }));
  const locked = board.circuit.status !== "setup" && board.circuit.status !== "active";

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Seeding</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Type a number next to each wrestler. Lowest number walks in first. Leave it blank and
            the desk will rank them from last period when you open week 1 — or fill from prior now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={auto.isPending || locked}
            onClick={() =>
              auto.mutate(undefined, {
                onSuccess: (next) => {
                  setSeeds(
                    Object.fromEntries(next.fighters.map((f) => [f.id, f.seed ? String(f.seed) : ""])),
                  );
                  toast.success("Seeded from prior period.");
                },
                onError: (e) => toast.error(e.message),
              })
            }
          >
            Fill from prior
          </Button>
          <Button
            disabled={save.isPending || locked}
            onClick={() =>
              save.mutate(
                {
                  slug: board.circuit.slug,
                  pin: pinOf(),
                  seeds: board.fighters
                    .map((f) => ({ fighterId: f.id, seed: Number(seeds[f.id]) }))
                    .filter((r) => Number.isFinite(r.seed) && r.seed > 0),
                },
                {
                  onSuccess: () => toast.success("Seeds saved."),
                  onError: (e) => toast.error(e.message),
                },
              )
            }
          >
            Save seeds
          </Button>
        </div>
      </div>
      <ol className="divide-y divide-line rounded-lg border border-line bg-surface">
        {board.fighters
          .slice()
          .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
          .map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2">
              <label className="sr-only" htmlFor={`seed-${f.id}`}>
                Seed for {f.nickname}
              </label>
              <Input
                id={`seed-${f.id}`}
                className="w-16 text-center tabular"
                inputMode="numeric"
                value={seeds[f.id] ?? ""}
                onChange={(e) => setSeeds((prev) => ({ ...prev, [f.id]: e.target.value }))}
              />
              <MonoMark first={f.firstName} last={f.lastName} photo={f.photoUrl} className="size-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.nickname}</p>
                <p className="truncate text-xs text-muted">
                  {f.firstName} {f.lastName}
                  {f.hometown ? ` · ${f.hometown}` : ""} · prior {f.priorPoints}
                </p>
              </div>
            </li>
          ))}
      </ol>
    </div>
  );
}

function SettingsDesk({ board }: { board: BoardPayload }) {
  const [name, setName] = useState(board.circuit.name);
  const [p1, setP1] = useState(board.circuit.prizeMain);
  const [p2, setP2] = useState(board.circuit.prizeRedemption);
  const [p3, setP3] = useState(board.circuit.prizeRumble);
  const [ticker, setTicker] = useState(board.circuit.tickerText || DEFAULT_TICKER.join("\n"));
  const [theme, setTheme] = useState(board.circuit.theme || "house");
  const [metrics, setMetrics] = useState(board.metrics.map((m) => ({ id: m.id, label: m.label })));
  const save = useBoardMutation((d: Parameters<typeof updateSettings>[0]["data"]) =>
    updateSettings({ data: d }),
  );

  return (
    <form
      className="mt-8 max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(
          {
            slug: board.circuit.slug,
            pin: pinOf(),
            name,
            prizeMain: p1,
            prizeRedemption: p2,
            prizeRumble: p3,
            tickerText: ticker,
            theme,
            metrics,
          },
          {
            onSuccess: () => toast.success("Saved."),
            onError: (err) => toast.error(err.message),
          },
        );
      }}
    >
      <Field label="Circuit name" value={name} onChange={setName} />
      <Field label="Main prize" value={p1} onChange={setP1} />
      <Field label="Redemption prize" value={p2} onChange={setP2} />
      <Field label="Rumble prize" value={p3} onChange={setP3} />
      <div>
        <Label>House lights</Label>
        <p className="mt-1 mb-3 text-sm text-muted">
          Mix the building. Everyone sees it. Scores and greens stay the same.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SITE_THEMES.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  if (opt.id === "house") delete document.documentElement.dataset.theme;
                  else document.documentElement.dataset.theme = opt.id;
                }}
                className={cn(
                  "w-full rounded-lg border px-3 py-3 text-left",
                  theme === opt.id ? "border-bone bg-bone/10" : "border-line hover:bg-raised",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("size-4 rounded-full", 
                    opt.id === "house" && "bg-rose",
                    opt.id === "midnight" && "bg-steel",
                    opt.id === "garden" && "bg-sage",
                    opt.id === "neon" && "bg-neon-pink",
                    opt.id === "gold" && "bg-gold",
                    opt.id === "ice" && "bg-steel",
                  )} />
                  <span className="font-display text-lg italic">{opt.name}</span>
                </span>
                <span className="mt-1 block text-xs text-muted">{opt.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Label htmlFor="ticker">Rolling message board</Label>
        <Textarea
          id="ticker"
          className="mt-1.5 min-h-40"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <p className="mt-1.5 text-sm text-muted">
          One line per message. They scroll across the top of every page. Clear the box and save
          to restore the default board.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Metrics</Label>
        {metrics.map((m, i) => (
          <Input
            key={m.id}
            value={m.label}
            onChange={(e) => {
              const next = [...metrics];
              next[i] = { ...m, label: e.target.value };
              setMetrics(next);
            }}
          />
        ))}
      </div>
      <p className="text-sm text-muted">{SCORE_BLURB}</p>
      <Button type="submit" disabled={save.isPending}>
        Save settings
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function StarBoard({ board }: { board: BoardPayload }) {
  const week = board.circuit.currentWeek;
  const reset = useBoardMutation((d: Parameters<typeof resetFloorStars>[0]["data"]) =>
    resetFloorStars({ data: d }),
  );
  const rows = board.fighters
    .filter((f) => !f.departed)
    .map((f) => {
      const mine = board.floorWork.filter((w) => w.fighterId === f.id);
      const done = mine.filter((w) => w.done);
      const thisWeek = done.filter((w) => w.weekNumber === week);
      return {
        f,
        assigned: mine.filter((w) => w.weekNumber === week).length,
        weekJobs: thisWeek.length,
        weekStars: thisWeek.reduce((s, w) => s + w.stars, 0),
        totalStars: done.reduce((s, w) => s + w.stars, 0),
      };
    })
    .sort((a, b) => b.weekStars - a.weekStars || b.totalStars - a.totalStars || a.f.lastName.localeCompare(b.f.lastName));
  const anyWork = rows.some((r) => r.totalStars > 0);

  return (
    <RingCard>
      <p className="kicker">Week {week} · star board</p>
      <h2 className="mt-2 font-display text-2xl italic">Who is doing the work</h2>
      <p className="mt-1 mb-4 text-sm text-muted">
        Jobs checked off this week and stars banked for the period. Prints straight from the lockers.
      </p>
      {anyWork ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="py-2 pr-3 font-normal">Wrestler</th>
                <th className="py-2 pr-3 font-normal">Store</th>
                <th className="py-2 pr-3 font-normal tabular">Jobs this week</th>
                <th className="py-2 pr-3 font-normal tabular">Stars this week</th>
                <th className="py-2 pr-3 font-normal tabular">Period stars</th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ f, assigned, weekJobs, weekStars, totalStars }) => (
                <tr key={f.id} className={weekStars === 0 ? "text-subtle" : ""}>
                  <td className="py-2 pr-3">
                    <span className="font-medium">{f.nickname}</span>
                    <span className="ml-2 text-subtle">
                      {f.firstName} {f.lastName}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{storeLabel(f.store)}</td>
                  <td className="py-2 pr-3 tabular">
                    {weekJobs} / {assigned}
                  </td>
                  <td className="py-2 pr-3 tabular">{weekStars}</td>
                  <td className="py-2 pr-3 tabular">{totalStars}</td>
                  <td className="py-2 text-right">
                    {totalStars > 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={reset.isPending}
                        onClick={() => {
                          if (!window.confirm(`Reset ${f.nickname} to zero stars? Belt purchases go too.`)) return;
                          reset.mutate(
                            { slug: board.circuit.slug, fighterId: f.id, pin: pinOf() },
                            {
                              onSuccess: () => toast.success(`${f.nickname} is back to zero.`),
                              onError: (e) => toast.error(e.message),
                            },
                          );
                        }}
                      >
                        Reset stars
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-subtle">No jobs checked off yet. Stars print here as lockers tap them.</p>
      )}
    </RingCard>
  );
}

function JobsDesk({ board }: { board: BoardPayload }) {
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [stars, setStars] = useState("1");
  const [pack, setPack] = useState<"sales" | "ops" | "kind">("ops");
  const add = useBoardMutation((d: Parameters<typeof addFloorJob>[0]["data"]) => addFloorJob({ data: d }));
  const drop = useBoardMutation((d: Parameters<typeof removeFloorJob>[0]["data"]) => removeFloorJob({ data: d }));
  const catalog = board.jobCatalog ?? [];
  const groups: Array<"sales" | "ops" | "kind"> = ["sales", "ops", "kind"];
  const labels = { sales: "Sales", ops: "House", kind: "Team" } as const;

  return (
    <div className="mt-8 space-y-8">
    <StarBoard board={board} />
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(
            { slug: board.circuit.slug, pin: pinOf(), title, blurb, stars: Number(stars) || 1, pack },
            {
              onSuccess: () => {
                setTitle("");
                setBlurb("");
                toast.success("Job is in the pool. Next deal can pull it.");
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      >
        <p className="kicker">Add a job</p>
        <h2 className="font-display text-3xl italic">The pool stays open</h2>
        <p className="text-sm text-muted">
          Each person gets five random jobs every week: one sales, one house, one team, and two
          wild cards. All five count. Add anything you want in the mix.
        </p>
        <div>
          <Label htmlFor="job-title">Job</Label>
          <Input id="job-title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="job-blurb">What good looks like</Label>
          <Textarea id="job-blurb" className="mt-1.5" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="job-stars">Stars</Label>
            <Input id="job-stars" className="mt-1.5" type="number" min={1} max={3} value={stars} onChange={(e) => setStars(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="job-pack">Pack</Label>
            <select
              id="job-pack"
              className="mt-1.5 h-11 w-full rounded-sm border border-line bg-raised px-3 text-sm"
              value={pack}
              onChange={(e) => setPack(e.target.value as "sales" | "ops" | "kind")}
            >
              <option value="sales">Sales</option>
              <option value="ops">House</option>
              <option value="kind">Team</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? "Adding…" : "Add to the pool"}
        </Button>
      </form>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <p className="kicker">{labels[g]}</p>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
              {catalog
                .filter((j) => j.pack === g && j.live)
                .map((j) => (
                  <li key={j.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg italic leading-tight">{j.title}</p>
                      {j.blurb ? <p className="mt-1 text-sm text-muted">{j.blurb}</p> : null}
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-subtle">
                        {j.stars} star{j.stars === 1 ? "" : "s"}
                        {j.custom ? " · yours" : ""}
                      </p>
                    </div>
                    {j.custom ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={drop.isPending}
                        onClick={() =>
                          drop.mutate(
                            { slug: board.circuit.slug, pin: pinOf(), jobId: j.id },
                            {
                              onSuccess: () => toast.success("Pulled from the pool."),
                              onError: (err) => toast.error(err.message),
                            },
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}



function HouseDesk({ board, unlocked }: { board: BoardPayload; unlocked: boolean }) {
  const week = board.circuit.currentWeek;
  const live = (board.challenges ?? []).find((c) => c.weekNumber === week);
  const call = (board.houseCalls ?? []).find((c) => c.weekNumber === week);
  const [title, setTitle] = useState(live?.title ?? "");
  const [blurb, setBlurb] = useState(live?.blurb ?? "");
  const [faceId, setFaceId] = useState(call?.faceId ?? "");
  const [heelId, setHeelId] = useState(call?.heelId ?? "");
  const post = useBoardMutation((d: Parameters<typeof postChallenge>[0]["data"]) => postChallenge({ data: d }));
  const callSave = useBoardMutation((d: Parameters<typeof saveHouseCall>[0]["data"]) => saveHouseCall({ data: d }));
  const book = onTheBook(board.fighters);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          post.mutate(
            { slug: board.circuit.slug, title, blurb, pin: pinOf() },
            {
              onSuccess: () => toast.success("Challenge is up."),
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      >
        <p className="kicker">This week’s challenge</p>
        <h2 className="mt-1 font-display text-3xl italic">Drop one extra job</h2>
        <p className="text-sm text-muted">
          First three lockers to mark it get the desk stamp. Not for sale.
        </p>
        <Field label="The job" value={title} onChange={setTitle} />
        <div>
          <Label>Note</Label>
          <Textarea className="mt-1.5" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </div>
        <Button type="submit" disabled={post.isPending || !unlocked || !title.trim()}>
          {post.isPending ? "Posting…" : unlocked ? "Post the challenge" : "Unlock first"}
        </Button>
        {live ? (
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {live.claims.length ? live.claims.map((c) => {
              const f = board.fighters.find((x) => x.id === c.fighterId);
              return <li key={c.fighterId}>{f?.nickname ?? "Claimed"}</li>;
            }) : <li>Nobody has claimed it yet.</li>}
          </ul>
        ) : null}
      </form>

      <form
        className="space-y-3 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          callSave.mutate(
            { slug: board.circuit.slug, faceId, heelId, pin: pinOf() },
            {
              onSuccess: () => toast.success("Face and heel are set."),
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      >
        <p className="kicker">House call</p>
        <h2 className="mt-1 font-display text-3xl italic">Babyface and heel</h2>
        <p className="text-sm text-muted">You pick. They wear a sash all week.</p>
        <div>
          <Label htmlFor="face">Babyface · most helpful</Label>
          <select
            id="face"
            className="mt-1.5 flex h-11 w-full rounded-sm border border-line bg-raised px-3 text-sm"
            value={faceId}
            onChange={(e) => setFaceId(e.target.value)}
          >
            <option value="">Nobody</option>
            {book.map((f) => (
              <option key={f.id} value={f.id}>{f.nickname}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="heel">Heel · biggest closer</Label>
          <select
            id="heel"
            className="mt-1.5 flex h-11 w-full rounded-sm border border-line bg-raised px-3 text-sm"
            value={heelId}
            onChange={(e) => setHeelId(e.target.value)}
          >
            <option value="">Nobody</option>
            {book.map((f) => (
              <option key={f.id} value={f.id}>{f.nickname}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={callSave.isPending || !unlocked}>
          {callSave.isPending ? "Saving…" : unlocked ? "Lock the call" : "Unlock first"}
        </Button>
      </form>
    </div>
  );
}
