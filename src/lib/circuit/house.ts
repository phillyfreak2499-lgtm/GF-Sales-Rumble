export const CHALLENGE_SLOTS = 3;

export type ChallengeClaim = { fighterId: string; at: string };

export type WeekChallenge = {
  weekNumber: number;
  title: string;
  blurb: string;
  claims: ChallengeClaim[];
};

export type HouseCall = {
  weekNumber: number;
  faceId: string;
  heelId: string;
};

export function challengeOpen(c: WeekChallenge | null | undefined) {
  if (!c) return false;
  return c.claims.length < CHALLENGE_SLOTS;
}

export function claimedChallenge(c: WeekChallenge | null | undefined, fighterId: string) {
  return Boolean(c?.claims.some((x) => x.fighterId === fighterId));
}

export function callForWeek(calls: HouseCall[] | undefined, week: number) {
  return (calls ?? []).find((c) => c.weekNumber === week) ?? null;
}

export function roleOf(calls: HouseCall[] | undefined, fighterId: string, week: number) {
  const c = callForWeek(calls, week);
  if (!c) return null;
  if (c.faceId === fighterId) return "face" as const;
  if (c.heelId === fighterId) return "heel" as const;
  return null;
}
