import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, LogOut, UserRound, BarChart3, Sparkles, Mic, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ScorePad } from "@/components/board/score-pad";
import { LockerEdit } from "@/components/board/locker-edit";
import { Academy, AcademyStrip } from "@/components/board/academy";
import { MatchupRow } from "@/components/board/matchup-row";
import { BadgeRack, ChaseNote, HeatBar, RankChip, StreakLine } from "@/components/board/heat";
import { FloorWorkList, StarBelt } from "@/components/board/floor-work";
import { BeltShop } from "@/components/board/belt-shop";
import { CrowdPanel } from "@/components/board/crowd-panel";
import { BellCard, FirstPinSplash } from "@/components/board/bell-card";
import { WinSplash, unseenWin } from "@/components/board/win-splash";
import { playDing } from "@/lib/circuit/arena-sfx";
import { mvpWeeksOf, titanOn, TitantronChrome, TitanUnlock } from "@/components/board/titantron";
import { FoundChrome, foundOn, HouseSash } from "@/components/board/house-sash";
import { ChallengeCard } from "@/components/board/challenge-card";
import { roleOf } from "@/lib/circuit/house";
import { plateClasses, PlateSticker } from "@/components/board/nameplate";
import { PlateMark } from "@/components/board/nameplate";
import { BracketChip, FloorLine, MetricPips, Seed } from "@/components/board/pieces";
import { RingCard, Ticket } from "@/components/arena/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submitScore } from "@/lib/server/circuit";
import type { BoardPayload } from "@/lib/server/circuit";
import { useBoardMutation, useHeat, standingOf } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { RANK_BLURB } from "@/lib/circuit/heat";
import { beltOf } from "@/lib/circuit/floor-work";
import { pickStarCount } from "@/lib/circuit/crowd";
import { socksTieIds } from "@/lib/circuit/seed-week";
import { scorecard } from "@/lib/circuit/engine";
import { awardedBonus } from "@/lib/circuit/training";
import { weekAcceptsScores, type Fighter } from "@/lib/circuit/types";
import { clearLockerPass } from "@/lib/circuit/locker-session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "academy" | "stats" | "card" | "locker" | "belt" | "crowd";

