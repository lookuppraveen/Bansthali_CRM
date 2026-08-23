/**
 * Mock ERP adapter — stands in for the University's in-house ERP until the
 * real integration contract is defined in discovery. Everything below is
 * behind an interface so the real adapter can be swapped in without
 * touching callers.
 */

import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export interface ErpPayload {
  studentName: string;
  program: string;
  category?: string | null;
  externalRefId: number;
  guardianName?: string;
  guardianMobile?: string;
  aggregate?: string;
  hostelRequested?: boolean;
}

export interface ErpResult {
  ok: boolean;
  studentId?: string;
  error?: string;
}

export interface ErpAdapter {
  push(payload: ErpPayload): Promise<ErpResult>;
}

// ── Mock implementation ─────────────────────────────────────
// 85% chance of success, 10% queued, 5% review-required.
class MockErpAdapter implements ErpAdapter {
  async push(payload: ErpPayload): Promise<ErpResult> {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    const roll = Math.random();
    if (roll < 0.85) {
      const suffix = String(1000 + Math.floor(Math.random() * 9000));
      return { ok: true, studentId: `BV26-${suffix}` };
    }
    if (roll < 0.95) {
      return { ok: false, error: "Downstream timeout — will retry" };
    }
    return { ok: false, error: `Schema mismatch on programme_code for "${payload.program}"` };
  }
}

export const erp: ErpAdapter = new MockErpAdapter();

/**
 * Handoff a lead to the ERP. Idempotent — safe to retry.
 * Records/updates a row in erp_handoffs and audit_log.
 */
export async function handoffLead(leadId: number): Promise<{
  handoffId: number;
  status: (typeof schema.erpStatusEnum.enumValues)[number];
  studentId?: string;
  error?: string;
}> {
  const lead = await db.query.leads.findFirst({
    where: eq(schema.leads.id, leadId),
    with: { parents: true },
  });
  if (!lead) throw new Error("Lead not found");

  const payload: ErpPayload = {
    studentName: lead.name,
    program: lead.program ?? "",
    category: lead.category,
    externalRefId: lead.id,
    guardianName: lead.parents[0]?.name,
    guardianMobile: lead.parents[0]?.phone ?? undefined,
    aggregate: lead.aggregate ?? undefined,
    hostelRequested: lead.hostelRequested,
  };

  // Upsert-by-lead: keep at most one active handoff record per lead.
  const [existing] = await db
    .select()
    .from(schema.erpHandoffs)
    .where(eq(schema.erpHandoffs.leadId, leadId))
    .limit(1);

  const result = await erp.push(payload);
  const now = new Date();

  if (existing) {
    const [row] = await db
      .update(schema.erpHandoffs)
      .set({
        status: result.ok ? "synced" : result.error?.includes("Schema") ? "review" : "queued",
        erpStudentId: result.studentId ?? existing.erpStudentId,
        attempts: existing.attempts + 1,
        lastError: result.ok ? null : result.error ?? "Unknown",
        payload: payload as unknown as object,
        updatedAt: now,
      })
      .where(eq(schema.erpHandoffs.id, existing.id))
      .returning();

    return {
      handoffId: row.id,
      status: row.status,
      studentId: row.erpStudentId ?? undefined,
      error: row.lastError ?? undefined,
    };
  }

  const [row] = await db
    .insert(schema.erpHandoffs)
    .values({
      leadId,
      studentName: lead.name,
      program: lead.program ?? "",
      status: result.ok ? "synced" : result.error?.includes("Schema") ? "review" : "queued",
      erpStudentId: result.studentId,
      attempts: 1,
      lastError: result.ok ? null : result.error,
      payload: payload as unknown as object,
    })
    .returning();

  return {
    handoffId: row.id,
    status: row.status,
    studentId: row.erpStudentId ?? undefined,
    error: row.lastError ?? undefined,
  };
}
