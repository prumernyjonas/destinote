import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import type { Notification } from "@/types/database";

function mapRow(row: Record<string, unknown>): Notification {
  const payload = (row.payload as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    userId: row.recipient_id as string,
    type: row.type as Notification["type"],
    title: (payload.title as string) ?? "",
    body: (payload.body as string) ?? "",
    link: (payload.link as string) ?? null,
    metadata: payload,
    readAt: (row.is_read as boolean) ? new Date(row.created_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const admin = createAdminSupabaseClient();
  let query = admin
    .from("notifications")
    .select("id, recipient_id, type, payload, is_read, created_at", {
      count: "exact",
    })
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  const items = (data ?? []).map(mapRow);
  return new Response(
    JSON.stringify({
      items,
      total: count ?? items.length,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}
