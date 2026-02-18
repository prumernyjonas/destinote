import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";

/** POST – smaže přečtená oznámení starší než N dní (výchozí 30) */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const admin = createAdminSupabaseClient();
  const { data: deleted, error } = await admin
    .from("notifications")
    .delete()
    .eq("recipient_id", userId)
    .eq("is_read", true)
    .lt("created_at", cutoffIso)
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const count = deleted?.length ?? 0;
  return new Response(
    JSON.stringify({ ok: true, deleted: count }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
