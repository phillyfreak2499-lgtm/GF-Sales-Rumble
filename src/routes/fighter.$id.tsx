import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BracketChip, MetricPips, MonoMark, Seed } from "@/components/board/pieces";
import { Badge } from "@/components/ui/badge";
import { useBoard, standingOf } from "@/lib/use-board";
import { scorecard } from "@/lib/circuit/engine";
import { formatRecord, recordOf } from "@/lib/circuit/copy";
import { z } from "zod";

const search = z.object({ slug: z.string().optional() });

export const Route = createFileRoute("/fighter/$id")({
  validateSearch: search,
  component: FighterPage,
});

function FighterPage() {
  const { id } = Route.useParams();
  const { slug } = Route.useSearch();
  const { data: board, isPending } = useBoard(slug);
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const f = board.fighters.find((x) => x.id === id);
  if (!f) {
    return (
      <Shell>
        <p className="text-muted">Not on this locker room.</p>
      </Shell>
    );
  }
  const s = standingOf(board, f.id);
  const rec = recordOf(f.id, board.placements);
  const history = board.weeks.map((w) => {
    const score = board.scores.find((x) => x.fighterId === f.id && x.weekNumber === w.weekNumber);
    const match = board.matchups.find((m) => m.weekNumber === w.weekNumber && m.fighterIds.includes(f.id));
    const place = board.placements.find((p) => p.fighterId === f.id && p.weekNumber === w.weekNumber);
    return { w, score, match, place };
  });

  return (
    <Shell>
      <Link to="/roster" className="kicker text-subtle hover:text-fg">
        Locker room
      </Link>
      <div className="mt-4 flex items-start gap-4">
        <MonoMark first={f.firstName} last={f.lastName} className="size-16 text-lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Seed n={f.seed} />
            {s ? <BracketChip id={s.currentBracket} /> : null}
          </div>
          <h1 className="mt-1 font-display text-4xl italic leading-[0.95] sm:text-5xl">{f.nickname}</h1>
          <p className="mt-2 text-muted">
            {f.firstName} {f.lastName}
            {f.hometown ? ` · ${f.hometown}` : ""}
          </p>
        </div>
      </div>
      {f.hypeLine ? <p className="mt-6 max-w-xl text-lg text-fg">{f.hypeLine}</p> : null}
      {f.backstory ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{f.backstory}</p> : null}
      {f.funFact ? (
        <p className="mt-3 max-w-xl text-sm text-bone">
          <span className="text-xs uppercase tracking-[0.14em] text-subtle">Fun fact · </span>
          {f.funFact}
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Record" value={formatRecord(rec)} />
        <Stat label="Period pts" value={String(s?.totalPoints ?? 0)} />
        <Stat label="Greens" value={String(s?.totalGreens ?? 0)} />
        <Stat label="Sweeps" value={String(s?.totalSweeps ?? 0)} />
      </dl>

      <h2 className="mt-10 font-display text-2xl">Weeks</h2>
      <ol className="mt-4 space-y-3">
        {history.map(({ w, score, match, place }) => (
          <li key={w.weekNumber} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Week {w.weekNumber}</span>
              <Badge>{w.status}</Badge>
              {place ? <Badge tone="bone">{place.result}</Badge> : null}
              {match ? (
                <span className="text-xs uppercase tracking-[0.12em] text-subtle">{match.bracket}</span>
              ) : null}
            </div>
            {score ? (
              <div className="mt-2 flex items-center gap-3 text-sm">
                <MetricPips statuses={score.statuses} />
                <span className="tabular">{scorecard(score.statuses, score.reviews).points} pts</span>
                {score.notes ? <span className="text-muted">{score.notes}</span> : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-subtle">No card</p>
            )}
            {match && match.kind === "singles" ? (
              <p className="mt-2 text-sm text-muted">
                vs{" "}
                {match.fighterIds
                  .filter((x) => x !== f.id)
                  .map((oid) => board.fighters.find((p) => p.id === oid)?.nickname)
                  .join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-subtle">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular">{value}</dd>
    </div>
  );
}
