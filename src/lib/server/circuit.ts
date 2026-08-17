import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import {
  assignSeeds,
  cardFor,
  decideWinner,
  fightersInBracketNext,
  nextBracketOnLoss,
  pairBracket,
  parseRosterCsv,
  plausibleCard,
  resolveWeek,
  scorecard,
  week1Field,
} from "@/lib/circuit/engine";
import { writePreview, writeRecap } from "@/lib/circuit/gazette";
import { NICKNAME_BANK } from "@/lib/circuit/seed-roster";
import { generatePersona } from "@/lib/circuit/copy";
import {
  DEFAULT_METRICS,
  DESK_PIN,
  type BracketId,
  type Circuit,
  type Fighter,
  type MetricStatus,
} from "@/lib/circuit/types";
import { claimCodeFrom, nid } from "@/lib/utils";
import {
  mapCircuit,
  mapFighter,
  mapGazette,
  mapMatchup,
  mapMetric,
  mapPlacement,
  mapScore,
  mapWeek,
  type CircuitRow,
  type FighterRow,
} from "./map";
import { DEMO_SLUG, ensureDemoCircuit, resetDemoCircuit } from "./seed-demo";

async function optionalUserId(bearer?: string) {
  try {
    const u = await getSessionUser(bearer);
    return u?.id ?? null;
  } catch {
    return null;
  }
}

async function loadCircuitBySlug(slug: string) {
  const sql = await getSql();
  const rows = await sql<CircuitRow>`select * from circuits where slug = ${slug} limit 1`;
  return rows[0] ? mapCircuit(rows[0]) : null;
}

async function loadCircuitById(id: string) {
  const sql = await getSql();
  const rows = await sql<CircuitRow>`select * from circuits where id = ${id} limit 1`;
  return rows[0] ? mapCircuit(rows[0]) : null;
}

function assertCanWrite(circuit: Circuit, userId: string | null, pin?: string) {
  if ((pin ?? "").trim().toLowerCase() === DESK_PIN) return;
  if (userId && circuit.ownerUserId === userId) return;
  throw new Error("Enter the commissioner password to do that.");
}

export type BoardPayload = Awaited<ReturnType<typeof buildBoard>>;

