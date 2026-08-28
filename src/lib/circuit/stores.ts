export type StoreDef = {
  slug: string;
  name: string;
  short: string;
};

export const STORES: StoreDef[] = [
  { slug: "rockwall", name: "Rockwall, TX", short: "Rockwall" },
  { slug: "southlake", name: "Southlake, TX", short: "Southlake" },
  { slug: "allen", name: "Allen, TX", short: "Allen" },
  { slug: "waco", name: "Waco, TX", short: "Waco" },
  { slug: "plano", name: "Plano, TX", short: "Plano" },
  { slug: "arlington", name: "Arlington, TX", short: "Arlington" },
  { slug: "alliance", name: "Fort Worth - Alliance, TX", short: "Alliance" },
  { slug: "college-station", name: "College Station, TX", short: "College Station" },
  { slug: "fort-worth", name: "Fort Worth - Helen, TX", short: "Helen" },
  { slug: "temple", name: "Temple, TX", short: "Temple" },
  { slug: "waxahachie", name: "Waxahachie, TX", short: "Waxahachie" },
];

export const STORE_BY_SLUG = Object.fromEntries(STORES.map((s) => [s.slug, s])) as Record<string, StoreDef>;

/** Official names — used wherever a list of stores is needed. */
export const STORE_NAMES = STORES.map((s) => s.name);

const ALIAS: Record<string, string> = {
  rockwall: "rockwall",
  southlake: "southlake",
  allen: "allen",
  waco: "waco",
  plano: "plano",
  arlington: "arlington",
  alliance: "alliance",
  "alliance (fort worth)": "alliance",
  "alliance fort worth": "alliance",
  "fort worth - alliance": "alliance",
  "fort worth alliance": "alliance",
  "college station": "college-station",
  "fort worth": "fort-worth",
  "fort worth (bryant irvin rd)": "fort-worth",
  "bryant irvin": "fort-worth",
  "fort worth - helen": "fort-worth",
  "fort worth helen": "fort-worth",
  helen: "fort-worth",
  temple: "temple",
  waxahachie: "waxahachie",
};

export function storeSlugOf(raw: string) {
  const n = raw.trim().toLowerCase().replace(/,?\s*tx\s*$/i, "").replace(/\s+/g, " ");
  if (!n) return "";
  if (STORE_BY_SLUG[n]) return n;
  if (ALIAS[n]) return ALIAS[n];
  const hit = STORES.find((s) => n.includes(s.short.toLowerCase()) || s.name.toLowerCase().includes(n));
  return hit?.slug ?? "";
}

export function storeOf(raw: string) {
  const slug = storeSlugOf(raw);
  return slug ? STORE_BY_SLUG[slug] : null;
}

export function storeLabel(raw: string) {
  return storeOf(raw)?.name ?? (raw.trim() || "Unaffiliated");
}

export type RoomPaint = "house" | "rose" | "steel" | "sage" | "amber" | "gold" | "neon-pink" | "neon-cyan";
export type RoomMark = "" | "star" | "bolt" | "heat" | "crown";

export const ROOM_PAINTS: Array<{ id: RoomPaint; name: string }> = [
  { id: "house", name: "House slate" },
  { id: "rose", name: "Heat wash" },
  { id: "steel", name: "Steel wash" },
  { id: "sage", name: "Green wash" },
  { id: "amber", name: "Warm wash" },
  { id: "gold", name: "Gold room" },
  { id: "neon-pink", name: "Hot neon" },
  { id: "neon-cyan", name: "Ice neon" },
];

export const ROOM_MARKS: Array<{ id: RoomMark; name: string }> = [
  { id: "", name: "No mark" },
  { id: "star", name: "Star" },
  { id: "bolt", name: "Bolt" },
  { id: "heat", name: "Heat" },
  { id: "crown", name: "Crown" },
];

export type RoomHandle = "brass" | "chrome" | "black" | "gold";

export const ROOM_HANDLES: Array<{ id: RoomHandle; name: string }> = [
  { id: "brass", name: "Brass handle" },
  { id: "chrome", name: "Chrome handle" },
  { id: "black", name: "Black handle" },
  { id: "gold", name: "Gold handle" },
];

export type StoreRoom = {
  slug: string;
  paint: RoomPaint;
  accent: RoomPaint;
  motto: string;
  mark: RoomMark;
  handle: RoomHandle;
};

export function emptyRoom(slug: string): StoreRoom {
  return { slug, paint: "house", accent: "amber", motto: "", mark: "", handle: "brass" };
}

export function roomPaintClass(paint: string) {
  if (paint === "rose") return "room-rose";
  if (paint === "steel") return "room-steel";
  if (paint === "sage") return "room-sage";
  if (paint === "amber") return "room-amber";
  if (paint === "gold") return "room-gold";
  if (paint === "neon-pink") return "room-neon-pink";
  if (paint === "neon-cyan") return "room-neon-cyan";
  return "room-house";
}