export function LockerHub({
  board,
  fighter,
  passcode,
  onBoard,
  onLeave,
}: {
  board: BoardPayload;
  fighter: Fighter;
  passcode: string;
  onBoard: (next: BoardPayload) => void;
  onLeave: () => void;
}) {
  const week = board.weeks.find((w) => w.weekNumber === board.circuit.currentWeek);
  const awarded = awardedBonus(board.academy, fighter.id, board.circuit.currentWeek) === 1;
  const [tab, setTab] = useState<Tab>(awarded ? "stats" : "academy");
  const [bellAway, setBellAway] = useState(false);
  const [firstPin, setFirstPin] = useState(false);
  const [titanHi, setTitanHi] = useState(false);
  const [winPop, setWinPop] = useState<ReturnType<typeof unseenWin>>(null);
  const heatBoard = useHeat(board);
  const standing = standingOf(board, fighter.id);
  const rec = recordOf(fighter.id, board.placements);
  const h = heatBoard?.byId[fighter.id];
  const mvpWeeks = mvpWeeksOf(heatBoard?.honors, fighter.id);
  const showTitan = titanOn(fighter.plateFx, mvpWeeks.length > 0);
  const showFound = foundOn(fighter.plateFx, standing?.currentBracket === "rumble" || fighter.plateFx === "found");
  const houseRole = roleOf(board.houseCalls, fighter.id, board.circuit.currentWeek);
  const bank = beltOf(fighter.id, board.floorWork, board.beltItems, pickStarCount(fighter.id, board.picks ?? [], board.matchups));
  const liveWeek = board.circuit.currentWeek;
  const existing = board.scores.find((s) => s.fighterId === fighter.id && s.weekNumber === liveWeek);
  const match = board.matchups.find((m) => m.weekNumber === liveWeek && m.fighterIds.includes(fighter.id));
  const save = useBoardMutation((d: Parameters<typeof submitScore>[0]["data"]) =>
    submitScore({ data: d }),
  );
  useEffect(() => {
    if (!mvpWeeks.length) return;
    const key = `titan-seen-${fighter.id}`;
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setTitanHi(true);
      }
    } catch {
      /* ignore */
    }
  }, [fighter.id, mvpWeeks.length]);
  useEffect(() => {
    const hit = unseenWin(fighter.id, board.placements);
    if (hit) setWinPop(hit);
  }, [fighter.id, board.placements]);

  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: "academy", label: "Academy", icon: BookOpen },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "card", label: "Card", icon: ClipboardList },
    { id: "locker", label: "Locker", icon: UserRound },
    { id: "crowd", label: "Crowd", icon: Mic },
    { id: "belt", label: "Belt", icon: Sparkles },
  ];

  return (
    <div className="mt-8 space-y-6">
      <ChallengeCard board={board} fighterId={fighter.id} passcode={passcode} onBoard={onBoard} />
      <RingCard className={cn("overflow-hidden p-5 sm:p-6", (fighter.plateSticker || showTitan) && "pb-16", showTitan && "titantron", plateClasses(fighter))}>
        {showTitan ? <TitantronChrome weeks={mvpWeeks} /> : null}
        {showFound ? <FoundChrome /> : null}
        <HouseSash role={houseRole} />
        <PlateSticker id={fighter.plateSticker} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker">
              {fighter.firstName} {fighter.lastName}
            </p>
            <h2 className="mt-1 font-display text-4xl italic leading-none"><PlateMark mark={fighter.plateMark} />{fighter.nickname}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Seed n={fighter.seed} />
              {standing ? <BracketChip id={standing.currentBracket} /> : null}
              {h ? <RankChip rank={h.rank} /> : null}
              {fighter.hometown ? <Ticket>{fighter.hometown}</Ticket> : null}
              <Badge tone="bone">
                Week {liveWeek}/{board.circuit.weeks}
              </Badge>
              {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
            </div>
            {standing ? (
              <div className="mt-3 max-w-md">
                <FloorLine id={standing.currentBracket} />
              </div>
            ) : null}
            <div className="mt-3">
              <StarBelt earned={bank.earned} bank={bank.bank} compact />
            </div>
            {h ? (
              <div className="mt-2">
                <StreakLine heat={h} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/print/$id" params={{ id: fighter.id }}>
                <Printer className="size-4" /> Print locker
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearLockerPass();
                onLeave();
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
        <div className="mt-5">
          <AcademyStrip academy={board.academy} fighterId={fighter.id} currentWeek={liveWeek} />
        </div>
      </RingCard>

      {!bellAway && match ? (
        <BellCard
          me={fighter}
          match={match}
          opponent={
            match.fighterIds.map((id) => board.fighters.find((x) => x.id === id)).find((x) => x && x.id !== fighter.id) ??
            null
          }
          onClose={() => setBellAway(true)}
        />
      ) : null}

      {winPop ? (
        <WinSplash
          fighter={fighter}
          weekNumber={winPop.weekNumber}
          champ={winPop.result === "champ"}
          onClose={() => setWinPop(null)}
        />
      ) : null}
      {firstPin ? <FirstPinSplash onClose={() => setFirstPin(false)} /> : null}
      {titanHi && !winPop ? <TitanUnlock weeks={mvpWeeks} onClose={() => setTitanHi(false)} /> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-sm border px-4 text-sm",
                on ? "border-bone bg-bone/15 text-fg" : "border-line text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "academy" ? (
        <Academy board={board} fighterId={fighter.id} passcode={passcode} onBoard={onBoard} />
      ) : null}

      {tab === "stats" ? (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Record" value={formatRecord(rec)} />
            <Stat label="Period pts" value={String(standing?.totalPoints ?? 0)} />
            <Stat label="Heat" value={String(h?.heat ?? 0)} />
            <Stat label="Plates" value={String(h?.badges.length ?? 0)} />
          </dl>
          <div className="grid gap-3 lg:grid-cols-2">
            {h ? (
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
            ) : (
              <RingCard>
                <p className="kicker">Heat</p>
                <p className="mt-2 font-display text-2xl italic">Prints when week 1 opens.</p>
              </RingCard>
            )}
            <RingCard>
              <p className="kicker">Week {liveWeek} · floor jobs</p>
              <h3 className="mt-2 mb-4 font-display text-2xl italic">This week’s work</h3>
              <FloorWorkList
                board={board}
                fighterId={fighter.id}
                passcode={passcode}
                onBoard={onBoard}
              />
            </RingCard>
          </div>
          {h && h.badges.length > 0 ? (
            <div>
              <p className="kicker">Hardware</p>
              <h3 className="mt-2 mb-4 font-display text-3xl italic">On the wall</h3>
              <BadgeRack ids={h.badges} />
            </div>
          ) : null}
          <div>
            <p className="kicker">Period</p>
            <h3 className="mt-2 mb-4 font-display text-3xl italic">Weeks</h3>
            <ol className="space-y-3">
              {board.weeks.map((w) => {
                const score = board.scores.find(
                  (x) => x.fighterId === fighter.id && x.weekNumber === w.weekNumber,
                );
                const place = board.placements.find(
                  (p) => p.fighterId === fighter.id && p.weekNumber === w.weekNumber,
                );
                const train = awardedBonus(board.academy, fighter.id, w.weekNumber);
                const card = score
                  ? scorecard(score.statuses, score.reviews, score.trainingBonus || train)
                  : train
                    ? scorecard([], 0, 1)
                    : null;
                return (
                  <li key={w.weekNumber}>
                    <RingCard>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg italic">Week {w.weekNumber}</span>
                        <Badge>{w.status}</Badge>
                        {place ? <Badge tone="bone">{place.result}</Badge> : null}
                        {train ? <Badge tone="sage">Academy +1</Badge> : null}
                      </div>
                      {card ? (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                          {score ? <MetricPips statuses={score.statuses} /> : null}
                          <span className="tabular">{card.points} pts</span>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-subtle">No card</p>
                      )}
                    </RingCard>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}

      {tab === "card" ? (
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <RingCard className="p-5 sm:p-7">
            <p className="kicker">Week {liveWeek}</p>
            <h3 className="mt-1 font-display text-3xl italic">Mark your card</h3>
            <div className="mt-6">
              <ScorePad
                key={fighter.id + (existing?.id ?? "new")}
                metrics={board.metrics}
                initialStatuses={existing?.statuses}
                initialReviews={existing?.reviews}
                initialNotes={existing?.notes}
                trainingBonus={awarded ? 1 : 0}
                disabled={!weekAcceptsScores(week?.status ?? "")}
                pending={save.isPending}
                onSubmit={(d) => {
                  save.mutate(
                    {
                      claimCode: passcode,
                      weekNumber: liveWeek,
                      statuses: d.statuses,
                      reviews: d.reviews,
                      notes: d.notes,
                    },
                    {
                      onSuccess: (next) => {
                        const wasEmpty = !board.scores.some((s) => s.fighterId === fighter.id);
                        const advanced = next.circuit.currentWeek !== board.circuit.currentWeek;
                        toast.success(
                          advanced
                            ? `Card posted. Week ${board.circuit.currentWeek} is closed. Week ${next.circuit.currentWeek} is booked.`
                            : "Card posted.",
                        );
                        onBoard(next);
                        if (wasEmpty) {
                          setFirstPin(true);
                          playDing();
                        }
                        const hit = unseenWin(fighter.id, next.placements);
                        if (hit) setWinPop(hit);
                      },
                      onError: (err) => toast.error(err.message),
                    },
                  );
                }}
              />
            </div>
          </RingCard>
          <div className="space-y-6">
            {match ? (
              <div>
                <p className="mb-3 kicker">This week</p>
                <MatchupRow board={board} matchupId={match.id} />
              </div>
            ) : (
              <p className="text-sm text-muted">No matchup booked yet. You can still mark this week’s card.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "locker" ? (
        <LockerEdit fighter={fighter} slug={board.circuit.slug} passcode={passcode} onBoard={onBoard} needSocks={socksTieIds(board).has(fighter.id)} />
      ) : null}

      {tab === "crowd" ? (
        <CrowdPanel board={board} fighterId={fighter.id} passcode={passcode} onBoard={onBoard} />
      ) : null}

      {tab === "belt" ? (
        <BeltShop board={board} fighter={fighter} passcode={passcode} onBoard={onBoard} />
      ) : null}
    </div>
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
