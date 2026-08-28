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
  reseedIds,
  parseRosterCsv,
  plausibleCard,
  resolveWeek,
  scorecard,
} from "@/lib/circuit/engine";
import { writePreview, writeRecap } from "@/lib/circuit/gazette";
import { NICKNAME_BANK } from "@/lib/circuit/seed-roster";
import { generatePersona } from "@/lib/circuit/copy";
import {
  DEFAULT_METRICS,
  STATUS_ORDER,
  weekAcceptsScores,
  type BracketId,
  type Circuit,
  type Fighter,
  type MetricStatus,
} from "@/lib/circuit/types";
import { isPhotoUrl } from "@/lib/photo";
import { nid } from "@/lib/utils";
import { isNicePasscode, mintPasscode, normalizePasscode } from "@/lib/circuit/passcode";
import {
  awardedBonus,
  gradeQuiz,
  moduleById,
  type TrainingRecord,
} from "@/lib/circuit/training";
import {
  BELT_BY_ID,
  FLOOR_TASKS,
  FREE_ITEMS,
  beltOf,
  itemToPlateValue,
  liveTasks,
  type FloorTaskDef,
  type TaskPack,
} from "@/lib/circuit/floor-work";
import { cleanWalkout, DEMO_WALKOUTS, pickStarCount, STORE_NAMES, walkoutWords } from "@/lib/circuit/crowd";
import { weekCardProgress } from "@/lib/circuit/week-progress";
import { emptyRoom, STORES, storeOf, storeSlugOf, type RoomHandle, type RoomMark, type RoomPaint } from "@/lib/circuit/stores";
import { isSiteTheme } from "@/lib/circuit/themes";
import { computeCircuitHeat } from "@/lib/circuit/heat";
import { PROMO_BY_ID } from "@/lib/circuit/promos";
import {
  mapCircuit,
  mapFighter,
  mapGazette,
  mapMatchup,
  mapMetric,
  mapPlacement,
  mapScore,
  mapTraining,
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

// Server-only: never imported by client code, so this never reaches the
// browser bundle. Unset (not "cogs") on purpose — an operator must set a real
// value before commissioner actions work. See DESK_PIN in .env.example.
const DESK_PIN = (process.env.DESK_PIN ?? "").trim().toLowerCase();

function matchesDeskPin(candidate?: string) {
  if (!DESK_PIN) return false;
  return (candidate ?? "").trim().toLowerCase() === DESK_PIN;
}

function assertCanWrite(circuit: Circuit, userId: string | null, pin?: string) {
  if (matchesDeskPin(pin)) return;
  if (userId && circuit.ownerUserId === userId) return;
  throw new Error("Enter the commissioner password to do that.");
}

const VALID_STATUSES = new Set<MetricStatus>(STATUS_ORDER);

async function assertValidCard(
  sql: Awaited<ReturnType<typeof getSql>>,
  circuitId: string,
  statuses: MetricStatus[],
) {
  const metricCount =
    (
      await sql<{ c: number }>`select count(*)::int as c from metrics where circuit_id = ${circuitId}`
    )[0]?.c ?? DEFAULT_METRICS.length;
  if (!Array.isArray(statuses) || statuses.length !== metricCount) {
    throw new Error("That card does not match this circuit's metrics.");
  }
  if (!statuses.every((s) => VALID_STATUSES.has(s))) {
    throw new Error("That card has an invalid status.");
  }
}

async function ensureNicePasscodes(circuitId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; claim_code: string }>`
    select id, claim_code from fighters where circuit_id = ${circuitId}
  `;
  const used = new Set(rows.map((r) => normalizePasscode(r.claim_code)));
  for (const r of rows) {
    if (isNicePasscode(r.claim_code)) continue;
    used.delete(normalizePasscode(r.claim_code));
    const next = mintPasscode(used);
    used.add(next);
    await sql`update fighters set claim_code = ${next} where id = ${r.id}`;
  }
}

async function fighterByPasscode(code: string) {
  const sql = await getSql();
  const normalized = normalizePasscode(code);
  if (!normalized) return null;
  const row = (
    await sql<FighterRow>`select * from fighters where upper(claim_code) = ${normalized} limit 1`
  )[0];
  return row ? mapFighter(row) : null;
}

export type BoardPayload = Awaited<ReturnType<typeof buildBoard>>;

async function ensureCrowdFields(sql: Awaited<ReturnType<typeof getSql>>, circuitId: string) {
  try {
    const rows = await sql<{ id: string; store: string | null; walkout: string | null }>`
      select id, store, walkout from fighters where circuit_id = ${circuitId} order by last_name
    `;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]!;
      const official = storeOf(r.store ?? "")?.name ?? "";
      const nextStore = official || (r.store ?? "").trim() || STORE_NAMES[i % STORE_NAMES.length];
      const nextWalk = (r.walkout ?? "").trim() || DEMO_WALKOUTS[i % DEMO_WALKOUTS.length];
      if (nextStore === (r.store ?? "").trim() && nextWalk === (r.walkout ?? "").trim()) continue;
      await sql`
        update fighters
        set store = ${nextStore},
            walkout = ${nextWalk}
        where id = ${r.id}
      `;
    }
  } catch {
    /* migration not applied yet */
  }
}

