import { createAdminClient } from "@/lib/supabase/admin";

export type DlqEntry = {
  workspace_id?: string;
  event_type: string;
  platform_event_id?: string;
  payload: Record<string, unknown>;
  error_message: string;
  error_context?: Record<string, unknown>;
  retry_count?: number;
};

export async function logToDeadLetter(entry: DlqEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("dead_letter_events").insert({
      workspace_id: entry.workspace_id ?? null,
      event_type: entry.event_type,
      platform_event_id: entry.platform_event_id ?? null,
      payload: entry.payload,
      error_message: entry.error_message,
      error_context: entry.error_context ?? {},
      retry_count: entry.retry_count ?? 0,
    } as Record<string, unknown>);

    if (error) {
      console.error("[dlq] Failed to write dead letter event:", error.message);
    } else {
      console.warn(
        `[dlq] Event logged: type=${entry.event_type} id=${entry.platform_event_id ?? "unknown"} error="${entry.error_message.slice(0, 100)}"`,
      );
    }
  } catch (err) {
    console.error("[dlq] Unexpected error writing dead letter:", (err as Error).message);
  }
}

export async function replayDeadLetterEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data, error: fetchError } = await supabase
    .from("dead_letter_events")
    .select("id, status")
    .eq("id", eventId)
    .eq("status", "failed")
    .maybeSingle();

  if (fetchError || !data) {
    return { success: false, error: fetchError?.message ?? "Event not found or already replayed" };
  }

  await supabase
    .from("dead_letter_events")
    .update({ status: "replayed", replayed_at: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", eventId);

  return { success: true };
}
