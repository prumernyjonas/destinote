import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRole, isAdmin, getUserIdFromRequest } from "../../_utils/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getCurrentUserIdOptional() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("[articles/[id].GET] START", { id });
  const admin = createAdminSupabaseClient();
  
  // Nejdřív načteme článek, abychom mohli zkontrolovat author_id
  const { data, error } = await admin
    .from("articles")
    .select(
      "id, author_id, title, summary, content, status, created_at, updated_at, published_at, main_image_url, main_image_public_id, main_image_width, main_image_height, main_image_alt"
    )
    .eq("id", id)
    .maybeSingle();
    
  if (error) {
    console.error("[articles/[id].GET] Database error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  if (!data) {
    console.warn("[articles/[id].GET] Article not found", { id });
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  console.log("[articles/[id].GET] Article found", {
    id: data.id,
    authorId: data.author_id,
    status: data.status,
  });

  // Zkusíme získat userId různými způsoby
  let userId: string | null = null;
  
  // 1. Zkus x-user-id header (nejspolehlivější pro klienta)
  userId = req.headers.get("x-user-id") as string | null;
  console.log("[articles/[id].GET] userId from x-user-id header:", userId || "null");
  
  // 2. Zkus session z cookies
  if (!userId) {
    userId = await getCurrentUserIdOptional();
    console.log("[articles/[id].GET] userId from session:", userId || "null");
  }
  
  // 3. Fallback: Bearer token z Authorization headeru
  if (!userId) {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
    console.log("[articles/[id].GET] Bearer token present:", !!token);
    if (token) {
      try {
        const adminAuth = createAdminSupabaseClient();
        const { data: tokenUser, error: tokenError } = await adminAuth.auth.getUser(token);
        if (tokenError) {
          console.warn("[articles/[id].GET] Error getting user from token:", tokenError);
        } else if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
          console.log("[articles/[id].GET] userId from Bearer token:", userId);
        }
      } catch (e) {
        console.warn("[articles/[id].GET] Exception getting user from token:", e);
      }
    }
  }

  console.log("[articles/[id].GET] Final userId:", userId || "null");

  // Zkontrolujme přístup
  const publicAllowed = data.status === "approved";
  const isOwner = userId && data.author_id === userId;
  
  // Získejme roli, pokud máme userId
  let role: string | null = null;
  if (userId) {
    try {
      role = await getUserRole(userId);
      console.log("[articles/[id].GET] User role:", role);
    } catch (e) {
      console.warn("[articles/[id].GET] Error getting user role:", e);
    }
  }
  
  const isAdminUser = role && isAdmin(role as any);
  const canSee = publicAllowed || isOwner || isAdminUser;
  
  console.log("[articles/[id].GET] Access check", {
    publicAllowed,
    isOwner,
    isAdminUser,
    canSee,
    userId,
    authorId: data.author_id,
    status: data.status,
  });
  
  if (!canSee) {
    console.warn("[articles/[id].GET] Access denied", {
      id,
      userId,
      authorId: data.author_id,
      status: data.status,
      isOwner,
      publicAllowed,
      isAdminUser,
    });
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  console.log("[articles/[id].GET] Access granted, returning data");
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Získáme userId z různých zdrojů (header, session, Bearer token)
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const admin = createAdminSupabaseClient();

    // Load article for permission check
    const { data: art, error: artErr } = await admin
      .from("articles")
      .select("author_id, status")
      .eq("id", id)
      .maybeSingle();
    if (artErr) {
      return new Response(JSON.stringify({ error: artErr.message }), {
        status: 500,
      });
    }
    if (!art) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }
    const role = await getUserRole(userId);
    const owner = art.author_id === userId;
    if (!owner && !isAdmin(role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const allowed: any = {};
    for (const key of ["title", "summary", "content", "destination_id"]) {
      if (key in body) allowed[key] = body[key];
    }
    if ("title" in body) {
      allowed.slug = slugify(body.title);
    }
    if (Object.keys(allowed).length === 0) {
      return new Response(JSON.stringify({ error: "No updatable fields" }), {
        status: 400,
      });
    }
    allowed.updated_at = new Date().toISOString();
    
    // Pokud je článek schválený a vlastník ho upravuje, změňme status na pending
    // (admin může upravovat bez změny statusu)
    if (art.status === "approved" && owner && !isAdmin(role)) {
      allowed.status = "pending";
    }

    const { error: upErr } = await admin
      .from("articles")
      .update(allowed)
      .eq("id", id);
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Internal error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
