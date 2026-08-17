import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BoardPayload } from "@/lib/server/circuit";
import { submitScoresBatch } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { SCORE_BLURB, STATUS_LABEL, STATUS_ORDER, type MetricStatus } from "@/lib/circuit/types";
import { statusClass } from "./pieces";
import { cn } from "@/lib/utils";
import { Seed } from "./pieces";

const CYCLE: MetricStatus[] = [...STATUS_ORDER];

function nextStatus(s: MetricStatus): MetricStatus {
  const i = CYCLE.indexOf(s);
  return CYCLE[(i + 1) % CYCLE.length];
}

function StatusBtn({
  status,
  disabled,
  onClick,
  className,
}: {
  status: MetricStatus;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-11 rounded-sm border text-xs uppercase tracking-[0.1em]",
        statusClass(status, true),
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </button>
  );
}

function ReviewBtns({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "size-11 rounded-sm border text-xs tabular",
            value === n ? "border-bone bg-bone/15 text-fg" : "border-line text-muted",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function ScoreSheet({ board }: { board: BoardPayload }) {
  const week = board.circuit.currentWeek;
  const weekState = board.weeks.find((w) => w.weekNumber === week);
  const ids = [
    ...new Set(
      board.matchups.filter((m) => m.weekNumber === week).flatMap((m) => m.fighterIds),
    ),
  ];
  const fighters = (
    ids.length
      ? ids.map((id) => board.fighters.find((f) => f.id === id))
      : board.fighters
  )
    .filter(Boolean)
    .sort((a, b) => (a!.seed ?? 99) - (b!.seed ?? 99) || a!.lastName.localeCompare(b!.lastName));

  const [filter, setFilter] = useState("");

  const initial = useMemo(() => {
    const map: Record<string, { statuses: MetricStatus[]; reviews: number }> = {};
    for (const f of fighters) {
      if (!f) continue;
      const s = board.scores.find((x) => x.fighterId === f.id && x.weekNumber === week);
      map[f.id] = {
        statuses: s?.statuses ?? board.metrics.map(() => "red" as MetricStatus),
        reviews: s?.reviews ?? 0,
      };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.circuit.id, week, board.scores.length]);

  const [rows, setRows] = useState(initial);
  const save = useBoardMutation((d: Parameters<typeof submitScoresBatch>[0]["data"]) =>
    submitScoresBatch({ data: d }),
  );
  const open = weekState?.status === "open";
  const locked = weekState?.status === "locked";

  function setStatus(id: string, i: number, s: MetricStatus) {
    setRows((prev) => {
      const cur = prev[id] ?? { statuses: board.metrics.map(() => "red" as MetricStatus), reviews: 0 };
      const statuses = [...cur.statuses];
      statuses[i] = s;
      return { ...prev, [id]: { ...cur, statuses } };
    });
  }

  function setReviews(id: string, reviews: number) {
    setRows((prev) => {
      const cur = prev[id] ?? { statuses: board.metrics.map(() => "red" as MetricStatus), reviews: 0 };
      return { ...prev, [id]: { ...cur, reviews } };
    });
  }

  function saveSheet() {
    save.mutate(
      {
        slug: board.circuit.slug,
        weekNumber: week,
        rows: Object.entries(rows).map(([fighterId, r]) => ({
          fighterId,
          statuses: r.statuses,
          reviews: r.reviews,
        })),
      },
      {
        onSuccess: () => toast.success("Sheet saved."),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  const shown = fighters.filter((f) => {
    if (!f || !filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      f.nickname.toLowerCase().includes(q) ||
      f.firstName.toLowerCase().includes(q) ||
      f.lastName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-subtle">Week {week} scoresheet</p>
          <h2 className="font-display text-3xl">Mark the cards</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Tap a metric to cycle Red → Orange → Blue → Green. No password. {SCORE_BLURB}
          </p>
        </div>
        <Button disabled={!open || save.isPending} onClick={saveSheet}>
          {save.isPending ? "Saving…" : "Save sheet"}
        </Button>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Find someone"
        className="h-11 w-full max-w-sm rounded-sm border border-line bg-raised px-3 text-sm text-fg placeholder:text-subtle"
      />

      <div className="space-y-3 lg:hidden">
        {shown.map((f) => {
          if (!f) return null;
          const row = rows[f.id] ?? {
            statuses: board.metrics.map(() => "red" as MetricStatus),
            reviews: 0,
          };
          const card = scorecard(row.statuses, row.reviews);
          return (
            <article key={f.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <Seed n={f.seed} /> {f.nickname}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {f.firstName} {f.lastName}
                  </p>
                </div>
                <p className="tabular text-sm">
                  {card.points}
                  <span className="text-subtle"> pts</span>
                  {card.sweep ? <span className="ml-1 text-sage">sweep</span> : null}
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {board.metrics.map((m, i) => {
                  const s = row.statuses[i] ?? "red";
                  return (
                    <li key={m.id} className="grid grid-cols-[1fr_5.5rem] items-center gap-2">
                      <span className="text-sm text-muted">{m.label}</span>
                      <StatusBtn
                        status={s}
                        disabled={!open}
                        onClick={() => setStatus(f.id, i, nextStatus(s))}
                        className="w-full"
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.12em] text-subtle">Reviews</span>
                <ReviewBtns
                  value={row.reviews}
                  disabled={!open}
                  onChange={(n) => setReviews(f.id, n)}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-line lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-raised text-left text-xs uppercase tracking-[0.12em] text-subtle">
            <tr>
              <th className="px-3 py-3 font-medium">Wrestler</th>
              {board.metrics.map((m) => (
                <th key={m.id} className="px-2 py-3 font-medium">
                  {m.label}
                </th>
              ))}
              <th className="px-2 py-3 font-medium">Reviews</th>
              <th className="px-3 py-3 font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((f) => {
              if (!f) return null;
              const row = rows[f.id] ?? {
                statuses: board.metrics.map(() => "red" as MetricStatus),
                reviews: 0,
              };
              const card = scorecard(row.statuses, row.reviews);
              return (
                <tr key={f.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Seed n={f.seed} />
                      <div>
                        <p className="font-medium">{f.nickname}</p>
                        <p className="text-xs text-muted">
                          {f.firstName} {f.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  {board.metrics.map((m, i) => {
                    const s = row.statuses[i] ?? "red";
                    return (
                      <td key={m.id} className="px-2 py-2">
                        <StatusBtn
                          status={s}
                          disabled={!open}
                          onClick={() => setStatus(f.id, i, nextStatus(s))}
                          className="w-full min-w-16"
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2">
                    <ReviewBtns
                      value={row.reviews}
                      disabled={!open}
                      onChange={(n) => setReviews(f.id, n)}
                    />
                  </td>
                  <td className="px-3 py-2 tabular font-medium">
                    {card.points}
                    {card.sweep ? <span className="ml-1 text-xs text-sage">sweep</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {locked ? (
        <p className="text-sm text-amber">Scores are locked. The commissioner can unlock them from the desk.</p>
      ) : !open ? (
        <p className="text-sm text-subtle">This week is not open for scoring.</p>
      ) : null}
    </div>
  );
}
