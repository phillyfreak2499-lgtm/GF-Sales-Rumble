export type MetricStatus = "green" | "blue" | "orange" | "red";
export type BracketId = "main" | "redemption" | "rumble";
export type CircuitStatus = "setup" | "active" | "complete";
export type WeekStatus = "upcoming" | "open" | "locked" | "finalized";
export type MatchupKind = "singles" | "bye" | "rumble";
export type MatchupStatus = "scheduled" | "complete";
export type GazetteKind = "preview" | "recap";
export type PlacementResult = "win" | "loss" | "bye" | "rumble" | "champ";

export const BRACKETS: BracketId[] = ["main", "redemption", "rumble"];

export const BRACKET_LABEL: Record<BracketId, string> = {
  main: "Main Event",
  redemption: "Redemption",
  rumble: "Royal Rumble",
};

export type FloorId = BracketId | "out" | "champ" | "unassigned";

export const FLOOR: Record<
  FloorId,
  { n: number | null; name: string; short: string; fightFor: string; stillIn: string }
> = {
  main: {
    n: 1,
    name: "Main Event",
    short: "Floor 1",
    fightFor: "the title",
    stillIn: "You are on Floor 1. Win and you stay in the title picture.",
  },
  redemption: {
    n: 2,
    name: "Redemption",
    short: "Floor 2",
    fightFor: "second prize",
    stillIn: "You are on Floor 2. One loss dropped you. You are still fighting for second prize.",
  },
  rumble: {
    n: 3,
    name: "Royal Rumble",
    short: "Floor 3",
    fightFor: "the rumble belt",
    stillIn: "You are on Floor 3. You are still on the card. Highest score this week takes the rumble belt.",
  },
  champ: {
    n: null,
    name: "Champion",
    short: "Belt",
    fightFor: "the belt",
    stillIn: "You hold the belt on this floor.",
  },
  out: {
    n: null,
    name: "Out",
    short: "Out",
    fightFor: "next period",
    stillIn: "This period’s card is closed for you.",
  },
  unassigned: {
    n: null,
    name: "Not seeded",
    short: "—",
    fightFor: "a floor",
    stillIn: "The commissioner has not put you on a floor yet.",
  },
};

export const STATUS_ORDER: MetricStatus[] = ["red", "orange", "blue", "green"];

export const STATUS_LABEL: Record<MetricStatus, string> = {
  green: "Green",
  blue: "Blue",
  orange: "Orange",
  red: "Red",
};

export const STATUS_POINTS: Record<MetricStatus, number> = {
  green: 3,
  blue: 2,
  orange: 1,
  red: 0,
};

export const SCORE_BLURB =
  "Green 3, Blue 2, Orange 1, Red 0. Each extra green after the first is +1. Every metric green is an automatic win that week. Named 5-star reviews are +1 each, three max. Pass this week’s academy quiz for +1. Ties: greens, then blues, then reviews, then seed.";

export type Circuit = {
  id: string;
  slug: string;
  name: string;
  periodLabel: string;
  weeks: number;
  currentWeek: number;
  status: CircuitStatus;
  joinCode: string;
  ownerUserId: string | null;
  isDemo: boolean;
  prizeMain: string;
  prizeRedemption: string;
  prizeRumble: string;
  week1Byes: number;
  tickerText: string;
  theme: string;
};

export const DEFAULT_TICKER = [
  "Period 10",
  "How the Rumble works",
  "Green 3 · Blue 2 · Orange 1 · Red 0",
  "Every store scores",
  "Your passcode opens the locker",
  "Academy quiz is +1 on the card",
  "The commissioner locks the week",
  "Green beats blue beats orange",
  "Red is zero",
  "All green is a sweep",
  "Heat prints from the scoresheet",
  "Waterman Arch Supports",
  "Main Event · Redemption · Royal Rumble",
];

export function tickerItems(text?: string | null): string[] {
  const lines = (text ?? "")
    .split(/\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.length ? lines : DEFAULT_TICKER;
}

export type Metric = {
  id: string;
  circuitId: string;
  key: string;
  label: string;
  sortOrder: number;
};

export type Fighter = {
  id: string;
  circuitId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  nickname: string;
  hypeLine: string;
  backstory: string;
  hometown: string;
  funFact: string;
  seed: number | null;
  priorPoints: number;
  priorBlues: number;
  priorReviews: number;
  socksSold: number;
  claimCode: string;
  active: boolean;
  departed: boolean;
  photoUrl: string;
  plateBorder: string;
  plateBg: string;
  plateMark: string;
  plateSticker: string;
  plateFx: string;
  store: string;
  walkout: string;
};

export type Week = {
  circuitId: string;
  weekNumber: number;
  status: WeekStatus;
};

export type Score = {
  id: string;
  circuitId: string;
  fighterId: string;
  weekNumber: number;
  statuses: MetricStatus[];
  reviews: number;
  notes: string;
  trainingBonus: 0 | 1;
};

export type Matchup = {
  id: string;
  circuitId: string;
  weekNumber: number;
  bracket: BracketId;
  kind: MatchupKind;
  fighterIds: string[];
  winnerId: string | null;
  status: MatchupStatus;
};

export type Placement = {
  circuitId: string;
  fighterId: string;
  weekNumber: number;
  bracket: BracketId;
  result: PlacementResult;
  rankInBracket: number | null;
};

export type GazetteIssue = {
  id: string;
  circuitId: string;
  weekNumber: number;
  kind: GazetteKind;
  headline: string;
  body: string;
  publishedAt: string;
};

export type Scorecard = {
  points: number;
  greens: number;
  blues: number;
  oranges: number;
  reds: number;
  reviews: number;
  bonus: number;
  trainingBonus: 0 | 1;
  sweep: boolean;
};

export type Pairing = {
  kind: MatchupKind;
  fighterIds: string[];
  bracket: BracketId;
};

export const DEFAULT_METRICS = [
  { key: "volume", label: "Sales volume" },
  { key: "ticket", label: "Average ticket" },
  { key: "conversion", label: "Conversion" },
  { key: "followup", label: "Follow-up close" },
  { key: "new", label: "New guests" },
] as const;

export function weekAcceptsScores(status: string) {
  return status === "open" || status === "upcoming";
}
