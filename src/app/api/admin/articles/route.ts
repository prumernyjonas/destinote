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
  const status = searchParams.get("status") || undefined;
  const author = searchParams.get("author") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const admin = createAdminSupabaseClient();
  let query = admin
    .from("articles")
    .select(
      "id, author_id, title, status, created_at, updated_at, published_at, main_image_url, main_image_public_id"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (author) query = query.eq("author_id", author);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ items: data ?? [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


