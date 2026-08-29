import { describe, expect, it } from "vitest";
import { nextBracketOnSweep, resolveWeek } from "./engine";
import type { Matchup, MetricStatus, Score } from "./types";

const score = (fighterId: string, statuses: MetricStatus[], reviews = 0): Score => ({
  id: `s-${fighterId}`,
  circuitId: "c1",
  fighterId,
  weekNumber: 1,
  statuses,
  reviews,
  notes: "",
  trainingBonus: 0,
});

const matchup = (over: Partial<Matchup>): Matchup => ({
  id: "m1",
  circuitId: "c1",
  weekNumber: 1,
  bracket: "main",
  kind: "singles",
  fighterIds: [],
  winnerId: null,
  status: "scheduled",
  videoUrl: "",
  ...over,
});

const seeds = new Map([
  ["a", 1],
  ["b", 2],
  ["c", 3],
]);

const resolve = (matchups: Matchup[], scores: Score[], isFinalWeek = false) =>
  resolveWeek({ matchups, scores, seedById: seeds, metricCount: 3, isFinalWeek });

describe("nextBracketOnSweep", () => {
  it("climbs one floor and caps at main", () => {
    expect(nextBracketOnSweep("rumble")).toBe("redemption");
    expect(nextBracketOnSweep("redemption")).toBe("main");
    expect(nextBracketOnSweep("main")).toBe("main");
  });
});

describe("resolveWeek sweep rule", () => {
  it("a losing card without a sweep still drops a floor", () => {
    const out = resolve(
      [matchup({ fighterIds: ["a", "b"] })],
      [score("a", ["green", "green", "blue"]), score("b", ["blue", "blue", "blue"])],
    );
    const loser = out.find((r) => r.fighterId === "b")!;
    expect(loser.result).toBe("loss");
    expect(loser.next).toBe("redemption");
  });

  it("a sweep on redemption climbs back to main", () => {
    const out = resolve(
      [matchup({ bracket: "redemption", fighterIds: ["a", "b"] })],
      [score("a", ["green", "green", "green"]), score("b", ["blue", "blue", "blue"])],
    );
    const winner = out.find((r) => r.fighterId === "a")!;
    expect(winner.result).toBe("win");
    expect(winner.next).toBe("main");
    expect(out.find((r) => r.fighterId === "b")!.next).toBe("rumble");
  });

  it("a sweep on main wins and stays on main", () => {
    const out = resolve(
      [matchup({ fighterIds: ["a", "b"] })],
      [score("a", ["green", "green", "green"]), score("b", ["blue", "blue", "blue"])],
    );
    const winner = out.find((r) => r.fighterId === "a")!;
    expect(winner.result).toBe("win");
    expect(winner.next).toBe("main");
  });

  it("when both sweep, the outscored card still reads as a win and climbs", () => {
    const out = resolve(
      [matchup({ bracket: "redemption", fighterIds: ["a", "b"] })],
      [score("a", ["green", "green", "green"], 2), score("b", ["green", "green", "green"])],
    );
    const second = out.find((r) => r.fighterId === "b")!;
    expect(second.result).toBe("win");
    expect(second.next).toBe("main");
  });

  it("a sweep in a non-final rumble climbs out of floor three", () => {
    const out = resolve(
      [matchup({ bracket: "rumble", kind: "rumble", fighterIds: ["a", "b", "c"] })],
      [
        score("a", ["blue", "blue", "blue"]),
        score("b", ["green", "green", "green"]),
        score("c", ["orange", "orange", "red"]),
      ],
    );
    expect(out.find((r) => r.fighterId === "b")!.next).toBe("redemption");
    expect(out.find((r) => r.fighterId === "a")!.next).toBe("rumble");
  });

  it("final week still crowns the winner; a sweep does not reroute the belt", () => {
    const out = resolve(
      [matchup({ fighterIds: ["a", "b"] })],
      [score("a", ["green", "green", "green"]), score("b", ["green", "green", "green"], 1)],
      true,
    );
    expect(out.find((r) => r.fighterId === "b")!.next).toBe("champ");
    const runnerUp = out.find((r) => r.fighterId === "a")!;
    expect(runnerUp.result).toBe("win");
    expect(runnerUp.next).toBe("main");
  });
});
