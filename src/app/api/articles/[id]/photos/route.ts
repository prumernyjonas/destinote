import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const userId = auth.user.id;

  const admin = createAdminSupabaseClient();
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

  const { url, public_id, width, height, alt } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });

  // public_id není nutné v tabulce article_photos, ukládáme jej do alt nebo payload? Zůstane jen url + rozměry + alt
  const toInsert = {
    article_id: articleId,
    author_id: userId,
    url,
    public_id: public_id ?? null,
    alt: alt ?? null,
    width: width ?? null,
    height: height ?? null,
  };
  const { data, error } = await admin.from("article_photos").insert(toInsert).select("id").single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ id: data.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}


