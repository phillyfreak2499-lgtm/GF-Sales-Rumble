import type { BracketId, Fighter, Matchup, Placement, Score } from "./types";
import { BRACKET_LABEL } from "./types";
import { cardFor, compareCards } from "./engine";

export type RecordLine = { wins: number; losses: number; byes: number };

export function recordOf(fighterId: string, placements: Placement[]): RecordLine {
  const mine = placements.filter((p) => p.fighterId === fighterId);
  return {
    wins: mine.filter((p) => p.result === "win" || p.result === "champ").length,
    losses: mine.filter((p) => p.result === "loss").length,
    byes: mine.filter((p) => p.result === "bye").length,
  };
}

export function formatRecord(r: RecordLine) {
  return r.byes ? `${r.wins}–${r.losses} (${r.byes} bye)` : `${r.wins}–${r.losses}`;
}

function pick<T>(key: string, items: readonly T[]): T {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return items[Math.abs(h) % items.length];
}

const NICK_PREFIX = [
  "Cold",
  "Quiet",
  "Late",
  "Clean",
  "Hard",
  "Soft",
  "Last",
  "First",
  "Long",
  "Still",
] as const;
const NICK_NOUN = [
  "Close",
  "Ledger",
  "Hold",
  "Call",
  "Ticket",
  "Count",
  "Floor",
  "Bell",
  "Book",
  "Light",
] as const;

export function suggestNickname(first: string, last: string, used: string[] = []) {
  const taken = new Set(used.map((n) => n.toLowerCase()));
  const candidates = [
    `${pick(first, NICK_PREFIX)} ${pick(last, NICK_NOUN)}`,
    `${pick(last + first, NICK_PREFIX)} ${last}`,
    `The ${pick(first + last, NICK_NOUN)}`,
    `${first.slice(0, 1)}. ${pick(last, NICK_NOUN)}`,
  ];
  for (const c of candidates) {
    if (!taken.has(c.toLowerCase())) return c;
  }
  return `${last} ${pick(first + used.length, NICK_NOUN)}`;
}

const HYPE = [
  (n: string) => `Don’t blink on the follow-up. ${n} already booked the pin.`,
  (n: string) => `${n} didn’t come down the aisle to split the ticket.`,
  (n: string) => `The bell rings. The guest sits. ${n} is still talking.`,
  (n: string) => `Smile, handshake, close. That is the whole match.`,
  (n: string) => `${n} treats every walk-in like a title defense.`,
];

const STORIES = [
  ({ first, nickname, hometown, funFact }: Bio) =>
    `${first} walks into the Waterman ring like the main event already has their name on it. ${hometown ? `Out of ${hometown}, ` : ""}${first} works the aisle as “${nickname}.” The locker room still talks about this one: ${funFact || "they never leave a follow-up on read."} The finisher is one more question after the guest has their keys out.`,
  ({ first, last, nickname, hometown, funFact }: Bio) =>
    `They call ${first} ${last} “${nickname}” because the close never looks like a close. ${hometown ? `${hometown} sent them. ` : ""}${funFact ? `Referee’s note: ${funFact}` : "They keep the sample pairs straighter than the rulebook."} Polite. Patient. Undefeated against “we’re just looking.”`,
  ({ first, nickname, hometown, funFact }: Bio) =>
    `“${nickname}” is ${/^[aeiou]/i.test(hometown || "f") ? "an" : "a"} ${hometown || "floor"} original with a calm voice and a terrible memory for quitting. ${first} does not sell. ${first} narrates the guest into a yes. ${funFact ? `Also: ${funFact}` : "Also: they know who came back angry, and why."}`,
  ({ first, last, nickname, hometown, funFact }: Bio) =>
    `${first} ${last} — ${nickname} — treats the fitting chair like a turnbuckle. ${hometown ? `Hometown: ${hometown}. ` : ""}${funFact || "They once talked a skeptic into sitting down for “just the scan.”"} In this building that counts as a spear.`,
  ({ first, nickname, hometown, funFact }: Bio) =>
    `Gimmick: competence. Entrance music: the door chime. ${first}, known as ${nickname}${hometown ? ` of ${hometown}` : ""}, builds a match the long way — listen, measure, close. ${funFact ? funFact : "Keeps a running list of every almost-sale and hunts them on Tuesday."}`,
];

