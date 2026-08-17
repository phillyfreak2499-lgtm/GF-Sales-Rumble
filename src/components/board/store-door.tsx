import { Link } from "@tanstack/react-router";
import { PlateMark } from "@/components/board/nameplate";
import { roomPaintClass } from "@/lib/circuit/stores";
import { cn } from "@/lib/utils";

export function StoreDoor({
  slug,
  name,
  short,
  count,
  room,
}: {
  slug: string;
  name: string;
  short: string;
  count: number;
  room: { paint: string; motto?: string; mark?: string; handle?: string };
}) {
  return (
    <Link to="/room/$slug" params={{ slug }} className="block focus-visible:outline-none">
      <article className={cn("hall-door", roomPaintClass(room.paint), `hall-handle-${room.handle || "brass"}`)}>
        <div className="hall-hinge" />
        <div className="hall-hinge hall-hinge-low" />
        <div className="hall-panel">
          <span className="hall-peep" aria-hidden />
          <div className="hall-plate">
            <p className="hall-plate-name">{short}</p>
            <p className="hall-plate-sub">
              {count} {count === 1 ? "locker" : "lockers"}
            </p>
          </div>
          {room.motto ? <p className="hall-motto">“{room.motto}”</p> : null}
          <span className={cn("hall-knob", `hall-knob-${room.handle || "brass"}`)} aria-hidden />
          {room.mark ? (
            <span className="hall-sticker">
              <PlateMark mark={room.mark} />
            </span>
          ) : null}
        </div>
        <p className="sr-only">Open the {name} locker room</p>
      </article>
    </Link>
  );
}
