import {
  BRACKET_LABEL,
  type BracketId,
  type Fighter,
  type Matchup,
  type Placement,
  type Score,
} from "./types";
import { scorecard } from "./engine";
import { writeBoutPreview, writeBoutRecap } from "./copy";

function nameOf(f: Fighter) {
  const nick = f.nickname || f.lastName;
  const first = f.firstName ?? "";
  const last = f.lastName ?? "";
  return nick ? `${first} “${nick}” ${last}`.replace(/\s+/g, " ").trim() : `${first} ${last}`.trim();
}

export function writePreview(opts: {
  week: number;
  totalWeeks: number;
  periodLabel: string;
  circuitName: string;
  matchups: Matchup[];
  fighters: Fighter[];
  placements?: Placement[];
}): { headline: string; body: string } {
  const isFinal = opts.week === opts.totalWeeks;
  const placements = opts.placements ?? [];

  const headline = isFinal
    ? `${opts.periodLabel} title night is booked`
    : `Week ${opts.week} of ${opts.totalWeeks} is on the card`;

  const lines: string[] = [];
  lines.push(
    `${opts.circuitName} opens week ${opts.week}. The aisle is lit. Cards are live until the commissioner rings the bell.`,
  );

  const groups: BracketId[] = ["main", "redemption", "rumble"];
  for (const bracket of groups) {
    const ms = opts.matchups.filter((m) => m.bracket === bracket);
    if (!ms.length) continue;
    lines.push("");
    lines.push(isFinal && bracket === "main" ? "Main event" : BRACKET_LABEL[bracket]);
    for (const m of ms) {
      const copy = writeBoutPreview({
        week: opts.week,
        totalWeeks: opts.totalWeeks,
        matchup: m,
        fighters: opts.fighters,
        placements,
      });
      lines.push(copy.body);
    }
  }

  lines.push("");
  lines.push(
    "Green is three. Blue is two. Orange is one. Red is nothing. Each extra green after the first is a bonus point. A clean sweep — every metric green — is an automatic win. Named five-star reviews are one each, three max. Ties break on greens, then blues, then reviews, then seed.",
  );

  return { headline, body: lines.join("\n") };
}

export function writeRecap(opts: {
  week: number;
  totalWeeks: number;
  periodLabel: string;
  circuitName: string;
  matchups: Matchup[];
  fighters: Fighter[];
  scores: Score[];
  metricCount: number;
  placements?: Placement[];
  champions?: Partial<Record<BracketId, string>>;
}): { headline: string; body: string } {
  const byId = new Map(opts.fighters.map((f) => [f.id, f]));
  const isFinal = opts.week === opts.totalWeeks;
  const placements = opts.placements ?? [];

  const headline = isFinal
    ? `${opts.periodLabel} has its champions`
    : `Week ${opts.week} is in the books`;

  const lines: string[] = [];
  lines.push(`${opts.circuitName}, week ${opts.week}. The cards are in. Here is who walked out.`);

  const groups: BracketId[] = ["main", "redemption", "rumble"];
  for (const bracket of groups) {
    const ms = opts.matchups.filter((m) => m.bracket === bracket);
    if (!ms.length) continue;
    lines.push("");
    lines.push(BRACKET_LABEL[bracket]);
    for (const m of ms) {
      const copy = writeBoutRecap({
        week: opts.week,
        totalWeeks: opts.totalWeeks,
        matchup: m,
        fighters: opts.fighters,
        placements,
        scores: opts.scores,
        metricCount: opts.metricCount,
      });
      lines.push(copy.body);
    }
  }

  if (isFinal && opts.champions) {
    lines.push("");
    lines.push("Champions");
    for (const b of groups) {
      const id = opts.champions[b];
      const f = id ? byId.get(id) : undefined;
      if (f) lines.push(`${BRACKET_LABEL[b]}: ${nameOf(f)}.`);
    }
  }

  return { headline, body: lines.join("\n") };
}

export function scoreLine(statuses: string[], reviews: number) {
  const card = scorecard(statuses as never, reviews);
  return `${card.points} pts · ${card.greens} green · ${card.blues} blue · ${card.reviews} review${card.reviews === 1 ? "" : "s"}${card.sweep ? " · sweep" : ""}`;
}

export { nameOf };
