import { toast } from "sonner";
import { RingCard } from "@/components/arena/ring";
import type { BoardPayload } from "@/lib/server/circuit";
import { buyBeltItem, equipPlate } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import {
  BELT_SHOP,
  TIER_LABEL,
  beltOf,
  type BeltItem,
  type PlateSlot,
  type PlateTier,
} from "@/lib/circuit/floor-work";
import { pickStarCount } from "@/lib/circuit/crowd";
import type { Fighter } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";
import { StarBelt } from "./floor-work";
import { plateBgClass, plateBorderClass, PlateMark, PlateSticker } from "./nameplate";
import { mvpWeeksOf, titanOn, Titantron } from "./titantron";
import { foundOn } from "./house-sash";
import { standingOf } from "@/lib/use-board";
import { useHeat } from "@/lib/use-board";
import { Badge } from "@/components/ui/badge";

const SLOTS: Array<{ id: PlateSlot; label: string; lede: string }> = [
  { id: "border", label: "Borders", lede: "Cheap rope first. Neon glow later. Gold last." },
  { id: "bg", label: "Backgrounds", lede: "Wash the plate. Foil is the week-4 flex." },
  { id: "mark", label: "Marks", lede: "Small tags next to your name." },
  { id: "sticker", label: "Stickers", lede: "The big ones. More stars, bigger stamp." },
  { id: "fx", label: "Lights", lede: "Titantron is MVP only. Lost-and-found is Floor 3 only." },
];

const TIER_TONE: Record<PlateTier, "default" | "steel" | "sage" | "amber" | "bone"> = {
  house: "default",
  bright: "steel",
  neon: "sage",
  gold: "amber",
  legend: "bone",
};

function wearing(fighter: Fighter, item: BeltItem) {
  if (item.slot === "border") {
    return fighter.plateBorder === itemToWear(item);
  }
  if (item.slot === "bg") return fighter.plateBg === item.swatch;
  if (item.slot === "sticker") return (fighter.plateSticker || "") === (item.sticker ?? item.swatch);
  if (item.slot === "fx") {
    if (item.swatch === "off") return fighter.plateFx === "off";
    if (item.swatch === "found") return fighter.plateFx === "found";
    return titanOn(fighter.plateFx, true) && item.swatch === "titan" && fighter.plateFx !== "off" && fighter.plateFx !== "found";
  }
  return fighter.plateMark === (item.mark ?? "");
}

function itemToWear(item: BeltItem) {
  if (item.id === "border-double") return "double";
  if (item.id === "border-gold-double") return "gold-double";
  return item.swatch;
}