type Bio = {
  first: string;
  last: string;
  nickname: string;
  hometown: string;
  funFact: string;
};

export function generatePersona(input: {
  firstName: string;
  lastName: string;
  nickname?: string;
  hometown?: string;
  funFact?: string;
  usedNicknames?: string[];
}) {
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  const nickname =
    (input.nickname ?? "").trim() ||
    suggestNickname(first, last, input.usedNicknames ?? []);
  const hometown = (input.hometown ?? "").trim();
  const funFact = (input.funFact ?? "").trim();
  const bio: Bio = { first, last, nickname, hometown, funFact };
  const key = `${first}|${last}|${nickname}`;
  const story = pick(key, STORIES)(bio);
  const hype = pick(key + "h", HYPE)(nickname);
  return { nickname, hypeLine: hype, backstory: story };
}

function ringName(f: Fighter) {
  return f.nickname ? `${f.firstName} “${f.nickname}” ${f.lastName}` : `${f.firstName} ${f.lastName}`;
}

function shortName(f: Fighter) {
  return f.nickname || f.lastName;
}

function fromOf(f: Fighter) {
  return f.hometown ? ` out of ${f.hometown}` : "";
}

function factOf(f: Fighter) {
  return f.funFact ? f.funFact.replace(/\.$/, "") + "." : "";
}

export function writeBoutPreview(opts: {
  week: number;
  totalWeeks: number;
  matchup: Matchup;
  fighters: Fighter[];
  placements: Placement[];
}): { title: string; body: string } {
  const people = opts.matchup.fighterIds
    .map((id) => opts.fighters.find((f) => f.id === id))
    .filter(Boolean) as Fighter[];
  const label = BRACKET_LABEL[opts.matchup.bracket];
  const final = opts.week === opts.totalWeeks;

  if (opts.matchup.kind === "bye" && people[0]) {
    const a = people[0];
    return {
      title: `Week ${opts.week} · ${label} · Bye`,
      body: `${ringName(a)} (${formatRecord(recordOf(a.id, opts.placements))})${fromOf(a)} draws the bye and sits this one out. ${factOf(a)} They advance without taking a bump.`,
    };
  }

  if (opts.matchup.kind === "rumble") {
    const names = people
      .map((f) => `${shortName(f)} (${formatRecord(recordOf(f.id, opts.placements))})`)
      .join(", ");
    const facts = people
      .filter((f) => f.funFact)
      .slice(0, 3)
      .map((f) => `${shortName(f)}: ${f.funFact.replace(/\.$/, "")}`)
      .join(". ");
    return {
      title: `Week ${opts.week} · Royal Rumble`,
      body: `A ${people.length}-way scramble. Last card standing takes the scraps. In the ring: ${names}. ${facts}${facts ? "." : ""} Highest score wins. Alliances last as long as a follow-up window.`,
    };
  }

  if (people.length !== 2) {
    return { title: `Week ${opts.week} · ${label}`, body: "This match is still being booked." };
  }

  const [a, b] = people;
  const ra = recordOf(a.id, opts.placements);
  const rb = recordOf(b.id, opts.placements);
  const lastA = lastResult(a.id, opts.placements);
  const lastB = lastResult(b.id, opts.placements);
  const stakes = final
    ? `This is the ${label.toLowerCase()} title match.`
    : `Winner stays in ${label}. Loser drops a floor.`;

  const hist = [lastA && `${shortName(a)} ${lastA}`, lastB && `${shortName(b)} ${lastB}`]
    .filter(Boolean)
    .join(" ");

  const opener = pick(
    a.id + b.id + String(opts.week),
    [
      `Tale of the tape.`,
      `The bell is set.`,
      `Two corners. One fitting chair.`,
      `This one has been coming since the seeding meeting.`,
    ] as const,
  );

  const body = [
    `${opener} In this corner, #${a.seed ?? "—"} ${ringName(a)} (${formatRecord(ra)})${fromOf(a)}. ${factOf(a)}`,
    `Across the ring, #${b.seed ?? "—"} ${ringName(b)} (${formatRecord(rb)})${fromOf(b)}. ${factOf(b)}`,
    hist,
    stakes,
  ]
    .filter((s) => s && s.trim())
    .join(" ");

  return {
    title: `Week ${opts.week} · ${label}${final ? " · Title match" : ""}`,
    body,
  };
}

