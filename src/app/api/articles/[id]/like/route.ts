import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { createNotification, buildArticleLikeNotification } from "@/lib/notifications";

/** POST – přidat lajk článku (a notifikace autorovi) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const admin = createAdminSupabaseClient();

  const { data: article, error: artErr } = await admin
    .from("articles")
    .select("id, author_id, title, slug, status")
    .eq("id", articleId)
    .maybeSingle();
  if (artErr || !article) {
    return new Response(JSON.stringify({ error: "Article not found" }), {
      status: 404,
    });
  }
  if (article.status !== "approved") {
    return new Response(JSON.stringify({ error: "Article not published" }), {
      status: 400,
    });
  }

  const { data: existing } = await admin
    .from("article_likes")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ liked: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const { error: insErr } = await admin.from("article_likes").insert({
    article_id: articleId,
    user_id: userId,
  });
  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500,
    });
  }

  const { count } = await admin
    .from("article_likes")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);
  await admin
    .from("articles")
    .update({ likes_count: count ?? 0 })
    .eq("id", articleId);

  if (article.author_id !== userId) {
    const { data: actor } = await admin
      .from("users")
      .select("nickname")
      .eq("id", userId)
      .maybeSingle();
    try {
      await createNotification(
        admin,
        buildArticleLikeNotification({
          recipientId: article.author_id,
          articleId: article.id,
          articleTitle: article.title,
          articleSlug: article.slug,
          actorId: userId,
          actorNickname: actor?.nickname ?? undefined,
        })
      );
    } catch (e) {
      console.error("[articles like] createNotification failed:", e);
    }
  }

  return new Response(
    JSON.stringify({ liked: true, likesCount: count ?? 0 }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}

/** DELETE – odebrat lajk článku */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const userId = await getUserIdFromRequest(_req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const admin = createAdminSupabaseClient();

  const { error: delErr } = await admin
    .from("article_likes")
    .delete()
    .eq("article_id", articleId)
    .eq("user_id", userId);
  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500,
    });
  }

  const { count } = await admin
    .from("article_likes")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);
  await admin
    .from("articles")
    .update({ likes_count: count ?? 0 })
    .eq("id", articleId);

  return new Response(
    JSON.stringify({ liked: false, likesCount: count ?? 0 }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}
