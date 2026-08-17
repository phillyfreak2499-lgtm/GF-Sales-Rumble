import { DEFAULT_METRICS } from "@/lib/circuit/types";
import { DEMO_ROSTER } from "@/lib/circuit/seed-roster";
import { DEMO_BIOS } from "@/lib/circuit/demo-bios";
import { generatePersona } from "@/lib/circuit/copy";
import { nid } from "@/lib/utils";
import type { Sql } from "@/lib/db";

export const DEMO_SLUG = "p10";
export const DEMO_JOIN = "CLINCH-P10";
export const DEMO_WEEKS = 5;
export const DEMO_ROSTER_SIZE = DEMO_ROSTER.length;

async function rosterMatches(sql: Sql, circuitId: string) {
  const rows = await sql<{ last_name: string }>`
    select last_name from fighters where circuit_id = ${circuitId}
  `;
  if (rows.length !== DEMO_ROSTER_SIZE) return false;
  const names = new Set(rows.map((r) => r.last_name));
  return names.has("Einsohn") && names.has("Oden") && names.has("Rodriquez");
}

export async function ensureDemoCircuit(sql: Sql): Promise<void> {
  const existing = await sql<{ id: string; weeks: number; status: string }>`
    select id, weeks, status from circuits where slug = ${DEMO_SLUG} limit 1
  `;
  if (existing.length) {
    const ok = await rosterMatches(sql, existing[0].id);
    if (ok && existing[0].weeks === DEMO_WEEKS) return;
    await resetDemoCircuit(sql);
    return;
  }
  await insertDemo(sql);
}

export async function resetDemoCircuit(sql: Sql): Promise<void> {
  await sql`delete from circuits where slug = ${DEMO_SLUG}`;
  await insertDemo(sql);
}

async function insertDemo(sql: Sql) {
  const circuitId = nid("c");
  await sql`
    insert into circuits (
      id, slug, name, period_label, weeks, current_week, status, join_code,
      owner_user_id, is_demo, prize_main, prize_redemption, prize_rumble, week1_byes
    ) values (
      ${circuitId}, ${DEMO_SLUG}, ${"Period 10 Rumble"}, ${"P10"},
      ${DEMO_WEEKS}, ${1}, ${"setup"}, ${DEMO_JOIN},
      ${null}, ${true}, ${"$150"}, ${"$50"}, ${"Lunch"}, ${0}
    )
  `;

  for (let i = 0; i < DEFAULT_METRICS.length; i += 1) {
    const m = DEFAULT_METRICS[i];
    await sql`
      insert into metrics (id, circuit_id, key, label, sort_order)
      values (${nid("m")}, ${circuitId}, ${m.key}, ${m.label}, ${i})
    `;
  }

  for (let w = 1; w <= DEMO_WEEKS; w += 1) {
    await sql`
      insert into weeks (circuit_id, week_number, status)
      values (${circuitId}, ${w}, ${"upcoming"})
    `;
  }

  for (let i = 0; i < DEMO_ROSTER.length; i += 1) {
    const r = DEMO_ROSTER[i];
    const id = nid("f");
    const code = `${r.nickname.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${String(i + 1).padStart(2, "0")}`;
    const bio = DEMO_BIOS[r.nickname] ?? { hometown: "", funFact: "" };
    const persona = generatePersona({
      firstName: r.firstName,
      lastName: r.lastName,
      nickname: r.nickname,
      hometown: bio.hometown,
      funFact: bio.funFact,
    });
    await sql`
      insert into fighters (
        id, circuit_id, user_id, first_name, last_name, nickname, hype_line, backstory,
        hometown, fun_fact, seed, prior_points, prior_blues, prior_reviews, claim_code, active
      ) values (
        ${id}, ${circuitId}, ${null}, ${r.firstName}, ${r.lastName}, ${r.nickname},
        ${r.hypeLine || persona.hypeLine}, ${r.backstory || persona.backstory},
        ${bio.hometown}, ${bio.funFact},
        ${null}, ${r.priorPoints}, ${r.priorBlues},
        ${r.priorReviews}, ${code}, ${true}
      )
    `;
  }
}
