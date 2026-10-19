import { createAdminClient } from "@/lib/supabase/admin";

type AuditEntry = {
  workspace_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
};

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_logs").insert({
      workspace_id: entry.workspace_id,
      actor_id: entry.actor_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip_address ?? null,
    } as Record<string, unknown>);
  } catch (err) {
    console.error("[audit] failed to write log:", err);
  }
}
