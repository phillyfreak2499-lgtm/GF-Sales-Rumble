import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { pairBracket } from "@/lib/circuit/engine";
import { writePreview } from "@/lib/circuit/gazette";
import { nid } from "@/lib/utils";
import {
  mapCircuit,
  mapFighter,
  mapMatchup,
  type CircuitRow,
  type FighterRow,
} from "./map";

const DESK_PIN = (process.env.DESK_PIN ?? "").trim().toLowerCase();

function matchesDeskPin(candidate?: string) {
  if (!DESK_PIN) return false;
  return (candidate ?? "").trim().toLowerCase() === DESK_PIN;
}

async function optionalUserId() {
  try {
    const u = await getSessionUser();
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Put the live circuit back on week 1 and blank metric cards.
 * Does not touch fighters, passcodes, lockers, academy, jobs, or belts.
 */
export const rewindToWeek1 = createServerFn({ method: "POST" })
  .validator((d: { slug: string; pin?: string }) => d)
  .handler(async ({ data }) => {
    const userId = await optionalUserId();
    const sql = await getSql();
    const circuitRow = (
      await sql<CircuitRow>`select * from circuits where slug = ${data.slug} limit 1`
    )[0];
    if (!circuitRow) throw new Error("Circuit not found.");
    const circuit = mapCircuit(circuitRow);
    if (!(matchesDeskPin(data.pin) || (userId && circuit.ownerUserId === userId))) {
      throw new Error("Enter the commissioner password to do that.");
    }
    if (circuit.status === "setup") throw new Error("Week 1 has not opened yet.");

    await sql`delete from scores where circuit_id = ${circuit.id}`;
    await sql`
      update matchups
      set winner_id = ${null}, status = ${"scheduled"}
      where circuit_id = ${circuit.id} and week_number = 1
    `;
    await sql`delete from matchups where circuit_id = ${circuit.id} and week_number > 1`;
    await sql`delete from placements where circuit_id = ${circuit.id}`;
    await sql`
      delete from gazette
      where circuit_id = ${circuit.id} and (week_number > 1 or kind = ${"recap"})
    `;
    await sql`
      update weeks set status = ${"open"}
      where circuit_id = ${circuit.id} and week_number = 1
    `;
    await sql`
      update weeks set status = ${"upcoming"}
      where circuit_id = ${circuit.id} and week_number > 1
    `;
    await sql`
      update circuits set current_week = ${1}, status = ${"active"}
      where id = ${circuit.id}
    `;
    await sql`
      update fighters set active = ${true}
      where circuit_id = ${circuit.id} and departed = ${false}
    `;

    const week1 = await sql<{ id: string }>`
      select id from matchups where circuit_id = ${circuit.id} and week_number = 1
    `;
    if (!week1.length) {
      const rows = await sql<FighterRow>`
        select * from fighters
        where circuit_id = ${circuit.id} and departed = false
      `;
      const mapped = rows.map(mapFighter);
      const seedById = new Map(mapped.map((f) => [f.id, f.seed ?? 99]));
      const pairs = pairBracket(
        mapped.map((f) => f.id),
        seedById,
        "main",
        false,
      );
      await sql`delete from matchups where circuit_id = ${circuit.id} and week_number = 1`;
      for (const p of pairs) {
        await sql`
          insert into matchups (id, circuit_id, week_number, bracket, kind, fighter_ids_json, winner_id, status)
          values (
            ${nid("k")}, ${circuit.id}, ${1}, ${p.bracket}, ${p.kind},
            ${JSON.stringify(p.fighterIds)}, ${null}, ${"scheduled"}
          )
        `;
      }
    }

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

    return { ok: true, currentWeek: 1 as const };
  });
