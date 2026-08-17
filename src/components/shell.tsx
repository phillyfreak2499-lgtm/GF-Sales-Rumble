import { Link, useRouterState } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Marquee } from "@/components/arena/ring";
import { useBoard } from "@/lib/use-board";
import { tickerItems } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Ring" },
  { to: "/how", label: "How" },
  { to: "/card", label: "Card" },
  { to: "/bouts", label: "Bouts" },
  { to: "/roster", label: "Locker" },
  { to: "/report", label: "Gazette" },
  { to: "/honors", label: "Heat" },
  { to: "/score", label: "My locker" },
  { to: "/desk", label: "Desk" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const { data: board } = useBoard();
  const ticker = tickerItems(board?.circuit.tickerText);

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="no-print sticky top-0 z-40 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src="/waterman.jpg"
              alt="Waterman Arch Supports"
              className="h-8 w-auto max-w-[140px] object-contain object-left"
            />
            <span className="hidden leading-none sm:block">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-bone">Waterman</span>
              <span className="font-display text-2xl italic tracking-tight text-fg">Rumble</span>
            </span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const on = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
              const score = l.to === "/score";
              const heat = l.to === "/honors";
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-sm px-3 py-2 text-sm transition-colors",
                    on && !score && !heat && "bg-raised text-fg",
                    !on && !score && !heat && "text-muted hover:text-fg",
                    score && on && "bg-amber text-bg",
                    score && !on && "bg-amber/15 text-amber hover:bg-amber/25",
                    heat && on && "bg-rose/25 text-rose",
                    heat && !on && "text-rose/80 hover:text-rose",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {isPending ? (
              <div className="h-8 w-24 animate-pulse rounded-sm bg-raised" />
            ) : (
              <>
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/login"
                    className="rounded-sm border border-line px-3 py-2 text-sm text-fg"
                  >
                    Sign in
                  </Link>
                </SignedOut>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {LINKS.map((l) => {
            const on = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            const score = l.to === "/score";
            const heat = l.to === "/honors";
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-2 text-sm",
                  on && !score && !heat && "bg-raised text-fg",
                  !on && !score && !heat && "text-muted",
                  score && on && "bg-amber text-bg",
                  score && !on && "bg-amber/15 text-amber",
                  heat && on && "bg-rose/25 text-rose",
                  heat && !on && "text-rose/80",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-y border-rose/30 bg-gradient-to-r from-rose/20 via-surface to-steel/20"><Marquee items={ticker} /></div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="no-print mt-8">
        <div className="rope-rule" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <Link to="/how" className="text-xs uppercase tracking-[0.16em] text-subtle hover:text-fg">
            Waterman · Period 10 · How it works
          </Link>
          <Link to="/score" className="text-sm text-bone hover:text-fg">
            Open my locker
          </Link>
        </div>
      </footer>
    </div>
  );
}
