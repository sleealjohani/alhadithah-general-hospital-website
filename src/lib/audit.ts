import { supabase } from "./supabase/client";

/* Writes an admin action into activity_logs (actor, action, entity, diff).
   Fire-and-forget by design: auditing must never block or break the
   mutation it describes. RLS restricts inserts to active admins and stamps
   are validated server-side by the policy's auth.uid() check. */
export function logAdminAction(
  action: string,
  entityTable: string,
  entityId?: string | null,
  diff?: Record<string, unknown>
) {
  if (!supabase) return;
  supabase.auth.getUser().then(({ data }) => {
    if (!data.user || !supabase) return;
    supabase
      .from("activity_logs")
      .insert({
        actor_id: data.user.id,
        action,
        entity_table: entityTable,
        entity_id: entityId ?? null,
        metadata: diff ?? {}
      })
      .then(({ error }) => {
        if (error) console.warn("audit log failed", error.message);
      });
  });
}
