import type { BracketId, Matchup, Placement, Score, Scorecard } from "./types";
import { scorecard } from "./engine";
import { recordOf } from "./copy";
import type { TrainingRecord } from "./training";
import { awardedBonus, passedWeeks } from "./training";

export type RankId =
  | "prospect"
  | "enhancement"
  | "midcard"
  | "upper"
  | "title"
  | "main-event"
  | "champion";

export type BadgeId =
  | "first-pin"
  | "clean-sweep"
  | "five-star"
  | "comeback"
  | "iron"
  | "hot-streak"
  | "crowd"
  | "giant-killer"
  | "untouched"
  | "green-machine"
  | "title-picture"
  | "rumble-survivor"
  | "the-work"
  | "opening-bell"
  | "perfect-period"
  | "blue-track"
  | "full-syllabus";

export type HonorKind = "mvp" | "workhorse" | "crowd" | "upset" | "closest";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  blurb: string;
};

export type Honor = {
  weekNumber: number;
  kind: HonorKind;
  fighterId: string;
  note: string;
};

export type Mission = {
  id: string;
  title: string;
  blurb: string;
  have: number;
  need: number;
  done: boolean;
};

export type FighterHeat = {
  fighterId: string;
  heat: number;
  xp: number;
  level: number;
  nextLevelXp: number | null;
  rank: RankId;
  winStreak: number;
  scoreStreak: number;
  badges: BadgeId[];
  chase: { id: BadgeId; have: number; need: number } | null;
};

export type CircuitHeat = {
  byId: Record<string, FighterHeat>;
  ranked: FighterHeat[];
  honors: Honor[];
  latestHonors: Honor[];
  catalog: BadgeDef[];
};

export const RANK_LABEL: Record<RankId, string> = {
  prospect: "Prospect",
  enhancement: "Enhancement",
  midcard: "Midcard",
  upper: "Upper Card",
  title: "Title Picture",
  "main-event": "Main Event",
  champion: "Champion",
};

export const RANK_BLURB: Record<RankId, string> = {
  prospect: "Just signed. The bell has not tested you.",
  enhancement: "Getting reps. The midcard is watching.",
  midcard: "You work every week. The building knows the name.",
  upper: "You are on the poster now.",
  title: "One clean week from a belt.",
  "main-event": "The main card is your floor.",
  champion: "The floor is yours.",
};

export const HONOR_LABEL: Record<HonorKind, string> = {
  mvp: "MVP of the Week",
  workhorse: "Workhorse",
  crowd: "Crowd Heat",
  upset: "Upset of the Week",
  closest: "Closest Bout",
};

export const BADGE_CATALOG: BadgeDef[] = [
  { id: "first-pin", name: "First Pin", blurb: "You put someone away. The locker noticed." },
  { id: "clean-sweep", name: "Clean Sweep", blurb: "Every metric green. No recount needed." },
  { id: "five-star", name: "Five-Star Card", blurb: "Three named reviews in one week." },
  { id: "comeback", name: "Comeback Kid", blurb: "Dropped a floor. Climbed back with a win." },
  { id: "iron", name: "Iron Worker", blurb: "A card in every week so far. No no-shows." },
  { id: "hot-streak", name: "Hot Streak", blurb: "Two straight wins. Do not cool off." },
  { id: "crowd", name: "Crowd Favorite", blurb: "Most named reviews in the building." },
  { id: "giant-killer", name: "Giant Killer", blurb: "Beat a higher seed. That is an upset." },
  { id: "untouched", name: "Untouched", blurb: "Wins on the book. Zero losses." },
  { id: "green-machine", name: "Green Machine", blurb: "Most greens on the locker." },
  { id: "title-picture", name: "Title Picture", blurb: "Still standing in the Main Event." },
  { id: "rumble-survivor", name: "Rumble Survivor", blurb: "Still in the Royal Rumble." },
  { id: "the-work", name: "The Work", blurb: "Ten greens or more this period." },
  { id: "opening-bell", name: "Opening Bell", blurb: "Posted a card in week 1." },
  { id: "perfect-period", name: "Perfect Period", blurb: "A sweep in every completed week." },
  { id: "blue-track", name: "Blue Track", blurb: "Two weekly film-study quizzes in the book." },
  { id: "full-syllabus", name: "Full Syllabus", blurb: "All four weekly academies in the book." },
];

export const BADGE_BY_ID = Object.fromEntries(BADGE_CATALOG.map((b) => [b.id, b])) as Record<
  BadgeId,
  BadgeDef
