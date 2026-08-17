import type {
  BracketId,
  Fighter,
  Matchup,
  MatchupKind,
  MetricStatus,
  Pairing,
  Score,
  Scorecard,
} from "./types";
import { STATUS_POINTS } from "./types";

export function normalizeStatus(s: string | undefined | null): MetricStatus {
  if (s === "green" || s === "blue" || s === "orange" || s === "red") return s;
  return "red";
}

export function scorecard(statuses: MetricStatus[], reviews: number): Scorecard {
  const greens = statuses.filter((s) => s === "green").length;
  const blues = statuses.filter((s) => s === "blue").length;
  const oranges = statuses.filter((s) => s === "orange").length;
  const reds = statuses.filter((s) => s === "red" || s === ("none" as string)).length;
  const rev = Math.max(0, Math.min(3, Math.floor(reviews)));
  const bonus = Math.max(0, greens - 1);
  const base = statuses.reduce((sum, s) => sum + (STATUS_POINTS[s] ?? 0), 0);
  const sweep = statuses.length > 0 && greens === statuses.length;
  return {
    points: base + bonus + rev,
    greens,
    blues,
    oranges,
    reds,
    reviews: rev,
    bonus,
    sweep,
  };
}

export function emptyStatuses(n: number): MetricStatus[] {
  return Array.from({ length: n }, () => "red");
}

/** Lower rank number is better. A full-green sweep beats any non-sweep. */
export function compareCards(
  a: Scorecard & { seed: number },
  b: Scorecard & { seed: number },
): number {
  if (a.sweep !== b.sweep) return a.sweep ? -1 : 1;
  if (b.points !== a.points) return b.points - a.points;
  if (b.greens !== a.greens) return b.greens - a.greens;
  if (b.blues !== a.blues) return b.blues - a.blues;
  if (b.reviews !== a.reviews) return b.reviews - a.reviews;
  return a.seed - b.seed;
}

export function seedOrder(fighters: Fighter[]): Fighter[] {
  return [...fighters].sort((a, b) => {
    if (b.priorPoints !== a.priorPoints) return b.priorPoints - a.priorPoints;
    if (b.priorBlues !== a.priorBlues) return b.priorBlues - a.priorBlues;
    if (b.priorReviews !== a.priorReviews) return b.priorReviews - a.priorReviews;
    const ln = a.lastName.localeCompare(b.lastName);
    if (ln !== 0) return ln;
    return a.firstName.localeCompare(b.firstName);
  });
}

export function assignSeeds(fighters: Fighter[]): Fighter[] {
  return seedOrder(fighters).map((f, i) => ({ ...f, seed: i + 1 }));
}

export function pairBracket(
  fighterIds: string[],
  seedById: Map<string, number>,
  bracket: BracketId,
  asRumble: boolean,
): Pairing[] {
  const sorted = [...fighterIds].sort(
    (a, b) => (seedById.get(a) ?? 999) - (seedById.get(b) ?? 999),
  );
  if (sorted.length === 0) return [];
  if (asRumble || bracket === "rumble") {
    if (sorted.length === 1) {
      return [{ kind: "bye", fighterIds: sorted, bracket }];
    }
    return [{ kind: "rumble", fighterIds: sorted, bracket }];
  }
  if (sorted.length === 1) {
    return [{ kind: "bye", fighterIds: sorted, bracket }];
  }
  const pairs: Pairing[] = [];
  let list = sorted;
  if (list.length % 2 === 1) {
    pairs.push({ kind: "bye", fighterIds: [list[0]], bracket });
    list = list.slice(1);
  }
  const n = list.length;
  for (let i = 0; i < n / 2; i += 1) {
    pairs.push({
      kind: "singles",
      fighterIds: [list[i], list[n - 1 - i]],
      bracket,
    });
  }
  return pairs;
}

export function week1Field(
  seeded: Fighter[],
  week1Byes: number,
): { competing: Fighter[]; sitting: Fighter[] } {
  const byes = Math.max(0, Math.min(week1Byes, Math.max(0, seeded.length - 2)));
  return {
    sitting: seeded.slice(0, byes),
    competing: seeded.slice(byes),
  };
}

export function cardFor(
  fighterId: string,
  scores: Score[],
  metricCount: number,
  seed: number,
): Scorecard & { seed: number } {
  const s = scores.find((x) => x.fighterId === fighterId);
  const base = s
    ? scorecard(s.statuses, s.reviews)
    : scorecard(emptyStatuses(metricCount), 0);
  return { ...base, seed };
}

export function decideWinner(
  kind: MatchupKind,
  fighterIds: string[],
  scores: Score[],
  seedById: Map<string, number>,
  metricCount: number,
): { winnerId: string | null; ranked: string[] } {
  const ranked = [...fighterIds].sort((a, b) =>
    compareCards(
      cardFor(a, scores, metricCount, seedById.get(a) ?? 999),
      cardFor(b, scores, metricCount, seedById.get(b) ?? 999),
    ),
  );
  if (kind === "bye") return { winnerId: fighterIds[0] ?? null, ranked };
  return { winnerId: ranked[0] ?? null, ranked };
}

export function nextBracketOnLoss(from: BracketId): BracketId | "out" {
  if (from === "main") return "redemption";
  if (from === "redemption") return "rumble";
  return "out";
}

