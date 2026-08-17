import { normalizeStatus } from "@/lib/circuit/engine";
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
  claim_code: string;
  active: boolean;
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
    claimCode: r.claim_code,
    active: Boolean(r.active),
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
}) {
  return {
    id: r.id,
    circuitId: r.circuit_id,
    fighterId: r.fighter_id,
    weekNumber: Number(r.week_number),
    statuses: (JSON.parse(r.statuses_json) as string[]).map(normalizeStatus),
    reviews: Number(r.reviews),
    notes: r.notes,
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
