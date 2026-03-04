import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commentId = id;
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const userId = auth.user.id;

  const admin = createAdminSupabaseClient();

  const { data: comment, error: cErr } = await admin
    .from("comments")
    .select("id")
    .eq("id", commentId)
    .maybeSingle();
  if (cErr) return new Response(JSON.stringify({ error: cErr.message }), { status: 500 });
  if (!comment) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const { data: existing, error: exErr } = await admin
    .from("comment_dislikes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (exErr) return new Response(JSON.stringify({ error: exErr.message }), { status: 500 });

  if (existing) {
    const { error: delErr } = await admin
      .from("comment_dislikes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);
    if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
    return new Response(JSON.stringify({ disliked: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Při dislajku odebrat like (jen jeden stav)
  await admin
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);

  const { error: insErr } = await admin
    .from("comment_dislikes")
    .insert({ comment_id: commentId, user_id: userId });
  if (insErr) return new Response(JSON.stringify({ error: insErr.message }), { status: 500 });

  return new Response(JSON.stringify({ disliked: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
