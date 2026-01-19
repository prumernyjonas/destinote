import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, getUserIdFromRequest } from "@/app/api/_utils/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = id;
    console.log("[photos.GET] Request for article:", articleId);
    
    const admin = createAdminSupabaseClient();

    // Zkontrolovat, zda článek existuje
    const { data: art, error: artErr } = await admin
      .from("articles")
      .select("id")
      .eq("id", articleId)
      .maybeSingle();
    
    if (artErr) {
      console.error("[photos.GET] Article check error:", artErr);
      return new Response(JSON.stringify({ error: artErr.message }), { 
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    
    if (!art) {
      console.warn("[photos.GET] Article not found:", articleId);
      return new Response(JSON.stringify({ error: "Article not found" }), { 
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("[photos.GET] Fetching photos for article:", articleId);
    // Poznámka: public_id sloupec v article_photos neexistuje podle schématu
    const { data, error } = await admin
      .from("article_photos")
      .select("id, url, alt, width, height")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[photos.GET] Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("[photos.GET] Success, returning", data?.length || 0, "photos");
    return new Response(JSON.stringify({ photos: data || [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[photos.GET] Handler error:", err?.message, err?.stack);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  
  // Použijeme getUserIdFromRequest pro konzistentní autentizaci
  const userId = await getUserIdFromRequest(req);
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const admin = createAdminSupabaseClient();
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

  const { url, public_id, width, height, alt } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });

  // Poznámka: public_id sloupec v article_photos neexistuje podle schématu, takže ho neukládáme
  const toInsert = {
    article_id: articleId,
    author_id: userId,
    url,
    alt: alt ?? null,
    width: width ?? null,
    height: height ?? null,
  };
  const { data, error } = await admin.from("article_photos").insert(toInsert).select("id").single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  
  // Pokud je článek schválený a vlastník přidává obrázek, změňme status na pending
  if (art.status === "approved" && art.author_id === userId && !isAdmin(role)) {
    await admin
      .from("articles")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", articleId);
  }
  
  return new Response(JSON.stringify({ id: data.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}