async function buildBoard(circuit: Circuit) {
  const sql = await getSql();
  await ensureCrowdFields(sql, circuit.id);
  await ensureFloorWork(sql, circuit);
  const [metrics, fighterRows, weeks, scoreRows, matchRows, placeRows, gazRows, trainRows, workRows, unlockRows, catalogRows] =
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
      sql<{
        fighter_id: string;
        week_number: number;
        module_id: string;
        passed: boolean;
        awarded: boolean;
        correct: number;
        total: number;
        attempted_at: string;
      }>`select fighter_id, week_number, module_id, passed, awarded, correct, total, attempted_at
         from training_attempts where circuit_id = ${circuit.id}`,
      sql<{
        fighter_id: string;
        week_number: number;
        task_id: string;
        stars: number;
        done: boolean;
      }>`select fighter_id, week_number, task_id, stars, done from floor_work where circuit_id = ${circuit.id}`,
      sql<{
        fighter_id: string;
        item_id: string;
        spent: number;
      }>`select b.fighter_id, b.item_id, b.spent
         from belt_items b
         join fighters f on f.id = b.fighter_id
         where f.circuit_id = ${circuit.id}`,
      sql<{
        id: string;
        title: string;
        blurb: string;
        stars: number;
        pack: string;
        live: boolean;
      }>`select id, title, blurb, stars, pack, live from floor_catalog where circuit_id = ${circuit.id} order by created_at asc`,
    ]);
    let pickRows: Array<{ fighter_id: string; week_number: number; matchup_id: string; pick_id: string }> = [];
    let promoRows: Array<{ from_id: string; to_id: string; week_number: number; line_id: string }> = [];
    try {
      pickRows = await sql<{
        fighter_id: string;
        week_number: number;
        matchup_id: string;
        pick_id: string;
      }>`select fighter_id, week_number, matchup_id, pick_id from picks where circuit_id = ${circuit.id}`;
      promoRows = await sql<{
        from_id: string;
        to_id: string;
        week_number: number;
        line_id: string;
      }>`select from_id, to_id, week_number, line_id from promos where circuit_id = ${circuit.id}`;
    } catch {
      pickRows = [];
      promoRows = [];
    }
    let roomRows: Array<{ store_slug: string; paint: string; accent: string; motto: string; mark: string; handle: string }> = [];
    try {
      roomRows = await sql<{ store_slug: string; paint: string; accent: string; motto: string; mark: string; handle: string }>`
        select store_slug, paint, accent, motto, mark, handle from store_rooms where circuit_id = ${circuit.id}
      `;
    } catch {
      roomRows = [];
    }
    let challengeRows: Array<{ week_number: number; title: string; blurb: string }> = [];
    let claimRows: Array<{ week_number: number; fighter_id: string; claimed_at: string }> = [];
    let callRows: Array<{ week_number: number; face_id: string | null; heel_id: string | null }> = [];
    try {
      challengeRows = await sql<{ week_number: number; title: string; blurb: string }>`
        select week_number, title, blurb from challenges where circuit_id = ${circuit.id}
      `;
      claimRows = await sql<{ week_number: number; fighter_id: string; claimed_at: string }>`
        select week_number, fighter_id, claimed_at from challenge_claims where circuit_id = ${circuit.id}
      `;
      callRows = await sql<{ week_number: number; face_id: string | null; heel_id: string | null }>`
        select week_number, face_id, heel_id from house_calls where circuit_id = ${circuit.id}
      `;
    } catch {
      challengeRows = [];
      claimRows = [];
      callRows = [];
    }

  const fighters = fighterRows.map((r) => ({ ...mapFighter(r), claimCode: "" }));
  const academy: TrainingRecord[] = trainRows.map(mapTraining);
  const awarded = new Set(
    academy.filter((r) => r.awarded).map((r) => `${r.fighterId}:${r.weekNumber}`),
  );
  const scores = scoreRows.map((r) => {
    const s = mapScore(r);
    return {
      ...s,
      trainingBonus: awarded.has(`${s.fighterId}:${s.weekNumber}`) ? (1 as const) : (0 as const),
    };
  });
  const matchups = matchRows.map(mapMatchup);
  const placements = placeRows.map(mapPlacement);
  const metricCount = metrics.length;

  const standings = fighters.filter((f) => !f.departed).map((f) => {
    const mine = scores.filter((s) => s.fighterId === f.id);
    const totals = mine.reduce(
      (acc, s) => {
        const c = scorecard(s.statuses, s.reviews, s.trainingBonus);
        acc.points += c.points;
        acc.greens += c.greens;
        acc.blues += c.blues;
        acc.reviews += c.reviews;
        acc.sweeps += c.sweep ? 1 : 0;
        return acc;
      },
      { points: 0, greens: 0, blues: 0, reviews: 0, sweeps: 0 },
    );
    const scoredWeeks = new Set(mine.map((s) => s.weekNumber));
    for (const r of academy) {
      if (r.fighterId === f.id && r.awarded && !scoredWeeks.has(r.weekNumber)) {
        totals.points += 1;
      }
    }
    const weekScore = scores.find(
      (s) => s.fighterId === f.id && s.weekNumber === circuit.currentWeek,
    );
    const trainNow = awardedBonus(academy, f.id, circuit.currentWeek);
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
      weekCard: weekScore
        ? scorecard(weekScore.statuses, weekScore.reviews, weekScore.trainingBonus)
        : trainNow
          ? scorecard(
              Array.from({ length: metricCount }, () => "red" as const),
              0,
              1,
            )
          : null,
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
    academy,
    standings,
    champions: champs,
    floorWork: workRows.map((r) => ({
      fighterId: r.fighter_id,
      weekNumber: Number(r.week_number),
      taskId: r.task_id,
      stars: Number(r.stars),
      done: Boolean(r.done),
    })),
    beltItems: unlockRows.map((r) => ({
      fighterId: r.fighter_id,
      itemId: r.item_id,
      spent: Number(r.spent),
    })),
    jobCatalog: mergeCatalog(catalogRows),
    picks: pickRows.map((r) => ({
      fighterId: r.fighter_id,
      weekNumber: Number(r.week_number),
      matchupId: r.matchup_id,
      pickId: r.pick_id,
    })),
    promos: promoRows.map((r) => ({
      fromId: r.from_id,
      toId: r.to_id,
      weekNumber: Number(r.week_number),
      lineId: r.line_id,
    })),
    challenges: challengeRows.map((r) => ({
      weekNumber: Number(r.week_number),
      title: r.title,
      blurb: r.blurb,
      claims: claimRows
        .filter((c) => Number(c.week_number) === Number(r.week_number))
        .map((c) => ({ fighterId: c.fighter_id, at: c.claimed_at })),
    })),
    houseCalls: callRows
      .filter((r) => r.face_id || r.heel_id)
      .map((r) => ({
        weekNumber: Number(r.week_number),
        faceId: r.face_id ?? "",
        heelId: r.heel_id ?? "",
      })),
    rooms: STORES.map((s) => {
      const row = roomRows.find((r) => r.store_slug === s.slug);
      return row
        ? {
            slug: s.slug,
            paint: row.paint,
            accent: row.accent,
            motto: row.motto,
            mark: row.mark,
            handle: row.handle || "brass",
          }
        : emptyRoom(s.slug);
    }),
  };
}

function mergeCatalog(
  extras: Array<{ id: string; title: string; blurb: string; stars: number; pack: string; live: boolean }>,
): FloorTaskDef[] {
  const custom: FloorTaskDef[] = extras.map((r) => ({
    id: r.id,
    title: r.title,
    blurb: r.blurb,
    stars: Math.max(1, Math.min(3, Number(r.stars) || 1)),
    pack: r.pack === "sales" || r.pack === "kind" ? r.pack : "ops",
    live: Boolean(r.live),
    custom: true,
  }));
  return [...FLOOR_TASKS, ...custom];
}

