import type { Fighter, Matchup, Score } from "./types";

export function fightersWhoNeedCards(
  week: number,
  matchups: Matchup[],
  fighters: Array<Pick<Fighter, "id" | "departed">>,
) {
  const gone = new Set(fighters.filter((f) => f.departed).map((f) => f.id));
  const ids = new Set<string>();
  for (const m of matchups) {
    if (m.weekNumber !== week) continue;
    if (m.kind === "bye") continue;
    for (const id of m.fighterIds) {
      if (!gone.has(id)) ids.add(id);
    }
  }
  return [...ids];
}

export function weekCardProgress(
  week: number,
  matchups: Matchup[],
  fighters: Array<Pick<Fighter, "id" | "departed">>,
  scores: Array<Pick<Score, "fighterId" | "weekNumber">>,
) {
  const need = fightersWhoNeedCards(week, matchups, fighters);
  const have = need.filter((id) => scores.some((s) => s.fighterId === id && s.weekNumber === week));
  return {
    need,
    in: have.length,
    of: need.length,
    missing: need.length - have.length,
    ready: need.length > 0 && have.length === need.length,
  };
}