async function buildBoard(circuit: Circuit) {
  const sql = await getSql();
  const [metrics, fighterRows, weeks, scoreRows, matchRows, placeRows, gazRows] =
    await Promise.all([
      sql<{
        id: string;
        circuit_id: string;
        key: string;
        label: string;
        sort_order: number;
      }>`select * from metrics where circuit_id = ${circuit.id} order by sort_order asc`,
      sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id} order by seed nulls last, last_name`,
      sql<{
        circuit_id: string;
        week_number: number;
        status: string;
      }>`select * from weeks where circuit_id = ${circuit.id} order by week_number`,
      sql<{
        id: string;
        circuit_id: string;
        fighter_id: string;
        week_number: number;
        statuses_json: string;
        reviews: number;
        notes: string;
      }>`select * from scores where circuit_id = ${circuit.id}`,
      sql<{
        id: string;
        circuit_id: string;
        week_number: number;
        bracket: string;
        kind: string;
        fighter_ids_json: string;
        winner_id: string | null;
        status: string;
      }>`select * from matchups where circuit_id = ${circuit.id}`,
      sql<{
        circuit_id: string;
        fighter_id: string;
        week_number: number;
        bracket: string;
        result: string;
        rank_in_bracket: number | null;
      }>`select * from placements where circuit_id = ${circuit.id}`,
      sql<{
        id: string;
        circuit_id: string;
        week_number: number;
        kind: string;
        headline: string;
        body: string;
        published_at: string;
      }>`select * from gazette where circuit_id = ${circuit.id} order by week_number desc, kind desc`,
    ]);

  const fighters = fighterRows.map(mapFighter);
  const scores = scoreRows.map(mapScore);
  const matchups = matchRows.map(mapMatchup);
  const placements = placeRows.map(mapPlacement);

  const standings = fighters.map((f) => {
    const mine = scores.filter((s) => s.fighterId === f.id);
    const totals = mine.reduce(
      (acc, s) => {
        const c = scorecard(s.statuses, s.reviews);
        acc.points += c.points;
        acc.greens += c.greens;
        acc.blues += c.blues;
        acc.reviews += c.reviews;
        acc.sweeps += c.sweep ? 1 : 0;
        return acc;
      },
      { points: 0, greens: 0, blues: 0, reviews: 0, sweeps: 0 },
    );
    const weekScore = scores.find(
      (s) => s.fighterId === f.id && s.weekNumber === circuit.currentWeek,
    );
    const live = matchups.find(
      (m) =>
        m.weekNumber === circuit.currentWeek && m.fighterIds.includes(f.id),
    );
    let currentBracket: BracketId | "out" | "champ" | "unassigned" = "unassigned";
    if (live) currentBracket = live.bracket;
    else {
      const hist = placements
        .filter((p) => p.fighterId === f.id)
        .sort((a, b) => a.weekNumber - b.weekNumber);
      const last = hist[hist.length - 1];
      if (!last) currentBracket = circuit.status === "setup" ? "unassigned" : "main";
      else if (last.result === "champ") currentBracket = "champ";
      else if (last.result === "loss") {
        const n = nextBracketOnLoss(last.bracket);
        currentBracket = n === "out" ? "out" : n;
      } else currentBracket = last.bracket;
    }
    return {
      fighterId: f.id,
      totalPoints: totals.points,
      totalGreens: totals.greens,
      totalBlues: totals.blues,
      totalReviews: totals.reviews,
      totalSweeps: totals.sweeps,
      currentBracket,
      weekCard: weekScore ? scorecard(weekScore.statuses, weekScore.reviews) : null,
    };
  });

  standings.sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.totalGreens - a.totalGreens ||
      b.totalBlues - a.totalBlues ||
      b.totalReviews - a.totalReviews,
  );

  const champs: Partial<Record<BracketId, string>> = {};
  if (circuit.status === "complete") {
    for (const p of placements.filter((x) => x.result === "champ")) {
      champs[p.bracket] = p.fighterId;
    }
  }

  return {
    circuit,
    metrics: metrics.map(mapMetric),
    fighters,
    weeks: weeks.map(mapWeek),
    matchups,
    scores,
    placements,
    gazette: gazRows.map(mapGazette),
    standings,
    champions: champs,
  };
}

export const getBoard = createServerFn({ method: "GET" })
  .validator((d: { slug?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const slug = data.slug || DEMO_SLUG;
    const circuit = await loadCircuitBySlug(slug);
    if (!circuit) throw new Error("Circuit not found.");
    return buildBoard(circuit);
  });

export const listMyCircuits = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const rows = await sql<CircuitRow>`
      select * from circuits
      where owner_user_id = ${context.userId} or is_demo = true
      order by is_demo desc, created_at desc
    `;
    return rows.map(mapCircuit);
  });

export const createCircuit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      name: string;
      periodLabel: string;
      weeks: 4 | 5;
      prizeMain: string;
      prizeRedemption: string;
      prizeRumble: string;
      week1Byes: number;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = nid("c");
    const slug = `${data.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(-5)}`;
    const join = `CLINCH-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const weeks = data.weeks === 5 ? 5 : 4;
    await sql`
      insert into circuits (
        id, slug, name, period_label, weeks, current_week, status, join_code,
        owner_user_id, is_demo, prize_main, prize_redemption, prize_rumble, week1_byes
      ) values (
        ${id}, ${slug}, ${data.name.trim() || "Untitled circuit"},
        ${data.periodLabel.trim() || "P10"}, ${weeks}, ${1}, ${"setup"}, ${join},
        ${context.userId}, ${false}, ${data.prizeMain.trim() || "$150"},
        ${data.prizeRedemption.trim() || "$50"}, ${data.prizeRumble.trim() || "Lunch"},
        ${Math.max(0, Math.min(4, data.week1Byes | 0))}
      )
    `;
    for (let i = 0; i < DEFAULT_METRICS.length; i += 1) {
      const m = DEFAULT_METRICS[i];
      await sql`
        insert into metrics (id, circuit_id, key, label, sort_order)
        values (${nid("m")}, ${id}, ${m.key}, ${m.label}, ${i})
      `;
    }
    for (let w = 1; w <= weeks; w += 1) {
      await sql`
        insert into weeks (circuit_id, week_number, status)
        values (${id}, ${w}, ${"upcoming"})
      `;
    }
    const circuit = await loadCircuitById(id);
    if (!circuit) throw new Error("Failed to create circuit.");
    return buildBoard(circuit);
  });

