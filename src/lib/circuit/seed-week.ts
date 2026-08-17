import type { BoardPayload } from "@/lib/server/circuit";
import { onTheBook, standingOf } from "@/lib/use-board";

export function starsOf(board: BoardPayload, fighterId: string) {
  return board.floorWork
    .filter((w) => w.fighterId === fighterId && w.done)
    .reduce((n, w) => n + w.stars, 0);
}

/** People who share points + stars with someone else on the same floor. Socks break that. */
export function socksTieIds(board: BoardPayload) {
  const live = onTheBook(board.fighters);
  const buckets = new Map<string, string[]>();
  for (const f of live) {
    const s = standingOf(board, f.id);
    const floor = s?.currentBracket ?? "unassigned";
    const pts = s?.totalPoints ?? 0;
    const stars = starsOf(board, f.id);
    const key = `${floor}:${pts}:${stars}`;
    const list = buckets.get(key) ?? [];
    list.push(f.id);
    buckets.set(key, list);
  }
  const tied = new Set<string>();
  for (const list of buckets.values()) {
    if (list.length > 1) for (const id of list) tied.add(id);
  }
  return tied;
}
