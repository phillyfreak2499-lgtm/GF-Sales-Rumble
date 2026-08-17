import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { scorecard } from "@/lib/circuit/engine";
import { STATUS_LABEL, STATUS_ORDER, type Metric, type MetricStatus } from "@/lib/circuit/types";
import { statusClass } from "./pieces";
import { cn } from "@/lib/utils";

export function ScorePad({
  metrics,
  initialStatuses,
  initialReviews,
  initialNotes,
  disabled,
  pending,
  onSubmit,
}: {
  metrics: Metric[];
  initialStatuses?: MetricStatus[];
  initialReviews?: number;
  initialNotes?: string;
  disabled?: boolean;
  pending?: boolean;
  onSubmit: (d: { statuses: MetricStatus[]; reviews: number; notes: string }) => void;
}) {
  const [statuses, setStatuses] = useState<MetricStatus[]>(
    () => initialStatuses ?? metrics.map(() => "red" as MetricStatus),
  );
  const [reviews, setReviews] = useState(initialReviews ?? 0);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const card = useMemo(() => scorecard(statuses, reviews), [statuses, reviews]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ statuses, reviews, notes });
      }}
    >
      <ul className="space-y-3">
        {metrics.map((m, i) => (
          <li key={m.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-fg">{m.label}</span>
            <div className="flex flex-wrap gap-1">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setStatuses((prev) => {
                      const next = [...prev];
                      next[i] = s;
                      return next;
                    })
                  }
                  className={cn(
                    "h-10 min-w-16 rounded-sm border px-3 text-xs uppercase tracking-[0.12em] transition-colors",
                    statusClass(s, statuses[i] === s),
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Label>Named 5-star reviews</Label>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => setReviews(n)}
              className={cn(
                "size-11 rounded-sm border text-sm tabular",
                reviews === n ? "border-bone bg-bone/15 text-fg" : "border-line text-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Note</Label>
        <Textarea
          id="notes"
          className="mt-2"
          value={notes}
          disabled={disabled}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional — what moved the card"
        />
      </div>

      <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-subtle">This card</p>
          <p className="font-display text-3xl tabular leading-none">{card.points}</p>
          <p className="mt-1 text-sm text-muted">
            {card.greens} green · {card.blues} blue · {card.oranges} orange
            {card.bonus ? ` · +${card.bonus} extra` : ""}
            {card.sweep ? " · sweep" : ""}
          </p>
        </div>
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Saving…" : "Post card"}
        </Button>
      </div>
    </form>
  );
}
