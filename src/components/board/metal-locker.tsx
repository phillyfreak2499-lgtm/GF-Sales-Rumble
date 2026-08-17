import type { Fighter } from "@/lib/circuit/types";
import { plateClasses } from "@/components/board/nameplate";
import { HouseSash } from "@/components/board/house-sash";
import { cn } from "@/lib/utils";

export function MetalLocker({
  fighter,
  number,
  onOpen,
  role,
}: {
  fighter: Fighter;
  number: number;
  onOpen: () => void;
  role?: "face" | "heel" | null;
}) {
  return (
    <button type="button" className={cn("metal-locker", plateClasses(fighter))} onClick={onOpen}>
      <HouseSash role={role ?? null} compact />
      <span className="metal-vents" aria-hidden />
      <span className="metal-num">{String(number).padStart(2, "0")}</span>
      {fighter.photoUrl ? <img src={fighter.photoUrl} alt="" className="metal-photo" /> : null}
      <span className="metal-plate">
        <span className="metal-nick">{fighter.nickname}</span>
        <span className="metal-legal">
          {fighter.firstName} {fighter.lastName.slice(0, 1)}.
        </span>
      </span>
      <span className="metal-latch" aria-hidden />
    </button>
  );
}
