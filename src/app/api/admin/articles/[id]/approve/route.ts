import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, getUserIdFromRequest } from "@/app/api/_utils/auth";
import { createNotification, buildArticleApprovedNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { data: article, error: fetchErr } = await admin
    .from("articles")
    .select("id, author_id, slug, title")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !article) {
    return new Response(JSON.stringify({ error: "Article not found" }), { status: 404 });
  }

  const { error } = await admin
    .from("articles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: userId,
      published_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  try {
    await createNotification(admin, buildArticleApprovedNotification(article, userId));
  } catch (e) {
    console.error("[approve] createNotification failed:", e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


