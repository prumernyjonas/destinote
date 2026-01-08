import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  let userId: string | null = auth.user?.id ?? null;
  // Fallback: Bearer token z Authorization headeru (pokud chybí cookies)
  if (!userId) {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
    if (token) {
      const adminAuth = createAdminSupabaseClient();
      const { data: tokenUser } = await adminAuth.auth.getUser(token);
      if (tokenUser?.user?.id) {
        userId = tokenUser.user.id;
      }
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const admin = createAdminSupabaseClient();

  const { data: art, error: artErr } = await admin
    .from("articles")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (artErr) {
    return new Response(JSON.stringify({ error: artErr.message }), {
      status: 500,
    });
  }
  if (!art) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  const role = await getUserRole(userId);
  const owner = art.author_id === userId;
  if (!owner && !isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const { error: upErr } = await admin
    .from("articles")
    .update({ status: "pending" })
    .eq("id", id);
  if (upErr) {
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
