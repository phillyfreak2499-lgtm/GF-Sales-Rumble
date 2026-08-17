import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PhotoField } from "@/components/board/photo-field";
import { StoreSelect } from "@/components/board/store-select";
import { RingCard } from "@/components/arena/ring";
import { updateFighter, type BoardPayload } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import type { Fighter } from "@/lib/circuit/types";

export function LockerEdit({
  fighter,
  slug,
  passcode,
  onBoard,
  needSocks,
}: {
  fighter: Fighter;
  slug: string;
  passcode: string;
  onBoard?: (next: BoardPayload) => void;
  needSocks?: boolean;
}) {
  const [firstName, setFirstName] = useState(fighter.firstName);
  const [lastName, setLastName] = useState(fighter.lastName);
  const [nickname, setNickname] = useState(fighter.nickname);
  const [hometown, setHometown] = useState(fighter.hometown);
  const [funFact, setFunFact] = useState(fighter.funFact);
  const [store, setStore] = useState(fighter.store);
  const [walkout, setWalkout] = useState(fighter.walkout);
  const [socks, setSocks] = useState(String(fighter.socksSold ?? 0));
  const save = useBoardMutation((d: Parameters<typeof updateFighter>[0]["data"]) =>
    updateFighter({ data: d }),
  );

  useEffect(() => {
    setFirstName(fighter.firstName);
    setLastName(fighter.lastName);
    setNickname(fighter.nickname);
    setHometown(fighter.hometown);
    setFunFact(fighter.funFact);
    setStore(fighter.store);
    setWalkout(fighter.walkout);
    setSocks(String(fighter.socksSold ?? 0));
  }, [
    fighter.id,
    fighter.firstName,
    fighter.lastName,
    fighter.nickname,
    fighter.hometown,
    fighter.funFact,
    fighter.store,
    fighter.walkout,
    fighter.socksSold,
  ]);

  return (
    <RingCard className="p-5">
      <p className="kicker">Your locker</p>
      <h2 className="mt-2 font-display text-3xl italic">Update your card</h2>
      <p className="mt-2 text-sm text-muted">
        Name, ring name, store, five-word walk-out, hometown, and one fun fact. Photo
        sits next to your name on the sheet.
      </p>
      <div className="mt-4">
        <PhotoField fighter={fighter} slug={slug} passcode={passcode} markClassName="size-16 text-lg" />
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(
            {
              slug,
              fighterId: fighter.id,
              passcode,
              patch: {
                firstName,
                lastName,
                nickname,
                hometown,
                funFact,
                store,
                walkout,
                socksSold: Number(socks) || 0,
              },
            },
            {
              onSuccess: (next) => {
                onBoard?.(next);
                toast.success("Locker updated.");
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              className="mt-1.5"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              className="mt-1.5"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="nick">Nickname</Label>
          <Input id="nick" className="mt-1.5" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="store">Home store · locker room</Label>
          <div className="mt-1.5">
            <StoreSelect id="store" value={store} onChange={setStore} />
          </div>
        </div>
        <div>
          <Label htmlFor="walk">Walk-out · five words</Label>
          <Input id="walk" className="mt-1.5" value={walkout} onChange={(e) => setWalkout(e.target.value)} placeholder="Crown the ticket tonight" />
        </div>
        <div>
          <Label htmlFor="home">Hometown</Label>
          <Input id="home" className="mt-1.5" value={hometown} onChange={(e) => setHometown(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fact">One fun fact</Label>
          <Textarea id="fact" className="mt-1.5" value={funFact} onChange={(e) => setFunFact(e.target.value)} />
        </div>
        {needSocks ? (
          <div>
            <Label htmlFor="socks">Socks sold · tiebreak</Label>
            <Input
              id="socks"
              className="mt-1.5"
              inputMode="numeric"
              value={socks}
              onChange={(e) => setSocks(e.target.value.replace(/[^\d]/g, ""))}
            />
            <p className="mt-1.5 text-sm text-amber">
              You are tied on points and stars. Socks sold breaks the next seed.
            </p>
          </div>
        ) : null}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save locker"}
        </Button>
      </form>
    </RingCard>
  );
}
