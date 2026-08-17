import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { ScorePad } from "@/components/board/score-pad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MonoMark, Seed } from "@/components/board/pieces";
import {
  addFighter,
  addFightersBulk,
  finalizeWeek,
  lockWeek,
  removeFighter,
  resetDemo,
  rewriteStory,
  rollRemaining,
  saveSeeds,
  seedFromPrior,
  startCircuit,
  submitScore,
  updateFighter,
  updateSettings,
} from "@/lib/server/circuit";
import { useBoard, useBoardMutation } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { SCORE_BLURB } from "@/lib/circuit/types";
import { deskUnlocked, readDeskPin, writeDeskPin, clearDeskPin } from "@/lib/circuit/desk-pin";
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
  const [tab, setTab] = useState<"week" | "roster" | "seeds" | "settings">("week");
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(() => deskUnlocked());

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-subtle">Commissioner desk</p>
          <h1 className="mt-1 font-display text-4xl">{circuit.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="bone">
              Week {circuit.currentWeek}/{circuit.weeks}
            </Badge>
            <Badge>{circuit.status}</Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
            <Badge>Join {circuit.joinCode}</Badge>
            <Badge>{board.fighters.length} on the book</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <form
        className="mt-6 flex max-w-lg flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          writeDeskPin(pin);
          if (deskUnlocked(pin)) {
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
        Scores on the sheet do not need this password. Locking a week, adding people, seeding, and
        advancing do.
      </p>

      {!authPending && !user && !circuit.isDemo ? (
        <p className="mt-6 text-sm text-muted">
          Sign in to run your own circuit, or use the commissioner password on this desk.
        </p>
      ) : null}

      <div className="mt-8 flex gap-2">
        {(["week", "roster", "seeds", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-10 rounded-sm border px-4 text-sm capitalize ${
              tab === t ? "border-bone bg-bone/10" : "border-line text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "week" ? <WeekDesk board={board} canClose={canClose} /> : null}
      {tab === "roster" ? <RosterDesk board={board} /> : null}
      {tab === "seeds" ? <SeedsDesk board={board} /> : null}
      {tab === "settings" ? <SettingsDesk board={board} /> : null}
    </Shell>
  );
}

function WeekDesk({ board, canClose }: { board: BoardPayload; canClose: boolean }) {
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
      <div className="flex flex-wrap gap-2">
        {circuit.status === "setup" ? (
          <Button
            onClick={() =>
              start.mutate(undefined, {
                onSuccess: () => toast.success("Circuit is live. Week 1 is open."),
                onError: (e) => toast.error(e.message),
              })
            }
            disabled={start.isPending}
          >
            Seed and open week 1
          </Button>
        ) : null}
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
          const card = s ? scorecard(s.statuses, s.reviews) : null;
          return (
            <li key={id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Seed n={f.seed} />
                <span className="min-w-0 flex-1 truncate font-medium">{f.nickname}</span>
                <span className="text-xs text-subtle">{f.claimCode}</span>
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
                    disabled={week?.status !== "open"}
                    pending={save.isPending}
                    onSubmit={(d) => {
                      save.mutate(
                        {
                          slug: circuit.slug,
                          fighterId: id,
                          weekNumber: circuit.currentWeek,
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

function RosterDesk({ board }: { board: BoardPayload }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [nick, setNick] = useState("");
  const [hometown, setHometown] = useState("");
  const [funFact, setFunFact] = useState("");
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
          .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
          .map((f) => (
            <FighterAdminRow
              key={f.id}
              fighter={f}
              slug={board.circuit.slug}
              setup={board.circuit.status === "setup"}
              onRemove={() =>
                drop.mutate(
                  { slug: board.circuit.slug, fighterId: f.id, pin: pinOf() },
                  { onError: (e) => toast.error(e.message) },
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
  setup,
  onRemove,
}: {
  fighter: Fighter;
  slug: string;
  setup: boolean;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hometown, setHometown] = useState(fighter.hometown);
  const [funFact, setFunFact] = useState(fighter.funFact);
  const [seed, setSeed] = useState(fighter.seed ? String(fighter.seed) : "");
  const [story, setStory] = useState(fighter.backstory);
  const save = useBoardMutation((d: Parameters<typeof updateFighter>[0]["data"]) =>
    updateFighter({ data: d }),
  );
  const rewrite = useBoardMutation((d: Parameters<typeof rewriteStory>[0]["data"]) =>
    rewriteStory({ data: d }),
  );

  return (
    <li className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="flex items-center gap-3">
        <MonoMark first={fighter.firstName} last={fighter.lastName} className="size-9 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <Seed n={fighter.seed} /> {fighter.nickname}
          </p>
          <p className="truncate text-xs text-muted">
            {fighter.firstName} {fighter.lastName}
            {fighter.hometown ? ` · ${fighter.hometown}` : ""} · {fighter.claimCode}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Edit"}
        </Button>
        {setup ? (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
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
                  seed: seed ? Number(seed) : null,
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
          <Field label="Hometown" value={hometown} onChange={setHometown} />
          <Field label="Fun fact" value={funFact} onChange={setFunFact} />
          <Field label="Seed" value={seed} onChange={setSeed} />
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
              <MonoMark first={f.firstName} last={f.lastName} className="size-9 text-xs" />
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
