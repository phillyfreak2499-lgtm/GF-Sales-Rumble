import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { PageHead } from "@/components/arena/ring";
import { StoreDoor } from "@/components/board/store-door";
import { onTheBook, useBoard } from "@/lib/use-board";
import { STORES, emptyRoom, storeSlugOf } from "@/lib/circuit/stores";

export const Route = createFileRoute("/roster")({ component: RosterPage });

function RosterPage() {
  const { data: board, isPending } = useBoard();
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const live = onTheBook(board.fighters);
  const rooms = board.rooms ?? STORES.map((s) => emptyRoom(s.slug));
  const unaffiliated = live.filter((f) => !storeSlugOf(f.store));

  return (
    <Shell>
      <PageHead
        kicker="The hallway"
        title="Eleven doors"
        lede="Each store has a door. Walk in. The lockers inside have names on them. Yours opens with your passcode."
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STORES.map((store) => {
          const room = rooms.find((r) => r.slug === store.slug) ?? emptyRoom(store.slug);
          const crew = live.filter((f) => storeSlugOf(f.store) === store.slug);
          return (
            <li key={store.slug}>
              <StoreDoor
                slug={store.slug}
                name={store.name}
                short={store.short}
                count={crew.length}
                room={room}
              />
            </li>
          );
        })}
      </ul>
      {unaffiliated.length ? (
        <p className="mt-8 text-sm text-muted">
          {unaffiliated.length} {unaffiliated.length === 1 ? "person has" : "people have"} not picked a
          door yet. Set home store in My locker.
        </p>
      ) : null}
    </Shell>
  );
}
