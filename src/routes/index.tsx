import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { MonoMark, Seed } from "@/components/board/pieces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RingCard, Ticket } from "@/components/arena/ring";
import { fighterById, useBoard } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: board, isPending, error } = useBoard();

  if (isPending) {
    return (
      <Shell>
        <div className="h-72 animate-pulse rounded-xl bg-surface" />
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
      <section className="relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-ring)]">
        <img src="/hero.jpg" alt="" className="absolute inset-0 size-full object-cover object-center opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-lg ring-1 ring-bone/30" />
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 size-1.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 size-1.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 size-1.5 bg-bone/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 size-1.5 bg-bone/80" />
        <div className="relative px-5 py-12 sm:px-10 sm:py-16">
          <img
            src="/waterman.jpg"
            alt="Waterman Arch Supports"
            className="mb-6 h-10 w-auto max-w-[200px] object-contain object-left sm:h-12"
          />
          <Ticket>{ticket} · {circuit.periodLabel}</Ticket>
          <h1 className="mt-4 max-w-2xl font-display text-5xl italic leading-[0.95] sm:text-6xl">
            {circuit.name}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-fg/80 sm:text-base">
            Five weeks. Three floors. Every store on the same card. The floor marks the scores — no
            password. The commissioner locks the week. The rest of the rumble runs itself.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="bone">
              Week {circuit.currentWeek} of {circuit.weeks}
            </Badge>
            <Badge>{circuit.status}</Badge>
            {week ? <Badge tone={week.status === "locked" ? "amber" : "steel"}>{week.status}</Badge> : null}
            <Badge>{board.fighters.length} in the locker</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/score">Mark the scoresheet</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/bouts">Read the bouts</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/desk">Commissioner desk</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Prize label="Main Event" value={circuit.prizeMain} hint="Stay in the title picture" />
        <Prize label="Redemption" value={circuit.prizeRedemption} hint="One loss. Still alive." />
        <Prize label="Royal Rumble" value={circuit.prizeRumble} hint="Last card standing" />
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {circuit.status === "setup" ? (
              <>
                <p className="kicker">The locker · {board.fighters.length} signed</p>
                <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Meet the card</h2>
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
                <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Who is wrestling</h2>
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
                  <Link
                    to="/fighter/$id"
                    params={{ id: f.id }}
                    search={{ slug: circuit.slug }}
                    className="block"
                  >
                    <RingCard className="transition-colors hover:bg-raised">
                      <div className="flex items-center gap-3">
                        <MonoMark first={f.firstName} last={f.lastName} />
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg italic leading-tight">
                            {f.nickname}
                          </p>
                          <p className="truncate text-xs text-muted">
                            <Seed n={f.seed} /> {f.firstName} {f.lastName}
                          </p>
                        </div>
                      </div>
                    </RingCard>
                  </Link>
                </li>
              ))}
          </ul>
        ) : (
          <BoutList board={board} week={circuit.currentWeek} />
        )}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="kicker">Period to date</p>
          <h2 className="mb-4 mt-2 font-display text-3xl italic">Standings</h2>
          <RingCard className="p-0 sm:p-0">
            <ol className="divide-y divide-line">
              {board.standings.slice(0, 8).map((s, i) => {
                const f = fighterById(board, s.fighterId);
                if (!f) return null;
                return (
                  <li key={s.fighterId} className="flex items-center gap-3 px-4 py-3">
                    <span className="tabular w-6 text-sm text-subtle">{i + 1}</span>
                    <Link
                      to="/fighter/$id"
                      params={{ id: f.id }}
                      search={{ slug: circuit.slug }}
                      className="min-w-0 flex-1 truncate font-display italic"
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
            <h2 className="mt-3 font-display text-2xl italic leading-tight">{latest.headline}</h2>
            <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm text-muted">{latest.body}</p>
            <Link to="/report" className="mt-4 inline-block text-sm text-bone hover:text-fg">
              Read the gazette
            </Link>
          </RingCard>
        ) : (
          <RingCard className="relative overflow-hidden">
            <img src="/locker.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
            <div className="relative">
              <p className="kicker">The Floor Gazette</p>
              <h2 className="mt-3 font-display text-2xl italic leading-tight">
                No issue yet. The first preview prints when week 1 opens.
              </h2>
            </div>
          </RingCard>
        )}
      </section>

      <section className="mt-14">
        <RingCard className="p-5 sm:p-7">
          <p className="kicker">How the ring works</p>
          <h2 className="mt-2 font-display text-3xl italic">Five weeks. Three floors. Automatic.</h2>
          <ol className="mt-5 grid gap-5 text-sm text-muted sm:grid-cols-2">
            <li>
              <span className="text-fg">Seed.</span> Fill the order yourself, or rank them from last
              period. No roster cap — new hires join the rumble if they arrive after the bell.
            </li>
            <li>
              <span className="text-fg">Pair.</span> Highest remaining seed against lowest. Odd person
              out gets the bye. Rumble is a free-for-all.
            </li>
            <li>
              <span className="text-fg">Score.</span> Green 3, Blue 2, Orange 1, Red 0. Each extra
              green after the first is +1. Every metric green is an automatic win. Reviews +1 each,
              three max. Any store can mark the sheet.
            </li>
            <li>
              <span className="text-fg">Drop.</span> A loss in Main Event goes to Redemption. A loss
              there goes to the Royal Rumble. The commissioner locks the week so cards cannot change.
              Final week crowns each floor.
            </li>
          </ol>
        </RingCard>
      </section>
    </Shell>
  );
}

function Prize({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <RingCard>
      <p className="kicker">{label}</p>
      <p className="mt-2 font-display text-3xl italic">{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </RingCard>
  );
}
