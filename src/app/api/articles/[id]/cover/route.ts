import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Zkusíme získat userId různými způsoby
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
        console.warn("[cover.PUT] bearer resolve error", e);
      }
    }
  }
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Zkusíme získat userId různými způsoby
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
        console.warn("[cover.DELETE] bearer resolve error", e);
      }
    }
  }
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  
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

  const { error: upErr } = await admin
    .from("articles")
    .update({
      main_image_url: null,
      main_image_public_id: null,
      main_image_width: null,
      main_image_height: null,
      main_image_alt: null,
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
