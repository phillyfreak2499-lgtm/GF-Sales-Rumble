import type { Fighter, Matchup, Placement, Score } from "./types";
import { BRACKET_LABEL } from "./types";
import { cardFor, compareCards } from "./engine";
import { formatRecord, recordOf, ringName, shortName } from "./copy";

export type AnnounceStyle = "formal" | "playbyplay" | "color" | "title";
export type AnnouncePhase = "preview" | "recap";

export const ANNOUNCE_STYLES: Array<{
  id: AnnounceStyle;
  name: string;
  desk: string;
  blurb: string;
  intro: string;
}> = [
  {
    id: "formal",
    name: "Formal intro",
    desk: "Ring announcer",
    blurb: "Ladies and gentlemen. Weight, record, hometown. The contest is scheduled for one week.",
    intro:
      "Ladies and gentlemen — the following contest is scheduled for one week. When the bell rings, the cards decide it.",
  },
  {
    id: "playbyplay",
    name: "Play-by-play",
    desk: "Lead call",
    blurb: "He calls the work. Business is about to pick up. Respect the chair.",
    intro: "Mic is hot. The aisle is moving. Business is about to pick up on this floor.",
  },
  {
    id: "color",
    name: "Color desk",
    desk: "Second chair",
    blurb: "The rib, the heat, the one fact the locker already knows. Work-ok. Still sharp.",
    intro: "I have seen a lot of walk-ins. I have not seen a lot of people leave without a ticket.",
  },
  {
    id: "title",
    name: "Title call",
    desk: "Marquee night",
    blurb: "Lights up. Belts out. A voice that fills the building without borrowing anyone’s catchphrase.",
    intro: "The building is full. The belts are on the table. This is the main card. Listen.",
  },
];

export const ANNOUNCE_BY_ID = Object.fromEntries(ANNOUNCE_STYLES.map((s) => [s.id, s])) as Record<
  AnnounceStyle,
  (typeof ANNOUNCE_STYLES)[number]
>;

export function isAnnounceStyle(v: string): v is AnnounceStyle {
  return ANNOUNCE_STYLES.some((s) => s.id === v);
}

function fromOf(f: Fighter) {
  return f.hometown ? `, out of ${f.hometown}` : "";
}

function walkOf(f: Fighter) {
  return f.walkout ? ` Walk-out: “${f.walkout}.”` : "";
}


function factOf(f: Fighter) {
  return f.funFact ? f.funFact.replace(/\.$/, "") : "";
}

function lastLine(fighterId: string, placements: Placement[]): string | null {
  const hist = placements
    .filter((p) => p.fighterId === fighterId)
    .sort((a, b) => a.weekNumber - b.weekNumber);
  const last = hist[hist.length - 1];
  if (!last) return null;
  if (last.result === "win" || last.result === "champ") return `coming off a week ${last.weekNumber} win`;
  if (last.result === "loss") return `coming off a week ${last.weekNumber} loss`;
  if (last.result === "bye") return `rested on a bye in week ${last.weekNumber}`;
  return null;
}

function dropLine(bracket: Matchup["bracket"]) {
  if (bracket === "main") return "drops to Redemption";
  if (bracket === "redemption") return "drops to the Royal Rumble";
  return "is out of the building";
}

export type CallInput = {
  style: AnnounceStyle;
  phase: AnnouncePhase;
  week: number;
  totalWeeks: number;
  matchup: Matchup;
  fighters: Fighter[];
  placements: Placement[];
  scores?: Score[];
  metricCount?: number;
};

export function callBout(input: CallInput): { title: string; body: string } {
  const people = input.matchup.fighterIds
    .map((id) => input.fighters.find((f) => f.id === id))
    .filter(Boolean) as Fighter[];
  const label = BRACKET_LABEL[input.matchup.bracket];
  const final = input.week === input.totalWeeks;
  const title =
    input.phase === "recap"
      ? `Week ${input.week} · ${label} · ${input.matchup.kind === "bye" ? "Bye" : "Result"}`
      : `Week ${input.week} · ${label}${final ? " · Title match" : ""}${input.matchup.kind === "bye" ? " · Bye" : ""}`;

  if (input.matchup.kind === "bye" && people[0]) {
    return { title, body: byeCall(input.style, input.phase, people[0], label, input.placements) };
  }
  if (input.matchup.kind === "rumble") {
    return { title: `Week ${input.week} · Royal Rumble`, body: rumbleCall(input, people, final) };
  }
  if (people.length !== 2) {
    return {
      title,
      body:
        input.phase === "recap"
          ? "No result posted. The gazette is waiting on the scoresheet."
          : "This match is still being booked. Give the commissioner a minute.",
    };
  }
  return {
    title,
    body:
      input.phase === "recap"
        ? singlesRecap(input.style, people[0], people[1], input)
        : singlesPreview(input.style, people[0], people[1], input, final, label),
  };
}

