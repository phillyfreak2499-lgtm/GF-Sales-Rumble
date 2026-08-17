import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { BracketChip, FloorLine, MetricPips, Seed } from "@/components/board/pieces";
import { PhotoField } from "@/components/board/photo-field";
import { LockerEdit } from "@/components/board/locker-edit";
import { Academy, AcademyStrip } from "@/components/board/academy";
import { BadgeRack, ChaseNote, HeatBar, RankChip, StreakLine } from "@/components/board/heat";
import { FloorWorkList, StarBelt } from "@/components/board/floor-work";
import { PlateMark, PlateSticker, plateClasses } from "@/components/board/nameplate";
import { mvpWeeksOf, titanOn, TitantronChrome } from "@/components/board/titantron";
import { FoundChrome, foundOn, HouseSash } from "@/components/board/house-sash";
import { roleOf } from "@/lib/circuit/house";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { RingCard, Ticket } from "@/components/arena/ring";
import { useBoard, useHeat, standingOf } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { socksTieIds } from "@/lib/circuit/seed-week";
import { RANK_BLURB } from "@/lib/circuit/heat";
import { beltOf } from "@/lib/circuit/floor-work";
import { pickStarCount } from "@/lib/circuit/crowd";
import { awardedBonus } from "@/lib/circuit/training";
import { writeLockerPass } from "@/lib/circuit/locker-session";
import { lookupClaim } from "@/lib/server/circuit";
import { normalizePasscode } from "@/lib/circuit/passcode";
import { cn } from "@/lib/utils";
import { z } from "zod";

const search = z.object({ slug: z.string().optional() });

export const Route = createFileRoute("/fighter/$id")({
  validateSearch: search,
  component: FighterPage,
});