type FighterInput = {
  firstName: string;
  lastName: string;
  nickname?: string;
  hypeLine?: string;
  backstory?: string;
  hometown?: string;
  funFact?: string;
  seed?: number | null;
  priorPoints?: number;
  priorBlues?: number;
  priorReviews?: number;
};

function unusedNickname(existing: string[]) {
  const used = new Set(existing.map((n) => n.toLowerCase()));
  for (const n of NICKNAME_BANK) {
    if (!used.has(n.toLowerCase())) return n;
  }
  return `Seat ${existing.length + 1}`;
}

async function insertFighter(circuitId: string, input: FighterInput, seed: number | null) {
  const sql = await getSql();
  const existing = await sql<{ nickname: string; claim_code: string }>`
    select nickname, claim_code from fighters where circuit_id = ${circuitId}
  `;
  const persona = generatePersona({
    firstName: input.firstName,
    lastName: input.lastName,
    nickname: input.nickname || unusedNickname(existing.map((e) => e.nickname)),
    hometown: input.hometown,
    funFact: input.funFact,
    usedNicknames: existing.map((e) => e.nickname),
  });
  const nickname = persona.nickname;
  const hypeLine = (input.hypeLine ?? "").trim() || persona.hypeLine;
  const backstory = (input.backstory ?? "").trim() || persona.backstory;
  let code = claimCodeFrom(nickname, input.lastName + String(existing.length + 1));
  const codes = new Set(existing.map((e) => e.claim_code));
  let n = 1;
  while (codes.has(code)) {
    code = `${claimCodeFrom(nickname, input.lastName)}${n}`;
    n += 1;
  }
  const id = nid("f");
  const seedVal = input.seed ?? seed;
  await sql`
    insert into fighters (
      id, circuit_id, user_id, first_name, last_name, nickname, hype_line, backstory,
      hometown, fun_fact, seed, prior_points, prior_blues, prior_reviews, claim_code, active
    ) values (
      ${id}, ${circuitId}, ${null}, ${input.firstName.trim()}, ${input.lastName.trim()},
      ${nickname}, ${hypeLine}, ${backstory},
      ${(input.hometown ?? "").trim()}, ${(input.funFact ?? "").trim()},
      ${seedVal}, ${input.priorPoints ?? 0}, ${input.priorBlues ?? 0}, ${input.priorReviews ?? 0},
      ${code}, ${true}
    )
  `;
  return id;
}

