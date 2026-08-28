import { describe, expect, it } from "vitest";
import {
  BELT_SHOP,
  FLOOR_TASKS,
  FREE_ITEMS,
  beltOf,
  liveTasks,
  weekJobs,
  type BeltUnlock,
  type FloorTaskDef,
  type FloorWorkRow,
} from "./floor-work";

const row = (over: Partial<FloorWorkRow> = {}): FloorWorkRow => ({
  fighterId: "f1",
  weekNumber: 1,
  taskId: "make-boxes",
  stars: 1,
  done: true,
  ...over,
});

const customJob: FloorTaskDef = {
  id: "custom-1",
  title: "Sweep the back lot",
  blurb: "",
  stars: 2,
  pack: "ops",
  live: true,
  custom: true,
};

describe("liveTasks", () => {
  it("returns every live built-in task", () => {
    expect(liveTasks().map((t) => t.id)).toEqual(FLOOR_TASKS.filter((t) => t.live).map((t) => t.id));
  });

  it("appends extras and dedupes by id", () => {
    const tasks = liveTasks([customJob, { ...customJob, title: "duplicate" }]);
    expect(tasks.filter((t) => t.id === "custom-1")).toHaveLength(1);
    expect(tasks.find((t) => t.id === "custom-1")?.title).toBe("Sweep the back lot");
  });

  it("drops tasks marked not live", () => {
    const tasks = liveTasks([{ ...customJob, id: "custom-dead", live: false }]);
    expect(tasks.some((t) => t.id === "custom-dead")).toBe(false);
  });
});

describe("weekJobs", () => {
  it("only returns rows for the given fighter and week", () => {
    const work = [
      row(),
      row({ fighterId: "f2", taskId: "windows" }),
      row({ weekNumber: 2, taskId: "trash" }),
    ];
    const jobs = weekJobs("f1", 1, work);
    expect(jobs.map((j) => j.taskId)).toEqual(["make-boxes"]);
  });

  it("keeps catalog order no matter how the rows come back", () => {
    const ids = ["trash", "make-boxes", "lock-lace", "med-2"];
    const work = ids.map((taskId) => row({ taskId }));
    const jobs = weekJobs("f1", 1, work);
    const catalogOrder = FLOOR_TASKS.map((t) => t.id).filter((id) => ids.includes(id));
    expect(jobs.map((j) => j.taskId)).toEqual(catalogOrder);
  });

  it("falls back to a stub def for unknown tasks and sorts them last", () => {
    const work = [row({ taskId: "long-gone-job", stars: 2 }), row({ taskId: "med-2", stars: 2 })];
    const jobs = weekJobs("f1", 1, work);
    expect(jobs[jobs.length - 1]!.taskId).toBe("long-gone-job");
    expect(jobs[jobs.length - 1]!.def.title).toBe("long-gone-job");
  });

  it("resolves custom jobs from extras", () => {
    const jobs = weekJobs("f1", 1, [row({ taskId: "custom-1", stars: 2 })], [customJob]);
    expect(jobs[0]!.def.title).toBe("Sweep the back lot");
  });
});

describe("beltOf", () => {
  const unlock = (over: Partial<BeltUnlock> = {}): BeltUnlock => ({
    fighterId: "f1",
    itemId: "bg-raised",
    spent: 5,
    ...over,
  });

  it("sums stars from done rows only, for that fighter only", () => {
    const work = [
      row({ stars: 2 }),
      row({ taskId: "windows", stars: 3, done: false }),
      row({ fighterId: "f2", taskId: "trash", stars: 3 }),
    ];
    expect(beltOf("f1", work, []).earned).toBe(2);
  });

  it("adds extra stars and subtracts spent to get the bank", () => {
    const work = [row({ stars: 2 }), row({ taskId: "windows", stars: 1 })];
    const belt = beltOf("f1", work, [unlock()], 4);
    expect(belt.earned).toBe(7);
    expect(belt.spent).toBe(5);
    expect(belt.bank).toBe(2);
  });

  it("never reports a negative bank", () => {
    expect(beltOf("f1", [row()], [unlock({ spent: 99 })]).bank).toBe(0);
  });

  it("owned includes the free items plus this fighter's unlocks", () => {
    const belt = beltOf("f1", [], [unlock(), unlock({ fighterId: "f2", itemId: "bg-gold" })]);
    for (const id of FREE_ITEMS) expect(belt.owned.has(id)).toBe(true);
    expect(belt.owned.has("bg-raised")).toBe(true);
    expect(belt.owned.has("bg-gold")).toBe(false);
  });
});

describe("belt shop", () => {
  it("free items are exactly the zero-cost items that are not earned hardware", () => {
    for (const item of BELT_SHOP) {
      expect(FREE_ITEMS.has(item.id)).toBe(item.cost === 0 && !item.earn);
    }
  });

  it("prices climb with tier within every slot", () => {
    const tierRank = { house: 0, bright: 1, neon: 2, gold: 3, legend: 4 } as const;
    const slots = new Set(BELT_SHOP.map((i) => i.slot));
    for (const slot of slots) {
      const purchasable = BELT_SHOP.filter((i) => i.slot === slot && !i.earn);
      for (const a of purchasable) {
        for (const b of purchasable) {
          if (tierRank[a.tier] < tierRank[b.tier]) expect(a.cost).toBeLessThan(b.cost);
        }
      }
    }
  });
});
