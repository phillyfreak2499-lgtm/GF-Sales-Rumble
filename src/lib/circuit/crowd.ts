import type { Matchup } from "./types";
import { STORE_NAMES as OFFICIAL_STORES, storeLabel as officialLabel } from "./stores";

export const STORE_NAMES = OFFICIAL_STORES;

export type PickRow = {
  fighterId: string;
  weekNumber: number;
  matchupId: string;
  pickId: string;
};

export type PromoRow = {
  fromId: string;
  toId: string;
  weekNumber: number;
  lineId: string;
};

export function walkoutWords(raw: string) {
  return raw.trim().split(/\s+/).filter(Boolean);
}

export function cleanWalkout(raw: string) {
  return walkoutWords(raw).slice(0, 5).join(" ");
}

export function pickStarCount(fighterId: string, picks: PickRow[], matchups: Matchup[]) {
  const byId = new Map(matchups.map((m) => [m.id, m]));
  let n = 0;
  for (const p of picks) {
    if (p.fighterId !== fighterId) continue;
    const m = byId.get(p.matchupId);
    if (m && m.status === "complete" && m.winnerId && m.winnerId === p.pickId) n += 1;
  }
  return n;
}

export function pickRecord(fighterId: string, picks: PickRow[], matchups: Matchup[]) {
  const byId = new Map(matchups.map((m) => [m.id, m]));
  let right = 0;
  let locked = 0;
  for (const p of picks) {
    if (p.fighterId !== fighterId) continue;
    const m = byId.get(p.matchupId);
    if (!m || m.status !== "complete" || !m.winnerId) continue;
    locked += 1;
    if (m.winnerId === p.pickId) right += 1;
  }
  return { right, locked };
}

export function storeLabel(store: string) {
  return officialLabel(store);
}

export function storeStandings(
  fighters: Array<{ id: string; store: string; departed?: boolean }>,
  standings: Array<{ fighterId: string; totalPoints: number }>,
  heatById?: Record<string, { heat: number }>,
) {
  const pts = new Map(standings.map((s) => [s.fighterId, s.totalPoints]));
  const groups = new Map<
    string,
    { store: string; points: number; heat: number; count: number; ids: string[] }
  >();
  for (const f of fighters) {
    if (f.departed) continue;
    const name = storeLabel(f.store);
    const g = groups.get(name) ?? { store: name, points: 0, heat: 0, count: 0, ids: [] };
    g.points += pts.get(f.id) ?? 0;
    g.heat += heatById?.[f.id]?.heat ?? 0;
    g.count += 1;
    g.ids.push(f.id);
    groups.set(name, g);
  }
  return [...groups.values()].sort(
    (a, b) => b.points - a.points || b.heat - a.heat || a.store.localeCompare(b.store),
  );
}

export function pickLeaders(
  fighters: Array<{ id: string; nickname: string; departed?: boolean }>,
  picks: PickRow[],
  matchups: Matchup[],
) {
  return fighters
    .filter((f) => !f.departed)
    .map((f) => ({ ...f, ...pickRecord(f.id, picks, matchups), stars: pickStarCount(f.id, picks, matchups) }))
    .filter((f) => f.locked > 0 || f.stars > 0)
    .sort((a, b) => b.right - a.right || b.stars - a.stars || a.nickname.localeCompare(b.nickname));
}

export const DEMO_WALKOUTS = [
  "Crown the ticket tonight",
  "Nobody leaves this wobbly",
  "The door is the close",
  "One guest then ten",
  "Order in the fitting",
  "There is a way",
];