export function BeltShop({
  board,
  fighter,
  passcode,
  onBoard,
}: {
  board: BoardPayload;
  fighter: Fighter;
  passcode: string;
  onBoard: (next: BoardPayload) => void;
}) {
  const bank = beltOf(fighter.id, board.floorWork, board.beltItems, pickStarCount(fighter.id, board.picks ?? [], board.matchups));
  const heat = useHeat(board);
  const mvpWeeks = mvpWeeksOf(heat?.honors, fighter.id);
  const earnedTitan = mvpWeeks.length > 0;
  const onRumble = standingOf(board, fighter.id)?.currentBracket === "rumble";
  const earnedFound = onRumble || bank.owned.has("fx-found") || fighter.plateFx === "found";
  const buy = useBoardMutation((d: Parameters<typeof buyBeltItem>[0]["data"]) =>
    buyBeltItem({ data: d }),
  );
  const wear = useBoardMutation((d: Parameters<typeof equipPlate>[0]["data"]) =>
    equipPlate({ data: d }),
  );

  function act(item: BeltItem) {
    const owned = bank.owned.has(item.id);
    const fn = owned ? wear : buy;
    fn.mutate(
      { passcode, itemId: item.id },
      {
        onSuccess: (next) => {
          onBoard(next);
          toast.success(owned ? "Wearing it." : `Unlocked · ${item.cost} stars`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-8">
      <RingCard className={cn("overflow-hidden p-5 sm:p-6", fighter.plateSticker && "pb-16", plateBgClass(fighter.plateBg), plateBorderClass(fighter.plateBorder))}>
        <PlateSticker id={fighter.plateSticker} />
        <p className="kicker">The belt</p>
        <h2 className="mt-1 font-display text-3xl italic">
          <PlateMark mark={fighter.plateMark} />
          Make week 4 loud
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Floor jobs pay stars. House paint is cheap. Neon costs a real week. Gold and the big
          stickers are what you save for. The locker should look like you worked for it.
        </p>
        <div className="mt-4">
          <StarBelt earned={bank.earned} bank={bank.bank} />
        </div>
      </RingCard>

      {SLOTS.map((slot) => (
        <div key={slot.id}>
          <p className="kicker">{slot.label}</p>
          <p className="mt-1 text-sm text-muted">{slot.lede}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BELT_SHOP.filter((i) => i.slot === slot.id)
              .slice()
              .sort((a, b) => a.cost - b.cost)
              .map((item) => {
                const owned =
                  bank.owned.has(item.id) ||
                  (item.earn === "mvp" && earnedTitan) ||
                  (item.earn === "rumble" && earnedFound) ||
                  (item.earn === "challenge" && bank.owned.has(item.id));
                const on = wearing(fighter, item);
                const locked =
                  (item.earn === "mvp" && !earnedTitan) ||
                  (item.earn === "rumble" && !earnedFound) ||
                  (item.earn === "challenge" && !bank.owned.has(item.id));
                const canBuy = !locked && (owned || item.cost === 0 || bank.bank >= item.cost);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={buy.isPending || wear.isPending || on || locked}
                      onClick={() => act(item)}
                      className={cn(
                        "flex h-full w-full flex-col rounded-xl border px-4 py-4 text-left transition-colors",
                        on ? "border-bone bg-bone/10" : "border-line bg-surface hover:bg-raised",
                        !canBuy && !owned && "opacity-70",
                      )}
                    >
                      <span className="mb-3 flex items-center justify-between gap-2">
                        <Preview item={item} />
                        <Badge tone={TIER_TONE[item.tier]}>{TIER_LABEL[item.tier]}</Badge>
                      </span>
                      <span className="font-display text-xl italic leading-tight">{item.name}</span>
                      <span className="mt-1 text-sm text-muted">{item.blurb}</span>
                      <span className="mt-3 text-[11px] uppercase tracking-[0.14em] text-subtle">
                        {locked
                          ? item.earn === "rumble"
                            ? "Get to Floor 3"
                            : item.earn === "challenge"
                              ? "Claim the desk challenge"
                              : "Win MVP of the Week"
                          : on
                            ? "Wearing"
                            : owned
                              ? "Wear it"
                              : item.cost === 0
                                ? "Free"
                                : canBuy
                                  ? `${item.cost} stars`
                                  : `Need ${item.cost}`}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Preview({ item }: { item: BeltItem }) {
  if (item.slot === "mark") {
    return (
      <span className="grid h-10 min-w-16 place-items-center rounded-md border border-line bg-raised text-lg">
        {item.mark ? <PlateMark mark={item.mark} className="mr-0" /> : "—"}
      </span>
    );
  }
  if (item.slot === "fx") {
    return (
      <span className="relative h-14 min-w-24 overflow-hidden rounded-md border border-gold/40">
        <Titantron weeks={[1]} compact className="h-full min-h-14">
          <span className="block h-14" />
        </Titantron>
      </span>
    );
  }
  if (item.slot === "sticker") {
    return (
      <span className="relative grid h-14 min-w-24 place-items-center overflow-hidden rounded-md border border-line bg-raised">
        {item.sticker ? <PlateSticker id={item.sticker} preview /> : <span className="text-subtle">—</span>}
      </span>
    );
  }
  const border = item.slot === "border" ? itemToWear(item) : "bone";
  const bg = item.slot === "bg" ? item.swatch : "surface";
  return (
    <span className={cn("h-10 min-w-16 rounded-md border border-transparent", plateBgClass(bg), plateBorderClass(border))} />
  );
}
