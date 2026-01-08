import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, getUserIdFromRequest } from "@/app/api/_utils/auth";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const role = await getUserRole(userId);
  if (!isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 100);

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("comments")
    .select(
      "id, article_id, author_id, body, created_at, deleted_at"
    )
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 200)));
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify({ items: data ?? [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