function byeCall(
  style: AnnounceStyle,
  phase: AnnouncePhase,
  a: Fighter,
  label: string,
  placements: Placement[],
) {
  const rec = formatRecord(recordOf(a.id, placements));
  if (phase === "recap") {
    if (style === "color") return `${shortName(a)} sat this one out and still got paid in advancement. That is a good Tuesday.`;
    if (style === "title") return `${ringName(a)} is through. No contest required. The belt picture stays intact.`;
    if (style === "playbyplay") return `${shortName(a)} advances on a bye. No bump. Still in ${label}. Smart night.`;
    return `${ringName(a)}, record ${rec}, advances without contest. Still in ${label}.`;
  }
  if (style === "color") return `${shortName(a)} drew the night off. Do not be jealous. They still move on.`;
  if (style === "title") return `And now — a bye for ${ringName(a)}. The building grants the rest. They stay in ${label}.`;
  if (style === "playbyplay") return `${shortName(a)} sits. The chair is empty. They still go through. That is how a bye works.`;
  return `Ladies and gentlemen, ${ringName(a)}${fromOf(a)}, record ${rec}, has drawn a bye and will advance in ${label}.`;
}

function rumbleCall(input: CallInput, people: Fighter[], final: boolean) {
  const names = people.map((f) => `${shortName(f)} (${formatRecord(recordOf(f.id, input.placements))})`).join(", ");
  if (input.phase === "recap" && input.scores && input.metricCount != null) {
    const seedById = new Map(input.fighters.map((f) => [f.id, f.seed ?? 99]));
    const ranked = [...people].sort((a, b) =>
      compareCards(
        cardFor(a.id, input.scores!, input.metricCount!, seedById.get(a.id) ?? 99),
        cardFor(b.id, input.scores!, input.metricCount!, seedById.get(b.id) ?? 99),
      ),
    );
    const bits = ranked.map((f) => {
      const c = cardFor(f.id, input.scores!, input.metricCount!, f.seed ?? 99);
      return `${shortName(f)} ${c.points}${c.sweep ? " sweep" : ""}`;
    });
    const top = ranked[0];
    if (input.style === "title") {
      return `The scramble is over. ${bits.join(". ")}. ${top ? `${ringName(top)} stands last. The building knows the name.` : ""}`;
    }
    if (input.style === "color") {
      return `Everybody in, everybody counted. ${bits.join(" · ")}. ${top ? `${shortName(top)} crawled out with the card. Buy that person lunch.` : ""}`;
    }
    if (input.style === "playbyplay") {
      return `Rumble is in the books. Order of finish: ${bits.join(", ")}. ${top ? `${shortName(top)} got the last pin.` : ""}`;
    }
    return `Result of the ${people.length}-person rumble. ${bits.join(" · ")}. ${top ? `${ringName(top)} is declared the winner.` : ""}`;
  }
  if (input.style === "title") {
    return `A ${people.length}-person battle. ${final ? "This is for the belt." : "Last card standing takes the scraps."} In the ring: ${names}.`;
  }
  if (input.style === "color") {
    return `${people.length} people and one scoresheet. Alliances last as long as a follow-up window. In there: ${names}.`;
  }
  if (input.style === "playbyplay") {
    return `Rumble time. ${people.length} in. Highest card wins. The field: ${names}. Keep your eyes on the greens.`;
  }
  return `Ladies and gentlemen, a ${people.length}-person Royal Rumble. Highest score wins. Introducing: ${names}.`;
}

