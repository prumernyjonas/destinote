import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: articleId, photoId } = await params;
  
  // Zkusíme získat userId různými způsoby (stejně jako v POST)
  let userId: string | null = null;
  
  // 1. Zkus session z cookies
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (auth.user?.id) {
    userId = auth.user.id;
  }
  
  // 2. Fallback: Bearer token z Authorization headeru
  if (!userId) {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
    if (token) {
      try {
        const adminAuth = createAdminSupabaseClient();
        const { data: tokenUser } = await adminAuth.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
        }
      } catch (e) {
        console.warn("[photos.DELETE] bearer resolve error", e);
      }
    }
  }
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  // Verify ownership
  const { data: art, error: artErr } = await admin
    .from("articles")
    .select("author_id, status")
    .eq("id", articleId)
    .maybeSingle();
  if (artErr) return new Response(JSON.stringify({ error: artErr.message }), { status: 500 });
  if (!art) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  const role = await getUserRole(userId);
  if (art.author_id !== userId && !isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { error } = await admin.from("article_photos").delete().eq("id", photoId).eq("article_id", articleId);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  
  // Pokud je článek schválený a vlastník maže obrázek, změňme status na pending
  if (art.status === "approved" && art.author_id === userId && !isAdmin(role)) {
    await admin
      .from("articles")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", articleId);
  }
  
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