export const getBoard = createServerFn({ method: "GET" })
  .validator((d: { slug?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const slug = data.slug || DEMO_SLUG;
    const circuit = await loadCircuitBySlug(slug);
    if (!circuit) throw new Error("Circuit not found.");
    await ensureNicePasscodes(circuit.id);
    await ensureFloorWork(sql, circuit);
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
  photoUrl?: string;
  seed?: number | null;
  priorPoints?: number;
  priorBlues?: number;
  priorReviews?: number;
  socksSold?: number;
  store?: string;
  walkout?: string;
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
  const code = mintPasscode(existing.map((e) => e.claim_code));
  const id = nid("f");
  const seedVal = input.seed ?? seed;
  await sql`
    insert into fighters (
      id, circuit_id, user_id, first_name, last_name, nickname, hype_line, backstory,
      hometown, fun_fact, seed, prior_points, prior_blues, prior_reviews, claim_code, active, photo_url, store, walkout
    ) values (
      ${id}, ${circuitId}, ${null}, ${input.firstName.trim()}, ${input.lastName.trim()},
      ${nickname}, ${hypeLine}, ${backstory},
      ${(input.hometown ?? "").trim()}, ${(input.funFact ?? "").trim()},
      ${seedVal}, ${input.priorPoints ?? 0}, ${input.priorBlues ?? 0}, ${input.priorReviews ?? 0},
      ${code}, ${true}, ${(input.photoUrl ?? "").trim()},
      ${(input.store ?? "").trim()}, ${cleanWalkout(input.walkout ?? "")}
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
      passcode?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const current = (
      await sql<FighterRow>`select * from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`
    )[0];
    if (!current) throw new Error("Fighter not found.");
    const f = mapFighter(current);
    const desk = (() => {
      try {
        assertCanWrite(circuit, userId, data.pin);
        return true;
      } catch {
        return false;
      }
    })();
    if (!desk) {
      const self = data.passcode ? await fighterByPasscode(data.passcode) : null;
      if (!self || self.id !== f.id) {
        throw new Error("Enter that wrestler’s passcode to update their locker.");
      }
    }
    const next = {
      firstName: (data.patch.firstName ?? f.firstName).trim(),
      lastName: (data.patch.lastName ?? f.lastName).trim(),
      nickname: (data.patch.nickname ?? f.nickname).trim(),
      hypeLine: data.patch.hypeLine ?? f.hypeLine,
      backstory: data.patch.backstory ?? f.backstory,
      hometown: (data.patch.hometown ?? f.hometown).trim(),
      funFact: (data.patch.funFact ?? f.funFact).trim(),
      photoUrl: data.patch.photoUrl !== undefined ? data.patch.photoUrl : f.photoUrl,
      seed: desk ? (data.patch.seed !== undefined ? data.patch.seed : f.seed) : f.seed,
      priorPoints: desk ? (data.patch.priorPoints ?? f.priorPoints) : f.priorPoints,
      priorBlues: desk ? (data.patch.priorBlues ?? f.priorBlues) : f.priorBlues,
      priorReviews: desk ? (data.patch.priorReviews ?? f.priorReviews) : f.priorReviews,
      socksSold: Math.max(0, Math.floor(data.patch.socksSold ?? f.socksSold ?? 0)),
      active: desk ? (data.patch.active ?? f.active) : f.active,
      store: (data.patch.store ?? f.store).trim(),
      walkout: cleanWalkout(data.patch.walkout ?? f.walkout),
    };
    if (data.patch.walkout !== undefined && walkoutWords(data.patch.walkout).length > 5) {
      throw new Error("Walk-out is five words. Make them count.");
    }
    if (!next.firstName || !next.lastName) throw new Error("First and last name are required.");
    if (!next.nickname) throw new Error("Pick a ring name.");
    await sql`
      update fighters set
        first_name = ${next.firstName},
        last_name = ${next.lastName},
        nickname = ${next.nickname},
        hype_line = ${next.hypeLine},
        backstory = ${next.backstory},
        hometown = ${next.hometown},
        fun_fact = ${next.funFact},
        photo_url = ${next.photoUrl},
        seed = ${next.seed},
        prior_points = ${next.priorPoints},
        prior_blues = ${next.priorBlues},
        prior_reviews = ${next.priorReviews},
        socks_sold = ${next.socksSold},
        active = ${next.active},
        store = ${next.store},
        walkout = ${next.walkout}
      where id = ${f.id}
    `;
    const c = await loadCircuitById(circuit.id);
    return buildBoard(c!);
  });

export const setFighterPhoto = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; photoUrl: string; pin?: string; passcode?: string }) => d)
  .handler(async ({ data }) => {
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    const photo = data.photoUrl.trim();
    if (photo && !isPhotoUrl(photo)) throw new Error("That photo format is not allowed.");
    if (photo.length > 180_000) throw new Error("That photo is too large.");
    const userId = await optionalUserId();
    const desk = (() => {
      try {
        assertCanWrite(circuit, userId, data.pin);
        return true;
      } catch {
        return false;
      }
    })();
    if (!desk) {
      const self = data.passcode ? await fighterByPasscode(data.passcode) : null;
      if (!self || self.id !== data.fighterId) {
        throw new Error("Enter that wrestler’s passcode to change their photo.");
      }
    }
    const sql = await getSql();
    const current = (
      await sql<{ id: string }>`
        select id from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}
      `
    )[0];
    if (!current) throw new Error("Fighter not found.");
    await sql`update fighters set photo_url = ${photo} where id = ${data.fighterId}`;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

async function vacateFighter(sql: Awaited<ReturnType<typeof getSql>>, circuitId: string, fighterId: string) {
  const open = await sql<{ week_number: number }>`
    select week_number from weeks
    where circuit_id = ${circuitId} and status in ('upcoming', 'open', 'locked')
  `;
  const weeks = open.map((w) => Number(w.week_number));
  if (!weeks.length) return;
  const rows = await sql<{
    id: string;
    kind: string;
    fighter_ids_json: string;
    week_number: number;
  }>`select id, kind, fighter_ids_json, week_number from matchups where circuit_id = ${circuitId}`;
  for (const row of rows) {
    if (!weeks.includes(Number(row.week_number))) continue;
    let ids: string[] = [];
    try {
      ids = JSON.parse(row.fighter_ids_json) as string[];
    } catch {
      continue;
    }
    if (!ids.includes(fighterId)) continue;
    const left = ids.filter((id) => id !== fighterId);
    if (left.length === 0) {
      await sql`delete from matchups where id = ${row.id}`;
      continue;
    }
    const kind = left.length === 1 ? "bye" : row.kind === "rumble" ? "rumble" : "singles";
    await sql`
      update matchups
      set fighter_ids_json = ${JSON.stringify(left)}, kind = ${kind}, winner_id = ${null}, status = ${"scheduled"}
      where id = ${row.id}
    `;
  }
  for (const week of weeks) {
    await sql`delete from scores where fighter_id = ${fighterId} and week_number = ${week}`;
    await sql`delete from floor_work where fighter_id = ${fighterId} and week_number = ${week} and done = false`;
  }
}

export const removeFighter = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const row = (
      await sql<{ id: string }>`
        select id from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}
      `
    )[0];
    if (!row) throw new Error("They are not on the book.");
    if (circuit.status === "setup") {
      await sql`delete from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`;
    } else {
      await vacateFighter(sql, circuit.id, data.fighterId);
      await sql`update fighters set departed = ${true} where id = ${data.fighterId} and circuit_id = ${circuit.id}`;
    }
    const c = await loadCircuitById(circuit.id);
    return buildBoard(c!);
  });

export const restoreFighter = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    await sql`
      update fighters set departed = ${false}, active = ${true}
      where id = ${data.fighterId} and circuit_id = ${circuit.id}
    `;
    if (circuit.status === "active") {
      const rumble = (
        await sql<{ id: string; fighter_ids_json: string; kind: string }>`
          select id, fighter_ids_json, kind from matchups
          where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek} and bracket = ${"rumble"}
          limit 1
        `
      )[0];
      if (rumble) {
        let ids: string[] = [];
        try {
          ids = JSON.parse(rumble.fighter_ids_json) as string[];
        } catch {
          ids = [];
        }
        if (!ids.includes(data.fighterId)) {
          ids.push(data.fighterId);
          await sql`
            update matchups
            set fighter_ids_json = ${JSON.stringify(ids)}, kind = ${ids.length === 1 ? "bye" : "rumble"}
            where id = ${rumble.id}
          `;
        }
      } else {
        await sql`
          insert into matchups (id, circuit_id, week_number, bracket, kind, fighter_ids_json, winner_id, status)
          values (
            ${nid("k")}, ${circuit.id}, ${circuit.currentWeek}, ${"rumble"}, ${"bye"},
            ${JSON.stringify([data.fighterId])}, ${null}, ${"scheduled"}
          )
        `;
      }
    }
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
    const rows = await sql<FighterRow>`select * from fighters where circuit_id = ${circuit.id} and active = true and departed = false`;
    if (rows.length < 2) throw new Error("Need at least two fighters to open a circuit.");
    const mapped = rows.map(mapFighter);
    const keepSeeds = mapped.every((f) => f.seed != null);
    const seeded = keepSeeds
      ? [...mapped].sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99))
      : assignSeeds(mapped);
    for (const f of seeded) {
      await sql`update fighters set seed = ${f.seed} where id = ${f.id}`;
    }
    const seedById = new Map(seeded.map((f) => [f.id, f.seed ?? 99]));
    const pairs = pairBracket(
      seeded.map((f) => f.id),
      seedById,
      "main",
      false,
    );
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
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    let fighter: Fighter | null = null;
    let circuit: Circuit | null = null;
    if (data.claimCode) {
      const row = await fighterByPasscode(data.claimCode);
      if (!row) throw new Error("That passcode is not on the book.");
      fighter = row;
      circuit = await loadCircuitById(fighter.circuitId);
    } else if (data.slug && data.fighterId) {
      circuit = await loadCircuitBySlug(data.slug);
      if (!circuit) throw new Error("Circuit not found.");
      const userId = await optionalUserId();
      assertCanWrite(circuit, userId, data.pin);
      const row = (
        await sql<FighterRow>`select * from fighters where id = ${data.fighterId} and circuit_id = ${circuit.id}`
      )[0];
      if (!row) throw new Error("Fighter not found.");
      fighter = mapFighter(row);
    }
    if (!fighter || !circuit) throw new Error("Who is submitting?");
    if (fighter.departed) throw new Error("That locker was closed. See the commissioner.");
    const weekNumber = data.weekNumber ?? circuit.currentWeek;
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${weekNumber}
      `
    )[0];
    if (!week) throw new Error("No such week.");
    if (!weekAcceptsScores(week.status)) {
      throw new Error(
        week.status === "locked"
          ? "This week is locked. The commissioner has to unlock it before cards can change."
          : "This week is not open for cards.",
      );
    }
    await assertValidCard(sql, circuit.id, data.statuses);
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
    if (!next) throw new Error("Circuit not found.");
    return (await maybeAutoAdvance(next)) ?? (await buildBoard(next));
  });

