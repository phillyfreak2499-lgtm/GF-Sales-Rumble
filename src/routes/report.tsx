import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { BoutList } from "@/components/board/bout-card";
import { Badge } from "@/components/ui/badge";
import { PageHead, RingCard } from "@/components/arena/ring";
import { AnnouncerPlate, StyleRail } from "@/components/arena/announcer";
import { useAnnounceStyle } from "@/lib/use-announce";
import { useBoard } from "@/lib/use-board";

export const Route = createFileRoute("/report")({ component: ReportPage });

function ReportPage() {
  const { data: board, isPending } = useBoard();
  const { style, choose, meta } = useAnnounceStyle();
  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  const issues = [...board.gazette].sort(
    (a, b) => b.weekNumber - a.weekNumber || a.kind.localeCompare(b.kind),
  );
  const liveWeek = board.circuit.currentWeek;

  return (
    <Shell>
      <PageHead
        kicker="The Floor Gazette"
        title="This week’s paper"
        lede="Previews before the week. Recaps after it locks. Flip the style — same facts, different voice."
      />

      <div className="mt-8">
        <AnnouncerPlate compact line={meta.intro} />
      </div>
      <div className="mt-8">
        <StyleRail value={style} onChange={choose} />
      </div>

      <section className="mt-10">
        <p className="kicker">This week’s write-ups</p>
        <h2 className="mb-4 mt-2 font-display text-3xl italic">Week {liveWeek}</h2>
        {board.matchups.some((m) => m.weekNumber === liveWeek) ? (
          <BoutList board={board} week={liveWeek} style={style} />
        ) : (
          <RingCard className="relative overflow-hidden">
            <img src="/locker.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-25" />
            <div className="relative">
              <p className="font-display text-2xl italic">The first issue is still on the press.</p>
              <p className="mt-2 text-sm text-muted">Open week 1 and the gazette writes itself.</p>
            </div>
          </RingCard>
        )}
      </section>

      <div className="mt-12 space-y-6">
        <p className="kicker">Back issues</p>
        {issues.length === 0 ? <p className="text-muted">No issues yet.</p> : null}
        {issues.map((g) => (
          <RingCard key={g.id} className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{g.kind}</Badge>
              <span className="kicker text-subtle">Week {g.weekNumber}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl italic leading-tight sm:text-3xl">{g.headline}</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{g.body}</div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-subtle">
              Floor Gazette · {g.kind}
            </p>
          </RingCard>
        ))}
      </div>
    </Shell>
  );
}
