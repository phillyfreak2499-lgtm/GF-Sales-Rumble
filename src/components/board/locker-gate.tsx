import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { lookupClaim, type BoardPayload } from "@/lib/server/circuit";
import { normalizePasscode } from "@/lib/circuit/passcode";
import { writeLockerPass } from "@/lib/circuit/locker-session";
import type { Fighter } from "@/lib/circuit/types";

export function LockerGate({
  fighter,
  onOpen,
  onClose,
}: {
  fighter: Fighter;
  onOpen: (next: { fighter: Fighter; board: BoardPayload; passcode: string }) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-bg/70 p-4 sm:place-items-center">
      <form
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-poster"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const res = await lookupClaim({ data: { code } });
            if (!res || res.fighter.id !== fighter.id) {
              toast.error("That passcode does not open this locker.");
              return;
            }
            const passcode = normalizePasscode(code);
            writeLockerPass(passcode);
            onOpen({ ...res, passcode });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "That passcode is not on the book.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="kicker">Locked</p>
        <h2 className="mt-2 font-display text-3xl italic">{fighter.nickname}</h2>
        <p className="mt-2 text-sm text-muted">
          This locker belongs to {fighter.firstName}. Enter the passcode from the desk.
        </p>
        <div className="mt-4">
          <Label htmlFor="locker-pass">Passcode</Label>
          <Input
            id="locker-pass"
            className="mt-1.5"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Checking…" : "Open locker"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Back to the room
          </Button>
        </div>
      </form>
    </div>
  );
}