export const submitScoresBatch = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      weekNumber: number;
      rows: Array<{ fighterId: string; statuses: MetricStatus[]; reviews: number }>;
      pin?: string;
      passcode?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    const userId = await optionalUserId();
    const desk = (() => {
      try {
        assertCanWrite(circuit, userId, data.pin);
        return true;
      } catch {
        return false;
      }
    })();
    if (!desk) {
      const self = data.passcode ? await fighterByPasscode(data.passcode) : null;
      if (!self || self.circuitId !== circuit.id) {
        throw new Error("Enter your passcode to mark your card.");
      }
      if (data.rows.some((r) => r.fighterId !== self.id)) {
        throw new Error("That passcode only opens your own card.");
      }
    }
    const sql = await getSql();
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${data.weekNumber}
      `
    )[0];
    if (!week || !weekAcceptsScores(week.status)) {
      throw new Error(
        week?.status === "locked"
          ? "This week is locked. Unlock it from the desk before changing cards."
          : "This week is not open.",
      );
    }
    for (const row of data.rows) {
      await assertValidCard(sql, circuit.id, row.statuses);
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
    if (!next) throw new Error("Circuit not found.");
    return (await maybeAutoAdvance(next)) ?? (await buildBoard(next));
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

async function maybeAutoAdvance(circuit: Circuit) {
  if (circuit.status !== "active") return null;
  const board = await buildBoard(circuit);
  const week = circuit.currentWeek;
  const status = board.weeks.find((w) => w.weekNumber === week)?.status ?? "";
  if (status !== "open" && status !== "locked") return null;
  const progress = weekCardProgress(week, board.matchups, board.fighters, board.scores);
  if (!progress.ready) return null;
  try {
    return await closeWeekNow(circuit);
  } catch {
    return null;
  }
}

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
    return closeWeekNow(circuit);
  });

async function closeWeekNow(circuit: Circuit) {
    const sql = await getSql();
    const week = circuit.currentWeek;
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
    const trainRows = await sql<{ fighter_id: string }>`
      select fighter_id from training_attempts
      where circuit_id = ${circuit.id} and week_number = ${week} and awarded = true
    `;
    const trainingBonus = new Map(trainRows.map((r) => [r.fighter_id, 1]));
    const scored = scores.map((s) => ({
      ...s,
      trainingBonus: trainingBonus.has(s.fighterId) ? (1 as const) : (0 as const),
    }));

    const isFinal = week >= circuit.weeks;
    const resolved = resolveWeek({
      matchups,
      scores: scored,
      seedById,
      metricCount,
      isFinalWeek: isFinal,
      trainingBonus,
    });

    await sql`delete from placements where circuit_id = ${circuit.id} and week_number = ${week}`;
    for (const m of matchups) {
      const { winnerId } = decideWinner(
        m.kind,
        m.fighterIds,
        scored,
        seedById,
        metricCount,
        trainingBonus,
      );
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
      const { winnerId } = decideWinner(
        m.kind,
        m.fighterIds,
        scored,
        seedById,
        metricCount,
        trainingBonus,
      );
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
      scores: scored,
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
      const finals = nextWeek >= circuit.weeks;
      const gone = new Set(fighters.filter((f) => f.departed).map((f) => f.id));
      const nextPairs = [];
      const allScores = (
        await sql<{
          id: string;
          circuit_id: string;
          fighter_id: string;
          week_number: number;
          statuses_json: string;
          reviews: number;
          notes: string;
        }>`select * from scores where circuit_id = ${circuit.id}`
      ).map(mapScore);
      const allTrain = await sql<{ fighter_id: string; week_number: number }>`
        select fighter_id, week_number from training_attempts
        where circuit_id = ${circuit.id} and awarded = true
      `;
      const starRows = await sql<{ fighter_id: string; stars: number }>`
        select fighter_id, stars from floor_work where circuit_id = ${circuit.id} and done = true
      `.catch(() => [] as Array<{ fighter_id: string; stars: number }>);
      const trainBonus = new Map<string, number>();
      for (const r of allTrain) {
        const scored = allScores.some((s) => s.fighterId === r.fighter_id && s.weekNumber === Number(r.week_number));
        const add = scored ? 0 : 1;
        trainBonus.set(r.fighter_id, (trainBonus.get(r.fighter_id) ?? 0) + add);
      }
      const starOf = new Map<string, number>();
      for (const r of starRows) {
        starOf.set(r.fighter_id, (starOf.get(r.fighter_id) ?? 0) + Number(r.stars));
      }
      const pointsOf = new Map<string, number>();
      for (const f of fighters) {
        const mine = allScores.filter((s) => s.fighterId === f.id);
        let pts = 0;
        for (const s of mine) {
          const train = allTrain.some((r) => r.fighter_id === f.id && Number(r.week_number) === s.weekNumber) ? 1 : 0;
          pts += scorecard(s.statuses, s.reviews, train).points;
        }
        pts += trainBonus.get(f.id) ?? 0;
        pointsOf.set(f.id, pts);
      }
      for (const bracket of ["main", "redemption", "rumble"] as BracketId[]) {
        const ids = fightersInBracketNext(resolved, bracket).filter((id) => !gone.has(id));
        if (!ids.length) continue;
        const fresh = reseedIds(ids, (id) => {
          const f = fighters.find((x) => x.id === id);
          return {
            points: pointsOf.get(id) ?? 0,
            stars: starOf.get(id) ?? 0,
            socks: f?.socksSold ?? 0,
            seed: f?.seed ?? 99,
          };
        });
        for (const [id, seed] of fresh) {
          seedById.set(id, seed);
          await sql`update fighters set seed = ${seed} where id = ${id}`;
        }
        nextPairs.push(...pairBracket(ids, seedById, bracket, finals));
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
}

export const saveStoreRoom = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      storeSlug: string;
      paint: string;
      accent: string;
      motto: string;
      mark: string;
      handle?: string;
      passcode?: string;
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    if (!STORES.some((s) => s.slug === data.storeSlug)) throw new Error("That is not a locker room.");
    const userId = await optionalUserId();
    let desk = false;
    try {
      assertCanWrite(circuit, userId, data.pin);
      desk = true;
    } catch {
      desk = false;
    }
    if (!desk) {
      const self = data.passcode ? await fighterByPasscode(data.passcode) : null;
      if (!self || self.departed) throw new Error("Enter a passcode from this locker room.");
      if (storeSlugOf(self.store) !== data.storeSlug) {
        throw new Error("That passcode belongs to another locker room.");
      }
    }
    const paint = (["house", "rose", "steel", "sage", "amber", "gold", "neon-pink", "neon-cyan"].includes(data.paint)
      ? data.paint
      : "house") as RoomPaint;
    const accent = (["house", "rose", "steel", "sage", "amber", "gold", "neon-pink", "neon-cyan"].includes(data.accent)
      ? data.accent
      : "amber") as RoomPaint;
    const mark = (["", "star", "bolt", "heat", "crown"].includes(data.mark) ? data.mark : "") as RoomMark;
    const handle = (["brass", "chrome", "black", "gold"].includes(data.handle ?? "")
      ? data.handle
      : "brass") as RoomHandle;
    const motto = data.motto.trim().split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
    const sql = await getSql();
    await sql`
      insert into store_rooms (circuit_id, store_slug, paint, accent, motto, mark, handle)
      values (${circuit.id}, ${data.storeSlug}, ${paint}, ${accent}, ${motto}, ${mark}, ${handle})
      on conflict (circuit_id, store_slug) do update set
        paint = excluded.paint, accent = excluded.accent, motto = excluded.motto, mark = excluded.mark, handle = excluded.handle
    `;
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
    if (!matchesDeskPin(data.pin)) {
      throw new Error("Enter the commissioner password to do that.");
    }
    const sql = await getSql();
    await resetDemoCircuit(sql);
    const circuit = await loadCircuitBySlug(DEMO_SLUG);
    return buildBoard(circuit!);
  });

export const verifyDeskPin = createServerFn({ method: "POST" })
  .validator((d: { pin: string }) => d)
  .handler(async ({ data }) => matchesDeskPin(data.pin));

export const lookupClaim = createServerFn({ method: "GET" })
  .validator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const fighter = await fighterByPasscode(data.code);
    if (!fighter) return null;
    if (fighter.departed) throw new Error("That locker was closed. See the commissioner.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) return null;
    const board = await buildBoard(circuit);
    return { fighter: { ...fighter, claimCode: normalizePasscode(data.code) }, board };
  });

export const completeTraining = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; moduleId: string; answers: number[] }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCircuit(sql);
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    if (fighter.departed) throw new Error("That locker was closed. See the commissioner.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const mod = moduleById(data.moduleId);
    if (!mod) throw new Error("That training is not on the card.");
    const answers = data.answers.slice(0, mod.questions.length).map((n) => Math.floor(Number(n)));
    const raw = gradeQuiz(mod.id, answers);
    const weekNumber = mod.weekNumber ?? 0;
    const weekRow =
      weekNumber > 0
        ? (
            await sql<{ status: string }>`
              select status from weeks
              where circuit_id = ${circuit.id} and week_number = ${weekNumber}
            `
          )[0]
        : null;
    const existing = (
      await sql<{ passed: boolean; awarded: boolean }>`
        select passed, awarded from training_attempts
        where fighter_id = ${fighter.id} and week_number = ${weekNumber} and module_id = ${mod.id}
      `
    )[0];
    const alreadyAwarded = Boolean(existing?.awarded);
    const weekHits =
      weekNumber > 0
        ? await sql<{ awarded: boolean }>`
            select awarded from training_attempts
            where fighter_id = ${fighter.id} and week_number = ${weekNumber} and awarded = true
          `
        : [];
    const canAward =
      raw.passed && weekNumber > 0 && weekRow ? weekAcceptsScores(weekRow.status) : false;
    const awarded = alreadyAwarded || (canAward && weekHits.length === 0);
    const passed = Boolean(existing?.passed) || raw.passed;
    const id = nid("t");
    await sql`
      insert into training_attempts (
        id, circuit_id, fighter_id, week_number, module_id,
        passed, awarded, correct, total, answers_json, attempted_at
      ) values (
        ${id}, ${circuit.id}, ${fighter.id}, ${weekNumber}, ${mod.id},
        ${passed}, ${awarded}, ${raw.correct}, ${raw.total},
        ${JSON.stringify(answers)}, now()
      )
      on conflict (fighter_id, week_number, module_id) do update set
        passed = excluded.passed,
        awarded = excluded.awarded,
        correct = excluded.correct,
        total = excluded.total,
        answers_json = excluded.answers_json,
        attempted_at = now()
    `;
    const next = await loadCircuitById(circuit.id);
    return {
      board: await buildBoard(next!),
      grade: {
        ...raw,
        awarded,
        alreadyAwarded,
      },
    };
  });

export type PasscodeRow = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  seed: number | null;
  passcode: string;
};

export const listPasscodes = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    await ensureNicePasscodes(circuit.id);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      first_name: string;
      last_name: string;
      nickname: string;
      seed: number | null;
      claim_code: string;
    }>`
      select id, first_name, last_name, nickname, seed, claim_code
      from fighters
      where circuit_id = ${circuit.id} and departed = false
      order by seed nulls last, last_name
    `;
    return rows.map(
      (r): PasscodeRow => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        nickname: r.nickname,
        seed: r.seed === null ? null : Number(r.seed),
        passcode: r.claim_code,
      }),
    );
  });

export const rotatePasscode = createServerFn({ method: "POST" })
  .validator((d: { slug: string; fighterId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const sql = await getSql();
    const existing = await sql<{ id: string; claim_code: string }>`
      select id, claim_code from fighters where circuit_id = ${circuit.id}
    `;
    const target = existing.find((r) => r.id === data.fighterId);
    if (!target) throw new Error("Fighter not found.");
    const used = new Set(existing.map((r) => r.claim_code).filter((c) => c !== target.claim_code));
    const next = mintPasscode(used);
    await sql`update fighters set claim_code = ${next} where id = ${target.id}`;
    return { fighterId: target.id, passcode: next };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      name?: string;
      prizeMain?: string;
      prizeRedemption?: string;
      prizeRumble?: string;
      tickerText?: string;
      theme?: string;
      metrics?: Array<{ id: string; label: string }>;
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const theme = data.theme && isSiteTheme(data.theme) ? data.theme : (circuit.theme || "house");
    const sql = await getSql();
    await sql`
      update circuits set
        name = ${data.name ?? circuit.name},
        prize_main = ${data.prizeMain ?? circuit.prizeMain},
        prize_redemption = ${data.prizeRedemption ?? circuit.prizeRedemption},
        prize_rumble = ${data.prizeRumble ?? circuit.prizeRumble},
        ticker_text = ${data.tickerText !== undefined ? data.tickerText : circuit.tickerText},
        theme = ${theme}
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