export const addFighter = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighter: FighterInput; bearer?: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId(data.bearer);
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "setup") {
      const id = await insertFighter(circuit.id, data.fighter, null);
      const sql = await getSql();
      const open = (
        await sql<{ status: string }>`
          select status from weeks where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
        `
      )[0];
      if (open?.status === "open") {
        const rumble = await sql<{ id: string; fighter_ids_json: string; kind: string }>`
          select id, fighter_ids_json, kind from matchups
          where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek} and bracket = ${"rumble"}
          limit 1
        `;
        if (rumble[0]) {
          const ids = JSON.parse(rumble[0].fighter_ids_json) as string[];
          ids.push(id);
          await sql`update matchups set fighter_ids_json = ${JSON.stringify(ids)}, kind = ${"rumble"} where id = ${rumble[0].id}`;
        } else {
          await sql`
            insert into matchups (id, circuit_id, week_number, bracket, kind, fighter_ids_json, winner_id, status)
            values (${nid("k")}, ${circuit.id}, ${circuit.currentWeek}, ${"rumble"}, ${"rumble"}, ${JSON.stringify([id])}, ${null}, ${"scheduled"})
          `;
        }
      }
      const next = await loadCircuitById(circuit.id);
      return buildBoard(next!);
    }
    await insertFighter(circuit.id, data.fighter, null);
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const addFightersBulk = createServerFn({ method: "POST" })
  .validator((d: { slug: string; csv: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "setup") throw new Error("Bulk add is only open before the circuit starts.");
    const rows = parseRosterCsv(data.csv);
    if (!rows.length) throw new Error("No rows found. Use first,last,nickname,points,blues,reviews.");
    for (const r of rows) {
      await insertFighter(circuit.id, r, null);
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const updateFighter = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      fighterId: string;
      patch: Partial<FighterInput> & { active?: boolean };
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const current = (
      await sql<FighterRow>`select * from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`
    )[0];
    if (!current) throw new Error("Fighter not found.");
    const f = mapFighter(current);
    const next = {
      firstName: data.patch.firstName ?? f.firstName,
      lastName: data.patch.lastName ?? f.lastName,
      nickname: data.patch.nickname ?? f.nickname,
      hypeLine: data.patch.hypeLine ?? f.hypeLine,
      backstory: data.patch.backstory ?? f.backstory,
      hometown: data.patch.hometown ?? f.hometown,
      funFact: data.patch.funFact ?? f.funFact,
      seed: data.patch.seed !== undefined ? data.patch.seed : f.seed,
      priorPoints: data.patch.priorPoints ?? f.priorPoints,
      priorBlues: data.patch.priorBlues ?? f.priorBlues,
      priorReviews: data.patch.priorReviews ?? f.priorReviews,
      active: data.patch.active ?? f.active,
    };
    await sql`
      update fighters set
        first_name = ${next.firstName},
        last_name = ${next.lastName},
        nickname = ${next.nickname},
        hype_line = ${next.hypeLine},
        backstory = ${next.backstory},
        hometown = ${next.hometown},
        fun_fact = ${next.funFact},
        seed = ${next.seed},
        prior_points = ${next.priorPoints},
        prior_blues = ${next.priorBlues},
        prior_reviews = ${next.priorReviews},
        active = ${next.active}
      where id = ${f.id}
    `;
    const c = await loadCircuitById(circuit.id);
    return buildBoard(c!);
  });

export const removeFighter = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "setup") throw new Error("Remove fighters before the opening bell.");
    const sql = await getSql();
    await sql`delete from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`;
    const c = await loadCircuitById(circuit.id);
    return buildBoard(c!);
  });

async function writeMatchups(
  circuitId: string,
  week: number,
  pairs: ReturnType<typeof pairBracket>,
) {
  const sql = await getSql();
  await sql`delete from matchups where circuit_id = ${circuitId} and week_number = ${week}`;
  for (const p of pairs) {
    await sql`
      insert into matchups (id, circuit_id, week_number, bracket, kind, fighter_ids_json, winner_id, status)
      values (${nid("k")}, ${circuitId}, ${week}, ${p.bracket}, ${p.kind}, ${JSON.stringify(p.fighterIds)}, ${null}, ${"scheduled"})
    `;
  }
}

