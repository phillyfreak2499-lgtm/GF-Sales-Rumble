export type PlateSlot = "border" | "bg" | "mark" | "sticker" | "fx";
export type PlateTier = "house" | "bright" | "neon" | "gold" | "legend";

export type BeltItem = {
  id: string;
  slot: PlateSlot;
  name: string;
  blurb: string;
  cost: number;
  swatch: string;
  mark?: string;
  sticker?: string;
  tier: PlateTier;
  earn?: "mvp" | "rumble" | "challenge";
};

export const TIER_LABEL: Record<PlateTier, string> = {
  house: "House",
  bright: "Bright",
  neon: "Neon",
  gold: "Gold",
  legend: "Week 4",
};

export type TaskPack = "sales" | "ops" | "kind";

export const PACK_LABEL: Record<TaskPack, string> = {
  sales: "Sales",
  ops: "House",
  kind: "Team",
};

export type FloorTaskDef = {
  id: string;
  title: string;
  blurb: string;
  stars: number;
  pack: TaskPack;
  live: boolean;
  custom?: boolean;
};

export const FLOOR_TASKS: FloorTaskDef[] = [
  { id: "med-2", title: "Sell two Med Massagers", blurb: "Two units out the door this week.", stars: 2, pack: "sales", live: true },
  { id: "lock-lace", title: "Sell one Lock Laces", blurb: "One pair. Easy add-on on the way out.", stars: 1, pack: "sales", live: true },
  { id: "two-shoes", title: "Sell two shoes to one guest", blurb: "One guest. Two pairs. They walk out set.", stars: 3, pack: "sales", live: true },
  { id: "socks-20", title: "Sell 20 socks this week", blurb: "Count them. Twenty pair on the week.", stars: 2, pack: "sales", live: true },
  { id: "three-step-2", title: "Sell two 3-steps this week", blurb: "Two three-step solutions. Full work, not a half fit.", stars: 3, pack: "sales", live: true },
  { id: "five-step", title: "Sell a 5-step", blurb: "The whole solution. One guest who actually needs it.", stars: 3, pack: "sales", live: true },
  { id: "ask-why", title: "Ask a guest why they came in", blurb: "Not what they want. Why they walked through the door.", stars: 2, pack: "sales", live: true },
  { id: "start-why", title: "Start one fit with the why", blurb: "Lead with the reason. Product comes second.", stars: 2, pack: "sales", live: true },

  { id: "deep-clean", title: "Deep clean the restroom or support room", blurb: "Spotless. The next guest notices before they sit.", stars: 2, pack: "ops", live: true },
  { id: "make-boxes", title: "Make boxes", blurb: "Build the stack so tomorrow is easy.", stars: 1, pack: "ops", live: true },
  { id: "make-velcro", title: "Make velcro", blurb: "Cut and ready. Nobody hunts for a strip mid-fit.", stars: 1, pack: "ops", live: true },
  { id: "windows", title: "Clean the windows", blurb: "If they cannot see in, they do not come in.", stars: 1, pack: "ops", live: true },
  { id: "harris-mats", title: "Clean the Harris mats", blurb: "Pull them. Shake them. Put them back right.", stars: 1, pack: "ops", live: true },
  { id: "trash", title: "Take out the trash", blurb: "The unglamorous job. The store smells like a store again.", stars: 1, pack: "ops", live: true },
  { id: "all-calls", title: "Make all the calls today", blurb: "The list is empty before you leave. Every name.", stars: 2, pack: "ops", live: true },

  { id: "karen-note", title: "Email Karen a nice message", blurb: "Make her day. Work-ok. Kind. No fluff she has to answer.", stars: 1, pack: "kind", live: true },
  { id: "store-call-kind", title: "Call another store and say something kind", blurb: "Pick one person on another team. Tell them something true and specific.", stars: 2, pack: "kind", live: true },
  { id: "help-task", title: "Help a coworker finish a task", blurb: "Their list, not yours. Stay until it is done.", stars: 1, pack: "kind", live: true },
  { id: "help-cart", title: "Help a coworker put their cart away", blurb: "Two people. One cart. The closer does not stay late alone.", stars: 1, pack: "kind", live: true },
  { id: "tell-nice", title: "Tell a coworker something that helps the team", blurb: "Specific. About them. The kind of thing that makes someone stand up straighter.", stars: 1, pack: "kind", live: true },
  { id: "cover-fit", title: "Cover a coworker so they can finish a fit", blurb: "You take the next guest. They stay with theirs. Nobody rushes a yes.", stars: 2, pack: "kind", live: true },
  { id: "why-close", title: "Tell the closer why a guest said yes", blurb: "Pass the reason, not just the ticket. The next person can use it.", stars: 1, pack: "kind", live: true },
  { id: "share-win", title: "Share one win with another store", blurb: "One thing that worked today. Make their afternoon easier.", stars: 1, pack: "kind", live: true },
  { id: "new-hire-fit", title: "Sit with a new hire for one fit", blurb: "Do not take over. Let them lead. You are the net.", stars: 2, pack: "kind", live: true },
  { id: "next-shift-note", title: "Leave the next shift a note about a guest", blurb: "Someone might come back. Write what they need to know.", stars: 1, pack: "kind", live: true },
];