function FighterPage() {
  const { id } = Route.useParams();
  const { slug } = Route.useSearch();
  const { data: board, isPending } = useBoard(slug);
  const heatBoard = useHeat(board);
  const [code, setCode] = useState("");
  const [mine, setMine] = useState("");
  const [looking, setLooking] = useState(false);
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const f = board.fighters.find((x) => x.id === id);
  if (!f) {
    return (
      <Shell>
        <p className="text-muted">Not on this locker room.</p>
      </Shell>
    );
  }
  const s = standingOf(board, f.id);
  const rec = recordOf(f.id, board.placements);
  const h = heatBoard?.byId[f.id];
  const mvpWeeks = mvpWeeksOf(heatBoard?.honors, f.id);
  const showTitan = titanOn(f.plateFx, mvpWeeks.length > 0);
  const bank = beltOf(f.id, board.floorWork, board.beltItems, pickStarCount(f.id, board.picks ?? [], board.matchups));
  const history = board.weeks.map((w) => {
    const score = board.scores.find((x) => x.fighterId === f.id && x.weekNumber === w.weekNumber);
    const match = board.matchups.find((m) => m.weekNumber === w.weekNumber && m.fighterIds.includes(f.id));
    const place = board.placements.find((p) => p.fighterId === f.id && p.weekNumber === w.weekNumber);
    return { w, score, match, place };
  });

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/roster" className="kicker text-subtle hover:text-fg">
          Locker room
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to="/print/$id" params={{ id: f.id }}>
            <Printer className="size-4" /> Print locker
          </Link>
        </Button>
      </div>

      <section className={cn("relative mt-4 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-poster)]", showTitan && "titantron", foundOn(f.plateFx, true) && "found-plate", plateClasses(f))}>
        <HouseSash role={roleOf(board.houseCalls, f.id, board.circuit.currentWeek)} />
        {foundOn(f.plateFx, true) ? <FoundChrome /> : null}
        {showTitan ? <TitantronChrome weeks={mvpWeeks} /> : null}
        <PlateSticker id={f.plateSticker} />
        <img src="/locker.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-lg ring-1 ring-bone/30" />
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 size-2.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 size-2.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 size-2.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 size-2.5 bg-bone/80" />
        <div className={cn("relative px-5 py-10 sm:px-10 sm:py-14", f.plateSticker && "pb-20")}>
          <div className="flex flex-wrap items-start gap-4">
            <PhotoField
              fighter={f}
              slug={board.circuit.slug}
              markClassName="size-16 text-lg"
              locked={!mine}
              passcode={mine || undefined}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Seed n={f.seed} />
                {s ? <BracketChip id={s.currentBracket} /> : null}
                {h ? <RankChip rank={h.rank} /> : null}
                {f.hometown ? <Ticket>{f.hometown}</Ticket> : null}
              </div>
              {s ? <div className="mt-2 max-w-md"><FloorLine id={s.currentBracket} /></div> : null}
              <h1 className="mt-3 font-display text-5xl italic leading-[0.9] sm:text-7xl"><PlateMark mark={f.plateMark} className="mr-2 text-4xl sm:text-5xl" />{f.nickname}</h1>
              <p className="mt-3 text-muted">
                {f.firstName} {f.lastName}
              </p>
              <div className="mt-3"><StarBelt earned={bank.earned} bank={mine ? bank.bank : undefined} /></div>{h ? <div className="mt-2"><StreakLine heat={h} /></div> : null}
            </div>
          </div>
          {f.hypeLine ? <p className="mt-6 max-w-xl text-lg text-fg">{f.hypeLine}</p> : null}
          {f.backstory ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{f.backstory}</p> : null}
          {f.funFact ? (
            <p className="mt-4 max-w-xl text-sm text-bone">
              <span className="text-xs uppercase tracking-[0.14em] text-subtle">Fun fact · </span>
              {f.funFact}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        {mine ? (
          <div className="space-y-8">
            <LockerEdit fighter={f} slug={board.circuit.slug} passcode={mine} needSocks={socksTieIds(board).has(f.id)} />
            <Academy
              board={board}
              fighterId={f.id}
              passcode={mine}
              onBoard={() => undefined}
            />
          </div>
        ) : (
          <RingCard className="p-5">
            <p className="kicker">This is my locker</p>
            <h2 className="mt-2 font-display text-2xl italic">Enter your passcode</h2>
            <p className="mt-1 text-sm text-muted">
              Update hometown, fun fact, and photo. Get the code from the commissioner desk.
            </p>
            <form
              className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setLooking(true);
                try {
                  const res = await lookupClaim({ data: { code } });
                  if (!res || res.fighter.id !== f.id) {
                    toast.error("That passcode is not for this locker.");
                    return;
                  }
                  setMine(normalizePasscode(code));
                  writeLockerPass(normalizePasscode(code));
                  toast.success("Locker unlocked.");
                } finally {
                  setLooking(false);
                }
              }}
            >
              <div className="flex-1">
                <Label htmlFor="me">Passcode</Label>
                <Input
                  id="me"
                  className="mt-1.5 uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BELL-47"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={looking || !code.trim()}>
                {looking ? "Checking…" : "Unlock"}
              </Button>
            </form>
          </RingCard>
        )}
      </section>

      <div className="mt-6">
        <AcademyStrip academy={board.academy} fighterId={f.id} currentWeek={board.circuit.currentWeek} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Record" value={formatRecord(rec)} />
        <Stat label="Period pts" value={String(s?.totalPoints ?? 0)} />
        <Stat label="Heat" value={String(h?.heat ?? 0)} />
        <Stat label="Plates" value={String(h?.badges.length ?? 0)} />
      </dl>

      {h ? (
        <section className="mt-8 grid gap-3 lg:grid-cols-2">
          <RingCard>
            <HeatBar value={h.heat} />
            <p className="mt-3 text-sm text-muted">{RANK_BLURB[h.rank]}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-subtle">
              {h.xp} xp · level {h.level}
              {h.nextLevelXp ? ` · next rank at ${h.nextLevelXp}` : ""}
            </p>
            <div className="mt-5">
              <ChaseNote heat={h} />
            </div>
          </RingCard>
          <RingCard>
            <p className="kicker">Week {board.circuit.currentWeek} · floor jobs</p>
            <h2 className="mt-2 mb-4 font-display text-2xl italic">This week’s work</h2>
            <FloorWorkList board={board} fighterId={f.id} passcode={mine || undefined} />
          </RingCard>
        </section>
      ) : null}

      {h && h.badges.length > 0 ? (
        <section className="mt-8">
          <p className="kicker">Hardware</p>
          <h2 className="mt-2 mb-4 font-display text-3xl italic">On the wall</h2>
          <BadgeRack ids={h.badges} />
        </section>
      ) : null}

      <h2 className="mt-12 font-display text-3xl italic">Weeks</h2>
      <ol className="mt-4 space-y-3">
        {history.map(({ w, score, match, place }) => (
          <li key={w.weekNumber}>
            <RingCard>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg italic">Week {w.weekNumber}</span>
                <Badge>{w.status}</Badge>
                {place ? <Badge tone="bone">{place.result}</Badge> : null}
                {match ? (
                  <span className="text-xs uppercase tracking-[0.12em] text-subtle">{match.bracket}</span>
                ) : null}
              </div>
              {score ? (
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <MetricPips statuses={score.statuses} />
                  <span className="tabular">
                    {scorecard(score.statuses, score.reviews, score.trainingBonus).points} pts
                  </span>
                  {score.trainingBonus ? (
                    <span className="text-xs uppercase tracking-[0.12em] text-sage">Academy</span>
                  ) : null}
                  {score.notes ? <span className="text-muted">{score.notes}</span> : null}
                </div>
              ) : awardedBonus(board.academy, f.id, w.weekNumber) ? (
                <p className="mt-2 text-sm text-sage">Academy +1 · no card posted</p>
              ) : (
                <p className="mt-2 text-sm text-subtle">No card</p>
              )}
              {match && match.kind === "singles" ? (
                <p className="mt-2 text-sm text-muted">
                  vs{" "}
                  {match.fighterIds
                    .filter((x) => x !== f.id)
                    .map((oid) => board.fighters.find((p) => p.id === oid)?.nickname)
                    .join(", ")}
                </p>
              ) : null}
            </RingCard>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <RingCard className="px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-subtle">{label}</dt>
      <dd className="mt-1 font-display text-2xl italic tabular">{value}</dd>
    </RingCard>
  );
}