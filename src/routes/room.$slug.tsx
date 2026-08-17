import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LockerHub } from "@/components/board/locker-hub";
import { LockerGate } from "@/components/board/locker-gate";
import { MetalLocker } from "@/components/board/metal-locker";
import { saveStoreRoom, lookupClaim, type BoardPayload } from "@/lib/server/circuit";
import { useBoard, useBoardMutation, onTheBook } from "@/lib/use-board";
import {
  ROOM_HANDLES,
  ROOM_MARKS,
  ROOM_PAINTS,
  STORE_BY_SLUG,
  emptyRoom,
  roomPaintClass,
  storeSlugOf,
  type RoomHandle,
  type RoomMark,
  type RoomPaint,
} from "@/lib/circuit/stores";
import { readLockerPass, clearLockerPass } from "@/lib/circuit/locker-session";
import { roleOf } from "@/lib/circuit/house";
import { normalizePasscode } from "@/lib/circuit/passcode";
import type { Fighter } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room/$slug")({ component: RoomPage });

function RoomPage() {
  const { slug } = Route.useParams();
  const store = STORE_BY_SLUG[slug];
  const { data: board, isPending } = useBoard();
  const save = useBoardMutation((d: Parameters<typeof saveStoreRoom>[0]["data"]) =>
    saveStoreRoom({ data: d }),
  );
  const [openPaint, setOpenPaint] = useState(false);
  const [pass, setPass] = useState(() => readLockerPass());
  const [asking, setAsking] = useState<Fighter | null>(null);
  const [open, setOpen] = useState<{ fighter: Fighter; board: BoardPayload; passcode: string } | null>(null);

  const room = useMemo(() => {
    if (!board) return emptyRoom(slug);
    return board.rooms?.find((r) => r.slug === slug) ?? emptyRoom(slug);
  }, [board, slug]);
  const [paint, setPaint] = useState<RoomPaint>(room.paint as RoomPaint);
  const [accent, setAccent] = useState<RoomPaint>(room.accent as RoomPaint);
  const [motto, setMotto] = useState(room.motto);
  const [mark, setMark] = useState<RoomMark>((room.mark || "") as RoomMark);
  const [handle, setHandle] = useState<RoomHandle>((room.handle || "brass") as RoomHandle);

  useEffect(() => {
    setPaint(room.paint as RoomPaint);
    setAccent(room.accent as RoomPaint);
    setMotto(room.motto);
    setMark((room.mark || "") as RoomMark);
    setHandle((room.handle || "brass") as RoomHandle);
  }, [room.paint, room.accent, room.motto, room.mark, room.handle]);

  async function tryOpen(fighter: Fighter) {
    const saved = readLockerPass();
    if (saved) {
      try {
        const res = await lookupClaim({ data: { code: saved } });
        if (res && res.fighter.id === fighter.id) {
          setOpen({ ...res, passcode: normalizePasscode(saved) });
          return;
        }
      } catch {
        /* ask */
      }
    }
    setAsking(fighter);
  }

  if (isPending || !board) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </Shell>
    );
  }
  if (!store) {
    return (
      <Shell>
        <p className="text-muted">That locker room is not on the book.</p>
        <Link to="/roster" className="mt-3 inline-block text-sm text-bone">
          Back to the hallway
        </Link>
      </Shell>
    );
  }

  const crew = onTheBook(board.fighters)
    .filter((f) => storeSlugOf(f.store) === slug)
    .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99) || a.lastName.localeCompare(b.lastName));

  if (open) {
    return (
      <Shell>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-subtle hover:text-fg"
            onClick={() => {
              setOpen(null);
            }}
          >
            Close locker · back to {store.short}
          </button>
          <Button
            variant="ghost"
            onClick={() => {
              clearLockerPass();
              setOpen(null);
            }}
          >
            Sign out
          </Button>
        </div>
        <LockerHub
          board={open.board}
          fighter={open.fighter}
          passcode={open.passcode}
          onBoard={(next) => setOpen((cur) => (cur ? { ...cur, board: next, fighter: next.fighters.find((f) => f.id === cur.fighter.id) ?? cur.fighter } : cur))}
          onLeave={() => setOpen(null)}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/roster" className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-subtle hover:text-fg">
        Hallway
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{store.name}</p>
          <h1 className="mt-1 font-display text-5xl italic leading-none">{store.short}</h1>
          {room.motto ? <p className="mt-2 font-display text-xl italic text-bone">“{room.motto}”</p> : null}
        </div>
        <Button variant="outline" onClick={() => setOpenPaint((v) => !v)}>
          {openPaint ? "Close the door shop" : "Paint this door"}
        </Button>
      </div>

      {openPaint ? (
        <form
          className="mt-6 max-w-xl space-y-3 rounded-xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(
              {
                slug: board.circuit.slug,
                storeSlug: store.slug,
                paint,
                accent,
                motto,
                mark,
                handle,
                passcode: pass,
              },
              {
                onSuccess: () => toast.success("Door painted."),
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <p className="text-sm text-muted">Anyone who works this store can change the door. Use your passcode.</p>
          <div>
            <Label htmlFor="room-pass">Passcode</Label>
            <Input id="room-pass" className="mt-1.5" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" />
          </div>
          <Swatch label="Door color" options={ROOM_PAINTS} value={paint} onChange={setPaint} />
          <Swatch label="Rope" options={ROOM_PAINTS} value={accent} onChange={setAccent} />
          <Swatch label="Handle" options={ROOM_HANDLES} value={handle} onChange={setHandle} />
          <Swatch label="Sticker" options={ROOM_MARKS.map((m) => ({ id: m.id, name: m.name }))} value={mark} onChange={setMark} />
          <div>
            <Label htmlFor="motto">Motto · eight words</Label>
            <Input id="motto" className="mt-1.5" value={motto} onChange={(e) => setMotto(e.target.value)} />
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save the door"}
          </Button>
        </form>
      ) : null}

      <section className={cn("locker-hall mt-8", roomPaintClass(room.paint), `room-rope-${room.accent}`)}>
        <p className="mb-4 text-sm text-muted">Tap a locker. It asks for that person’s passcode, then it opens.</p>
        {crew.length ? (
          <div className="locker-grid">
            {crew.map((f, i) => (
              <MetalLocker key={f.id} fighter={f} number={i + 1} role={roleOf(board.houseCalls, f.id, board.circuit.currentWeek)} onOpen={() => tryOpen(f)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Empty room. Pick this store as home in My locker.</p>
        )}
      </section>

      {asking ? (
        <LockerGate fighter={asking} onClose={() => setAsking(null)} onOpen={(next) => { setAsking(null); setOpen(next); }} />
      ) : null}
    </Shell>
  );
}

function Swatch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: T; name: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id || "none"}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-sm border px-3 py-2 text-sm",
              value === opt.id ? "border-bone bg-bone/15 text-fg" : "border-line text-muted",
            )}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}
