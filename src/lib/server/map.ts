import { normalizeStatus } from "@/lib/circuit/engine";
import type { TrainingRecord } from "@/lib/circuit/training";
import type {
  BracketId,
  Circuit,
  CircuitStatus,
  Fighter,
  GazetteIssue,
  GazetteKind,
  Matchup,
  MatchupKind,
  MatchupStatus,
  Metric,
  Placement,
  PlacementResult,
  Score,
  Week,
  WeekStatus,
} from "@/lib/circuit/types";

export type CircuitRow = {
  id: string;
  slug: string;
  name: string;
  period_label: string;
  weeks: number;
  current_week: number;
  status: string;
  join_code: string;
  owner_user_id: string | null;
  is_demo: boolean;
  prize_main: string;
  prize_redemption: string;
  prize_rumble: string;
  week1_byes: number;
  ticker_text?: string | null;
  theme?: string | null;
};

export type FighterRow = {
  id: string;
  circuit_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  nickname: string;
  hype_line: string;
  backstory: string;
  hometown: string;
  fun_fact: string;
  seed: number | null;
  prior_points: number;
  prior_blues: number;
  prior_reviews: number;
  socks_sold?: number | null;
  claim_code: string;
  active: boolean;
  photo_url?: string | null;
  plate_border?: string | null;
  plate_bg?: string | null;
  plate_mark?: string | null;
  plate_sticker?: string | null;
  plate_fx?: string | null;
  departed?: boolean | null;
  store?: string | null;
  walkout?: string | null;
};

export function mapCircuit(r: CircuitRow): Circuit {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    periodLabel: r.period_label,
    weeks: Number(r.weeks),
    currentWeek: Number(r.current_week),
    status: r.status as CircuitStatus,
    joinCode: r.join_code,
    ownerUserId: r.owner_user_id,
    isDemo: Boolean(r.is_demo),
    prizeMain: r.prize_main,
    prizeRedemption: r.prize_redemption,
    prizeRumble: r.prize_rumble,
    week1Byes: Number(r.week1_byes),
    tickerText: r.ticker_text ?? "",
    theme: r.theme ?? "house",
  };
}

export function mapFighter(r: FighterRow): Fighter {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    nickname: r.nickname,
    hypeLine: r.hype_line,
    backstory: r.backstory,
    hometown: r.hometown ?? "",
    funFact: r.fun_fact ?? "",
    seed: r.seed === null ? null : Number(r.seed),
    priorPoints: Number(r.prior_points),
    priorBlues: Number(r.prior_blues),
    priorReviews: Number(r.prior_reviews),
    socksSold: Number(r.socks_sold ?? 0),
    claimCode: r.claim_code,
    active: Boolean(r.active),
    departed: Boolean(r.departed),
    store: r.store ?? "",
    walkout: r.walkout ?? "",
    photoUrl: r.photo_url ?? "",
    plateBorder: r.plate_border ?? "bone",
    plateBg: r.plate_bg ?? "surface",
    plateMark: r.plate_mark ?? "",
    plateSticker: r.plate_sticker ?? "",
    plateFx: r.plate_fx ?? "",
  };
}

export function mapMetric(r: {
  id: string;
  circuit_id: string;
  key: string;
  label: string;
  sort_order: number;
}): Metric {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    key: r.key,
    label: r.label,
    sortOrder: Number(r.sort_order),
  };
}

export function mapWeek(r: {
  circuit_id: string;
  week_number: number;
  status: string;
}): Week {
  return {
    circuitId: r.circuit_id,
    weekNumber: Number(r.week_number),
    status: r.status as WeekStatus,
  };
}

export function mapScore(r: {
  id: string;
  circuit_id: string;
  fighter_id: string;
  week_number: number;
  statuses_json: string;
  reviews: number;
  notes: string;
  training_bonus?: number | boolean | null;
}): Score {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    fighterId: r.fighter_id,
    weekNumber: Number(r.week_number),
    statuses: (JSON.parse(r.statuses_json) as string[]).map(normalizeStatus),
    reviews: Number(r.reviews),
    notes: r.notes,
    trainingBonus: r.training_bonus ? 1 : 0,
  };
}

export function mapTraining(r: {
  fighter_id: string;
  week_number: number;
  module_id: string;
  passed: boolean;
  awarded?: boolean | null;
  correct: number;
  total: number;
  attempted_at: string | Date;
}): TrainingRecord {
  return {
    fighterId: r.fighter_id,
    weekNumber: Number(r.week_number),
    moduleId: r.module_id,
    passed: Boolean(r.passed),
    awarded: Boolean(r.awarded),
    correct: Number(r.correct),
    total: Number(r.total),
    attemptedAt: String(r.attempted_at),
  };
}

export function mapMatchup(r: {
  id: string;
  circuit_id: string;
  week_number: number;
  bracket: string;
  kind: string;
  fighter_ids_json: string;
  winner_id: string | null;
  status: string;
}): Matchup {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    weekNumber: Number(r.week_number),
    bracket: r.bracket as BracketId,
    kind: r.kind as MatchupKind,
    fighterIds: JSON.parse(r.fighter_ids_json) as string[],
    winnerId: r.winner_id,
    status: r.status as MatchupStatus,
  };
}

export function mapPlacement(r: {
  circuit_id: string;
  fighter_id: string;
  week_number: number;
  bracket: string;
  result: string;
  rank_in_bracket: number | null;
}): Placement {
  return {
    circuitId: r.circuit_id,
    fighterId: r.fighter_id,
    weekNumber: Number(r.week_number),
    bracket: r.bracket as BracketId,
    result: r.result as PlacementResult,
    rankInBracket: r.rank_in_bracket === null ? null : Number(r.rank_in_bracket),
  };
}

export function mapGazette(r: {
  id: string;
  circuit_id: string;
  week_number: number;
  kind: string;
  headline: string;
  body: string;
  published_at: string;
}): GazetteIssue {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    weekNumber: Number(r.week_number),
    kind: r.kind as GazetteKind,
    headline: r.headline,
    body: r.body,
    publishedAt: String(r.published_at),
  };
}
