import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/database";
import { slugifyNickname } from "@/utils/slugify";

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface PayloadStorage {
  title: string;
  body: string;
  link?: string | null;
  [key: string]: unknown;
}

/**
 * Vytvoří notifikaci v databázi. Používá existující schéma:
 * recipient_id, type, article_id?, actor_id?, payload (JSONB), is_read
 */
export async function createNotification(
  admin: SupabaseClient,
  payload: CreateNotificationPayload
): Promise<void> {
  const payloadData: PayloadStorage = {
    title: payload.title || "",
    body: payload.body ?? "",
    link: payload.link ?? null,
    ...(payload.metadata ?? {}),
  };

  const insertData: Record<string, unknown> = {
    recipient_id: payload.userId,
    type: payload.type,
    payload: payloadData,
    is_read: false,
  };

  const meta = (payload.metadata ?? {}) as Record<string, unknown>;
  if (
    payload.type === "article_approved" ||
    payload.type === "article_rejected" ||
    payload.type === "article_submitted"
  ) {
    insertData.article_id = meta.article_id ?? null;
    insertData.actor_id = meta.actor_id ?? null;
  }
  if (payload.type === "comment_new" || payload.type === "comment_like") {
    insertData.article_id = meta.article_id ?? null;
    insertData.actor_id = meta.actor_id ?? null;
  }
  if (payload.type === "article_like") {
    insertData.article_id = meta.article_id ?? null;
    insertData.actor_id = meta.actor_id ?? null;
  }
  if (payload.type === "new_follower") {
    insertData.actor_id = meta.follower_id ?? null;
  }

  const { error } = await admin.from("notifications").insert(insertData);

  if (error) {
    console.error("[notifications] createNotification error:", error);
    throw error;
  }
}

/** Helper pro article_approved */
export function buildArticleApprovedNotification(
  article: { id: string; title: string; slug: string; author_id: string },
  actorId?: string
) {
  return {
    userId: article.author_id,
    type: "article_approved" as const,
    title: "Článek schválen",
    body: article.title,
    link: `/clanek/${article.slug}`,
    metadata: { article_id: article.id, actor_id: actorId },
  };
}

/** Helper pro article_rejected */
export function buildArticleRejectedNotification(
  article: { id: string; title: string; slug: string; author_id: string },
  reason?: string | null,
  actorId?: string
) {
  return {
    userId: article.author_id,
    type: "article_rejected" as const,
    title: "Článek zamítnut",
    body: article.title,
    link: `/clanek/${article.slug}`,
    metadata: { article_id: article.id, actor_id: actorId, ...(reason ? { reason } : {}) },
  };
}

/** Helper pro article_like – když někdo lajkne článek autora */
export function buildArticleLikeNotification(payload: {
  recipientId: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  actorId: string;
  actorNickname?: string;
}) {
  return {
    userId: payload.recipientId,
    type: "article_like" as const,
    title: "Lajk u článku",
    body: payload.articleTitle,
    link: `/clanek/${payload.articleSlug}`,
    metadata: {
      article_id: payload.articleId,
      actor_id: payload.actorId,
    },
  };
}

/** Helper pro comment_new */
export function buildCommentNewNotification(payload: {
  recipientId: string;
  articleTitle: string;
  articleSlug: string;
  articleId: string;
  commentId: string;
  actorId: string;
}) {
  return {
    userId: payload.recipientId,
    type: "comment_new" as const,
    title: "Nový komentář",
    body: payload.articleTitle,
    link: `/clanek/${payload.articleSlug}`,
    metadata: {
      article_id: payload.articleId,
      comment_id: payload.commentId,
      actor_id: payload.actorId,
    },
  };
}

/** Helper pro comment_like */
export function buildCommentLikeNotification(payload: {
  recipientId: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  commentId: string;
  actorId: string;
}) {
  return {
    userId: payload.recipientId,
    type: "comment_like" as const,
    title: "Lajk u komentáře",
    body: payload.articleTitle,
    link: `/clanek/${payload.articleSlug}`,
    metadata: {
      article_id: payload.articleId,
      comment_id: payload.commentId,
      actor_id: payload.actorId,
    },
  };
}

/** Helper pro article_submitted – pro adminy (odkaz na článek, ne na admin) */
export function buildArticleSubmittedNotification(payload: {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  authorId: string;
}) {
  return {
    userId: "", // doplní notifyAdmins
    type: "article_submitted" as const,
    title: "Nový článek ke schválení",
    body: payload.articleTitle,
    link: `/clanek/${payload.articleSlug}`,
    metadata: {
      article_id: payload.articleId,
      actor_id: payload.authorId,
    },
  };
}

/** Helper pro article_submitted – pro autora (potvrzení odeslání) */
export function buildArticleSubmittedForAuthorNotification(payload: {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  authorId: string;
}) {
  return {
    userId: payload.authorId,
    type: "article_submitted" as const,
    title: "Článek odeslán ke schválení",
    body: payload.articleTitle,
    link: `/dashboard/articles/${payload.articleId}/edit`,
    metadata: {
      article_id: payload.articleId,
      actor_id: payload.authorId,
    },
  };
}

/**
 * Pošle notifikaci všem adminům a moderátorům.
 */
export async function notifyAdmins(
  admin: SupabaseClient,
  payload: Omit<CreateNotificationPayload, "userId"> & { userId?: string }
): Promise<void> {
  const { data: admins } = await admin
    .from("users")
    .select("id")
    .in("role", ["admin", "moderator"])
    .is("deleted_at", null);

  if (!admins?.length) return;

  for (const a of admins) {
    try {
      await createNotification(admin, { ...payload, userId: a.id });
    } catch (e) {
      console.error("[notifications] notifyAdmins failed for", a.id, e);
    }
  }
}

/** Helper pro new_follower */
export function buildNewFollowerNotification(payload: {
  targetUserId: string;
  followerNickname: string;
  followerId: string;
}) {
  const slug = slugifyNickname(payload.followerNickname) || payload.followerId;
  return {
    userId: payload.targetUserId,
    type: "new_follower" as const,
    title: "Nový sledující",
    body: payload.followerNickname,
    link: `/profil/${slug}`,
    metadata: { follower_id: payload.followerId },
  };
}
