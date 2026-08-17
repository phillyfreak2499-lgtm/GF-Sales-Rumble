import type { BoardPayload } from "@/lib/server/circuit";
import { writeBoutPreview, writeBoutRecap, formatRecord, recordOf } from "@/lib/circuit/copy";
import { fighterById } from "@/lib/use-board";
import { RingCard, VsMark } from "@/components/arena/ring";
import { Seed } from "./pieces";

export function BoutCard({
  board,
  matchupId,
}: {
  board: BoardPayload;
  matchupId: string;
}) {
  const m = board.matchups.find((x) => x.id === matchupId);
  if (!m) return null;
  const copy =
    m.status === "complete"
      ? writeBoutRecap({
          week: m.weekNumber,
          totalWeeks: board.circuit.weeks,
          matchup: m,
          fighters: board.fighters,
          placements: board.placements,
          scores: board.scores,
          metricCount: board.metrics.length,
        })
      : writeBoutPreview({
          week: m.weekNumber,
          totalWeeks: board.circuit.weeks,
          matchup: m,
          fighters: board.fighters,
          placements: board.placements,
        });
  const people = m.fighterIds.map((id) => fighterById(board, id)).filter(Boolean);

  return (
    <RingCard className="p-5 sm:p-6">
      <p className="kicker">{copy.title}</p>
      {m.kind === "singles" && people.length === 2 ? (
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="min-w-0 flex-1 font-display text-2xl italic leading-tight sm:text-3xl">
            <Seed n={people[0]!.seed} /> {people[0]!.nickname}
          </p>
          <VsMark />
          <p className="min-w-0 flex-1 font-display text-2xl italic leading-tight sm:text-right sm:text-3xl">
            <Seed n={people[1]!.seed} /> {people[1]!.nickname}
          </p>
        </div>
      ) : null}
      {m.kind === "singles" && people.length === 2 ? (
        <p className="mt-2 text-sm text-muted">
          {formatRecord(recordOf(people[0]!.id, board.placements))}
          {people[0]!.hometown ? ` · ${people[0]!.hometown}` : ""}
          <span className="mx-2 text-subtle">/</span>
          {formatRecord(recordOf(people[1]!.id, board.placements))}
          {people[1]!.hometown ? ` · ${people[1]!.hometown}` : ""}
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-relaxed text-muted">{copy.body}</p>
    </RingCard>
  );
}

export function BoutList({
  board,
  week,
}: {
  board: BoardPayload;
  week: number;
}) {
  const items = board.matchups.filter((m) => m.weekNumber === week);
  if (!items.length) return <p className="text-muted">No bouts booked this week.</p>;
  return (
    <div className="space-y-4">
      {items.map((m) => (
        <BoutCard key={m.id} board={board} matchupId={m.id} />
      ))}
    </div>
  );
}
