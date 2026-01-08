import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (auth.user?.id) return auth.user.id;

  // Fallback: Bearer token v Authorization headeru
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;
  if (token) {
    try {
      const admin = createAdminSupabaseClient();
      const { data: tokenUser } = await admin.auth.getUser(token);
      if (tokenUser?.user?.id) return tokenUser.user.id;
    } catch (e) {
      console.warn("[comments.POST] bearer resolve error", e);
    }
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  const admin = createAdminSupabaseClient();
  // Načíst všechny komentáře pro článek a seskupit na klientovi
  const { data, error } = await admin
    .from("comments")
    .select(
      "id, author_id, body, parent_id, created_at, deleted_at, users!comments_author_id_fkey(nickname, avatar_url)"
    )
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  const list = (data || []).filter((c) => !c.deleted_at);

  // Doplníme/aktualizujeme avatar a nickname z auth.user_metadata pro všechny autory (nejen chybějící).
  const uniqueIds = Array.from(new Set(list.map((c) => c.author_id)));
  const profileMap = new Map<
    string,
    { nickname?: string | null; avatar_url?: string | null }
  >();
  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const { data: userData } = await admin.auth.admin.getUserById(uid);
        const meta = (userData as any)?.user?.user_metadata || {};
        const nickname =
          meta.nickname ||
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          null;
        const avatarUrl = meta.avatar_url || meta.picture || null;
        profileMap.set(uid, {
          nickname,
          avatar_url: avatarUrl,
        });
      } catch (e) {
        console.warn("[comments.GET] auth meta fetch failed for", uid, e);
      }
    })
  );

  for (const c of list) {
    const meta = profileMap.get(c.author_id);
    if (!c.users) {
      c.users = meta as any;
    } else {
      const u = c.users as any;
      if (!u.nickname && meta?.nickname) {
        u.nickname = meta.nickname;
      }
      if (!u.avatar_url && meta?.avatar_url) {
        u.avatar_url = meta.avatar_url;
      }
    }
  }

  // sestavíme jednoduchý strom (max 1 úroveň odpovědí)
  const byId = new Map(
    list.map((c) => [
      c.id,
      {
        ...c,
        replies: [] as any[],
      },
    ])
  );
  const roots: any[] = [];
  for (const c of byId.values()) {
    if (c.parent_id) {
      const parent = byId.get(c.parent_id);
      if (parent) parent.replies.push(c);
    } else {
      roots.push(c);
    }
  }

  return new Response(JSON.stringify({ items: roots }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  const userId = await resolveUserId(req);
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  const admin = createAdminSupabaseClient();

  const { body, parent_id } = await req.json();
  if (!body || typeof body !== "string") {
    return new Response(JSON.stringify({ error: "Missing body" }), {
      status: 400,
    });
  }

  if (parent_id) {
    const { data: parent, error: pErr } = await admin
      .from("comments")
      .select("id, article_id, parent_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (pErr)
      return new Response(JSON.stringify({ error: pErr.message }), {
        status: 500,
      });
    if (!parent || parent.article_id !== articleId) {
      return new Response(JSON.stringify({ error: "Invalid parent_id" }), {
        status: 400,
      });
    }
    if (parent.parent_id) {
      // Povolíme max 2 úrovně (root -> reply -> reply). Pokud má parent parenta, ověříme, že jde o druhou úroveň.
      const { data: grand, error: gErr } = await admin
        .from("comments")
        .select("id, parent_id")
        .eq("id", parent.parent_id)
        .maybeSingle();
      if (gErr)
        return new Response(JSON.stringify({ error: gErr.message }), {
          status: 500,
        });
      if (grand?.parent_id) {
        return new Response(
          JSON.stringify({
            error: "Maximální hloubka vláken jsou 2 úrovně odpovědí.",
          }),
          { status: 400 }
        );
      }
    }
  }

  const { data, error } = await admin
    .from("comments")
    .insert({
      article_id: articleId,
      author_id: userId,
      body,
      parent_id: parent_id ?? null,
    })
    .select("id")
    .single();
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });

  return new Response(JSON.stringify({ id: data.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
