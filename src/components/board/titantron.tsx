import { useEffect, type ReactNode } from "react";
import { playUnlock } from "@/lib/circuit/arena-sfx";
import { cn } from "@/lib/utils";
import type { Honor } from "@/lib/circuit/heat";

export function mvpWeeksOf(honors: Honor[] | undefined, fighterId: string) {
  return (honors ?? [])
    .filter((h) => h.kind === "mvp" && h.fighterId === fighterId)
    .map((h) => h.weekNumber)
    .sort((a, b) => a - b);
}

export function titanOn(plateFx: string | undefined, earned: boolean) {
  if (!earned) return false;
  return plateFx !== "off";
}

export function titanLabel(weeks: number[]) {
  return weeks.length > 1 ? `${weeks.length}× MVP` : weeks[0] ? `Week ${weeks[0]} MVP` : "MVP";
}

export function TitantronChrome({ weeks, compact }: { weeks: number[]; compact?: boolean }) {
  return (
    <>
      <span aria-hidden className="titantron-glow" />
      <span aria-hidden className="titantron-scan" />
      <span aria-hidden className="titantron-spots" />
      <span className={compact ? "titantron-sash titantron-sash-sm" : "titantron-sash"}>{titanLabel(weeks)}</span>
    </>
  );
}

export function Titantron({
  weeks,
  children,
  className,
  compact,
}: {
  weeks: number[];
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const label = weeks.length > 1 ? `${weeks.length}× MVP` : weeks[0] ? `Week ${weeks[0]} MVP` : "MVP";
  return (
    <div className={cn("titantron relative", className)}>
      <span aria-hidden className="titantron-glow" />
      <span aria-hidden className="titantron-scan" />
      <span aria-hidden className="titantron-spots" />
      <div className="relative z-[1]">{children}</div>
      <span className={cn("titantron-sash", compact && "titantron-sash-sm")}>{label}</span>
    </div>
  );
}

export function TitanUnlock({ weeks, onClose }: { weeks: number[]; onClose: () => void }) {
  useEffect(() => {
    playUnlock();
  }, []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg/85 p-4">
      <div className="titantron w-full max-w-md overflow-hidden rounded-xl border border-gold/50 bg-surface p-8 text-center shadow-[0_0_80px_rgb(232_197_107/0.35)]">
        <span aria-hidden className="titantron-glow" />
        <span aria-hidden className="titantron-scan" />
        <p className="relative kicker !text-gold">The Titantron</p>
        <h3 className="relative mt-3 font-display text-5xl italic leading-none">You are over</h3>
        <p className="relative mt-4 text-sm text-muted">
          MVP of the week{weeks.length > 1 ? ` · ${weeks.length} times` : weeks[0] ? ` ${weeks[0]}` : ""}.
          The locker just got loud. Wear it on the Ring, the roster, and your plate.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="relative mt-6 inline-flex h-11 items-center rounded-sm bg-gold px-5 text-sm font-medium text-bg"
        >
          Light it up
        </button>
      </div>
    </div>
  );
}
