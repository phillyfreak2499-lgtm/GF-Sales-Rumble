import { ANNOUNCE_STYLES, type AnnounceStyle } from "@/lib/circuit/announce";
import { cn } from "@/lib/utils";

export function AnnouncerPlate({
  line,
  compact,
  className,
}: {
  line?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-ring)]",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-7",
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-2 rounded-lg ring-1 ring-bone/20" />
      <div className="relative min-w-0">
        <p className="kicker">The Floor Gazette</p>
        <p className={cn("font-display italic leading-tight", compact ? "mt-1 text-2xl" : "mt-1 text-3xl sm:text-4xl")}>
          How the card sounds
        </p>
        <p className={cn("text-sm leading-relaxed text-muted", compact ? "mt-1.5" : "mt-3 max-w-md")}>
          {line ?? "Same facts. Four voices. Flip the desk and the write-up changes."}
        </p>
      </div>
    </aside>
  );
}

export function MicByline({
  kind = "preview",
  desk,
}: {
  kind?: "preview" | "recap";
  desk?: string;
}) {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
      Floor Gazette
      <span className="text-line">·</span>
      {desk ?? (kind === "recap" ? "Recap" : "Preview")}
    </p>
  );
}

export function StyleRail({
  value,
  onChange,
}: {
  value: AnnounceStyle;
  onChange: (s: AnnounceStyle) => void;
}) {
  return (
    <div>
      <p className="kicker">Write-up style</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ANNOUNCE_STYLES.map((s) => {
          const on = s.id === value;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onChange(s.id)}
                className={cn(
                  "h-full w-full rounded-lg border px-3 py-3 text-left transition-colors",
                  on ? "border-bone bg-bone/10 text-fg" : "border-line bg-surface text-muted hover:text-fg",
                )}
              >
                <span className="block text-[11px] uppercase tracking-[0.14em] text-bone">{s.desk}</span>
                <span className="mt-1 block font-display text-xl italic leading-tight">{s.name}</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted">{s.blurb}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
