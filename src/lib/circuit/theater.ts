import type { BoardPayload } from "@/lib/server/circuit";
import { storeStandings } from "./crowd";
import { PROMO_BY_ID } from "./promos";

const TAPES = [
  {
    kicker: "Monday tape",
    line: "The bell rang. Open your locker. See who you wrestle.",
    to: "/score" as const,
    cta: "Open my locker",
  },
  {
    kicker: "Tuesday tape",
    line: "Film day. Four academies. Pass one for a point on the card.",
    to: "/score" as const,
    cta: "Watch the film",
  },
  {
    kicker: "Wednesday tape",
    line: "Floor jobs. Four stars sitting on the belt if you actually do them.",
    to: "/score" as const,
    cta: "This week’s work",
  },
  {
    kicker: "Thursday tape",
    line: "Pick the card. Send a promo. The building is listening.",
    to: "/score" as const,
    cta: "Crowd",
  },
  {
    kicker: "Friday tape",
    line: "Get the colors in before the commissioner locks the week.",
    to: "/score" as const,
    cta: "Mark my card",
  },
  {
    kicker: "Saturday tape",
    line: "Store heat is public. Look at the door next to yours.",
    to: "/honors" as const,
    cta: "Store heat",
  },
  {
    kicker: "Sunday tape",
    line: "Walk-out day. Five words. Make the aisle remember you.",
    to: "/score" as const,
    cta: "Fix my walk-out",
  },
];

export function todayTape(board: BoardPayload) {
  if (board.circuit.status === "setup") {
    return {
      kicker: "Preseason",
      line: "The book is open. Week 1 starts when the commissioner hits the bell.",
      to: "/how" as const,
      cta: "How this works",
    };
  }
  if (board.circuit.status === "complete") {
    return {
      kicker: "Final bell",
      line: "The floors have names on them. Walk the ceremony.",
      to: "/ceremony" as const,
      cta: "Ceremony",
    };
  }
  const week = board.weeks.find((w) => w.weekNumber === board.circuit.currentWeek);
  if (week?.status === "locked") {
    return {
      kicker: "Cards are frozen",
      line: "Nobody can change a score. The commissioner closes the week next.",
      to: "/bouts" as const,
      cta: "Read the bouts",
    };
  }
  const day = new Date().getDay();
  return TAPES[day] ?? TAPES[1];
}

export function lockerCheck(board: BoardPayload) {
  const live = board.fighters.filter((f) => !f.departed);
  const week = board.circuit.currentWeek;
  const posted = live.filter((f) =>
    board.scores.some((s) => s.fighterId === f.id && s.weekNumber === week),
  );
  return { in: posted.length, of: live.length, missing: live.length - posted.length };
}

export function mainEvent(board: BoardPayload) {
  const week = board.circuit.currentWeek;
  const singles = board.matchups.filter((m) => m.weekNumber === week && m.kind === "singles");
  const main = singles.find((m) => m.bracket === "main") ?? singles[0];
  if (!main || main.fighterIds.length < 2) return null;
  const people = main.fighterIds
    .map((id) => board.fighters.find((f) => f.id === id))
    .filter(Boolean);
  if (people.length < 2) return null;
  return { matchup: main, a: people[0]!, b: people[1]! };
}

export function storeRace(board: BoardPayload) {
  const rows = storeStandings(board.fighters, board.standings);
  if (rows.length < 2) return rows[0] ? { lead: rows[0], chase: null, gap: 0 } : null;
  return { lead: rows[0]!, chase: rows[1]!, gap: rows[0]!.points - rows[1]!.points };
}

export function featuredPromo(board: BoardPayload) {
  const week = board.circuit.currentWeek;
  const live = (board.promos ?? []).filter((p) => p.weekNumber === week);
  if (!live.length) return null;
  const p = live[0]!;
  const from = board.fighters.find((f) => f.id === p.fromId);
  const to = board.fighters.find((f) => f.id === p.toId);
  const line = PROMO_BY_ID[p.lineId]?.text;
  if (!from || !line) return null;
  return { from, to, line };
}
