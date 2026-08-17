import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { PageHead, RingCard, Ticket } from "@/components/arena/ring";
import { Button } from "@/components/ui/button";
import { fighterById, useBoard, useHeat } from "@/lib/use-board";
import { pickLeaders, storeStandings } from "@/lib/circuit/crowd";
import { FLOOR } from "@/lib/circuit/types";

export const Route = createFileRoute("/ceremony")({ component: CeremonyPage });

function CeremonyPage() {
  const { data: board, isPending } = useBoard();
  const heat = useHeat(board);
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }

  const done = board.circuit.status === "complete";
  const stores = storeStandings(board.fighters, board.standings, heat?.byId);
  const picks = pickLeaders(board.fighters, board.picks ?? [], board.matchups);
  const belts = (["main", "redemption", "rumble"] as const)
    .map((id) => {
      const champId = board.champions[id];
      const f = champId ? fighterById(board, champId) : null;
      return { id, floor: FLOOR[id], fighter: f };
    })
    .filter((b) => b.fighter);

  return (
    <Shell>
      <PageHead
        kicker={done ? "Final bell" : "Week 4 · the building is loud"}
        title={done ? "The ceremony" : "Title night"}
        lede={
          done
            ? "The floors have names on them now. Walk-outs, store heat, and the pick ’em book."
            : "Week 4 is a rumble on each floor. This page fills when the commissioner closes the last week."
        }
        action={<Ticket>{done ? "Belts are printed" : "Not over yet"}</Ticket>}
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {belts.length ? (
          belts.map((b) => (
            <li key={b.id}>
              <RingCard className={b.id === "main" ? "bg-amber/10" : b.id === "redemption" ? "bg-steel/10" : "bg-rose/10"}>
                <p className="kicker">{b.floor.name}</p>
                <p className="mt-3 font-display text-4xl italic leading-none">{b.fighter!.nickname}</p>
                <p className="mt-2 text-sm text-muted">
                  {b.fighter!.firstName} {b.fighter!.lastName}
                  {b.fighter!.store ? ` · ${b.fighter!.store}` : ""}
                </p>
                {b.fighter!.walkout ? (
                  <p className="mt-3 text-sm text-amber">“{b.fighter!.walkout}”</p>
                ) : null}
              </RingCard>
            </li>
          ))
        ) : (
          <li className="sm:col-span-3">
            <RingCard>
              <p className="font-display text-2xl italic">No belts yet.</p>
              <p className="mt-2 text-sm text-muted">Close week 4 and the names print here.</p>
            </RingCard>
          </li>
        )}
      </ul>

      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <RingCard>
          <p className="kicker">Store heat</p>
          <h2 className="mt-2 font-display text-3xl italic">{stores[0]?.store ?? "—"}</h2>
          <p className="mt-2 text-sm text-muted">
            {stores[0]
              ? `${stores[0].points} period points from ${stores[0].count} on the book.`
              : "Stores print when people list them on their locker."}
          </p>
        </RingCard>
        <RingCard>
          <p className="kicker">Pick ’em king</p>
          <h2 className="mt-2 font-display text-3xl italic">{picks[0]?.nickname ?? "—"}</h2>
          <p className="mt-2 text-sm text-muted">
            {picks[0] ? `${picks[0].right} of ${picks[0].locked} on the book.` : "Nobody has a closed pick yet."}
          </p>
        </RingCard>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/honors">Full heat board</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to the ring</Link>
        </Button>
      </div>
    </Shell>
  );
}
