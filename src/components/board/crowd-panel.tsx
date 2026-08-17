import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RingCard } from "@/components/arena/ring";
import { savePick, savePromo, type BoardPayload } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import { PROMO_LINES, PROMO_BY_ID } from "@/lib/circuit/promos";
import { pickRecord } from "@/lib/circuit/crowd";
import { weekAcceptsScores } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";

export function CrowdPanel({
  board,
  fighterId,
  passcode,
  onBoard,
}: {
  board: BoardPayload;
  fighterId: string;
  passcode: string;
  onBoard?: (next: BoardPayload) => void;
}) {
  const week = board.circuit.currentWeek;
  const open = weekAcceptsScores(board.weeks.find((w) => w.weekNumber === week)?.status ?? "");
  const rec = pickRecord(fighterId, board.picks ?? [], board.matchups);
  const bouts = board.matchups.filter((m) => m.weekNumber === week && m.kind !== "bye");
  const mine = board.matchups.find((m) => m.weekNumber === week && m.fighterIds.includes(fighterId));
  const foes = (mine?.fighterIds ?? []).filter((id) => id !== fighterId);
  const promo = (board.promos ?? []).find((p) => p.fromId === fighterId && p.weekNumber === week);
  const pickMut = useBoardMutation((d: Parameters<typeof savePick>[0]["data"]) => savePick({ data: d }));
  const promoMut = useBoardMutation((d: Parameters<typeof savePromo>[0]["data"]) => savePromo({ data: d }));

  return (
    <div className="space-y-6">
      <RingCard className="p-5">
        <p className="kicker">Pick ’em</p>
        <h3 className="mt-2 font-display text-3xl italic">Who wins the week</h3>
        <p className="mt-2 text-sm text-muted">
          Tap a name. Right pick after the week closes is a star on the belt.
          {rec.locked ? ` Book so far: ${rec.right} of ${rec.locked}.` : ""}
        </p>
        {bouts.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">No bouts to pick until week 1 is open.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bouts.map((m) => {
              const minePick = (board.picks ?? []).find(
                (p) => p.fighterId === fighterId && p.matchupId === m.id,
              );
              return (
                <li key={m.id} className="rounded-lg border border-line px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">
                    {m.kind === "rumble" ? "Rumble" : "Singles"}
                    {m.fighterIds.includes(fighterId) ? " · your match" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.fighterIds.map((id) => {
                      const f = board.fighters.find((x) => x.id === id);
                      if (!f) return null;
                      const on = minePick?.pickId === id;
                      const won = m.status === "complete" && m.winnerId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          disabled={!open || pickMut.isPending}
                          onClick={() =>
                            pickMut.mutate(
                              { passcode, matchupId: m.id, pickId: id },
                              {
                                onSuccess: (next) => {
                                  onBoard?.(next);
                                  toast.success(`Picked ${f.nickname}.`);
                                },
                                onError: (e) => toast.error(e.message),
                              },
                            )
                          }
                          className={cn(
                            "rounded-sm border px-3 py-2 text-sm",
                            on && "border-amber bg-amber/15 text-amber",
                            !on && "border-line text-muted hover:text-fg",
                            won && "ring-1 ring-sage/50",
                          )}
                        >
                          {f.nickname}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </RingCard>

      <RingCard className="p-5">
        <p className="kicker">Promo</p>
        <h3 className="mt-2 font-display text-3xl italic">Talk to the other corner</h3>
        <p className="mt-2 text-sm text-muted">
          One canned line. Work-ok. The gazette and the bout page quote it.
        </p>
        {foes.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">No opponent this week. Save it for the next bell.</p>
        ) : (
          <>
            {promo ? (
              <p className="mt-3 font-display text-xl italic text-amber">
                “{PROMO_BY_ID[promo.lineId]?.text ?? promo.lineId}”
              </p>
            ) : null}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PROMO_LINES.map((line) => (
                <li key={line.id}>
                  <button
                    type="button"
                    disabled={!open || promoMut.isPending}
                    onClick={() =>
                      promoMut.mutate(
                        { passcode, lineId: line.id, toId: foes[0] },
                        {
                          onSuccess: (next) => {
                            onBoard?.(next);
                            toast.success("Promo is on the card.");
                          },
                          onError: (e) => toast.error(e.message),
                        },
                      )
                    }
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left text-sm",
                      promo?.lineId === line.id
                        ? "border-amber bg-amber/15 text-fg"
                        : "border-line text-muted hover:text-fg",
                    )}
                  >
                    {line.text}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </RingCard>
    </div>
  );
}
