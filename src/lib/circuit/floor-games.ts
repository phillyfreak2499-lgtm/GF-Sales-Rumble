export type FloorGame = {
  slug: string;
  title: string;
  kicker: string;
  blurb: string;
  file: string;
};

export const FLOOR_GAMES: FloorGame[] = [
  {
    slug: "3-step-showdown",
    title: "3-Step Showdown",
    kicker: "Quiz booth",
    blurb: "Buzz in on product knowledge. Train solo or run a showdown with the team.",
    file: "/games/3-step-showdown.html",
  },
  {
    slug: "keep-the-client",
    title: "Keep the Client",
    kicker: "Hangman",
    blurb: "Guess the ailment before they walk out. Then read how the supports actually help.",
    file: "/games/keep-the-client.html",
  },
  {
    slug: "new-client-roleplay",
    title: "New Client Roleplay",
    kicker: "Floor cards",
    blurb: "Spin a Floor Leader, Specialist, and Client. Print the card. Run CARE on the floor.",
    file: "/games/new-client-roleplay.html",
  },
  {
    slug: "client-case-file",
    title: "Client Case File",
    kicker: "Interview",
    blurb: "Open the seals. Job, pain, shoes, hot button, decision-maker. Own the kitchen table.",
    file: "/games/client-case-file.html",
  },
  {
    slug: "fit-clue",
    title: "Fit Clue",
    kicker: "Mystery",
    blurb: "Deduce the Strengthener, Maintainer, and Relaxer the guest walked out without.",
    file: "/games/fit-clue.html",
  },
  {
    slug: "arch-quest",
    title: "ArchQuest",
    kicker: "New hire",
    blurb: "Lightning, sort station, fit lab, sales sequence, mastery. Product and process.",
    file: "/games/arch-quest.html",
  },
  {
    slug: "care-floor-commander",
    title: "CARE Floor Commander",
    kicker: "Floor sim",
    blurb: "Walk the floor. Greet. Hand off. Protect greens. Answer reds.",
    file: "/games/care-floor-commander.html",
  },
];

export function floorGame(slug: string) {
  return FLOOR_GAMES.find((g) => g.slug === slug) ?? null;
}
