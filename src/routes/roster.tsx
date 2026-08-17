import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BracketChip, MonoMark } from "@/components/board/pieces";
import { FighterPoster, PageHead } from "@/components/arena/ring";
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
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <FighterPoster
                    nickname={f.nickname}
                    name={`${f.firstName} ${f.lastName} · ${formatRecord(recordOf(f.id, board.placements))}`}
                    hometown={f.hometown}
                    seed={f.seed}
                    fact={f.hypeLine || f.funFact}
                    mark={
                      <span className="flex items-center gap-2">
                        <MonoMark first={f.firstName} last={f.lastName} />
                        {s ? <BracketChip id={s.currentBracket} /> : null}
                      </span>
                    }
                  />
                </Link>
              </li>
            );
          })}
      </ul>
    </Shell>
  );
}
