import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, getUserIdFromRequest } from "@/app/api/_utils/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
  if (!url) {
    return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });
  }
  // public_id je volitelný - může být null pro obrázky z galerie

  // Nejdřív zjistíme aktuální cover obrázek
  const { data: currentArt } = await admin
    .from("articles")
    .select("main_image_url, main_image_public_id, main_image_width, main_image_height, main_image_alt")
    .eq("id", id)
    .maybeSingle();

  // Pokud existuje původní cover obrázek a je jiný než nový, PŘIDÁME ho do galerie (aby se NIKDY neztratil)
  if (currentArt?.main_image_url && currentArt.main_image_url !== url) {
    console.log("[cover.PUT] Old cover found, adding to gallery:", currentArt.main_image_url);
    
    // Zkontrolujeme, jestli už není v galerii
    const { data: existingPhoto, error: checkError } = await admin
      .from("article_photos")
      .select("id")
      .eq("article_id", id)
      .eq("url", currentArt.main_image_url)
      .maybeSingle();

    if (checkError) {
      console.error("[cover.PUT] Error checking existing photo:", checkError);
    }

    // Pokud není v galerii, PŘIDÁME ho tam (aby se NIKDY neztratil)
    // DŮLEŽITÉ: Nikdy nesmazeme obrázek z galerie, jen ho přidáme
    if (!existingPhoto) {
      console.log("[cover.PUT] Adding old cover to gallery");
      const { error: insertError } = await admin
        .from("article_photos")
        .insert({
          article_id: id,
          author_id: userId,
          url: currentArt.main_image_url,
          public_id: currentArt.main_image_public_id,
          width: currentArt.main_image_width,
          height: currentArt.main_image_height,
          alt: currentArt.main_image_alt,
        });
      
      if (insertError) {
        console.error("[cover.PUT] Error adding old cover to gallery:", insertError);
        // Pokračujeme i když se nepodařilo přidat do galerie - hlavní je, že se nastaví nový cover
      } else {
        console.log("[cover.PUT] Successfully added old cover to gallery");
      }
    } else {
      console.log("[cover.PUT] Old cover already in gallery, skipping");
    }
  }
  
  // DŮLEŽITÉ: Obrázek z galerie, který se nastaví jako hlavní, ZŮSTANE v galerii
  // Nikdy nesmazeme obrázek z galerie automaticky - jen když ho uživatel explicitně smaže
  console.log("[cover.PUT] Setting new cover:", url);

  // Nastavíme nový cover obrázek
  const updateData: any = {
    main_image_url: url,
    main_image_public_id: public_id,
    main_image_width: width ?? null,
    main_image_height: height ?? null,
    main_image_alt: alt ?? null,
    updated_at: new Date().toISOString(),
  };
  
  if (art.status === "approved" && owner && !isAdmin(role)) {
    updateData.status = "pending";
  }
  
  const { error: upErr } = await admin
    .from("articles")
    .update(updateData)
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
    .eq("id", id)
    .maybeSingle();
  if (artErr) return new Response(JSON.stringify({ error: artErr.message }), { status: 500 });
  if (!art) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const role = await getUserRole(userId);
  const owner = art.author_id === userId;
  if (!owner && !isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // Pokud je článek schválený a vlastník ho upravuje, změňme status na pending
  const updateData: any = {
    main_image_url: null,
    main_image_public_id: null,
    main_image_width: null,
    main_image_height: null,
    main_image_alt: null,
    updated_at: new Date().toISOString(),
  };
  
  if (art.status === "approved" && owner && !isAdmin(role)) {
    updateData.status = "pending";
  }

  const { error: upErr } = await admin
    .from("articles")
    .update(updateData)
    .eq("id", id);
  if (upErr) {
    return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
