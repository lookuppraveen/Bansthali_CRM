import { db, schema } from "@/db/client";
import { asc } from "drizzle-orm";

/** Static fallback if no pipeline is configured for a stage. */
const DEFAULT_STAGE_HOURS: Record<string, number> = {
  Enquiry: 24,
  Nurturing: 48,
  Application: 72,
  BUAT: 24,
  "Merit List": 48,
  Counselling: 24,
  Verification: 48,
  Enrolled: 168, // 1 week grace
  Dropped: 720, // 30d
};

let cache: Map<string, number> | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 60_000;

/** Load stage→hours from active pipelines. Cached for 60s. */
async function loadStageHours(): Promise<Map<string, number>> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;

  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({ stage: schema.pipelineStages.stage, slaHours: schema.pipelineStages.slaHours })
      .from(schema.pipelineStages)
      .orderBy(asc(schema.pipelineStages.orderIndex));
    // First pipeline wins (simple demo model).
    for (const r of rows) if (!map.has(r.stage)) map.set(r.stage, r.slaHours);
  } catch {
    /* schema may not yet be migrated in dev — fall through to defaults */
  }

  for (const [stage, hrs] of Object.entries(DEFAULT_STAGE_HOURS)) {
    if (!map.has(stage)) map.set(stage, hrs);
  }
  cache = map;
  cacheAt = Date.now();
  return map;
}

export type SlaStatus = "On track" | "Due today" | "Breached";

export function slaFor(elapsedMs: number, slaHours: number): SlaStatus {
  const slaMs = slaHours * 3600_000;
  if (elapsedMs > slaMs) return "Breached";
  const remaining = slaMs - elapsedMs;
  if (remaining < 24 * 3600_000) return "Due today";
  return "On track";
}

/** Compute a live SLA for one lead. */
export async function computeSla(stage: string, lastTouchAt: Date): Promise<SlaStatus> {
  const hoursMap = await loadStageHours();
  const slaHours = hoursMap.get(stage) ?? 24;
  return slaFor(Date.now() - lastTouchAt.getTime(), slaHours);
}

/** Compute SLA for many leads in one pass (no per-row DB call). */
export async function computeSlaMany<T extends { stage: string; lastTouchAt: Date | string }>(
  leads: T[]
): Promise<(T & { sla: SlaStatus })[]> {
  const hoursMap = await loadStageHours();
  const now = Date.now();
  return leads.map((l) => {
    const slaHours = hoursMap.get(l.stage) ?? 24;
    const then = typeof l.lastTouchAt === "string" ? new Date(l.lastTouchAt).getTime() : l.lastTouchAt.getTime();
    return { ...l, sla: slaFor(now - then, slaHours) };
  });
}
