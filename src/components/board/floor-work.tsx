import { Star } from "lucide-react";
import { toast } from "sonner";
import type { BoardPayload } from "@/lib/server/circuit";
import { completeFloorTask } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import { beltOf, weekJobs } from "@/lib/circuit/floor-work";
import { pickStarCount } from "@/lib/circuit/crowd";
import { weekAcceptsScores } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";

export function StarBelt({
  earned,
  bank,
  compact,
}: {
  earned: number;
  bank?: number;
  compact?: boolean;
}) {
  const shown = Math.max(5, Math.min(12, earned || 5));
  return (
    <div className={cn("flex flex-wrap items-center gap-1", compact && "gap-0.5")}>
      {Array.from({ length: shown }, (_, i) => (
        <Star
          key={i}
          className={cn(
            compact ? "size-3" : "size-3.5",
            i < earned ? "fill-amber text-amber" : "text-subtle",
          )}
        />
      ))}
      <span className="ml-1.5 tabular text-[11px] uppercase tracking-[0.14em] text-subtle">
        {earned} star{earned === 1 ? "" : "s"}
        {typeof bank === "number" ? ` · ${bank} to spend` : ""}
      </span>
    </div>
  );
}

export function FloorWorkList({
  board,
  fighterId,
  passcode,
  onBoard,
}: {
  board: BoardPayload;
  fighterId: string;
  passcode?: string;
  onBoard?: (next: BoardPayload) => void;
}) {
  const week = board.circuit.currentWeek;
  const jobs = weekJobs(fighterId, week, board.floorWork, board.jobCatalog ?? []);
  const open = weekAcceptsScores(board.weeks.find((w) => w.weekNumber === week)?.status ?? "");
  const bank = beltOf(fighterId, board.floorWork, board.beltItems, pickStarCount(fighterId, board.picks ?? [], board.matchups));
  const save = useBoardMutation((d: Parameters<typeof completeFloorTask>[0]["data"]) =>
    completeFloorTask({ data: d }),
  );

  if (jobs.length === 0) {
    return <p className="text-sm text-subtle">This week’s jobs print when the locker opens.</p>;
  }

  return (
    <div>
      <StarBelt earned={bank.earned} bank={bank.bank} />
      <ul className="mt-4 space-y-2">
        {jobs.map((job) => {
          const clickable = Boolean(passcode) && open && !save.isPending;
          return (
            <li key={job.taskId}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => {
                  if (!passcode) return;
                  save.mutate(
                    { passcode, taskId: job.taskId, weekNumber: week, done: !job.done },
                    {
                      onSuccess: (next) => {
                        onBoard?.(next);
                        toast.success(job.done ? "Star taken back." : `+${job.stars} on the belt.`);
                      },
                      onError: (err) => toast.error(err.message),
                    },
                  );
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left",
                  job.done ? "border-amber/40 bg-amber/10" : "border-line bg-bg/30",
                  clickable && "hover:bg-raised",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border",
                    job.done ? "border-amber bg-amber text-bg" : "border-line text-transparent",
                  )}
                >
                  <Star className="size-3 fill-current" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("text-sm font-medium", job.done ? "text-amber" : "text-fg")}>
                      {job.def.title}
                    </span>
                    <span className="shrink-0 tabular text-[11px] uppercase tracking-[0.14em] text-subtle">
                      {job.stars}★
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{job.def.blurb}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!passcode ? (
        <p className="mt-3 text-xs text-subtle">Open My locker with your passcode to check these off.</p>
      ) : !open ? (
        <p className="mt-3 text-xs text-subtle">Week is locked. Stars already earned stay on the belt.</p>
      ) : (
        <p className="mt-3 text-xs text-subtle">Tap a job when it is done. Stars go on your belt.</p>
      )}
    </div>
  );
}