>;

const LEVELS: Array<{ level: number; xp: number; rank: RankId }> = [
  { level: 1, xp: 0, rank: "prospect" },
  { level: 2, xp: 80, rank: "enhancement" },
  { level: 3, xp: 180, rank: "midcard" },
  { level: 4, xp: 320, rank: "upper" },
  { level: 5, xp: 500, rank: "title" },
  { level: 6, xp: 750, rank: "main-event" },
  { level: 7, xp: 1100, rank: "champion" },
];

export type HeatBoard = {
  circuit: { currentWeek: number; weeks: number; status: string };
  fighters: Array<{
    id: string;
    seed: number | null;
    priorPoints: number;
    priorBlues: number;
    priorReviews: number;
    departed?: boolean;
  }>;
  scores: Score[];
  matchups: Matchup[];
  placements: Placement[];
  standings: Array<{
    fighterId: string;
    totalPoints: number;
    totalGreens: number;
    totalBlues: number;
    totalReviews: number;
    totalSweeps: number;
    currentBracket: BracketId | "out" | "champ" | "unassigned";
    weekCard: Scorecard | null;
  }>;
  weeks: Array<{ weekNumber: number; status: string }>;
  academy?: TrainingRecord[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function levelFromXp(xp: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  return { ...current, nextLevelXp: next?.xp ?? null };
}

function winStreakOf(fighterId: string, placements: Placement[]) {
  const mine = placements
    .filter((p) => p.fighterId === fighterId)
    .sort((a, b) => a.weekNumber - b.weekNumber);
  let streak = 0;
  for (let i = mine.length - 1; i >= 0; i -= 1) {
    const r = mine[i].result;
    if (r === "bye") continue;
    if (r === "win" || r === "champ") streak += 1;
    else break;
  }
  return streak;
}

function scoreStreakOf(fighterId: string, scores: Score[], currentWeek: number) {
  let streak = 0;
  for (let w = currentWeek; w >= 1; w -= 1) {
    if (scores.some((s) => s.fighterId === fighterId && s.weekNumber === w)) streak += 1;
    else if (w === currentWeek) continue;
    else break;
  }
  return streak;
}

function maxWeekReviews(fighterId: string, scores: Score[]) {
  return scores
    .filter((s) => s.fighterId === fighterId)
    .reduce((m, s) => Math.max(m, s.reviews), 0);
}

function weeksScored(fighterId: string, scores: Score[]) {
  return new Set(scores.filter((s) => s.fighterId === fighterId).map((s) => s.weekNumber)).size;
}

function beatHigherSeed(fighterId: string, matchups: Matchup[], seedOf: Map<string, number>) {
  return matchups.some((m) => {
    if (m.kind !== "singles" || m.winnerId !== fighterId) return false;
    const other = m.fighterIds.find((id) => id !== fighterId);
    if (!other) return false;
    return (seedOf.get(fighterId) ?? 99) > (seedOf.get(other) ?? 99);
  });
}

function comebackWin(fighterId: string, placements: Placement[]) {
  const mine = placements
    .filter((p) => p.fighterId === fighterId)
    .sort((a, b) => a.weekNumber - b.weekNumber);
  let dropped = false;
  for (const p of mine) {
    if (p.result === "loss") dropped = true;
    if (dropped && (p.result === "win" || p.result === "champ") && p.bracket !== "main") {
      return true;
    }
  }
  return false;
}

function badgesFor(opts: {
  fighterId: string;
  standing: HeatBoard["standings"][number] | undefined;
  scores: Score[];
  matchups: Matchup[];
  placements: Placement[];
  seedOf: Map<string, number>;
  playedWeeks: number;
  maxReviews: number;
  maxGreens: number;
  winStreak: number;
  academy: TrainingRecord[];
}): BadgeId[] {
  const rec = recordOf(opts.fighterId, opts.placements);
  const sweeps = opts.standing?.totalSweeps ?? 0;
  const greens = opts.standing?.totalGreens ?? 0;
  const reviews = opts.standing?.totalReviews ?? 0;
  const scored = weeksScored(opts.fighterId, opts.scores);
  const out: BadgeId[] = [];

  if (rec.wins >= 1) out.push("first-pin");
  if (sweeps >= 1) out.push("clean-sweep");
  if (maxWeekReviews(opts.fighterId, opts.scores) >= 3) out.push("five-star");
  if (comebackWin(opts.fighterId, opts.placements)) out.push("comeback");
  if (opts.playedWeeks >= 1 && scored >= opts.playedWeeks) out.push("iron");
  if (opts.winStreak >= 2) out.push("hot-streak");
  if (opts.maxReviews > 0 && reviews >= opts.maxReviews) out.push("crowd");
  if (beatHigherSeed(opts.fighterId, opts.matchups, opts.seedOf)) out.push("giant-killer");
  if (rec.wins >= 1 && rec.losses === 0) out.push("untouched");
  if (opts.maxGreens > 0 && greens >= opts.maxGreens) out.push("green-machine");
  if (opts.standing?.currentBracket === "main") out.push("title-picture");
  if (opts.standing?.currentBracket === "rumble") out.push("rumble-survivor");
  if (greens >= 10) out.push("the-work");
  if (opts.scores.some((s) => s.fighterId === opts.fighterId && s.weekNumber === 1)) {
    out.push("opening-bell");
  }
  const completed = opts.scores.filter((s) => s.fighterId === opts.fighterId);
  if (
    opts.playedWeeks >= 2 &&
    completed.length >= opts.playedWeeks &&
    completed.every((s) => scorecard(s.statuses, s.reviews, s.trainingBonus).sweep)
  ) {
    out.push("perfect-period");
  }
  const weeksHit = passedWeeks(opts.academy, opts.fighterId).length;
  if (weeksHit >= 2) out.push("blue-track");
  if (weeksHit >= 4) out.push("full-syllabus");
  return out;
}

function chaseOf(
  earned: Set<BadgeId>,
  fighterId: string,
  standing: HeatBoard["standings"][number] | undefined,
  scores: Score[],
  placements: Placement[],
  winStreak: number,
  playedWeeks: number,
  academy: TrainingRecord[],
): FighterHeat["chase"] {
  const rec = recordOf(fighterId, placements);
  const weeksHit = passedWeeks(academy, fighterId).length;
  const candidates: Array<{ id: BadgeId; have: number; need: number }> = [
    { id: "first-pin", have: rec.wins, need: 1 },
    { id: "clean-sweep", have: standing?.totalSweeps ?? 0, need: 1 },
    { id: "five-star", have: maxWeekReviews(fighterId, scores), need: 3 },
    { id: "hot-streak", have: winStreak, need: 2 },
    { id: "the-work", have: standing?.totalGreens ?? 0, need: 10 },
    { id: "iron", have: weeksScored(fighterId, scores), need: Math.max(1, playedWeeks) },
    { id: "opening-bell", have: scores.some((s) => s.fighterId === fighterId && s.weekNumber === 1) ? 1 : 0, need: 1 },
    { id: "blue-track", have: weeksHit, need: 2 },
    { id: "full-syllabus", have: weeksHit, need: 4 },
  ];
  return candidates.find((c) => !earned.has(c.id) && c.have < c.need) ?? null;
}

function heatOf(
  standing: HeatBoard["standings"][number] | undefined,
  winStreak: number,
  maxPoints: number,
  priorPoints: number,
  maxPrior: number,
  seed: number | null,
  rosterSize: number,
): number {
  const pts = standing?.totalPoints ?? 0;
  const sweeps = standing?.totalSweeps ?? 0;
  const reviews = standing?.totalReviews ?? 0;
  const weekPts = standing?.weekCard?.points ?? 0;
  let heat = 6;
  heat += (pts / Math.max(1, maxPoints)) * 38;
  heat += (priorPoints / Math.max(1, maxPrior)) * 14;
  heat += Math.min(20, winStreak * 8);
  heat += Math.min(12, sweeps * 6);
  heat += Math.min(12, reviews * 4);
  heat += Math.min(10, weekPts);
  if (pts === 0 && priorPoints === 0 && seed) {
    const spread = Math.max(1, rosterSize - 1);
    heat += Math.round(16 * (1 - (seed - 1) / spread));
  }
  if (standing?.currentBracket === "main") heat += 8;
  if (standing?.currentBracket === "champ") heat += 16;
  if (standing?.currentBracket === "redemption") heat += 4;
  if (standing?.currentBracket === "out") heat *= 0.55;
  return clamp(Math.round(heat), 0, 100);
}

function honorsForWeek(board: HeatBoard, weekNumber: number): Honor[] {
  const weekScores = board.scores.filter((s) => s.weekNumber === weekNumber);
  if (weekScores.length === 0) return [];
  const cards = weekScores.map((s) => ({
    fighterId: s.fighterId,
    card: scorecard(s.statuses, s.reviews, s.trainingBonus),
    seed: board.fighters.find((f) => f.id === s.fighterId)?.seed ?? 99,
  }));
  const honors: Honor[] = [];

  const mvp = [...cards].sort(
    (a, b) => b.card.points - a.card.points || b.card.greens - a.card.greens,
  )[0];
  if (mvp && mvp.card.points > 0) {
    honors.push({
      weekNumber,
      kind: "mvp",
      fighterId: mvp.fighterId,
      note: `${mvp.card.points} points on the card.`,
    });
  }

  const horse = [...cards].sort((a, b) => b.card.greens - a.card.greens)[0];
  if (horse && horse.card.greens > 0) {
    honors.push({
      weekNumber,
      kind: "workhorse",
      fighterId: horse.fighterId,
      note: `${horse.card.greens} green${horse.card.greens === 1 ? "" : "s"} this week.`,
    });
  }

  const crowd = [...cards].sort((a, b) => b.card.reviews - a.card.reviews)[0];
  if (crowd && crowd.card.reviews > 0) {
    honors.push({
      weekNumber,
      kind: "crowd",
      fighterId: crowd.fighterId,
      note: `${crowd.card.reviews} named review${crowd.card.reviews === 1 ? "" : "s"}.`,
    });
  }

  const seedOf = new Map(board.fighters.map((f) => [f.id, f.seed ?? 99]));
  let bestUpset: { fighterId: string; gap: number } | null = null;
  let closest: { fighterId: string; margin: number } | null = null;
  for (const m of board.matchups.filter((x) => x.weekNumber === weekNumber && x.kind === "singles")) {
    const [a, b] = m.fighterIds;
    if (!a || !b) continue;
    const winner = m.winnerId;
    const loser = winner === a ? b : winner === b ? a : null;
    if (winner && loser) {
      const gap = (seedOf.get(winner) ?? 99) - (seedOf.get(loser) ?? 99);
      if (gap > 0 && (!bestUpset || gap > bestUpset.gap)) {
        bestUpset = { fighterId: winner, gap };
      }
    }
    const ca = cards.find((c) => c.fighterId === a);
    const cb = cards.find((c) => c.fighterId === b);
    if (ca && cb) {
      const margin = Math.abs(ca.card.points - cb.card.points);
      const lead = ca.card.points >= cb.card.points ? a : b;
      if (!closest || margin < closest.margin) closest = { fighterId: lead, margin };
    }
  }
  if (bestUpset) {
    honors.push({
      weekNumber,
      kind: "upset",
      fighterId: bestUpset.fighterId,
      note: `Took down a seed ${bestUpset.gap} spots higher.`,
    });
  }
  if (closest) {
    honors.push({
      weekNumber,
      kind: "closest",
      fighterId: closest.fighterId,
      note:
        closest.margin === 0
          ? "Split on points. Seed broke the tie."
          : `Won by ${closest.margin} point${closest.margin === 1 ? "" : "s"}.`,
    });
  }
  return honors;
}

export function computeCircuitHeat(board: HeatBoard): CircuitHeat {
  const seedOf = new Map(board.fighters.map((f) => [f.id, f.seed ?? 99]));
  const playedWeeks = Math.max(
    1,
    board.weeks.filter((w) => w.status === "open" || w.status === "locked" || w.status === "finalized")
      .length || board.circuit.currentWeek,
  );
  const maxPoints = Math.max(1, ...board.standings.map((s) => s.totalPoints), 0);
  const maxPrior = Math.max(1, ...board.fighters.map((f) => f.priorPoints), 0);
  const maxReviews = Math.max(0, ...board.standings.map((s) => s.totalReviews));
  const maxGreens = Math.max(0, ...board.standings.map((s) => s.totalGreens));

  const byId: Record<string, FighterHeat> = {};
  for (const f of board.fighters.filter((x) => !x.departed)) {
    const standing = board.standings.find((s) => s.fighterId === f.id);
    const rec = recordOf(f.id, board.placements);
    const winStreak = winStreakOf(f.id, board.placements);
    const scoreStreak = scoreStreakOf(f.id, board.scores, board.circuit.currentWeek);
    const academy = board.academy ?? [];
    const badges = badgesFor({
      fighterId: f.id,
      standing,
      scores: board.scores,
      matchups: board.matchups,
      placements: board.placements,
      seedOf,
      playedWeeks,
      maxReviews,
      maxGreens,
      winStreak,
      academy,
    });
    const earned = new Set(badges);
    const weeksHit = passedWeeks(academy, f.id).length;
    const weeksAwarded = academy.filter((r) => r.fighterId === f.id && r.awarded).length;
    const xp =
      (standing?.totalPoints ?? 0) * 10 +
      rec.wins * 25 +
      rec.byes * 5 +
      (standing?.totalSweeps ?? 0) * 40 +
      (standing?.totalReviews ?? 0) * 15 +
      f.priorPoints * 4 +
      f.priorBlues * 5 +
      f.priorReviews * 8 +
      badges.length * 20 +
      weeksHit * 18 +
      weeksAwarded * 22;
    const lvl = levelFromXp(xp);
    const rank = standing?.currentBracket === "champ" ? "champion" : lvl.rank;
    byId[f.id] = {
      fighterId: f.id,
      heat: heatOf(
        standing,
        winStreak,
        maxPoints,
        f.priorPoints,
        maxPrior,
        f.seed,
        board.fighters.length,
      ),
      xp,
      level: lvl.level,
      nextLevelXp: lvl.nextLevelXp,
      rank,
      winStreak,
      scoreStreak,
      badges,
      chase: chaseOf(earned, f.id, standing, board.scores, board.placements, winStreak, playedWeeks, academy),
    };
  }

  const ranked = Object.values(byId).sort(
    (a, b) => b.heat - a.heat || b.xp - a.xp || b.winStreak - a.winStreak,
  );

  const honors: Honor[] = [];
  for (const w of board.weeks) {
    honors.push(...honorsForWeek(board, w.weekNumber));
  }
  const weeksWith = [...new Set(honors.map((h) => h.weekNumber))].sort((a, b) => b - a);
  const latestWeek = weeksWith[0] ?? null;
  const latestHonors = latestWeek ? honors.filter((h) => h.weekNumber === latestWeek) : [];

  return { byId, ranked, honors, latestHonors, catalog: BADGE_CATALOG };
}

export function missionsFor(
  fighterId: string,
  board: HeatBoard,
  weekNumber = board.circuit.currentWeek,
): Mission[] {
  const score = board.scores.find((s) => s.fighterId === fighterId && s.weekNumber === weekNumber);
  const card = score ? scorecard(score.statuses, score.reviews, score.trainingBonus) : null;
  const match = board.matchups.find(
    (m) => m.weekNumber === weekNumber && m.fighterIds.includes(fighterId),
  );
  const place = board.placements.find(
    (p) => p.fighterId === fighterId && p.weekNumber === weekNumber,
  );
  const won = place?.result === "win" || place?.result === "champ" || place?.result === "bye";
  const seed = board.fighters.find((f) => f.id === fighterId)?.seed ?? 99;
  const oppId = match?.fighterIds.find((id) => id !== fighterId);
  const oppSeed = oppId ? (board.fighters.find((f) => f.id === oppId)?.seed ?? 99) : null;
  const academyHit = awardedBonus(board.academy, fighterId, weekNumber) === 1;

  const holdTheFloor: Mission = {
    id: "hold",
    title: "Hold the floor",
    blurb: match?.kind === "bye" ? "Bye week. Stay ready." : "Win your bout this week.",
    have: won ? 1 : 0,
    need: 1,
    done: won,
  };
  const paintGreen: Mission = {
    id: "green",
    title: "Paint it green",
    blurb: "Land two greens on the scoresheet.",
    have: card?.greens ?? 0,
    need: 2,
    done: (card?.greens ?? 0) >= 2,
  };
  const askReview: Mission = {
    id: "review",
    title: "Ask for the review",
    blurb: "One named five-star this week.",
    have: card?.reviews ?? 0,
    need: 1,
    done: (card?.reviews ?? 0) >= 1,
  };
  const protectSeed: Mission = {
    id: "seed",
    title: "Protect the seed",
    blurb:
      oppSeed != null
        ? seed <= oppSeed
          ? "You are favored. Win clean."
          : "You are the underdog. Steal the pin."
        : "Post a card so the seed means something.",
    have: won ? 1 : score ? 0 : 0,
    need: 1,
    done: won,
  };
  const hitAcademy: Mission = {
    id: "academy",
    title: "Hit the academy",
    blurb: "Pass this week’s film-study quiz for +1 on the card.",
    have: academyHit ? 1 : 0,
    need: 1,
    done: academyHit,
  };

  return [holdTheFloor, paintGreen, askReview, hitAcademy, protectSeed];
}

export function heatOfFighter(heat: CircuitHeat | null | undefined, id: string) {
  return heat?.byId[id] ?? null;
}
