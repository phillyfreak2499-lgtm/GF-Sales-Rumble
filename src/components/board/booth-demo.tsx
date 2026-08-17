import type { BoardPayload } from "@/lib/server/circuit";
import { callBout, type AnnounceStyle } from "@/lib/circuit/announce";
import { ANNOUNCE_BY_ID } from "@/lib/circuit/announce";
import type { Matchup } from "@/lib/circuit/types";
import { RingCard, Ticket, VsMark } from "@/components/arena/ring";
import { MicByline } from "@/components/arena/announcer";
import { Seed } from "./pieces";

export function BoothDemo({
  board,
  style,
}: {
  board: BoardPayload;
  style: AnnounceStyle;
}) {
  const pair = [...board.fighters]
    .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName))
    .slice(0, 2);
  if (pair.length < 2) return null;
  const [a, b] = pair;
  const matchup: Matchup = {
    id: "booth",
    circuitId: board.circuit.id,
    weekNumber: 1,
    bracket: "main",
    kind: "singles",
    fighterIds: [a.id, b.id],
    winnerId: null,
    status: "scheduled",
  };
  const copy = callBout({
    style,
    phase: "preview",
    week: 1,
    totalWeeks: board.circuit.weeks,
    matchup,
    fighters: board.fighters,
    placements: board.placements,
  });
  const desk = ANNOUNCE_BY_ID[style];

  return (
    <RingCard className="p-5 sm:p-7">
      <Ticket>Booth · sample call</Ticket>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-subtle">
        {desk.desk} · {desk.name}
      </p>
      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <p className="min-w-0 flex-1 font-display text-3xl italic leading-[0.95] sm:text-4xl">
          <Seed n={a.seed} /> {a.nickname}
        </p>
        <VsMark />
        <p className="min-w-0 flex-1 font-display text-3xl italic leading-[0.95] sm:text-right sm:text-4xl">
          <Seed n={b.seed} /> {b.nickname}
        </p>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted">{copy.body}</p>
      <MicByline desk={desk.desk} />
    </RingCard>
  );
}
