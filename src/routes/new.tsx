import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createCircuit } from "@/lib/server/circuit";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/new")({ component: NewCircuit });

function NewCircuit() {
  const { user, isPending } = useCurrentUserState();
  const nav = useNavigate();
  const [name, setName] = useState("Period 10 Rumble");
  const [period, setPeriod] = useState("P10");
  const [weeks, setWeeks] = useState<4 | 5>(4);
  const [p1, setP1] = useState("$150");
  const [p2, setP2] = useState("$50");
  const [p3, setP3] = useState("Lunch");
  const [byes, setByes] = useState("0");
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <Shell>
        <div className="h-32 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <Shell>
      <Link to="/desk" className="text-sm text-muted hover:text-fg">
        Desk
      </Link>
      <h1 className="mt-2 font-display text-4xl">Open a circuit</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Name it, set the purse, pick four or five weeks. Fill the locker, set the seeds, then ring
        the bell. Pairings, drops, bout write-ups, and the gazette run themselves.
      </p>
      <form
        className="mt-8 max-w-md space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const board = await createCircuit({
              data: {
                name,
                periodLabel: period,
                weeks,
                prizeMain: p1,
                prizeRedemption: p2,
                prizeRumble: p3,
                week1Byes: Number(byes) || 0,
              },
            });
            toast.success("Circuit created. Add the roster.");
            nav({ to: "/desk" });
            void board;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <Label>Name</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Period label</Label>
          <Input className="mt-1.5" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div>
          <Label>Length</Label>
          <div className="mt-1.5 flex gap-2">
            {([4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWeeks(n)}
                className={`h-11 flex-1 rounded-sm border text-sm ${
                  weeks === n ? "border-bone bg-bone/10" : "border-line text-muted"
                }`}
              >
                {n} weeks
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Week 1 byes for top seeds</Label>
          <Input className="mt-1.5" value={byes} onChange={(e) => setByes(e.target.value)} />
        </div>
        <div>
          <Label>Main prize</Label>
          <Input className="mt-1.5" value={p1} onChange={(e) => setP1(e.target.value)} />
        </div>
        <div>
          <Label>Redemption prize</Label>
          <Input className="mt-1.5" value={p2} onChange={(e) => setP2(e.target.value)} />
        </div>
        <div>
          <Label>Rumble prize</Label>
          <Input className="mt-1.5" value={p3} onChange={(e) => setP3(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Opening…" : "Create circuit"}
        </Button>
      </form>
    </Shell>
  );
}