export const TASK_BY_ID = Object.fromEntries(FLOOR_TASKS.map((t) => [t.id, t])) as Record<
  string,
  FloorTaskDef
>;

export function liveTasks(extras: FloorTaskDef[] = []) {
  const seen = new Set<string>();
  const out: FloorTaskDef[] = [];
  for (const t of [...FLOOR_TASKS, ...extras]) {
    if (!t.live || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

export const BELT_SHOP: BeltItem[] = [
  { id: "border-bone", slot: "border", name: "House rope", blurb: "The default turnbuckle.", cost: 0, swatch: "bone", tier: "house" },
  { id: "border-sage", slot: "border", name: "Green ring", blurb: "Looks like a sweep.", cost: 3, swatch: "sage", tier: "bright" },
  { id: "border-steel", slot: "border", name: "Steel cable", blurb: "Cool. Clean. Blue.", cost: 3, swatch: "steel", tier: "bright" },
  { id: "border-amber", slot: "border", name: "Heat rope", blurb: "Warm edge. Crowd notice.", cost: 4, swatch: "amber", tier: "bright" },
  { id: "border-rose", slot: "border", name: "Upset red", blurb: "You came from a loss.", cost: 4, swatch: "rose", tier: "bright" },
  { id: "border-double", slot: "border", name: "Double rope", blurb: "Two rings. Title energy.", cost: 6, swatch: "double", tier: "bright" },
  { id: "border-neon-cyan", slot: "border", name: "Ice neon", blurb: "Glows. The aisle sees you first.", cost: 10, swatch: "neon-cyan", tier: "neon" },
  { id: "border-neon-pink", slot: "border", name: "Hot neon", blurb: "Pink voltage. Cannot miss it.", cost: 10, swatch: "neon-pink", tier: "neon" },
  { id: "border-neon-lime", slot: "border", name: "Lime wire", blurb: "Electric green. Night-card energy.", cost: 11, swatch: "neon-lime", tier: "neon" },
  { id: "border-gold", slot: "border", name: "Gold rope", blurb: "Heavy. Expensive. Week 4 talk.", cost: 14, swatch: "gold", tier: "gold" },
  { id: "border-gold-double", slot: "border", name: "Gold double", blurb: "Two gold rings. Championship plate.", cost: 16, swatch: "gold-double", tier: "legend" },

  { id: "bg-surface", slot: "bg", name: "Locker slate", blurb: "The house background.", cost: 0, swatch: "surface", tier: "house" },
  { id: "bg-raised", slot: "bg", name: "Raised card", blurb: "A little more light on the name.", cost: 2, swatch: "raised", tier: "house" },
  { id: "bg-sage", slot: "bg", name: "Green wash", blurb: "Soft sage behind the plate.", cost: 4, swatch: "sage", tier: "bright" },
  { id: "bg-steel", slot: "bg", name: "Blue wash", blurb: "Steel tint. Calm heat.", cost: 4, swatch: "steel", tier: "bright" },
  { id: "bg-amber", slot: "bg", name: "Warm wash", blurb: "Amber behind the letters.", cost: 5, swatch: "amber", tier: "bright" },
  { id: "bg-rose", slot: "bg", name: "Heat wash", blurb: "A little rose in the card.", cost: 5, swatch: "rose", tier: "bright" },
  { id: "bg-neon-cyan", slot: "bg", name: "Cyan flood", blurb: "The plate lights up from inside.", cost: 10, swatch: "neon-cyan", tier: "neon" },
  { id: "bg-neon-pink", slot: "bg", name: "Pink flood", blurb: "Hot wash. Main-event lighting.", cost: 10, swatch: "neon-pink", tier: "neon" },
  { id: "bg-neon-lime", slot: "bg", name: "Lime flood", blurb: "Looks illegal. Still work-ok.", cost: 11, swatch: "neon-lime", tier: "neon" },
  { id: "bg-gold", slot: "bg", name: "Gold wash", blurb: "Warm metal behind the name.", cost: 14, swatch: "gold", tier: "gold" },
  { id: "bg-gold-foil", slot: "bg", name: "Gold foil", blurb: "The plate moves. Save for week 4.", cost: 16, swatch: "gold-foil", tier: "legend" },

  { id: "mark-none", slot: "mark", name: "No mark", blurb: "Just the name.", cost: 0, swatch: "none", mark: "", tier: "house" },
  { id: "mark-star", slot: "mark", name: "Star", blurb: "A star by the plate.", cost: 2, swatch: "amber", mark: "star", tier: "house" },
  { id: "mark-bolt", slot: "mark", name: "Bolt", blurb: "Fast closer.", cost: 3, swatch: "amber", mark: "bolt", tier: "bright" },
  { id: "mark-heat", slot: "mark", name: "Heat", blurb: "The card is hot.", cost: 3, swatch: "rose", mark: "heat", tier: "bright" },
  { id: "mark-crown", slot: "mark", name: "Crown", blurb: "Title picture.", cost: 5, swatch: "amber", mark: "crown", tier: "bright" },
  { id: "mark-live", slot: "mark", name: "Live tag", blurb: "Tiny neon LIVE next to the name.", cost: 8, swatch: "neon-pink", mark: "live", tier: "neon" },
  { id: "mark-foil", slot: "mark", name: "Gold star", blurb: "A gold mark. Quiet flex.", cost: 10, swatch: "gold", mark: "foil", tier: "gold" },

  { id: "sticker-none", slot: "sticker", name: "No sticker", blurb: "Clean plate.", cost: 0, swatch: "", sticker: "", tier: "house" },
  { id: "sticker-closer", slot: "sticker", name: "Closer stamp", blurb: "Medium stamp. You finish tickets.", cost: 8, swatch: "closer", sticker: "closer", tier: "bright" },
  { id: "sticker-heat", slot: "sticker", name: "Heat stamp", blurb: "Medium. The locker is loud.", cost: 8, swatch: "heat", sticker: "heat", tier: "bright" },
  { id: "sticker-sweep", slot: "sticker", name: "Sweep banner", blurb: "Bigger. All green energy.", cost: 10, swatch: "sweep", sticker: "sweep", tier: "neon" },
  { id: "sticker-neon-live", slot: "sticker", name: "Neon LIVE", blurb: "Big neon plate. Week 3 look.", cost: 12, swatch: "neon-live", sticker: "neon-live", tier: "neon" },
  { id: "sticker-gold-seal", slot: "sticker", name: "Gold seal", blurb: "Big wax seal. Costs real work.", cost: 14, swatch: "gold-seal", sticker: "gold-seal", tier: "gold" },
  { id: "sticker-belt", slot: "sticker", name: "Belt buckle", blurb: "Huge. Looks like a title.", cost: 16, swatch: "belt", sticker: "belt", tier: "legend" },
  { id: "sticker-undisputed", slot: "sticker", name: "Undisputed", blurb: "The biggest stamp. Week 4 only if you grind.", cost: 18, swatch: "undisputed", sticker: "undisputed", tier: "legend" },

  { id: "fx-titan", slot: "fx", name: "The Titantron", blurb: "Only week MVPs. Gold lights, a sash, the building hears you.", cost: 0, swatch: "titan", tier: "legend", earn: "mvp" },
  { id: "fx-off", slot: "fx", name: "Dark titantron", blurb: "You earned it. You can still turn the lights off.", cost: 0, swatch: "off", tier: "legend", earn: "mvp" },

  { id: "sticker-desk", slot: "sticker", name: "Commissioner's stamp", blurb: "First three to finish the desk challenge. Not for sale.", cost: 0, swatch: "desk", sticker: "desk", tier: "legend", earn: "challenge" },
  { id: "fx-found", slot: "fx", name: "Lost-and-found", blurb: "Floor 3 only. Ugly. Loud. You picked it up after the losses.", cost: 0, swatch: "found", tier: "legend", earn: "rumble" },
];

export const BELT_BY_ID = Object.fromEntries(BELT_SHOP.map((i) => [i.id, i])) as Record<string, BeltItem>;

export const FREE_ITEMS = new Set(BELT_SHOP.filter((i) => i.cost === 0 && !i.earn).map((i) => i.id));

export const DEFAULT_PLATE = {
  border: "bone",
  bg: "surface",
  mark: "",
  sticker: "",
} as const;

export type FloorWorkRow = {
  fighterId: string;
  weekNumber: number;
  taskId: string;
  stars: number;
  done: boolean;
};

export type BeltUnlock = {
  fighterId: string;
  itemId: string;
  spent: number;
};

export function beltOf(
  fighterId: string,
  work: FloorWorkRow[],
  unlocks: BeltUnlock[],
  extraStars = 0,
) {
  const earned =
    work.filter((w) => w.fighterId === fighterId && w.done).reduce((s, w) => s + w.stars, 0) + extraStars;
  const spent = unlocks.filter((u) => u.fighterId === fighterId).reduce((s, u) => s + u.spent, 0);
  const owned = new Set<string>([
    ...FREE_ITEMS,
    ...unlocks.filter((u) => u.fighterId === fighterId).map((u) => u.itemId),
  ]);
  return { earned, spent, bank: Math.max(0, earned - spent), owned };
}

export function weekJobs(fighterId: string, week: number, work: FloorWorkRow[], extras: FloorTaskDef[] = []) {
  const byId: Record<string, FloorTaskDef> = { ...TASK_BY_ID };
  for (const t of extras) byId[t.id] = t;
  // The floor_work select has no ORDER BY, so checked rows drift in the raw
  // result; pin the list to catalog order so jobs never jump around on click.
  const rank = new Map([...FLOOR_TASKS, ...extras].map((t, i) => [t.id, i]));
  return work
    .filter((w) => w.fighterId === fighterId && w.weekNumber === week)
    .map((w) => ({
      ...w,
      def: byId[w.taskId] ?? {
        id: w.taskId,
        title: w.taskId,
        blurb: "",
        stars: w.stars,
        pack: "ops" as const,
        live: true,
      },
    }))
    .sort((a, b) => (rank.get(a.taskId) ?? 999) - (rank.get(b.taskId) ?? 999));
}

export function itemToPlateValue(item: BeltItem) {
  if (item.slot === "fx") return item.swatch;
  if (item.slot === "mark") return item.mark ?? "";
  if (item.slot === "sticker") return item.sticker ?? item.swatch;
  if (item.slot === "border") {
    if (item.id === "border-double") return "double";
    if (item.id === "border-gold-double") return "gold-double";
    return item.swatch;
  }
  return item.swatch;
}
