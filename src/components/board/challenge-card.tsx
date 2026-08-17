import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RingCard, Ticket } from "@/components/arena/ring";
import type { BoardPayload } from "@/lib/server/circuit";
import { claimChallenge } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import { CHALLENGE_SLOTS, challengeOpen, claimedChallenge } from "@/lib/circuit/house";
import { weekAcceptsScores } from "@/lib/circuit/types";

export function ChallengeCard({
  board,
  fighterId,
  passcode,
  onBoard,
}: {
  board: BoardPayload;
  fighterId: string;
  passcode: string;
  onBoard: (next: BoardPayload) => void;
}) {
  const week = board.circuit.currentWeek;
  const challenge = (board.challenges ?? []).find((c) => c.weekNumber === week);
  const weekState = board.weeks.find((w) => w.weekNumber === week);
  const open = weekAcceptsScores(weekState?.status ?? "") && challengeOpen(challenge);
  const mine = claimedChallenge(challenge, fighterId);
  const claim = useBoardMutation(() => claimChallenge({ data: { passcode } }));

  if (!challenge) return null;

  return (
    <RingCard className="border-amber/40 bg-amber/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="kicker !text-amber">Commissioner’s challenge</p>
        <Ticket>
          {challenge.claims.length}/{CHALLENGE_SLOTS} claimed
        </Ticket>
      </div>
      <h3 className="mt-2 font-display text-3xl italic">{challenge.title}</h3>
      {challenge.blurb ? <p className="mt-2 text-sm text-muted">{challenge.blurb}</p> : null}
      <p className="mt-2 text-sm text-muted">First three lockers to mark it get the desk stamp. Not for sale.</p>
      <div className="mt-4">
        {mine ? (
          <p className="text-sm text-sage">You claimed it. Wear the stamp from the belt.</p>
        ) : open ? (
          <Button
            onClick={() =>
              claim.mutate(undefined, {
                onSuccess: (next) => {
                  onBoard(next);
                  toast.success("Claimed. The desk stamp is on your belt.");
                },
                onError: (e) => toast.error(e.message),
              })
            }
            disabled={claim.isPending}
          >
            {claim.isPending ? "Claiming…" : "I did it"}
          </Button>
        ) : (
          <p className="text-sm text-muted">The first three already claimed it.</p>
        )}
      </div>
    </RingCard>
  );
}
