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
  "Green 3, Blue 2, Orange 1, Red 0. Each extra green after the first is +1. Every metric green is an automatic win that week. Named 5-star reviews are +1 each, three max. Ties: greens, then blues, then reviews, then seed.";

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
};

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
  claimCode: string;
  active: boolean;
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

export const DESK_PIN = "cogs";
