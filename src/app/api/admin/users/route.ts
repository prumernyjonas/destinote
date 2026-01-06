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

  const admin = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);
  const q = searchParams.get("q")?.trim();

  let query = admin
    .from("users")
    .select("id, email, nickname, role, created_at, updated_at, avatar_url")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    // jednoduché OR vyhledávání přes ILIKE
    query = query.or(
      `email.ilike.%${q}%,nickname.ilike.%${q}%`
    ) as any;
  }

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ items: data ?? [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


