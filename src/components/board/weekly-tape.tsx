import { Link } from "@tanstack/react-router";
import { RingCard, VsMark } from "@/components/arena/ring";
import { Button } from "@/components/ui/button";
import type { BoardPayload } from "@/lib/server/circuit";
import { featuredPromo, lockerCheck, mainEvent, storeRace, todayTape } from "@/lib/circuit/theater";
import { callForWeek } from "@/lib/circuit/house";
import { Seed } from "./pieces";

export function WeeklyTape({ board }: { board: BoardPayload }) {
  const tape = todayTape(board);
  const check = lockerCheck(board);
  const headline = mainEvent(board);
  const race = storeRace(board);
  const promo = featuredPromo(board);
  const pct = check.of ? Math.round((check.in / check.of) * 100) : 0;

  return (
    <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
      <RingCard className="border-amber/30 bg-amber/5 p-5 sm:p-7">
        <p className="kicker !text-amber">{tape.kicker}</p>
        <h2 className="mt-2 font-display text-4xl italic leading-[0.95] sm:text-5xl">{tape.line}</h2>
        <div className="mt-6">
          <Button asChild>
            <Link to={tape.to}>{tape.cta}</Link>
          </Button>
        </div>
        {headline ? (
          <div className="mt-8 border-t border-line pt-5">
            <p className="kicker">Tonight’s main event</p>
            <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="font-display text-3xl italic">
                <Seed n={headline.a.seed} /> {headline.a.nickname}
              </p>
              <VsMark />
              <p className="font-display text-3xl italic">
                <Seed n={headline.b.seed} /> {headline.b.nickname}
              </p>
            </div>
            {headline.a.walkout || headline.b.walkout ? (
              <p className="mt-2 text-sm text-muted">
                {[headline.a.walkout && `“${headline.a.walkout}”`, headline.b.walkout && `“${headline.b.walkout}”`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </RingCard>

      <div className="grid gap-3">
        <RingCard>
          <p className="kicker">Practice</p>
          <p className="mt-2 font-display text-4xl italic tabular">
            {check.in}
            <span className="text-2xl text-muted"> / {check.of}</span>
          </p>
          <p className="mt-1 text-sm text-muted">cards in this week. {pct}% of the locker showed up.</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
          </div>
        </RingCard>
        <RingCard>
          <p className="kicker">Store race</p>
          {race ? (
            <>
              <p className="mt-2 font-display text-3xl italic">{race.lead.store}</p>
              <p className="mt-1 text-sm text-muted">
                {race.chase
                  ? `${race.gap} points up on ${race.chase.store}`
                  : `${race.lead.points} period points`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">List a store in your locker to get on the board.</p>
          )}
        </RingCard>
        {(() => {
          const week = board.circuit.currentWeek;
          const call = callForWeek(board.houseCalls, week);
          const ch = (board.challenges ?? []).find((c) => c.weekNumber === week);
          const face = board.fighters.find((f) => f.id === call?.faceId);
          const heel = board.fighters.find((f) => f.id === call?.heelId);
          if (!ch && !face && !heel) return null;
          return (
            <RingCard>
              {ch ? (
                <>
                  <p className="kicker">Desk challenge</p>
                  <p className="mt-2 font-display text-2xl italic">{ch.title}</p>
                  <p className="mt-1 text-sm text-muted">{ch.claims.length}/3 claimed</p>
                </>
              ) : null}
              {face || heel ? (
                <p className="mt-3 text-sm text-muted">
                  {face ? `Babyface ${face.nickname}` : ""}
                  {face && heel ? " · " : ""}
                  {heel ? `Heel ${heel.nickname}` : ""}
                </p>
              ) : null}
            </RingCard>
          );
        })()}
        {promo ? (
          <RingCard className="bg-rose/5">
            <p className="kicker">Promo of the night</p>
            <p className="mt-2 font-display text-2xl italic">“{promo.line}”</p>
            <p className="mt-2 text-sm text-muted">
              {promo.from.nickname}
              {promo.to ? ` → ${promo.to.nickname}` : ""}
            </p>
          </RingCard>
        ) : (
          <RingCard>
            <p className="kicker">Promo of the night</p>
            <p className="mt-2 text-sm text-muted">Nobody has talked to the other corner yet. Crowd tab.</p>
          </RingCard>
        )}
      </div>
    </section>
  );
}
