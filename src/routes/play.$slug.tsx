import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { FLOOR_GAMES, floorGame } from "@/lib/circuit/floor-games";

export const Route = createFileRoute("/play/$slug")({
  component: PlayPage,
});

function PlayPage() {
  const { slug } = Route.useParams();
  const game = floorGame(slug);

  if (!game) {
    return (
      <Shell>
        <p className="text-muted">That game is not on the card.</p>
        <ul className="mt-4 space-y-2">
          {FLOOR_GAMES.map((g) => (
            <li key={g.slug}>
              <Link to="/play/$slug" params={{ slug: g.slug }} className="text-bone hover:underline">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </Shell>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-raised px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="kicker truncate">{game.kicker}</p>
          <p className="truncate font-display text-xl italic leading-none">{game.title}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/score">Back to locker</Link>
        </Button>
      </div>
      <iframe
        title={game.title}
        src={game.file}
        className="min-h-0 w-full flex-1 border-0 bg-bg"
        allow="autoplay"
      />
    </div>
  );
}
