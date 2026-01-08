import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: articleId, photoId } = await params;
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const userId = auth.user.id;

  const admin = createAdminSupabaseClient();
  // Verify ownership
  const { data: art, error: artErr } = await admin
    .from("articles")
    .select("author_id")
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
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


