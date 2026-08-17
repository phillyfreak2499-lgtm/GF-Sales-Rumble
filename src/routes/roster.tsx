import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BracketChip, MonoMark, Seed } from "@/components/board/pieces";
import { PageHead, RingCard } from "@/components/arena/ring";
import { useBoard, standingOf } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";

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

  return (
    <Shell>
      <PageHead
        kicker="The locker room"
        title="Signed and ready"
        lede={`${board.fighters.length} wrestlers on the book. Seeds, hometowns, and the story that walks out with them. New hires can be added any time.`}
      />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {board.fighters
          .slice()
          .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
          .map((f) => {
            const s = standingOf(board, f.id);
            return (
              <li key={f.id}>
                <Link
                  to="/fighter/$id"
                  params={{ id: f.id }}
                  search={{ slug: board.circuit.slug }}
                  className="block"
                >
                  <RingCard className="transition-colors hover:bg-raised">
                    <div className="flex items-start gap-3">
                      <MonoMark first={f.firstName} last={f.lastName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Seed n={f.seed} />
                          <span className="truncate font-display text-xl italic">{f.nickname}</span>
                        </div>
                        <p className="truncate text-sm text-muted">
                          {f.firstName} {f.lastName}
                          {f.hometown ? ` · ${f.hometown}` : ""}
                        </p>
                        <p className="mt-1 text-xs tabular text-subtle">
                          {formatRecord(recordOf(f.id, board.placements))}
                        </p>
                        {f.hypeLine ? (
                          <p className="mt-2 line-clamp-2 text-sm text-fg/80">{f.hypeLine}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {s ? <BracketChip id={s.currentBracket} /> : null}
                          <span className="tabular text-xs text-muted">{s?.totalPoints ?? 0} pts period</span>
                        </div>
                      </div>
                    </div>
                  </RingCard>
                </Link>
              </li>
            );
          })}
      </ul>
    </Shell>
  );
}
