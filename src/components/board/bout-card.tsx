import type { BoardPayload } from "@/lib/server/circuit";
import { callBout, type AnnounceStyle } from "@/lib/circuit/announce";
import { ANNOUNCE_BY_ID } from "@/lib/circuit/announce";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { fighterById } from "@/lib/use-board";
import { RingCard, Ticket, VsMark } from "@/components/arena/ring";
import { MicByline } from "@/components/arena/announcer";
import { BoutVideoLink, Seed } from "./pieces";
import { PROMO_BY_ID } from "@/lib/circuit/promos";

export function BoutCard({
  board,
  matchupId,
  style = "formal",
}: {
  board: BoardPayload;
  matchupId: string;
  style?: AnnounceStyle;
}) {
  const m = board.matchups.find((x) => x.id === matchupId);
  if (!m) return null;
  const phase = m.status === "complete" ? "recap" : "preview";
  const copy = callBout({
    style,
    phase,
    week: m.weekNumber,
    totalWeeks: board.circuit.weeks,
    matchup: m,
    fighters: board.fighters,
    placements: board.placements,
    scores: board.scores,
    metricCount: board.metrics.length,
  });
  const people = m.fighterIds.map((id) => fighterById(board, id)).filter(Boolean);
  const desk = ANNOUNCE_BY_ID[style].desk;

  return (
    <RingCard className="p-5 sm:p-7">
      <Ticket>{copy.title}</Ticket>
      {m.kind === "singles" && people.length === 2 ? (
        <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <p className="min-w-0 flex-1 font-display text-3xl italic leading-[0.95] sm:text-4xl">
            <Seed n={people[0]!.seed} /> {people[0]!.nickname}
          </p>
          <VsMark />
          <p className="min-w-0 flex-1 font-display text-3xl italic leading-[0.95] sm:text-right sm:text-4xl">
            <Seed n={people[1]!.seed} /> {people[1]!.nickname}
          </p>
        </div>
      ) : null}
      {m.kind === "singles" && people.length === 2 ? (
        <p className="mt-3 text-sm text-muted">
          {formatRecord(recordOf(people[0]!.id, board.placements))}
          {people[0]!.hometown ? ` · ${people[0]!.hometown}` : ""}
          <span className="mx-2 text-subtle">/</span>
          {formatRecord(recordOf(people[1]!.id, board.placements))}
          {people[1]!.hometown ? ` · ${people[1]!.hometown}` : ""}
        </p>
      ) : null}
      {people.some((p) => p?.walkout) ? (
        <p className="mt-3 text-sm text-muted">
          {people
            .filter((p) => p?.walkout)
            .map((p) => `${p!.nickname}: “${p!.walkout}”`)
            .join(" · ")}
        </p>
      ) : null}
      <PromoTape board={board} matchupId={m.id} week={m.weekNumber} />
      <p className="mt-5 text-sm leading-relaxed text-muted">{copy.body}</p>
      <BoutVideoLink url={m.videoUrl} />
      <MicByline kind={phase} desk={desk} />
    </RingCard>
  );
}

export function BoutList({
  board,
  week,
  style = "formal",
}: {
  board: BoardPayload;
  week: number;
  style?: AnnounceStyle;
}) {
  const items = board.matchups.filter((m) => m.weekNumber === week);
  if (!items.length) return <p className="text-muted">No bouts booked this week.</p>;
  return (
    <div className="space-y-4">
      {items.map((m) => (
        <BoutCard key={m.id} board={board} matchupId={m.id} style={style} />
      ))}
    </div>
  );
}

function PromoTape({
  board,
  matchupId,
  week,
}: {
  board: BoardPayload;
  matchupId: string;
  week: number;
}) {
  const m = board.matchups.find((x) => x.id === matchupId);
  if (!m) return null;
  const lines = (board.promos ?? []).filter(
    (p) => p.weekNumber === week && m.fighterIds.includes(p.fromId) && m.fighterIds.includes(p.toId),
  );
  if (!lines.length) return null;
  return (
    <ul className="mt-3 space-y-1">
      {lines.map((p) => {
        const from = board.fighters.find((f) => f.id === p.fromId);
        return (
          <li key={`${p.fromId}-${p.lineId}`} className="text-sm text-amber">
            {from?.nickname}: “{PROMO_BY_ID[p.lineId]?.text ?? p.lineId}”
          </li>
        );
      })}
    </ul>
  );
}