export function liveCard(
  fighterId: string,
  scores: {
    fighterId: string;
    weekNumber: number;
    statuses: MetricStatus[];
    reviews: number;
    trainingBonus?: number;
  }[],
  week: number,
  trainingBonus = 0,
) {
  const s = scores.find((x) => x.fighterId === fighterId && x.weekNumber === week);
  const train = (s?.trainingBonus ?? 0) > 0 || trainingBonus > 0 ? 1 : 0;
  return s ? scorecard(s.statuses, s.reviews, train) : train ? scorecard([], 0, 1) : null;
}

export { cardFor, scorecard };

async function loadJobExtras(sql: Awaited<ReturnType<typeof getSql>>, circuitId: string): Promise<FloorTaskDef[]> {
  try {
    const rows = await sql<{
      id: string;
      title: string;
      blurb: string;
      stars: number;
      pack: string;
      live: boolean;
    }>`select id, title, blurb, stars, pack, live from floor_catalog where circuit_id = ${circuitId}`;
    return mergeCatalog(rows).filter((t) => t.custom);
  } catch {
    return [];
  }
}

async function ensureFloorWork(sql: Awaited<ReturnType<typeof getSql>>, circuit: Circuit) {
  const extras = await loadJobExtras(sql, circuit.id);
  const week = (
    await sql<{ status: string }>`
      select status from weeks where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
    `
  )[0];
  const fresh = circuit.status === "setup" || week?.status === "upcoming";
  if (fresh) {
    await sql`
      delete from floor_work
      where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek} and done = false
    `;
  }
  const fighters = await sql<{ id: string }>`
    select id from fighters where circuit_id = ${circuit.id} and departed = false
  `;
  const existing = await sql<{ fighter_id: string; task_id: string }>`
    select fighter_id, task_id from floor_work
    where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
  `;
  const have = new Set(existing.map((r) => `${r.fighter_id}:${r.task_id}`));
  const jobs = liveTasks(extras);
  const missing: Array<{ fighterId: string; task: FloorTaskDef }> = [];
  for (const f of fighters) {
    for (const task of jobs) {
      if (!have.has(`${f.id}:${task.id}`)) missing.push({ fighterId: f.id, task });
    }
  }
  // Whole roster × whole catalog can be hundreds of rows; insert in batches so
  // the first board load of a week is not hundreds of network round-trips.
  const chunkSize = 200;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const params: unknown[] = [];
    const rows = chunk.map(({ fighterId, task }) => {
      const base = params.length;
      params.push(nid("fw"), circuit.id, fighterId, circuit.currentWeek, task.id, task.stars);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, false)`;
    });
    await sql.query(
      `insert into floor_work (id, circuit_id, fighter_id, week_number, task_id, stars, done)
       values ${rows.join(", ")}
       on conflict (fighter_id, week_number, task_id) do nothing`,
      params,
    );
  }
}

export const postChallenge = createServerFn({ method: "POST" })
  .validator((d: { slug: string; title: string; blurb?: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const title = data.title.trim();
    if (!title) throw new Error("Give the challenge a name.");
    const sql = await getSql();
    await sql`
      insert into challenges (circuit_id, week_number, title, blurb)
      values (${circuit.id}, ${circuit.currentWeek}, ${title}, ${(data.blurb ?? "").trim()})
      on conflict (circuit_id, week_number) do update set title = excluded.title, blurb = excluded.blurb
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const claimChallenge = createServerFn({ method: "POST" })
  .validator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    if (fighter.departed) throw new Error("That locker was closed.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const week = circuit.currentWeek;
    const ch = (
      await sql<{ title: string }>`
        select title from challenges where circuit_id = ${circuit.id} and week_number = ${week}
      `
    )[0];
    if (!ch) throw new Error("No challenge this week.");
    const open = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${week}
      `
    )[0];
    if (!weekAcceptsScores(open?.status ?? "")) throw new Error("This week is locked.");
    const already = (
      await sql<{ fighter_id: string }>`
        select fighter_id from challenge_claims
        where circuit_id = ${circuit.id} and week_number = ${week} and fighter_id = ${fighter.id}
      `
    )[0];
    if (already) {
      const next = await loadCircuitById(circuit.id);
      return buildBoard(next!);
    }
    const taken = (
      await sql<{ c: number }>`
        select count(*)::int as c from challenge_claims
        where circuit_id = ${circuit.id} and week_number = ${week}
      `
    )[0]?.c ?? 0;
    if (taken >= 3) throw new Error("The first three already claimed it.");
    await sql`
      insert into challenge_claims (circuit_id, week_number, fighter_id)
      values (${circuit.id}, ${week}, ${fighter.id})
    `;
    await sql`
      insert into belt_items (fighter_id, item_id, spent)
      values (${fighter.id}, ${"sticker-desk"}, ${0})
      on conflict (fighter_id, item_id) do nothing
    `;
    return equipOwned(circuit, fighter.id, "sticker-desk");
  });

export const saveHouseCall = createServerFn({ method: "POST" })
  .validator((d: { slug: string; faceId?: string; heelId?: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const face = data.faceId || null;
    const heel = data.heelId || null;
    if (face && heel && face === heel) throw new Error("Face and heel have to be two people.");
    const sql = await getSql();
    await sql`
      insert into house_calls (circuit_id, week_number, face_id, heel_id)
      values (${circuit.id}, ${circuit.currentWeek}, ${face}, ${heel})
      on conflict (circuit_id, week_number) do update set face_id = excluded.face_id, heel_id = excluded.heel_id
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const addFloorJob = createServerFn({ method: "POST" })
  .validator(
    (d: { slug: string; title: string; blurb?: string; stars?: number; pack?: TaskPack; pin?: string }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    const title = data.title.trim();
    if (!title) throw new Error("Give the job a name.");
    const pack: TaskPack = data.pack === "sales" || data.pack === "kind" ? data.pack : "ops";
    const stars = Math.max(1, Math.min(3, Math.floor(data.stars ?? 1)));
    const sql = await getSql();
    await sql`
      insert into floor_catalog (id, circuit_id, title, blurb, stars, pack, live)
      values (${nid("job")}, ${circuit.id}, ${title}, ${(data.blurb ?? "").trim()}, ${stars}, ${pack}, ${true})
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const removeFloorJob = createServerFn({ method: "POST" })
  .validator((d: { slug: string; jobId: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const circuit = await loadCircuitBySlug(data.slug);
    if (!circuit) throw new Error("Circuit not found.");
    assertCanWrite(circuit, userId, data.pin);
    if (!data.jobId.startsWith("job_")) throw new Error("House jobs stay on the list.");
    const sql = await getSql();
    await sql`delete from floor_catalog where id = ${data.jobId} and circuit_id = ${circuit.id}`;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const savePick = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; matchupId: string; pickId: string }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    if (fighter.departed) throw new Error("That locker was closed.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const m = (
      await sql<{
        id: string;
        week_number: number;
        kind: string;
        fighter_ids_json: string;
        status: string;
      }>`select id, week_number, kind, fighter_ids_json, status from matchups where id = ${data.matchupId} and circuit_id = ${circuit.id}`
    )[0];
    if (!m) throw new Error("That bout is not on the card.");
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${m.week_number}
      `
    )[0];
    if (!weekAcceptsScores(week?.status ?? "")) throw new Error("Picks are locked for that week.");
    let ids: string[] = [];
    try {
      ids = JSON.parse(m.fighter_ids_json) as string[];
    } catch {
      ids = [];
    }
    if (!ids.includes(data.pickId)) throw new Error("That name is not in this bout.");
    if (m.kind === "bye") throw new Error("A bye is not a pick.");
    await sql`
      insert into picks (id, circuit_id, fighter_id, week_number, matchup_id, pick_id)
      values (${nid("pk")}, ${circuit.id}, ${fighter.id}, ${m.week_number}, ${m.id}, ${data.pickId})
      on conflict (fighter_id, matchup_id) do update set pick_id = excluded.pick_id
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const savePromo = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; lineId: string; toId?: string }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    if (fighter.departed) throw new Error("That locker was closed.");
    if (!PROMO_BY_ID[data.lineId]) throw new Error("Pick a line from the list.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const week = (
      await sql<{ status: string }>`
        select status from weeks where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
      `
    )[0];
    if (!weekAcceptsScores(week?.status ?? "")) throw new Error("Promos are locked this week.");
    const live = (
      await sql<{ kind: string; fighter_ids_json: string }>`
        select kind, fighter_ids_json from matchups
        where circuit_id = ${circuit.id} and week_number = ${circuit.currentWeek}
      `
    );
    let toId = data.toId ?? "";
    for (const row of live) {
      let ids: string[] = [];
      try {
        ids = JSON.parse(row.fighter_ids_json) as string[];
      } catch {
        ids = [];
      }
      if (!ids.includes(fighter.id)) continue;
      const others = ids.filter((id) => id !== fighter.id);
      if (row.kind === "singles" && others[0]) toId = others[0];
      else if (others.includes(toId)) {
        /* keep */
      } else if (others[0] && !toId) toId = others[0];
    }
    if (!toId) throw new Error("No opponent to talk to this week.");
    await sql`
      insert into promos (id, circuit_id, week_number, from_id, to_id, line_id)
      values (${nid("pr")}, ${circuit.id}, ${circuit.currentWeek}, ${fighter.id}, ${toId}, ${data.lineId})
      on conflict (from_id, week_number) do update set line_id = excluded.line_id, to_id = excluded.to_id
    `;
    const next = await loadCircuitById(circuit.id);
    return buildBoard(next!);
  });

export const completeFloorTask = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; taskId: string; weekNumber: number; done: boolean }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    if (fighter.departed) throw new Error("That locker was closed. See the commissioner.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const sql = await getSql();
    const week = (
      await sql<{ status: string }>`
        select status from weeks
        where circuit_id = ${circuit.id} and week_number = ${data.weekNumber}
      `
    )[0];
    if (!weekAcceptsScores(week?.status ?? "")) {
      throw new Error("This week is locked. Stars already on the belt stay.");
    }
    const row = (
      await sql<{ id: string; done: boolean }>`
        select id, done from floor_work
        where fighter_id = ${fighter.id} and week_number = ${data.weekNumber} and task_id = ${data.taskId}
      `
    )[0];
    if (!row) throw new Error("That job is not on your card this week.");
    await sql`
      update floor_work
      set done = ${data.done}, completed_at = ${data.done ? new Date().toISOString() : null}
      where id = ${row.id}
    `;
    return buildBoard(circuit);
  });

export const buyBeltItem = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; itemId: string }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    const item = BELT_BY_ID[data.itemId];
    if (!item) throw new Error("That upgrade is not in the shop.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const board = await buildBoard(circuit);
    const bank = beltOf(fighter.id, board.floorWork, board.beltItems, pickStarCount(fighter.id, board.picks, board.matchups));
    const heat = computeCircuitHeat(board);
    const isMvp = heat.honors.some((h) => h.kind === "mvp" && h.fighterId === fighter.id);
    if (item.earn === "mvp" && !isMvp) {
      throw new Error("Win MVP of the Week first. Heat prints it from the scoresheet.");
    }
    const standing = board.standings.find((s) => s.fighterId === fighter.id);
    if (item.earn === "rumble" && standing?.currentBracket !== "rumble" && !bank.owned.has(item.id)) {
      throw new Error("The lost-and-found is on Floor 3. Get there first.");
    }
    if (item.earn === "challenge" && !bank.owned.has(item.id)) {
      throw new Error("Finish the commissioner's challenge. First three lockers.");
    }
    if (bank.owned.has(item.id) || (item.earn === "mvp" && isMvp) || (item.earn === "rumble" && standing?.currentBracket === "rumble")) {
      return equipOwned(circuit, fighter.id, item.id);
    }
    if (item.cost > 0 && bank.bank < item.cost) {
      throw new Error(`Need ${item.cost} stars. You have ${bank.bank}.`);
    }
    const sql = await getSql();
    await sql`
      insert into belt_items (fighter_id, item_id, spent)
      values (${fighter.id}, ${item.id}, ${item.cost})
      on conflict (fighter_id, item_id) do nothing
    `;
    return equipOwned(circuit, fighter.id, item.id);
  });

export const equipPlate = createServerFn({ method: "POST" })
  .validator((d: { passcode: string; itemId: string }) => d)
  .handler(async ({ data }) => {
    const fighter = await fighterByPasscode(data.passcode);
    if (!fighter) throw new Error("That passcode is not on the book.");
    const item = BELT_BY_ID[data.itemId];
    if (!item) throw new Error("That upgrade is not in the shop.");
    const circuit = await loadCircuitById(fighter.circuitId);
    if (!circuit) throw new Error("Circuit not found.");
    const board = await buildBoard(circuit);
    const bank = beltOf(fighter.id, board.floorWork, board.beltItems, pickStarCount(fighter.id, board.picks, board.matchups));
    const heat = computeCircuitHeat(board);
    const isMvp = heat.honors.some((h) => h.kind === "mvp" && h.fighterId === fighter.id);
    if (item.earn === "mvp" && !isMvp) {
      throw new Error("Win MVP of the Week first. Heat prints it from the scoresheet.");
    }
    const standing = board.standings.find((s) => s.fighterId === fighter.id);
    if (item.earn === "rumble" && standing?.currentBracket !== "rumble" && !bank.owned.has(item.id)) {
      throw new Error("The lost-and-found is on Floor 3.");
    }
    if (!bank.owned.has(item.id) && !FREE_ITEMS.has(item.id) && !(item.earn === "mvp" && isMvp) && !(item.earn === "rumble" && standing?.currentBracket === "rumble")) {
      throw new Error("Buy that upgrade first.");
    }
    return equipOwned(circuit, fighter.id, item.id);
  });

async function equipOwned(circuit: Circuit, fighterId: string, itemId: string) {
  const item = BELT_BY_ID[itemId];
  if (!item) throw new Error("Unknown upgrade.");
  const value = itemToPlateValue(item);
  const sql = await getSql();
  if (item.slot === "border") {
    await sql`update fighters set plate_border = ${value} where id = ${fighterId}`;
  } else if (item.slot === "bg") {
    await sql`update fighters set plate_bg = ${value} where id = ${fighterId}`;
  } else if (item.slot === "sticker") {
    await sql`update fighters set plate_sticker = ${value} where id = ${fighterId}`;
  } else if (item.slot === "fx") {
    await sql`update fighters set plate_fx = ${value} where id = ${fighterId}`;
  } else {
    await sql`update fighters set plate_mark = ${value} where id = ${fighterId}`;
  }
  const next = await loadCircuitById(circuit.id);
  return buildBoard(next!);
}
