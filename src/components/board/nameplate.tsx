import { cn } from "@/lib/utils";
import type { Fighter } from "@/lib/circuit/types";

export function plateBgClass(bg: string) {
  if (bg === "raised") return "bg-raised";
  if (bg === "sage") return "bg-sage/15";
  if (bg === "steel") return "bg-steel/15";
  if (bg === "amber") return "bg-amber/15";
  if (bg === "rose") return "bg-rose/15";
  if (bg === "neon-cyan") return "plate-neon-cyan text-fg";
  if (bg === "neon-pink") return "plate-neon-pink text-fg";
  if (bg === "neon-lime") return "plate-neon-lime text-fg";
  if (bg === "gold") return "plate-gold";
  if (bg === "gold-foil") return "plate-gold-foil";
  return "bg-surface";
}

export function plateBorderClass(border: string) {
  if (border === "sage") return "ring-2 ring-sage";
  if (border === "steel") return "ring-2 ring-steel";
  if (border === "amber") return "ring-2 ring-amber";
  if (border === "rose") return "ring-2 ring-rose";
  if (border === "double") return "ring-2 ring-bone ring-offset-2 ring-offset-bg";
  if (border === "neon-cyan") return "glow-neon-cyan";
  if (border === "neon-pink") return "glow-neon-pink";
  if (border === "neon-lime") return "glow-neon-lime";
  if (border === "gold") return "glow-gold";
  if (border === "gold-double") return "glow-gold ring-offset-2 ring-offset-bg ring-2 ring-gold";
  return "";
}

export function plateClasses(fighter: Pick<Fighter, "plateBorder" | "plateBg">) {
  return cn("relative overflow-hidden", plateBgClass(fighter.plateBg), plateBorderClass(fighter.plateBorder));
}

const MARK_ALIASES: Record<string, string> = {
  "★": "star",
  "⚡": "bolt",
  "🔥": "heat",
  "👑": "crown",
  "🏆": "crown",
  "💪": "bolt",
  "♥": "heat",
  "🦶": "star",
  "🔔": "star",
};

export function normalizeMark(mark?: string) {
  if (!mark) return "";
  return MARK_ALIASES[mark] ?? mark;
}

export function PlateMark({ mark, className }: { mark?: string; className?: string }) {
  const id = normalizeMark(mark);
  if (!id) return null;
  return (
    <span aria-hidden className={cn("mr-1.5 inline-flex items-center align-middle", className)}>
      <MarkGlyph id={id} />
    </span>
  );
}

function MarkGlyph({ id }: { id: string }) {
  const stroke = id === "heat" ? "currentColor" : "currentColor";
  if (id === "live") {
    return (
      <span className="rounded-[2px] bg-neon-pink px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
        Live
      </span>
    );
  }
  if (id === "foil") {
    return <span className="font-display text-[0.85em] italic text-gold">★</span>;
  }
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[0.85em]", id === "heat" && "text-rose", id === "bolt" && "text-amber")} aria-hidden>
      {id === "star" ? (
        <path fill="currentColor" d="M12 2.6 14.7 9h6.6l-5.3 4 2 6.4L12 15.8 5.9 19.4l2-6.4L2.7 9h6.6L12 2.6Z" />
      ) : id === "bolt" ? (
        <path fill="currentColor" d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" />
      ) : id === "heat" ? (
        <path fill={stroke} d="M12 2s5 6 5 11a5 5 0 1 1-10 0c0-5 5-11 5-11Z" />
      ) : id === "crown" ? (
        <path fill="currentColor" d="M3 16 5 7l4 5 3-7 3 7 4-5 2 9H3Zm1 2h16v3H4v-3Z" />
      ) : (
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      )}
    </svg>
  );
}

/** Stickers live in a reserved dock. They never sit on the name. */
export function PlateSticker({
  id,
  preview,
}: {
  id?: string;
  preview?: boolean;
}) {
  if (!id) return null;
  const size = preview ? "sm" : "md";
  const body =
    id === "closer" ? (
      <Stamp tone="rose" size={size}>
        Closer
      </Stamp>
    ) : id === "heat" ? (
      <Stamp tone="amber" size={size}>
        Heat
      </Stamp>
    ) : id === "sweep" ? (
      <Stamp tone="sage" size={size}>
        Sweep
      </Stamp>
    ) : id === "neon-live" ? (
      <span className="sticker-live text-neon-pink">
        <Stamp tone="neon" size={size}>
          Live
        </Stamp>
      </span>
    ) : id === "gold-seal" ? (
      <Seal preview={preview} />
    ) : id === "belt" ? (
      <Buckle preview={preview} />
    ) : id === "undisputed" ? (
      <span className="sticker-undisputed">
        <Stamp tone="gold" size={preview ? "sm" : "lg"}>
          Undisputed
        </Stamp>
      </span>
    ) : id === "desk" ? (
      <Stamp tone="amber" size={size}>
        Desk
      </Stamp>
    ) : id === "found" ? (
      <Stamp tone="gold" size={preview ? "sm" : "lg"}>
        Found
      </Stamp>
    ) : null;
  if (!body) return null;
  if (preview) return <span className="relative inline-flex">{body}</span>;
  return <span className="sticker-dock">{body}</span>;
}

function Stamp({
  children,
  tone,
  size,
}: {
  children: string;
  tone: "rose" | "amber" | "sage" | "neon" | "gold";
  size: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span
      className={cn(
        "inline-block border-2 bg-bg/80 font-display italic tracking-[0.12em] backdrop-blur-sm",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        size === "xl" && "px-3 py-1.5 text-lg",
        tone === "rose" && "border-rose text-rose",
        tone === "amber" && "border-amber text-amber",
        tone === "sage" && "border-sage text-sage",
        tone === "neon" && "border-neon-pink text-neon-pink",
        tone === "gold" && "border-gold text-gold",
      )}
    >
      {children}
    </span>
  );
}

function Seal({ preview }: { preview?: boolean }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-gold text-center font-display italic leading-none text-bg shadow-[0_0_18px_rgb(232_197_107/0.45)]",
        preview ? "size-12 text-[9px]" : "size-14 text-[10px]",
      )}
    >
      Gold
      <br />
      Seal
    </span>
  );
}

function Buckle({ preview }: { preview?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border-2 border-gold bg-gold-deep px-2 py-1 font-display italic text-gold",
        preview ? "text-[10px]" : "text-sm",
      )}
    >
      Belt
    </span>
  );
}
