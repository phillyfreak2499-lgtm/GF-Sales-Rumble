import { Link, useRouterState } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Ring" },
  { to: "/card", label: "Card" },
  { to: "/bouts", label: "Bouts" },
  { to: "/roster", label: "Locker" },
  { to: "/report", label: "Gazette" },
  { to: "/score", label: "Score" },
  { to: "/desk", label: "Desk" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-bg/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src="/waterman.jpg"
              alt="Waterman Arch Supports"
              className="h-8 w-auto max-w-[140px] object-contain object-left"
            />
            <span className="hidden font-display text-xl italic leading-none tracking-tight text-fg sm:inline">
              Rumble
            </span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const on = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
              const score = l.to === "/score";
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-sm px-3 py-2 text-sm transition-colors",
                    on && !score && "bg-raised text-fg",
                    !on && !score && "text-muted hover:text-fg",
                    score && on && "bg-bone text-bg",
                    score && !on && "bg-bone/15 text-bone hover:bg-bone/25",
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
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-2 text-sm",
                  on && !score && "bg-raised text-fg",
                  !on && !score && "text-muted",
                  score && on && "bg-bone text-bg",
                  score && !on && "bg-bone/15 text-bone",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="rope-rule" />
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="mt-8 border-t border-line/80">
        <div className="rope-rule" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <p className="text-xs uppercase tracking-[0.16em] text-subtle">
            Waterman · Period 10 · The floor fills the cards
          </p>
          <Link to="/score" className="text-sm text-bone hover:text-fg">
            Score this week
          </Link>
        </div>
      </footer>
    </div>
  );
}
