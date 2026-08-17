import type { BoardPayload } from "@/lib/server/circuit";
import type { Fighter } from "@/lib/circuit/types";
import { FLOOR, STATUS_LABEL } from "@/lib/circuit/types";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { scorecard } from "@/lib/circuit/engine";
import { awardedBonus } from "@/lib/circuit/training";
import { standingOf } from "@/lib/use-board";
import { mvpWeeksOf, titanOn } from "@/components/board/titantron";
import type { Honor } from "@/lib/circuit/heat";
import { cn } from "@/lib/utils";

export function PrintPack({
  board,
  fighter,
  honors,
}: {
  board: BoardPayload;
  fighter: Fighter;
  honors?: Honor[];
}) {
  const rec = recordOf(fighter.id, board.placements);
  const standing = standingOf(board, fighter.id);
  const floor = standing ? FLOOR[standing.currentBracket] : null;
  const weeks = mvpWeeksOf(honors, fighter.id);
  const titan = titanOn(fighter.plateFx, weeks.length > 0);
  const match = board.matchups.find(
    (m) => m.weekNumber === board.circuit.currentWeek && m.fighterIds.includes(fighter.id),
  );
  const foe = match?.fighterIds
    .map((id) => board.fighters.find((f) => f.id === id))
    .find((f) => f && f.id !== fighter.id);
  const cards = board.weeks
    .map((w) => {
      const score = board.scores.find((s) => s.fighterId === fighter.id && s.weekNumber === w.weekNumber);
      if (!score) return null;
      const train = awardedBonus(board.academy, fighter.id, w.weekNumber);
      const card = scorecard(score.statuses, score.reviews, train);
      const bout = board.matchups.find((m) => m.weekNumber === w.weekNumber && m.fighterIds.includes(fighter.id));
      const place = board.placements.find((p) => p.fighterId === fighter.id && p.weekNumber === w.weekNumber);
      return { w, score, card, bout, place };
    })
    .filter(Boolean);

  return (
    <div className="print-pack">
      <article className={cn("print-locker", titan && "print-titan")}>
        <header className="print-mast">
          <img src="/waterman.jpg" alt="Waterman" className="print-logo" />
          <p>
            {board.circuit.periodLabel} · {board.circuit.name}
          </p>
        </header>
        <div className="print-hero">
          {fighter.photoUrl ? (
            <img src={fighter.photoUrl} alt="" className="print-photo" />
          ) : (
            <div className="print-photo print-photo-empty">
              {fighter.firstName.slice(0, 1)}
              {fighter.lastName.slice(0, 1)}
            </div>
          )}
          <div className="print-id">
            <p className="print-kicker">
              {fighter.store ? `${fighter.store} · ` : ""}
              Seed {fighter.seed ?? "—"}
            </p>
            <h1>{fighter.nickname}</h1>
            <p className="print-legal">
              {fighter.firstName} {fighter.lastName}
              {fighter.hometown ? ` · ${fighter.hometown}` : ""}
            </p>
            {fighter.walkout ? <p className="print-walk">“{fighter.walkout}”</p> : null}
            <p className="print-rec">{formatRecord(rec)}</p>
            {floor ? (
              <p className="print-floor">
                {floor.short} · {floor.name}
              </p>
            ) : null}
            {titan ? <p className="print-sash">{weeks.length > 1 ? `${weeks.length}× MVP` : `Week ${weeks[0]} MVP`}</p> : null}
          </div>
        </div>
        {fighter.funFact || fighter.backstory ? (
          <p className="print-fact">{fighter.funFact || fighter.backstory}</p>
        ) : null}
        {foe ? (
          <p className="print-bout">
            This week vs {foe.nickname}
            {foe.walkout ? ` · “${foe.walkout}”` : ""}
          </p>
        ) : null}
        <footer className="print-foot">Good Feet · Period 10 Rumble · Cut this out. Tape it to the stockroom.</footer>
      </article>

      <article className="print-scores">
        <header className="print-mast">
          <img src="/waterman.jpg" alt="Waterman" className="print-logo" />
          <p>
            Score cards · {fighter.nickname}
          </p>
        </header>
        <h2>The cards</h2>
        {cards.length === 0 ? (
          <p className="print-empty">No cards posted yet. Mark the week, then print again.</p>
        ) : (
          <ul className="print-weeks">
            {cards.map((row) => (
              <li key={row!.w.weekNumber} className="print-week">
                <div className="print-week-head">
                  <strong>Week {row!.w.weekNumber}</strong>
                  <span>
                    {row!.card.points} pts
                    {row!.card.sweep ? " · sweep" : ""}
                    {row!.place?.result ? ` · ${row!.place.result}` : ""}
                  </span>
                </div>
                <ol className="print-metrics">
                  {board.metrics.map((m, i) => {
                    const st = row!.score.statuses[i] ?? "red";
                    return (
                      <li key={m.id} className={`print-pip print-${st}`}>
                        <span>{m.label}</span>
                        <b>{STATUS_LABEL[st]}</b>
                      </li>
                    );
                  })}
                </ol>
                <p className="print-extra">
                  Reviews {row!.card.reviews}
                  {row!.card.trainingBonus ? " · academy +1" : ""}
                  {row!.card.bonus ? ` · extra green +${row!.card.bonus}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <footer className="print-foot">Green 3 · Blue 2 · Orange 1 · Red 0 · Extra green is a bonus · All green is a sweep</footer>
      </article>
    </div>
  );
}