export type ResolvedFighter = {
  fighterId: string;
  from: BracketId;
  result: "win" | "loss" | "bye" | "rumble";
  next: BracketId | "out" | "champ";
  rankInBracket: number;
};

export function resolveWeek(opts: {
  matchups: Matchup[];
  scores: Score[];
  seedById: Map<string, number>;
  metricCount: number;
  isFinalWeek: boolean;
}): ResolvedFighter[] {
  const out: ResolvedFighter[] = [];
  const byBracket = new Map<BracketId, Matchup[]>();
  for (const m of opts.matchups) {
    const list = byBracket.get(m.bracket) ?? [];
    list.push(m);
    byBracket.set(m.bracket, list);
  }

  for (const bracket of ["main", "redemption", "rumble"] as BracketId[]) {
    const ms = byBracket.get(bracket) ?? [];
    const ranks = new Map<string, number>();
    const allIn: string[] = [];
    for (const m of ms) {
      const { ranked } = decideWinner(
        m.kind,
        m.fighterIds,
        opts.scores,
        opts.seedById,
        opts.metricCount,
      );
      for (const id of ranked) allIn.push(id);
    }
    const unique = [...new Set(allIn)];
    unique.sort((a, b) =>
      compareCards(
        cardFor(a, opts.scores, opts.metricCount, opts.seedById.get(a) ?? 999),
        cardFor(b, opts.scores, opts.metricCount, opts.seedById.get(b) ?? 999),
      ),
    );
    unique.forEach((id, i) => ranks.set(id, i + 1));

    for (const m of ms) {
      const { winnerId, ranked } = decideWinner(
        m.kind,
        m.fighterIds,
        opts.scores,
        opts.seedById,
        opts.metricCount,
      );
      if (m.kind === "rumble") {
        ranked.forEach((id, i) => {
          const isChamp = opts.isFinalWeek && i === 0;
          const stay = i === 0 || !opts.isFinalWeek;
          out.push({
            fighterId: id,
            from: bracket,
            result: "rumble",
            next: isChamp ? "champ" : stay ? bracket : "out",
            rankInBracket: ranks.get(id) ?? i + 1,
          });
        });
        continue;
      }
      for (const id of m.fighterIds) {
        const won = id === winnerId;
        const isBye = m.kind === "bye";
        if (opts.isFinalWeek && won) {
          out.push({
            fighterId: id,
            from: bracket,
            result: isBye ? "bye" : "win",
            next: "champ",
            rankInBracket: ranks.get(id) ?? 1,
          });
        } else if (won || isBye) {
          out.push({
            fighterId: id,
            from: bracket,
            result: isBye ? "bye" : "win",
            next: bracket,
            rankInBracket: ranks.get(id) ?? 1,
          });
        } else {
          const drop = nextBracketOnLoss(bracket);
          out.push({
            fighterId: id,
            from: bracket,
            result: "loss",
            next: drop,
            rankInBracket: ranks.get(id) ?? 2,
          });
        }
      }
    }
  }
  return out;
}

export function fightersInBracketNext(
  resolved: ResolvedFighter[],
  bracket: BracketId,
): string[] {
  return resolved.filter((r) => r.next === bracket).map((r) => r.fighterId);
}

export function championsOf(resolved: ResolvedFighter[]): Partial<Record<BracketId, string>> {
  const champs: Partial<Record<BracketId, string>> = {};
  for (const r of resolved) {
    if (r.next === "champ") champs[r.from] = r.fighterId;
  }
  return champs;
}

export function plausibleCard(
  seed: number,
  rosterSize: number,
  metricCount: number,
): {
  statuses: MetricStatus[];
  reviews: number;
} {
  const quality = 1 - (seed - 1) / Math.max(1, rosterSize - 1);
  const statuses: MetricStatus[] = [];
  for (let i = 0; i < metricCount; i += 1) {
    const roll = Math.random();
    const bias = quality * 0.4 + 0.12;
    if (roll < bias * 0.45) statuses.push("green");
    else if (roll < bias) statuses.push("blue");
    else if (roll < bias + 0.35) statuses.push("orange");
    else statuses.push("red");
  }
  const reviews = Math.random() < quality * 0.45 ? (Math.random() < 0.3 ? 2 : 1) : 0;
  return { statuses, reviews: Math.min(3, reviews) };
}

export function parseRosterCsv(text: string): Array<{
  firstName: string;
  lastName: string;
  nickname: string;
  priorPoints: number;
  priorBlues: number;
  priorReviews: number;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: Array<{
    firstName: string;
    lastName: string;
    nickname: string;
    priorPoints: number;
    priorBlues: number;
    priorReviews: number;
  }> = [];
  for (const line of lines) {
    if (/^first/i.test(line)) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;
    rows.push({
      firstName: parts[0] ?? "",
      lastName: parts[1] ?? "",
      nickname: parts[2] ?? "",
      priorPoints: Number(parts[3] || 0) || 0,
      priorBlues: Number(parts[4] || 0) || 0,
      priorReviews: Number(parts[5] || 0) || 0,
    });
  }
  return rows.filter((r) => r.firstName && r.lastName);
}