export const startCircuit = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "setup") throw new Error("Already started.");
    const sql = await getSql();
    const rows = await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id} and active = true`;
    if (rows.length < 2) throw new Error("Need at least two fighters to open a circuit.");
    const mapped = rows.map(mapFighter);
    const keepSeeds = mapped.every((f) => f.seed != null);
    const seeded = keepSeeds
      ? [...mapped].sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99))
      : assignSeeds(mapped);
    for (const f of seeded) {
      await sql`update fighters set seed = ${f.seed} where id = ${f.id}`;
    }
    const { competing, sitting } = week1Field(seeded, circuit.week1Byes);
    const seedById = new Map(seeded.map((f) => [f.id, f.seed ?? 99]));
    const pairs = pairBracket(
      competing.map((f) => f.id),
      seedById,
      "main",
      false,
    );
    for (const f of sitting) {
      pairs.unshift({ kind: "bye", fighterIds: [f.id], bracket: "main" });
    }
    await writeMatchups(circuit.id, 1, pairs);
    await sql`update weeks set status = ${"open"} where circuit_id = ${circuit.id} and week_number = 1`;
    await sql`update circuits set status = ${"active"}, current_week = 1 where id = ${circuit.id}`;

    const boardFighters = (
      await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id}`
    ).map(mapFighter);
    const matchups = (
      await sql<{
        id: string;
        circuit_id: string;
        week_number: number;
        bracket: string;
        kind: string;
        fighter_ids_json: string;
        winner_id: string | null;
        status: string;
      }>`select * from matchups where circuit_id = ${circuit.id} and week_number = 1`
    ).map(mapMatchup);
    const preview = writePreview({
      week: 1,
      totalWeeks: circuit.weeks,
      periodLabel: circuit.periodLabel,
      circuitName: circuit.name,
      matchups,
      fighters: boardFighters,
      placements: [],
    });
    await sql`
      insert into gazette (id, circuit_id, week_number, kind, headline, body)
      values (${nid("g")}, ${circuit.id}, ${1}, ${"preview"}, ${preview.headline}, ${preview.body})
      on conflict (circuit_id, week_number, kind) do update set headline = excluded.headline, body = excluded.body
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const submitScore = createServerFn({ method: "POST" })
  .validator(
    (d: {
      claimCode?: string;
      slug?: string;
      fighterId?: string;
      weekNumber?: number;
      statuses: MetricStatus[];
      reviews: number;
      notes?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    let fighter: Fighter | null = null;
    let circuit: Circuit | null = null;
    if (data.claimCode) {
      const code = data.claimCode.trim().toUpperCase();
      const row = (
        await sql<FighterRow>`select * from fighters where upper(claim_code) = ${code} limit 1`
      )[0];
      if (!row) throw new Error("That claim code is not on the book.");
      fighter = mapFighter(row);
      circuit = await loadCircuitById(fighter.circuitId);
    } else if (data.slug && data.fighterId) {
      circuit = await loadCircuitBySlug(data.slug);
      if (!circuit) throw new Error("Circuit not found.");
      const row = (
        await sql<FighterRow>`select * from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`
      )[0];
      if (!row) throw new Error("Fighter not found.");
      fighter = mapFighter(row);
    }
    if (!fighter || !circuit) throw new Error("Who is submitting?");
    const weekNumber = data.weekNumber ?? circuit.currentWeek;
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${weekNumber}
      `
    )[0];
    if (!week) throw new Error("No such week.");
    if (week.status !== "open") {
      throw new Error(
        week.status === "locked"
          ? "This week is locked. The commissioner has to unlock it before cards can change."
          : "This week is not open for cards.",
      );
    }
    const reviews = Math.max(0, Math.min(3, Math.floor(data.reviews)));
    const existing = (
      await sql<{ id: string }>`
        select id from scores where fighter_id = ${fighter.id} and week_number = ${weekNumber}
      `
    )[0];
    if (existing) {
      await sql`
        update scores set statuses_json = ${JSON.stringify(data.statuses)}, reviews = ${reviews},
          notes = ${data.notes ?? ""}, submitted_at = now()
        where id = ${existing.id}
      `;
    } else {
      await sql`
        insert into scores (id, circuit_id, fighter_id, week_number, statuses_json, reviews, notes)
        values (${nid("s")}, ${circuit.id}, ${fighter.id}, ${weekNumber}, ${JSON.stringify(data.statuses)}, ${reviews}, ${data.notes ?? ""})
      `;
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const submitScoresBatch = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      weekNumber: number;
      rows: Array<{ fighterId: string; statuses: MetricStatus[]; reviews: number }>;
    }) => d,
  )
  .handler(async ({ data }) => {
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${data.weekNumber}
      `
    )[0];
    if (!week || week.status !== "open") {
      throw new Error(
        week?.status === "locked"
          ? "This week is locked. Unlock it from the desk before changing cards."
          : "This week is not open.",
      );
    }
    for (const row of data.rows) {
      const reviews = Math.max(0, Math.min(3, Math.floor(row.reviews)));
      const existing = (
        await sql<{ id: string }>`
          select id from scores where fighter_id = ${row.fighterId} and week_number = ${data.weekNumber}
        `
      )[0];
      if (existing) {
        await sql`
          update scores set statuses_json = ${JSON.stringify(row.statuses)}, reviews = ${reviews}, submitted_at = now()
          where id = ${existing.id}
        `;
      } else {
        await sql`
          insert into scores (id, circuit_id, fighter_id, week_number, statuses_json, reviews, notes)
          values (${nid("s")}, ${circuit.id}, ${row.fighterId}, ${data.weekNumber}, ${JSON.stringify(row.statuses)}, ${reviews}, ${""})
        `;
      }
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const lockWeek = createServerFn({ method: "POST" })
  .validator((d: { slug: string; locked: boolean; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "active") throw new Error("Circuit is not live.");
    const sql = await getSql();
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
      `
    )[0];
    if (!week) throw new Error("No such week.");
    if (data.locked) {
      if (week.status !== "open") throw new Error("Only an open week can be locked.");
      await sql`
        update weeks set status = ${"locked"}
        where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
      `;
    } else {
      if (week.status !== "locked") throw new Error("Only a locked week can be unlocked.");
      await sql`
        update weeks set status = ${"open"}
        where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
      `;
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const rollRemaining = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const week = circuit.currentWeek;
    const open = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${week}
      `
    )[0];
    if (open?.status !== "open") throw new Error("Week is not open.");
    const matchups = (
      await sql<{ fighter_ids_json: string }>`
        select fighter_ids_json from matchups where circuit_id = ${circuit.id} and week_number = ${week}
      `
    ).flatMap((r) => JSON.parse(r.fighter_ids_json) as string[]);
    const ids = [...new Set(matchups)];
    const metrics = await sql<{ id: string }>`select id from metrics where circuit_id = ${circuit.id}`;
    const roster = (
      await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id}`
    ).map(mapFighter);
    for (const id of ids) {
      const has = (
        await sql<{ id: string }>`select id from scores where fighter_id = ${id} and week_number = ${week}`
      )[0];
      if (has) continue;
      const f = roster.find((x) => x.id === id);
      const card = plausibleCard(f?.seed ?? 8, roster.length, metrics.length);
      await sql`
        insert into scores (id, circuit_id, fighter_id, week_number, statuses_json, reviews, notes)
        values (${nid("s")}, ${circuit.id}, ${id}, ${week}, ${JSON.stringify(card.statuses)}, ${card.reviews}, ${"Rolled by the desk."})
      `;
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const finalizeWeek = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (circuit.status !== "active") throw new Error("Circuit is not live.");
    const sql = await getSql();
    const week = circuit.currentWeek;
    const weekRow = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${week}
      `
    )[0];
    if (!weekRow || (weekRow.status !== "open" && weekRow.status !== "locked")) {
      throw new Error("Nothing to close.");
    }

    const metricCount = (
      await sql<{ c: number }>`select count(*)::int as c from metrics where circuit_id = ${circuit.id}`
    )[0]?.c ?? 5;
    const fighters = (
      await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id}`
    ).map(mapFighter);
    const seedById = new Map(fighters.map((f) => [f.id, f.seed ?? 99]));
    const matchups = (
      await sql<{
        id: string;
        circuit_id: string;
        week_number: number;
        bracket: string;
        kind: string;
        fighter_ids_json: string;
        winner_id: string | null;
        status: string;
      }>`select * from matchups where circuit_id = ${circuit.id} and week_number = ${week}`
    ).map(mapMatchup);
    const scores = (
      await sql<{
        id: string;
        circuit_id: string;
        fighter_id: string;
        week_number: number;
        statuses_json: string;
        reviews: number;
        notes: string;
      }>`select * from scores where circuit_id = ${circuit.id} and week_number = ${week}`
    ).map(mapScore);

    const isFinal = week >= circuit.weeks;
    const resolved = resolveWeek({
      matchups,
      scores,
      seedById,
      metricCount,
      isFinalWeek: isFinal,
    });

    await sql`delete from placements where circuit_id = ${circuit.id} and week_number = ${week}`;
    for (const m of matchups) {
      const { winnerId } = decideWinner(m.kind, m.fighterIds, scores, seedById, metricCount);
      await sql`update matchups set winner_id = ${winnerId}, status = ${"complete"} where id = ${m.id}`;
    }
    for (const r of resolved) {
      const result = r.next === "champ" ? "champ" : r.result;
      await sql`
        insert into placements (circuit_id, fighter_id, week_number, bracket, result, rank_in_bracket)
        values (${circuit.id}, ${r.fighterId}, ${week}, ${r.from}, ${result}, ${r.rankInBracket})
      `;
      if (r.next === "out") {
        await sql`update fighters set active = ${false} where id = ${r.fighterId}`;
      }
    }

    const recapMatchups = matchups.map((m) => {
      const { winnerId } = decideWinner(m.kind, m.fighterIds, scores, seedById, metricCount);
      return { ...m, winnerId, status: "complete" as const };
    });
    const champs = Object.fromEntries(
      resolved.filter((r) => r.next === "champ").map((r) => [r.from, r.fighterId]),
    ) as Partial<Record<BracketId, string>>;
    const placeAfter = (
      await sql<{
        circuit_id: string;
        fighter_id: string;
        week_number: number;
        bracket: string;
        result: string;
        rank_in_bracket: number | null;
      }>`select * from placements where circuit_id = ${circuit.id}`
    ).map(mapPlacement);
    const recap = writeRecap({
      week,
      totalWeeks: circuit.weeks,
      periodLabel: circuit.periodLabel,
      circuitName: circuit.name,
      matchups: recapMatchups,
      fighters,
      scores,
      metricCount,
      placements: placeAfter,
      champions: isFinal ? champs : undefined,
    });
    await sql`
      insert into gazette (id, circuit_id, week_number, kind, headline, body)
      values (${nid("g")}, ${circuit.id}, ${week}, ${"recap"}, ${recap.headline}, ${recap.body})
      on conflict (circuit_id, week_number, kind) do update set headline = excluded.headline, body = excluded.body
    `;
    await sql`update weeks set status = ${"finalized"} where circuit_id = ${circuit.id} and week_number = ${week}`;

    if (isFinal) {
      await sql`update circuits set status = ${"complete"} where id = ${circuit.id}`;
    } else {
      const nextWeek = week + 1;
      const nextPairs = [];
      for (const bracket of ["main", "redemption", "rumble"] as BracketId[]) {
        const ids = fightersInBracketNext(resolved, bracket);
        if (!ids.length) continue;
        nextPairs.push(...pairBracket(ids, seedById, bracket, bracket === "rumble"));
      }
      await writeMatchups(circuit.id, nextWeek, nextPairs);
      await sql`update weeks set status = ${"open"} where circuit_id = ${circuit.id} and week_number = ${nextWeek}`;
      await sql`update circuits set current_week = ${nextWeek} where id = ${circuit.id}`;
      const nextMatchups = (
        await sql<{
          id: string;
          circuit_id: string;
          week_number: number;
          bracket: string;
          kind: string;
          fighter_ids_json: string;
          winner_id: string | null;
          status: string;
        }>`select * from matchups where circuit_id = ${circuit.id} and week_number = ${nextWeek}`
      ).map(mapMatchup);
      const preview = writePreview({
        week: nextWeek,
        totalWeeks: circuit.weeks,
        periodLabel: circuit.periodLabel,
        circuitName: circuit.name,
        matchups: nextMatchups,
        fighters,
        placements: placeAfter,
      });
      await sql`
        insert into gazette (id, circuit_id, week_number, kind, headline, body)
        values (${nid("g")}, ${circuit.id}, ${nextWeek}, ${"preview"}, ${preview.headline}, ${preview.body})
        on conflict (circuit_id, week_number, kind) do update set headline = excluded.headline, body = excluded.body
      `;
    }

    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const saveSeeds = createServerFn({ method: "POST" })
  .validator((d: { slug: string; seeds: Array<{ fighterId: string; seed: number }>; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    for (const row of data.seeds) {
      const seed = Math.max(1, Math.floor(row.seed));
      await sql`
        update fighters set seed = ${seed}
        where id = ${row.fighterId} and circuit_id = ${circuit.id}
      `;
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const seedFromPrior = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const rows = await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id}`;
    const seeded = assignSeeds(rows.map(mapFighter));
    for (const f of seeded) {
      await sql`update fighters set seed = ${f.seed} where id = ${f.id}`;
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const rewriteStory = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const row = (
      await sql<FighterRow>`select * from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`
    )[0];
    if (!row) throw new Error("Fighter not found.");
    const f = mapFighter(row);
    const persona = generatePersona({
      firstName: f.firstName,
      lastName: f.lastName,
      nickname: f.nickname,
      hometown: f.hometown,
      funFact: f.funFact,
    });
    await sql`
      update fighters set hype_line = ${persona.hypeLine}, backstory = ${persona.backstory}
      where id = ${f.id}
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const resetDemo = createServerFn({ method: "POST" })
  .validator((d: { pin?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    if ((data.pin ?? "").trim().toLowerCase() !== DESK_PIN) {
      throw new Error("Enter the commissioner password to do that.");
    }
    const sql = await getSql();
    await resetDemoCircuit(sql);
    const circuit = await loadCircuitBySlug(DEMO_SLUG);
    return buildBoard(circuit!);
  });

export const lookupClaim = createServerFn({ method: "GET" })
  .validator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const code = data.code.trim().toUpperCase();
    const row = (
      await sql<FighterRow>`select * from fighters where upper(claim_code) = ${code} limit 1`
    )[0];
    if (!row) return null;
    const fighter = mapFighter(row);
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) return null;
    const board = await buildBoard(circuit);
    return { fighter, board };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      name?: string;
      prizeMain?: string;
      prizeRedemption?: string;
      prizeRumble?: string;
      metrics?: Array<{ id: string; label: string }>;
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    await sql`
      update circuits set
        name = ${data.name ?? circuit.name},
        prize_main = ${data.prizeMain ?? circuit.prizeMain},
        prize_redemption = ${data.prizeRedemption ?? circuit.prizeRedemption},
        prize_rumble = ${data.prizeRumble ?? circuit.prizeRumble}
      where id = ${circuit.id}
    `;
    if (data.metrics) {
      for (const m of data.metrics) {
        await sql`update metrics set label = ${m.label} where id = ${m.id} and circuit_id = ${circuit.id}`;
      }
    }
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export function opponentOf(fighterId: string, matchups: { fighterIds: string[]; weekNumber: number }[], week: number) {
  const m = matchups.find((x) => x.weekNumber === week && x.fighterIds.includes(fighterId));
  if (!m) return [];
  return m.fighterIds.filter((id) => id !== fighterId);
}

export function liveCard(fighterId: string, scores: { fighterId: string; weekNumber: number; statuses: MetricStatus[]; reviews: number }[], week: number) {
  const s = scores.find((x) => x.fighterId === fighterId && x.weekNumber === week);
  return s ? scorecard(s.statuses, s.reviews) : null;
}

export { cardFor, scorecard };