function singlesPreview(
  style: AnnounceStyle,
  a: Fighter,
  b: Fighter,
  input: CallInput,
  final: boolean,
  label: string,
) {
  const ra = formatRecord(recordOf(a.id, input.placements));
  const rb = formatRecord(recordOf(b.id, input.placements));
  const la = lastLine(a.id, input.placements);
  const lb = lastLine(b.id, input.placements);
  const stakes = final
    ? `This is the ${label.toLowerCase()} championship.`
    : `Winner stays in ${label}. Loser drops a floor. All green climbs one.`;

  if (style === "formal") {
    return [
      `Ladies and gentlemen, the following contest is scheduled for one week.`,
      `In this corner, from seed ${a.seed ?? "unseeded"}${fromOf(a)}, weighing in with a record of ${ra} — ${ringName(a)}.${walkOf(a)}${factOf(a) ? ` Known for this: ${factOf(a)}.` : ""}`,
      `And the opponent, seed ${b.seed ?? "unseeded"}${fromOf(b)}, record ${rb} — ${ringName(b)}.${walkOf(b)}${factOf(b) ? ` Known for this: ${factOf(b)}.` : ""}`,
      [la && `${shortName(a)} is ${la}.`, lb && `${shortName(b)} is ${lb}.`].filter(Boolean).join(" "),
      stakes,
    ]
      .filter((s) => s && s.trim())
      .join(" ");
  }

  if (style === "playbyplay") {
    return [
      `Here we go. Seed ${a.seed ?? "—"} ${shortName(a)} (${ra})${fromOf(a)} against seed ${b.seed ?? "—"} ${shortName(b)} (${rb})${fromOf(b)}.`,
      factOf(a) ? `${shortName(a)} — ${factOf(a)}.` : "",
      factOf(b) ? `${shortName(b)} — ${factOf(b)}.` : "",
      [la && `${shortName(a)} ${la}.`, lb && `${shortName(b)} ${lb}.`].filter(Boolean).join(" "),
      `${stakes} Watch the greens. That is where this one gets won.`,
    ]
      .filter((s) => s && s.trim())
      .join(" ");
  }

  if (style === "color") {
    return [
      `I like this one.`,
      `${shortName(a)} (${ra})${fromOf(a)}${factOf(a) ? ` — and yes, ${factOf(a)}` : ""}.`,
      `Across from them, ${shortName(b)} (${rb})${fromOf(b)}${factOf(b) ? `, who ${factOf(b).charAt(0).toLowerCase()}${factOf(b).slice(1)}` : ""}.`,
      [la && `${shortName(a)} is ${la}, so the heat is real.`, lb && `${shortName(b)} is ${lb}.`].filter(Boolean).join(" "),
      `${stakes} If this is close, it will be the reviews that spoil someone’s night.`,
    ]
      .filter((s) => s && s.trim())
      .join(" ");
  }

  return [
    `And now — for ${final ? "the championship of this floor" : `a place in ${label}`} —`,
    `${ringName(a)}, seed ${a.seed ?? "—"}, record ${ra}${fromOf(a)}.`,
    `Versus ${ringName(b)}, seed ${b.seed ?? "—"}, record ${rb}${fromOf(b)}.`,
    factOf(a) || factOf(b)
      ? `The building already knows this: ${[factOf(a) && `${shortName(a)}, ${factOf(a)}`, factOf(b) && `${shortName(b)}, ${factOf(b)}`].filter(Boolean).join(". ")}.`
      : "",
    stakes,
  ]
    .filter((s) => s && s.trim())
    .join(" ");
}

function singlesRecap(style: AnnounceStyle, a: Fighter, b: Fighter, input: CallInput) {
  const winner = input.matchup.winnerId === b.id ? b : a;
  const loser = winner.id === a.id ? b : a;
  const metricCount = input.metricCount ?? 5;
  const scores = input.scores ?? [];
  const cw = cardFor(winner.id, scores, metricCount, winner.seed ?? 99);
  const cl = cardFor(loser.id, scores, metricCount, loser.seed ?? 99);
  const drop = dropLine(input.matchup.bracket);
  const recW = formatRecord(recordOf(winner.id, input.placements));
  const how =
    cw.sweep && !cl.sweep
      ? "a clean sweep — every metric green"
      : cw.points === cl.points
        ? `even on points; ${shortName(winner)} takes the tiebreak`
        : `${cw.points} to ${cl.points}`;

  if (style === "formal") {
    return `The winner, ${ringName(winner)}, by ${how}. Record now ${recW}. ${ringName(loser)} ${drop}.${winner.funFact ? ` As advertised: ${factOf(winner)}.` : ""}`;
  }
  if (style === "playbyplay") {
    return `There it is. ${shortName(winner)} puts ${shortName(loser)} away, ${how}. ${shortName(winner)} stays standing at ${recW}. ${shortName(loser)} ${drop}. Good night’s work.`;
  }
  if (style === "color") {
    return `${shortName(winner)} just took ${shortName(loser)}’s lunch, ${how}. ${shortName(loser)} ${drop}. ${winner.funFact ? `Did we mention ${factOf(winner)}? We should have.` : "The locker saw that coming."}`;
  }
  return `Your winner — ${ringName(winner)}! ${how}. ${ringName(loser)} ${drop}. The building heard that one.`;
}
