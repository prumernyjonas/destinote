import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const { data: notification, error: fetchError } = await admin
    .from("notifications")
    .select("recipient_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !notification) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  if (notification.recipient_id !== userId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
