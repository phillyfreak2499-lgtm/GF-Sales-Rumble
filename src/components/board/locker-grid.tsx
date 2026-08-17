import { Link } from "@tanstack/react-router";
import { BracketChip } from "@/components/board/pieces";
import { PhotoField } from "@/components/board/photo-field";
import { HeatBar, RankChip } from "@/components/board/heat";
import { FighterPoster } from "@/components/arena/ring";
import { plateClasses } from "@/components/board/nameplate";
import { mvpWeeksOf, titanOn } from "@/components/board/titantron";
import { StarBelt } from "@/components/board/floor-work";
import type { BoardPayload } from "@/lib/server/circuit";
import { standingOf, useHeat } from "@/lib/use-board";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import type { Fighter } from "@/lib/circuit/types";

export function LockerGrid({ board, fighters }: { board: BoardPayload; fighters: Fighter[] }) {
  const heat = useHeat(board);
  if (!fighters.length) {
    return <p className="text-sm text-muted">This locker room is empty. Pick it as your home store.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fighters
        .slice()
        .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
        .map((f) => {
          const s = standingOf(board, f.id);
          const h = heat?.byId[f.id];
          return (
            <li key={f.id}>
              <div className="relative">
                <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
                  <PhotoField
                    fighter={f}
                    slug={board.circuit.slug}
                    compact
                    locked
                    markClassName="size-11 text-xs"
                  />
                </div>
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
                    store={f.store}
                    walkout={f.walkout}
                    seed={f.seed}
                    fact={f.hypeLine || f.funFact}
                    plateMark={f.plateMark}
                    plateSticker={f.plateSticker}
                    titanWeeks={
                      titanOn(f.plateFx, mvpWeeksOf(heat?.honors, f.id).length > 0)
                        ? mvpWeeksOf(heat?.honors, f.id)
                        : []
                    }
                    className={plateClasses(f)}
                    mark={
                      <span className="flex items-center gap-2">
                        <span className="size-11" aria-hidden />
                        {s ? <BracketChip id={s.currentBracket} /> : null}
                      </span>
                    }
                    footer={
                      <div className="space-y-2">
                        <StarBelt
                          earned={board.floorWork
                            .filter((w) => w.fighterId === f.id && w.done)
                            .reduce((n, w) => n + w.stars, 0)}
                          compact
                        />
                        {h ? (
                          <>
                            <RankChip rank={h.rank} />
                            <HeatBar value={h.heat} size="sm" />
                          </>
                        ) : null}
                      </div>
                    }
                  />
                </Link>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
