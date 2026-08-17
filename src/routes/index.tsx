import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { MonoMark } from "@/components/board/pieces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionshipPlate, FighterPoster, RingCard, Ticket } from "@/components/arena/ring";
import { fighterById, useBoard } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: board, isPending, error } = useBoard();

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
            {ticket} · {circuit.periodLabel} · {board.fighters.length} signed
          </Ticket>
          <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-bone">Waterman sales circuit</p>
          <h1 className="mt-2 max-w-3xl font-display text-6xl italic leading-[0.88] sm:text-8xl">
            Period 10
            <span className="block">Rumble</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-fg/85 sm:text-base">
            Five weeks. Three floors. One locker for every store. The floor marks the scores — no
            password. The commissioner locks the week. The rest of the rumble runs itself.
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
              <Link to="/score">Mark the scoresheet</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/bouts">Read the bouts</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/desk">Commissioner desk</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <ChampionshipPlate label="Main Event" value={circuit.prizeMain} hint="Stay in the title picture" />
        <ChampionshipPlate label="Redemption" value={circuit.prizeRedemption} hint="One loss. Still alive." />
        <ChampionshipPlate label="Royal Rumble" value={circuit.prizeRumble} hint="Last card standing" />
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {circuit.status === "setup" ? (
              <>
                <p className="kicker">The locker · {board.fighters.length} signed</p>
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
                      hometown={f.hometown}
                      seed={f.seed}
                      fact={f.hypeLine || f.funFact}
                      mark={<MonoMark first={f.firstName} last={f.lastName} />}
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
                if (!f) return null;
                return (
                  <li key={s.fighterId} className="flex items-center gap-3 px-4 py-3.5">
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
                        {f.hometown ? ` · ${f.hometown}` : ""}
                      </span>
                    </Link>
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
                No issue yet. The first preview prints when week 1 opens.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-muted">
                Pairings, hometowns, and the one fact that walks out with them.
              </p>
            </div>
          </RingCard>
        )}
      </section>

      <section className="mt-14">
        <RingCard className="p-5 sm:p-8">
          <p className="kicker">How the ring works</p>
          <h2 className="mt-2 font-display text-4xl italic">Five weeks. Three floors. Automatic.</h2>
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
                Highest remaining seed against lowest. Odd person out gets the bye. Rumble is a
                free-for-all.
              </p>
            </li>
            <li>
              <span className="kicker text-fg">03 · Score</span>
              <p className="mt-2">
                Green 3, Blue 2, Orange 1, Red 0. Each extra green after the first is +1. Every metric
                green is an automatic win. Reviews +1 each, three max. Any store can mark the sheet.
              </p>
            </li>
            <li>
              <span className="kicker text-fg">04 · Drop</span>
              <p className="mt-2">
                A loss in Main Event goes to Redemption. A loss there goes to the Royal Rumble. The
                commissioner locks the week so cards cannot change. Final week crowns each floor.
              </p>
            </li>
          </ol>
        </RingCard>
      </section>
    </Shell>
  );
}