export function writeBoutRecap(opts: {
  week: number;
  totalWeeks: number;
  matchup: Matchup;
  fighters: Fighter[];
  placements: Placement[];
  scores: Score[];
  metricCount: number;
}): { title: string; body: string } {
  const people = opts.matchup.fighterIds
    .map((id) => opts.fighters.find((f) => f.id === id))
    .filter(Boolean) as Fighter[];
  const label = BRACKET_LABEL[opts.matchup.bracket];
  const seedById = new Map(opts.fighters.map((f) => [f.id, f.seed ?? 99]));

  if (opts.matchup.kind === "bye" && people[0]) {
    return {
      title: `Week ${opts.week} · ${label} · Bye`,
      body: `${shortName(people[0])} advanced on a bye. No bump. Still in ${label}.`,
    };
  }

  if (opts.matchup.kind === "rumble") {
    const ranked = [...people].sort((a, b) => {
      const ca = cardFor(a.id, opts.scores, opts.metricCount, seedById.get(a.id) ?? 99);
      const cb = cardFor(b.id, opts.scores, opts.metricCount, seedById.get(b.id) ?? 99);
      return compareCards(ca, cb);
    });
    const bits = ranked.map((f) => {
      const c = cardFor(f.id, opts.scores, opts.metricCount, f.seed ?? 99);
      return `${shortName(f)} ${c.points}${c.sweep ? " (sweep)" : ""}`;
    });
    const top = ranked[0];
    return {
      title: `Week ${opts.week} · Rumble result`,
      body: `The scramble is over. ${bits.join(" · ")}. ${top ? `${shortName(top)} crawled out first.` : ""}`,
    };
  }

  if (people.length !== 2) {
    return { title: `Week ${opts.week} · ${label}`, body: "No result posted." };
  }

  const [a, b] = people;
  const winner = opts.matchup.winnerId === b.id ? b : a;
  const loser = winner.id === a.id ? b : a;
  const cw = cardFor(winner.id, opts.scores, opts.metricCount, winner.seed ?? 99);
  const cl = cardFor(loser.id, opts.scores, opts.metricCount, loser.seed ?? 99);
  const drop =
    opts.matchup.bracket === "main"
      ? "drops to Redemption"
      : opts.matchup.bracket === "redemption"
        ? "drops to the Rumble"
        : "is out of the building";
  const how = cw.sweep && !cl.sweep
    ? `a clean sweep — every metric green`
    : cw.points === cl.points
      ? `even on points; ${shortName(winner)} takes it on the tiebreak (${cw.greens} green${cw.greens === 1 ? "" : "s"})`
      : `${cw.points}–${cl.points}`;
  const callback = winner.funFact
    ? ` True to form: ${winner.funFact.replace(/\.$/, "")}.`
    : "";

  return {
    title: `Week ${opts.week} · ${label} · Result`,
    body: `${shortName(winner)} pins ${shortName(loser)}, ${how}. ${shortName(winner)} moves on at ${formatRecord(recordOf(winner.id, opts.placements))}. ${shortName(loser)} ${drop}.${callback}`,
  };
}

function lastResult(fighterId: string, placements: Placement[]): string | null {
  const hist = placements
    .filter((p) => p.fighterId === fighterId)
    .sort((a, b) => a.weekNumber - b.weekNumber);
  const last = hist[hist.length - 1];
  if (!last) return null;
  if (last.result === "win" || last.result === "champ") {
    return `came in off a week ${last.weekNumber} win.`;
  }
  if (last.result === "loss") return `is coming off a week ${last.weekNumber} loss.`;
  if (last.result === "bye") return `sat out week ${last.weekNumber} on a bye.`;
  return null;
}

export { ringName, shortName };
