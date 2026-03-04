import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification, buildCommentNewNotification } from "@/lib/notifications";

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  const admin = createAdminSupabaseClient();
  const currentUserId = await resolveUserId(req);

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
  const commentIds = list.map((c) => c.id);

  // Doplníme/aktualizujeme avatar a nickname z users tabulky (rychlejší než Auth API)
  const uniqueIds = Array.from(new Set(list.map((c) => c.author_id)));
  const profileMap = new Map<
    string,
    { nickname?: string | null; avatar_url?: string | null }
  >();
  
  if (uniqueIds.length > 0) {
    try {
      // Načíst data z users tabulky (rychlejší než Auth API)
      const { data: usersData, error: usersError } = await admin
        .from("users")
        .select("id, nickname, avatar_url")
        .in("id", uniqueIds)
        .is("deleted_at", null);
      
      if (!usersError && usersData) {
        for (const user of usersData) {
          profileMap.set(user.id, {
            nickname: user.nickname || null,
            avatar_url: user.avatar_url || null,
          });
        }
      }
      
      // Fallback: pro chybějící uživatele zkusit Auth API
      const missingIds = uniqueIds.filter((id) => !profileMap.has(id));
      if (missingIds.length > 0) {
        await Promise.all(
          missingIds.slice(0, 10).map(async (uid) => { // Limit 10 pro bezpečnost
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
      }
    } catch (e) {
      console.warn("[comments.GET] Error loading user profiles:", e);
    }
  }

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

  // Načíst max 3 odznaky na autora (pro zobrazení u komentářů). Později lze přepnout na user_display_badges.
  const authorBadgesMap = new Map<
    string,
    { id: string; name: string; icon_url: string | null }[]
  >();
  if (uniqueIds.length > 0) {
    const { data: ubRows, error: ubErr } = await admin
      .from("user_badges")
      .select("user_id, badge_id, awarded_at")
      .in("user_id", uniqueIds)
      .order("awarded_at", { ascending: false });

    if (!ubErr && ubRows?.length) {
      const badgeIds = [...new Set(ubRows.map((r: any) => r.badge_id))];
      const { data: badgesData, error: badgesErr } = await admin
        .from("badges")
        .select("id, name, icon_url")
        .in("id", badgeIds);

      if (!badgesErr && badgesData?.length) {
        const badgeById = new Map(badgesData.map((b: any) => [b.id, b]));
        const perUser = new Map<string, { id: string; name: string; icon_url: string | null }[]>();
        for (const ub of ubRows) {
          const arr = perUser.get(ub.user_id) ?? [];
          if (arr.length >= 3) continue;
          const b = badgeById.get(ub.badge_id);
          if (b) {
            arr.push(b);
            perUser.set(ub.user_id, arr);
          }
        }
        perUser.forEach((v, k) => authorBadgesMap.set(k, v));
      }
    }
  }

  for (const c of list) {
    (c as any).author_badges = authorBadgesMap.get(c.author_id) ?? [];
  }

  // Počty lajků a dislajků + stav přihlášeného uživatele
  const likesCountMap = new Map<string, number>();
  const dislikesCountMap = new Map<string, number>();
  const myLikedSet = new Set<string>();
  const myDislikedSet = new Set<string>();

  if (commentIds.length > 0) {
    const [likesRes, dislikesRes] = await Promise.all([
      admin.from("comment_likes").select("comment_id").in("comment_id", commentIds),
      admin.from("comment_dislikes").select("comment_id").in("comment_id", commentIds),
    ]);
    for (const row of likesRes.data ?? []) {
      const cid = (row as { comment_id: string }).comment_id;
      likesCountMap.set(cid, (likesCountMap.get(cid) ?? 0) + 1);
    }
    for (const row of dislikesRes.data ?? []) {
      const cid = (row as { comment_id: string }).comment_id;
      dislikesCountMap.set(cid, (dislikesCountMap.get(cid) ?? 0) + 1);
    }
    if (currentUserId) {
      const [myLikesRes, myDislikesRes] = await Promise.all([
        admin.from("comment_likes").select("comment_id").eq("user_id", currentUserId).in("comment_id", commentIds),
        admin.from("comment_dislikes").select("comment_id").eq("user_id", currentUserId).in("comment_id", commentIds),
      ]);
      for (const row of myLikesRes.data ?? []) myLikedSet.add((row as { comment_id: string }).comment_id);
      for (const row of myDislikesRes.data ?? []) myDislikedSet.add((row as { comment_id: string }).comment_id);
    }
  }

  for (const c of list) {
    (c as any).likes_count = likesCountMap.get(c.id) ?? 0;
    (c as any).dislikes_count = dislikesCountMap.get(c.id) ?? 0;
    (c as any).my_liked = currentUserId ? myLikedSet.has(c.id) : false;
    (c as any).my_disliked = currentUserId ? myDislikedSet.has(c.id) : false;
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

  let recipientId: string | null = null;
  if (parent_id) {
    const { data: parent } = await admin
      .from("comments")
      .select("author_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (parent && parent.author_id !== userId) recipientId = parent.author_id;
  } else {
    const { data: art } = await admin
      .from("articles")
      .select("author_id, title, slug")
      .eq("id", articleId)
      .maybeSingle();
    if (art && art.author_id !== userId) recipientId = art.author_id;
  }

  if (recipientId) {
    const { data: art } = await admin
      .from("articles")
      .select("title, slug")
      .eq("id", articleId)
      .maybeSingle();
    if (art) {
      try {
        await createNotification(
          admin,
          buildCommentNewNotification({
            recipientId,
            articleTitle: art.title,
            articleSlug: art.slug,
            articleId,
            commentId: data.id,
            actorId: userId,
          })
        );
      } catch (e) {
        console.error("[comments.POST] createNotification failed:", e);
      }
    }
  }

  return new Response(JSON.stringify({ id: data.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
