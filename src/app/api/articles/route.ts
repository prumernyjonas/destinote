import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "../_utils/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Generuje unikátní slug pro článek
 * Pokud slug už existuje, přidá číslo na konec (např. "nazev-clanku-2")
 */
async function generateUniqueSlug(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100; // Bezpečnostní limit

  while (counter < maxAttempts) {
    // Zkontrolovat, zda slug už existuje
    const { data: existing } = await admin
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) {
      // Slug je volný
      return slug;
    }

    // Slug existuje, zkusit s číslem
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Pokud jsme dosáhli limitu, použít timestamp jako fallback
  return `${baseSlug}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    let userId: string | null = userData?.user?.id ?? null;
    console.log("[articles.POST] start, cookieUserId:", userId || null);
    // Fallback: Bearer token z Authorization headeru (pokud chybí cookies)
    if (!userId) {
      const authHeader =
        req.headers.get("authorization") || req.headers.get("Authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : null;
      if (token)
        console.log("[articles.POST] bearer present (length)", token.length);
      if (token) {
        const admin = createAdminSupabaseClient();
        const { data: tokenUser } = await admin.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
          console.log("[articles.POST] resolved userId from bearer:", userId);
        }
      }
    }
    if (!userId) {
      console.warn("[articles.POST] Unauthorized - no userId");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const {
      title,
      summary,
      content,
      destination, // textový název země
      main_image_url,
      main_image_public_id,
      main_image_width,
      main_image_height,
      main_image_alt,
    } = body || {};
    console.log("[articles.POST] payload:", {
      hasTitle: !!title,
      hasContent: !!content,
      hasSummary: !!summary,
      hasDest: !!destination,
      hasCover: !!main_image_url,
    });
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Missing title or content" }),
        { status: 400 }
      );
    }
    const admin = createAdminSupabaseClient();
    
    // Získat název země pro uložení do textového pole destination
    let destinationName: string | null = null;
    
    // Pokud je poskytnut destination (textový název), použijeme ho
    if (destination && typeof destination === "string" && destination.trim() !== "") {
      destinationName = destination.trim();
    }
    
    const baseSlug = slugify(title);
    
    // Generovat unikátní slug
    const uniqueSlug = await generateUniqueSlug(admin, baseSlug);
    console.log("[articles.POST] generated slug:", uniqueSlug, "from base:", baseSlug);

    const toInsert: any = {
      author_id: userId,
      title,
      slug: uniqueSlug,
      summary: summary ?? null,
      content,
      status: "draft",
    };
    
    // Přidat destination (textový název země) pokud je k dispozici
    if (destinationName) {
      toInsert.destination = destinationName;
    }
    // pokud dorazila cover metadata, vložíme je rovnou
    if (main_image_url) (toInsert as any).main_image_url = main_image_url;
    if (main_image_public_id)
      (toInsert as any).main_image_public_id = main_image_public_id;
    if (typeof main_image_width !== "undefined")
      (toInsert as any).main_image_width =
        main_image_width === null ? null : Number(main_image_width);
    if (typeof main_image_height !== "undefined")
      (toInsert as any).main_image_height =
        main_image_height === null ? null : Number(main_image_height);
    if (typeof main_image_alt !== "undefined")
      (toInsert as any).main_image_alt =
        main_image_alt === null ? null : String(main_image_alt);
    const { data, error } = await admin
      .from("articles")
      .insert(toInsert)
      .select("id, slug")
      .single();
    if (error) {
      console.error("[articles.POST] insert error:", error.message, error);
      
      // Speciální handling pro duplicitní slug (i když by to nemělo nastat díky generateUniqueSlug)
      if (error.message?.includes("articles_slug_key") || error.code === "23505") {
        // Pokud přesto dojde k duplicitě, zkusit znovu s jiným slugem
        console.warn("[articles.POST] Duplicate slug detected, retrying with timestamp");
        const fallbackSlug = `${baseSlug}-${Date.now()}`;
        const retryInsert = { ...toInsert, slug: fallbackSlug };
        const { data: retryData, error: retryError } = await admin
          .from("articles")
          .insert(retryInsert)
          .select("id, slug")
          .single();
        
        if (retryError) {
          console.error("[articles.POST] retry insert error:", retryError.message);
          return new Response(
            JSON.stringify({
              error: "Nepodařilo se vytvořit článek. Zkuste změnit název článku.",
            }),
            { status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ id: retryData.id, slug: retryData.slug }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: error.message || "Chyba při vytváření článku",
        }),
        { status: 500 }
      );
    }
    console.log("[articles.POST] created:", { id: data.id, slug: data.slug });
    return new Response(JSON.stringify({ id: data.id, slug: data.slug }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[articles.POST] handler error:", err?.message, err);
    
    // Kontrola, zda není problém s JSON parsingem
    if (err instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Chyba při zpracování požadavku" }),
        { status: 400 }
      );
    }
    
    const message =
      err?.message === "UNAUTHORIZED" ? "Unauthorized" : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: message === "Unauthorized" ? 401 : 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const following = searchParams.get("following") === "true";
  const friends = searchParams.get("friends") === "true";
  const authorId = searchParams.get("authorId"); // Pro načtení článků konkrétního autora
  const admin = createAdminSupabaseClient();

  // Helper pro získání userId
  async function resolveUserId(): Promise<string | null> {
    let userId: string | null = searchParams.get("userId");

    if (!userId) {
      const supabase = await createServerSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id ?? null;
    }

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

    return userId;
  }

  try {
    if (mine) {
      const userId = await resolveUserId();

      if (!userId) {
        console.log("[articles.GET] No userId found");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      console.log("[articles.GET] Fetching articles for userId:", userId);
      const { data, error } = await admin
        .from("articles")
        .select("id, title, status, created_at, updated_at")
        .eq("author_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[articles.GET] Database error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      console.log("[articles.GET] Found articles:", data?.length || 0, data);
      return new Response(JSON.stringify({ items: data ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Články od sledovaných uživatelů
    if (following) {
      const userId = await resolveUserId();

      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      // Získat seznam sledovaných uživatelů
      const { data: followingData } = await admin
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId);

      const followingIds = (followingData || []).map((f: any) => f.following_id);

      if (followingIds.length === 0) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      const { data, error } = await admin
        .from("articles")
        .select(
          "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, author_id, destination"
        )
        .eq("status", "approved")
        .in("author_id", followingIds)
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ items: data ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Články od přátel (obousměrné sledování)
    if (friends) {
      const userId = await resolveUserId();

      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      // Získat seznam sledovaných a sledujících
      const [followingRes, followersRes] = await Promise.all([
        admin
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", userId),
        admin
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", userId),
      ]);

      const followingIds = new Set(
        (followingRes.data || []).map((f: any) => f.following_id)
      );
      const followerIds = new Set(
        (followersRes.data || []).map((f: any) => f.follower_id)
      );

      // Přátelé = průnik
      const friendIds = [...followingIds].filter((id) => followerIds.has(id));

      if (friendIds.length === 0) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      const { data, error } = await admin
        .from("articles")
        .select(
          "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, author_id, destination"
        )
        .eq("status", "approved")
        .in("author_id", friendIds)
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ items: data ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Články konkrétního autora (pro veřejný profil)
    if (authorId) {
      const { data, error } = await admin
        .from("articles")
        .select(
          "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, destination"
        )
        .eq("author_id", authorId)
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ items: data ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Výchozí: všechny schválené články
    const { data, error } = await admin
      .from("articles")
      .select(
        "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, destination"
      )
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ items: data ?? [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    const message =
      err?.message === "UNAUTHORIZED" ? "Unauthorized" : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: message === "Unauthorized" ? 401 : 500,
    });
  }
}
