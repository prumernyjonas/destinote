import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const userId = auth.user.id;
  const admin = createAdminSupabaseClient();

  const { data: art, error: artErr } = await admin
    .from("articles")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (artErr) return new Response(JSON.stringify({ error: artErr.message }), { status: 500 });
  if (!art) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const role = await getUserRole(userId);
  const owner = art.author_id === userId;
  if (!owner && !isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { url, public_id, width, height, alt } = await req.json();
  if (!url || !public_id) {
    return new Response(JSON.stringify({ error: "Missing url or public_id" }), { status: 400 });
  }

  const { error: upErr } = await admin
    .from("articles")
    .update({
      main_image_url: url,
      main_image_public_id: public_id,
      main_image_width: width ?? null,
      main_image_height: height ?? null,
      main_image_alt: alt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) {
    return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}


