import { RingCard, VsMark } from "@/components/arena/ring";
import { Seed } from "@/components/board/pieces";
import type { Fighter, Matchup } from "@/lib/circuit/types";
import { Button } from "@/components/ui/button";

export function BellCard({
  me,
  match,
  opponent,
  onClose,
}: {
  me: Fighter;
  match: Matchup;
  opponent: Fighter | null;
  onClose?: () => void;
}) {
  return (
    <RingCard className="border-amber/40 bg-amber/10 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker !text-amber">The bell</p>
          <h3 className="mt-2 font-display text-3xl italic sm:text-4xl">
            {match.kind === "bye"
              ? "Bye week. Stay ready."
              : match.kind === "rumble"
                ? "You are in the rumble"
                : "This week you wrestle"}
          </h3>
        </div>
        {onClose ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Got it
          </Button>
        ) : null}
      </div>
      {opponent && match.kind === "singles" ? (
        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <p className="font-display text-3xl italic">
            <Seed n={me.seed} /> {me.nickname}
          </p>
          <VsMark />
          <p className="font-display text-3xl italic">
            <Seed n={opponent.seed} /> {opponent.nickname}
          </p>
        </div>
      ) : null}
      {opponent?.walkout ? (
        <p className="mt-4 text-sm text-muted">
          Their walk-out: <span className="text-fg">“{opponent.walkout}”</span>
        </p>
      ) : null}
      {me.walkout ? (
        <p className="mt-1 text-sm text-muted">
          Yours: <span className="text-fg">“{me.walkout}”</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-subtle">Set a five-word walk-out in Locker so the aisle knows you.</p>
      )}
    </RingCard>
  );
}

export function FirstPinSplash({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-4">
      <RingCard className="w-full max-w-md border-amber/40 bg-amber/10 p-6 text-center">
        <p className="kicker !text-amber">First pin</p>
        <h3 className="mt-3 font-display text-4xl italic">The locker noticed</h3>
        <p className="mt-3 text-sm text-muted">
          First card of the period is in. That is a pin. Now go get the next one.
        </p>
        <Button className="mt-6" onClick={onClose}>
          Back to the locker
        </Button>
      </RingCard>
    </div>
  );
}
