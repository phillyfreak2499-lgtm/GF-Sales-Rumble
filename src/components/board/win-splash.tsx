import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Fighter, Placement } from "@/lib/circuit/types";
import { playChampFanfare, playWinFanfare, sfxMuted, setSfxMuted } from "@/lib/circuit/arena-sfx";
import { cn } from "@/lib/utils";

const COLORS = ["#e8c56b", "#e24b4b", "#ead9b0", "#ff4dce", "#3de4ff", "#c8ff3d", "#e89a3c"];

export function unseenWin(fighterId: string, placements: Placement[]) {
  const wins = placements
    .filter((p) => p.fighterId === fighterId && (p.result === "win" || p.result === "champ"))
    .sort((a, b) => b.weekNumber - a.weekNumber);
  return wins.find((w) => {
    try {
      return !localStorage.getItem(winKey(fighterId, w.weekNumber));
    } catch {
      return true;
    }
  }) ?? null;
}

export function markWinSeen(fighterId: string, weekNumber: number) {
  try {
    localStorage.setItem(winKey(fighterId, weekNumber), "1");
  } catch {
    /* ignore */
  }
}

function winKey(fighterId: string, week: number) {
  return `win-pop-${fighterId}-${week}`;
}

export function WinSplash({
  fighter,
  weekNumber,
  champ,
  onClose,
}: {
  fighter: Fighter;
  weekNumber: number;
  champ?: boolean;
  onClose: () => void;
}) {
  const [mute, setMute] = useState(() => sfxMuted());
  const bits = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 12) * 0.07}s`,
        dur: `${1.8 + (i % 7) * 0.18}s`,
        color: COLORS[i % COLORS.length],
        rot: (i * 47) % 360,
        size: 8 + (i % 5) * 4,
      })),
    [],
  );

  useEffect(() => {
    if (champ) playChampFanfare();
    else playWinFanfare();
  }, [champ]);

  function close() {
    markWinSeen(fighter.id, weekNumber);
    onClose();
  }

  return (
    <div className="win-splash" role="dialog" aria-label="You won">
      <span aria-hidden className="win-flash" />
      <span aria-hidden className="win-burst" />
      <div aria-hidden className="win-confetti">
        {bits.map((b) => (
          <i
            key={b.i}
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.dur,
              background: b.color,
              width: b.size,
              height: b.size * 0.45,
              transform: `rotate(${b.rot}deg)`,
            }}
          />
        ))}
      </div>
      <div className={cn("win-card", champ && "win-card-champ")}>
        <p className="kicker !text-gold">{champ ? "And still" : "Winner"}</p>
        {fighter.photoUrl ? (
          <img src={fighter.photoUrl} alt="" className="win-photo" />
        ) : null}
        <h2 className="win-name">{fighter.nickname}</h2>
        <p className="win-line">
          {champ ? `Week ${weekNumber}. The house is yours.` : `Week ${weekNumber}. The locker heard that.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={close}>Back to the locker</Button>
          <Button
            variant="ghost"
            onClick={() => {
              const next = !mute;
              setMute(next);
              setSfxMuted(next);
            }}
          >
            {mute ? "Sound off" : "Sound on"}
          </Button>
        </div>
      </div>
    </div>
  );
}
