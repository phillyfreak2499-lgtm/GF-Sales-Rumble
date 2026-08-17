import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import {
  BadgeRack,
  ChaseNote,
  HardwareMark,
  HeatBar,
  HonorCard,
  RankChip,
} from "@/components/board/heat";
import { FloorWorkList } from "@/components/board/floor-work";
import { MonoMark } from "@/components/board/pieces";
import { PageHead, RingCard } from "@/components/arena/ring";
import { RANK_BLURB, RANK_LABEL } from "@/lib/circuit/heat";
import { useBoard, useHeat } from "@/lib/use-board";
import { pickLeaders, storeStandings } from "@/lib/circuit/crowd";
import { callForWeek } from "@/lib/circuit/house";
import type { BoardPayload } from "@/lib/server/circuit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/honors")({ component: HonorsPage });

function HonorsPage() {
  const { data: board, isPending } = useBoard();
  const [picked, setPicked] = useState<string | null>(null);
  const heat = useHeat(board);
  if (isPending || !board || !heat) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const focusId = picked ?? heat.ranked[0]?.fighterId ?? null;
  const focusFighter = board.fighters.find((f) => f.id === focusId);
  const focusHeat = focusId ? heat.byId[focusId] : null;
  const honorWeek = heat.latestHonors[0]?.weekNumber ?? board.circuit.currentWeek;

  return (
    <Shell>
      <PageHead
        kicker="Heat · Hardware · Weekly honors"
        title="The heat"
        lede="Heat, ranks, and plates print themselves from the scoresheet. Nothing to enter. The locker chases the next plate. The building prints an MVP every week there is a card."
      />

      <HouseWeek board={board} />

      {heat.latestHonors.length > 0 ? (
        <section className="mt-10">
          <p className="kicker">Week {honorWeek} hardware</p>
          <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Printed this week</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heat.latestHonors.map((h) => {
              const f = board.fighters.find((x) => x.id === h.fighterId);
              return (
                <HonorCard
                  key={`${h.kind}-${h.fighterId}`}
                  honor={h}
                  nickname={f?.nickname ?? "Unknown"}
                  slug={board.circuit.slug}
                  fighterId={h.fighterId}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <RingCard className="mt-10">
          <p className="kicker">Weekly hardware</p>
          <h2 className="mt-2 font-display text-3xl italic">No plates this week yet</h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            MVP, Workhorse, Crowd Heat, Upset, and Closest Bout print as soon as the first cards land
            on the scoresheet.
          </p>
        </RingCard>
      )}

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="kicker">Locker heat</p>
          <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Who is over</h2>
          <p className="mt-2 text-sm text-muted">
            Heat is recent work: points, streaks, sweeps, reviews, and whether you are still on the
            main card. Tap a name to see their chase and week jobs.
          </p>
          <ol className="mt-5 divide-y divide-line rounded-xl bg-surface shadow-[var(--shadow-ring)]">
            {heat.ranked.map((row, i) => {
              const f = board.fighters.find((x) => x.id === row.fighterId);
              if (!f) return null;
              const on = row.fighterId === focusId;
              return (
                <li key={row.fighterId}>
                  <button
                    type="button"
                    onClick={() => setPicked(row.fighterId)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                      on ? "bg-raised" : "hover:bg-raised/60",
                    )}
                  >
                    <span className="tabular w-7 font-display text-lg italic text-subtle">{i + 1}</span>
                    <MonoMark first={f.firstName} last={f.lastName} photo={f.photoUrl} className="size-9 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg italic leading-tight">
                        {f.nickname}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2">
                        <RankChip rank={row.rank} />
                        <span className="text-[11px] uppercase tracking-[0.12em] text-subtle">
                          {row.badges.length} plate{row.badges.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </span>
                    <span className="w-12 shrink-0 text-right">
                      <span className="block font-display text-xl italic tabular leading-none">{row.heat}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-subtle">Heat</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="space-y-4">
          {focusFighter && focusHeat ? (
            <RingCard>
              <p className="kicker">Selected wrestler</p>
              <Link
                to="/fighter/$id"
                params={{ id: focusFighter.id }}
                search={{ slug: board.circuit.slug }}
                className="mt-2 block font-display text-4xl italic leading-[0.95] hover:text-bone"
              >
                {focusFighter.nickname}
              </Link>
              <p className="mt-2 text-sm text-muted">
                {focusFighter.firstName} {focusFighter.lastName}
                {focusFighter.hometown ? ` · ${focusFighter.hometown}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <RankChip rank={focusHeat.rank} />
                <span className="text-xs uppercase tracking-[0.14em] text-subtle">
                  {RANK_LABEL[focusHeat.rank]} · {RANK_BLURB[focusHeat.rank]}
                </span>
              </div>
              <div className="mt-5">
                <HeatBar value={focusHeat.heat} />
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-subtle">
                {focusHeat.xp} xp · level {focusHeat.level}
                {focusHeat.nextLevelXp ? ` · next ${focusHeat.nextLevelXp}` : ""}
                {focusHeat.winStreak > 0 ? ` · ${focusHeat.winStreak}-win streak` : ""}
              </p>
              <div className="mt-5">
                <ChaseNote heat={focusHeat} />
              </div>
              <div className="mt-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">Hardware</p>
                <BadgeRack ids={focusHeat.badges} />
              </div>
            </RingCard>
          ) : null}

          <RingCard>
            <p className="kicker">Week {board.circuit.currentWeek} · floor jobs</p>
            <h2 className="mt-2 font-display text-2xl italic">This week’s work</h2>
            <p className="mt-1 mb-4 text-sm text-muted">
              Four random floor jobs. Check them off in My locker for stars on the belt.
            </p>
            {focusId ? (
              <FloorWorkList board={board} fighterId={focusId} />
            ) : (
              <p className="text-sm text-subtle">Sign someone to the locker first.</p>
            )}
          </RingCard>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="kicker">Store heat</p>
          <h2 className="mt-2 font-display text-3xl italic">Who holds the door</h2>
          <ol className="mt-5 divide-y divide-line rounded-xl bg-surface">
            {storeStandings(board.fighters, board.standings, heat.byId).map((g, i) => (
              <li key={g.store} className="flex items-center gap-3 px-4 py-3">
                <span className="tabular w-7 font-display text-lg italic text-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl italic">{g.store}</span>
                  <span className="text-xs uppercase tracking-[0.12em] text-subtle">
                    {g.count} on the book
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl italic tabular">{g.points}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-subtle">pts</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="kicker">Pick ’em</p>
          <h2 className="mt-2 font-display text-3xl italic">The book</h2>
          <ol className="mt-5 divide-y divide-line rounded-xl bg-surface">
            {pickLeaders(board.fighters, board.picks ?? [], board.matchups).length ? (
              pickLeaders(board.fighters, board.picks ?? [], board.matchups)
                .slice(0, 8)
                .map((row, i) => (
                  <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="tabular w-7 font-display text-lg italic text-subtle">{i + 1}</span>
                    <span className="min-w-0 flex-1 font-display text-xl italic">{row.nickname}</span>
                    <span className="tabular text-sm text-muted">
                      {row.right}/{row.locked}
                    </span>
                  </li>
                ))
            ) : (
              <li className="px-4 py-6 text-sm text-muted">Picks print after the first week closes.</li>
            )}
          </ol>
        </div>
      </section>

      <section className="mt-14">
        <p className="kicker">The wall</p>
        <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Every plate</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Hardware unlocks from the scoresheet. No commissioner button. The selected wrestler’s
          earned plates sit lit.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {heat.catalog.map((badge) => (
            <li key={badge.id}>
              <HardwareMark badge={badge} earned={Boolean(focusHeat?.badges.includes(badge.id))} />
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}


function HouseWeek({ board }: { board: BoardPayload }) {
  const week = board.circuit.currentWeek;
  const call = callForWeek(board.houseCalls, week);
  const challenge = (board.challenges ?? []).find((c) => c.weekNumber === week);
  const face = board.fighters.find((f) => f.id === call?.faceId);
  const heel = board.fighters.find((f) => f.id === call?.heelId);
  if (!face && !heel && !challenge) return null;
  return (
    <section className="mt-10 grid gap-3 sm:grid-cols-3">
      {face ? (
        <div className="rounded-xl border border-bone/40 bg-bone/10 p-4">
          <p className="kicker">Babyface</p>
          <p className="mt-2 font-display text-2xl italic">{face.nickname}</p>
        </div>
      ) : null}
      {heel ? (
        <div className="rounded-xl border border-rose/40 bg-rose/10 p-4">
          <p className="kicker !text-rose">Heel</p>
          <p className="mt-2 font-display text-2xl italic">{heel.nickname}</p>
        </div>
      ) : null}
      {challenge ? (
        <div className="rounded-xl border border-amber/40 bg-amber/10 p-4">
          <p className="kicker !text-amber">Desk challenge</p>
          <p className="mt-2 font-display text-2xl italic">{challenge.title}</p>
          <p className="mt-1 text-sm text-muted">{challenge.claims.length}/3 claimed</p>
        </div>
      ) : null}
    </section>
  );
}
