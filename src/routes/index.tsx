import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { HonorCard, RankChip } from "@/components/board/heat";
import { MonoMark, BracketChip } from "@/components/board/pieces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionshipPlate, FighterPoster, RingCard, Ticket } from "@/components/arena/ring";
import { plateClasses } from "@/components/board/nameplate";
import { mvpWeeksOf, titanOn } from "@/components/board/titantron";
import { WeeklyTape } from "@/components/board/weekly-tape";
import { fighterById, onTheBook, useBoard, useHeat } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: board, isPending, error } = useBoard();
  const heat = useHeat(board);

  if (isPending) {
    return (
      <Shell>
        <div className="h-80 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  if (error || !board) {
    return (
      <Shell>
        <p className="text-rose">{error?.message ?? "Could not load the circuit."}</p>
      </Shell>
    );
  }

  const { circuit } = board;
  const latest = board.gazette[0];
  const week = board.weeks.find((w) => w.weekNumber === circuit.currentWeek);
  const boutCount = board.matchups.filter((m) => m.weekNumber === circuit.currentWeek).length;
  const ticket =
    circuit.status === "setup" ? "Preseason" : circuit.status === "complete" ? "Final bell" : "Tonight";
  const honorWeek = heat?.latestHonors[0]?.weekNumber;

  return (
    <Shell>
      <section className="relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-poster)]">
        <img src="/hero.jpg" alt="" className="absolute inset-0 size-full object-cover object-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/15" />
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-lg ring-1 ring-bone/35" />
        <span aria-hidden className="pointer-events-none absolute inset-5 hidden rounded-md ring-1 ring-bone/15 sm:block" />
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 size-2.5 bg-bone/85" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 size-2.5 bg-bone/85" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 size-2.5 bg-bone/85" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 size-2.5 bg-bone/85" />
        <div className="relative px-5 py-14 sm:px-12 sm:py-20">
          <img
            src="/waterman.jpg"
            alt="Waterman Arch Supports"
            className="mb-7 h-10 w-auto max-w-[200px] object-contain object-left sm:h-12"
          />
          <Ticket>
            {ticket} · {circuit.periodLabel} · {onTheBook(board.fighters).length} signed
          </Ticket>
          <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-bone">Waterman sales circuit</p>
          <h1 className="mt-2 max-w-3xl font-display text-6xl italic leading-[0.88] sm:text-8xl">
            Period 10
            <span className="block">Rumble</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-fg/85 sm:text-base">
            Four weeks. Three floors. One locker room for every store. Your passcode opens your card
            and the weekly academy. Pass the quiz for +1. Week four is a finals rumble on each
            floor. One belt per card.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="bone">
              Week {circuit.currentWeek} of {circuit.weeks}
            </Badge>
            <Badge>{circuit.status}</Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
          </div>
          <div className="mt-9 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to="/score">Open my locker</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/how">How this works</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/desk">Commissioner desk</Link>
            </Button>
            {circuit.status === "complete" || circuit.currentWeek >= circuit.weeks ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/ceremony">Ceremony</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <ChampionshipPlate tone="amber" label="Floor 1 · Main Event" value={circuit.prizeMain} hint="Stay in the title picture" />
        <ChampionshipPlate tone="steel" label="Floor 2 · Redemption" value={circuit.prizeRedemption} hint="One loss. Still alive." />
        <ChampionshipPlate tone="rose" label="Floor 3 · Royal Rumble" value={circuit.prizeRumble} hint="Last card standing" />
      </section>

      <div className="mt-8">
        <WeeklyTape board={board} />
      </div>

      {heat && heat.latestHonors.length > 0 ? (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Week {honorWeek} · Automatic</p>
              <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">This week’s hardware</h2>
            </div>
            <Link to="/honors" className="shrink-0 text-sm text-bone hover:text-fg">
              Full heat board
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heat.latestHonors.slice(0, 3).map((h) => {
              const f = fighterById(board, h.fighterId);
              return (
                <HonorCard
                  key={`${h.kind}-${h.fighterId}`}
                  honor={h}
                  nickname={f?.nickname ?? "Unknown"}
                  slug={circuit.slug}
                  fighterId={h.fighterId}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {circuit.status === "setup" ? (
              <>
                <p className="kicker">The locker · {onTheBook(board.fighters).length} signed</p>
                <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Meet the card</h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Week 1 is not open. Add new hires from the desk any time. When the bell rings, the
                  pairings write themselves.
                </p>
              </>
            ) : (
              <>
                <p className="kicker">
                  Week {circuit.currentWeek} · {boutCount} bout{boutCount === 1 ? "" : "s"}
                </p>
                <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Who is wrestling</h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Records, hometowns, and the one fact that already follows them down the aisle.
                </p>
              </>
            )}
          </div>
          <Link
            to={circuit.status === "setup" ? "/roster" : "/bouts"}
            className="shrink-0 text-sm text-bone hover:text-fg"
          >
            {circuit.status === "setup" ? "Full locker" : "All write-ups"}
          </Link>
        </div>
        {circuit.status === "setup" ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {board.fighters
              .slice()
              .sort((a, b) => a.lastName.localeCompare(b.lastName))
              .map((f) => (
                <li key={f.id}>
                  <Link to="/fighter/$id" params={{ id: f.id }} search={{ slug: circuit.slug }} className="block">
                    <FighterPoster
                      nickname={f.nickname}
                      name={`${f.firstName} ${f.lastName}`}
                      hometown={f.hometown} store={f.store} walkout={f.walkout}
                      seed={f.seed}
                      fact={f.hypeLine || f.funFact}
                      plateMark={f.plateMark}
                      plateSticker={f.plateSticker} titanWeeks={titanOn(f.plateFx, mvpWeeksOf(heat?.honors, f.id).length > 0) ? mvpWeeksOf(heat?.honors, f.id) : []}
                      className={plateClasses(f)}
                      mark={<MonoMark first={f.firstName} last={f.lastName} photo={f.photoUrl} />}
                    />
                  </Link>
                </li>
              ))}
          </ul>
        ) : (
          <BoutList board={board} week={circuit.currentWeek} />
        )}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="kicker">Period to date</p>
          <h2 className="mb-4 mt-2 font-display text-4xl italic">Standings</h2>
          <RingCard className="p-0 sm:p-0">
            <ol className="divide-y divide-line">
              {board.standings.slice(0, 10).map((s, i) => {
                const f = fighterById(board, s.fighterId);
                const h = heat?.byId[s.fighterId];
                if (!f) return null;
                return (
                  <li key={s.fighterId} className="flex min-w-0 items-center gap-2 px-4 py-3.5">
                    <span className="tabular w-7 font-display text-lg italic text-subtle">{i + 1}</span>
                    <Link
                      to="/fighter/$id"
                      params={{ id: f.id }}
                      search={{ slug: circuit.slug }}
                      className="min-w-0 flex-1 truncate font-display text-lg italic"
                    >
                      {f.nickname}
                      <span className="font-sans not-italic text-muted">
                        {" "}
                        · {formatRecord(recordOf(f.id, board.placements))}
                        {h ? ` · heat ${h.heat}` : ""}
                      </span>
                    </Link>
                    <BracketChip id={s.currentBracket} compact />
                    <span className="tabular text-sm">{s.totalPoints}</span>
                  </li>
                );
              })}
            </ol>
          </RingCard>
        </div>
        {latest ? (
          <RingCard>
            <p className="kicker">The Floor Gazette</p>
            <h2 className="mt-3 font-display text-3xl italic leading-tight">{latest.headline}</h2>
            <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-muted">{latest.body}</p>
            <Link to="/report" className="mt-5 inline-block text-sm text-bone hover:text-fg">
              Read the gazette
            </Link>
          </RingCard>
        ) : (
          <RingCard className="relative min-h-64 overflow-hidden">
            <img src="/locker.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
            <div className="relative">
              <p className="kicker">The Floor Gazette</p>
              <h2 className="mt-3 max-w-sm font-display text-3xl italic leading-tight">
                The first issue prints when week 1 opens.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-muted">
                Pairings, hometowns, and the one fact that walks out with them.
              </p>
            </div>
          </RingCard>
        )}
      </section>

      {heat && heat.ranked.some((r) => r.heat > 0) ? (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Crowd temperature</p>
              <h2 className="mt-2 font-display text-4xl italic">Hottest on the card</h2>
            </div>
            <Link to="/honors" className="shrink-0 text-sm text-bone hover:text-fg">
              Heat board
            </Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {heat.ranked.slice(0, 5).map((row, i) => {
              const f = fighterById(board, row.fighterId);
              if (!f) return null;
              return (
                <li key={row.fighterId}>
                  <Link to="/fighter/$id" params={{ id: f.id }} search={{ slug: circuit.slug }} className="block">
                    <RingCard>
                      <p className="tabular text-xs tracking-[0.16em] text-subtle">{String(i + 1).padStart(2, "0")}</p>
                      <p className="mt-2 truncate font-display text-2xl italic">{f.nickname}</p>
                      <div className="mt-2">
                        <RankChip rank={row.rank} />
                      </div>
                      <p className="mt-3 font-display text-3xl italic tabular">{row.heat}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">Heat</p>
                    </RingCard>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="mt-14">
        <RingCard className="p-5 sm:p-8">
          <p className="kicker">How the ring works</p>
          <h2 className="mt-2 font-display text-4xl italic">Four weeks. Three floors. Automatic.</h2>
          <ol className="mt-6 grid gap-6 text-sm text-muted sm:grid-cols-2">
            <li>
              <span className="kicker text-fg">01 · Seed</span>
              <p className="mt-2">
                Fill the order yourself, or rank them from last period. No roster cap — new hires join
                the rumble if they arrive after the bell.
              </p>
            </li>
            <li>
              <span className="kicker text-fg">02 · Pair</span>
              <p className="mt-2">
                Highest remaining seed against lowest. Odd person out gets the bye. Week four turns
                each floor into a rumble — highest card wins the belt.
              </p>
            </li>
            <li>
              <span className="kicker text-fg">03 · Score</span>
              <p className="mt-2">
                Green 3, Blue 2, Orange 1, Red 0. Each extra green after the first is +1. Every metric
                green is an automatic win. Reviews +1 each, three max. Your passcode marks your card.
              </p>
            </li>
            <li>
              <span className="kicker text-fg">04 · Lock</span>
              <p className="mt-2">
                The commissioner locks the week. Scores freeze. Winners stay. Losers drop. The gazette
                writes itself.{" "}
                <Link to="/how" className="text-bone hover:text-fg">
                  Full walkthrough
                </Link>
                .
              </p>
            </li>
          </ol>
        </RingCard>
      </section>
    </Shell>
  );
}