"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { slugifyNickname } from "@/utils/slugify";
import { FiThumbsUp, FiThumbsDown, FiMessageCircle } from "react-icons/fi";

function getAccessTokenFromStorage(): string | null {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      const lower = key.toLowerCase();
      const looksSupabase =
        lower.includes("supabase") || lower.startsWith("sb-");
      const looksAuth =
        lower.includes("auth") ||
        lower.includes("session") ||
        lower.includes("token");
      if (!looksSupabase || !looksAuth) continue;
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        const parsed = JSON.parse(value);
        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.currentSession?.access_token)
          return parsed.currentSession.access_token;
        if (parsed?.session?.access_token) return parsed.session.access_token;
        if (parsed?.accessToken) return parsed.accessToken;
      } catch {
        // ignore parse errors
      }
    }
  } catch {
    // ignore
  }
  return null;
}

type CommentBadge = {
  id: string;
  name: string;
  icon_url: string | null;
};

type CommentItemType = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  parent_id?: string | null;
  users?: {
    nickname?: string | null;
    avatar_url?: string | null;
  } | null;
  author_badges?: CommentBadge[];
  likes_count?: number;
  dislikes_count?: number;
  my_liked?: boolean;
  my_disliked?: boolean;
  replies?: CommentItemType[];
};

type CommentResponse = {
  items: CommentItemType[];
};

type CommentSort = "newest" | "oldest";

function sortCommentTree(
  items: CommentItemType[],
  order: CommentSort
): CommentItemType[] {
  const desc = order === "newest";
  const cmp = (a: CommentItemType, b: CommentItemType) => {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    return desc ? tB - tA : tA - tB;
  };
  return items
    .map((c) => ({
      ...c,
      replies:
        c.replies && c.replies.length > 0
          ? sortCommentTree([...c.replies], order)
          : c.replies,
    }))
    .sort(cmp);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function badgeIconSrc(badge: CommentBadge): string | null {
  const raw = badge.icon_url;
  if (!raw || typeof raw !== "string") return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  const filename = raw.replace(/^badges\/?/, "").trim();
  return filename ? `/badges/${filename}` : null;
}

function CommentBadges({ badges }: { badges: CommentBadge[] }) {
  if (!badges.length) return null;
  const display = badges.slice(0, 3);
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" title={display.map((b) => b.name).join(", ")}>
      {display.map((badge) => {
        const src = badgeIconSrc(badge);
        return (
          <span
            key={badge.id}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0"
            title={badge.name}
          >
            {src ? (
              <Image
                src={src}
                alt={badge.name}
                width={20}
                height={20}
                className="object-contain w-4 h-4 rounded-full"
                unoptimized={src.startsWith("/badges/")}
              />
            ) : (
              <span className="text-[10px]" aria-hidden>🏅</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function authorLabel(comment: CommentItemType) {
  const nick = comment.users?.nickname?.trim();
  if (nick) return nick;
  return `Uživatel ${comment.author_id.slice(0, 8)}`;
}

function CommentItem({ comment }: { comment: CommentItemType }) {
  const initialsSource =
    comment.users?.nickname ||
    comment.author_id?.slice(0, 2) ||
    comment.author_id ||
    "U";
  const initials = initialsSource.slice(0, 2).toUpperCase();
  const avatar = comment.users?.avatar_url;
  const nickname = comment.users?.nickname;
  const profileLink = nickname ? `/profil/${slugifyNickname(nickname)}` : null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2 flex-wrap">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={comment.users?.nickname || "Avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
              {initials}
            </span>
          )}
          {profileLink ? (
            <Link
              href={profileLink}
              className="font-medium text-gray-800 hover:text-green-700 hover:underline transition-colors"
            >
              {authorLabel(comment)}
            </Link>
          ) : (
            <span className="font-medium text-gray-800">
              {authorLabel(comment)}
            </span>
          )}
          {comment.author_badges && comment.author_badges.length > 0 && (
            <CommentBadges badges={comment.author_badges} />
          )}
        </div>
        <span>{formatDate(comment.created_at)}</span>
      </div>
      <p className="text-gray-900 whitespace-pre-line">{comment.body}</p>
    </div>
  );
}

export default function ArticleComments({
  articleId,
  articleSlug,
}: {
  articleId: string;
  articleSlug: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sortOrder, setSortOrder] = useState<CommentSort>("newest");

  const commentCount = useMemo(() => comments.length, [comments]);
  const sortedComments = useMemo(
    () => sortCommentTree(comments, sortOrder),
    [comments, sortOrder]
  );

  async function loadComments(initial = false) {
    if (initial) setLoading(true);
    setError(null);
    try {
      const token = getAccessTokenFromStorage();
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Načtení komentářů selhalo");
      }
      const data = (await res.json()) as CommentResponse;
      setComments(data.items || []);
    } catch (e: any) {
      setError(e.message || "Chyba při načítání komentářů");
    } finally {
      if (initial) setLoading(false);
    }
  }

  useEffect(() => {
    loadComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // Zajistí, že první client render bude shodný s SSR (vyhneme se hydration mismatch
  // kvůli rozdílnému auth stavu mezi serverem a klientem).
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(
    e: React.FormEvent,
    parentId: string | null = null
  ) {
    e.preventDefault();
    const text = parentId ? replyBody.trim() : body.trim();
    if (!text) {
      setError("Napište prosím komentář.");
      return;
    }
    if (!parentId) setSubmitting(true);
    else setDeletingId(null); // no-op for reply submit
    setError(null);
    try {
      const token = getAccessTokenFromStorage();
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          body: text,
          ...(parentId ? { parent_id: parentId } : {}),
        }),
      });
      if (res.status === 401) {
        setError("Pro přidání komentáře se prosím přihlaste.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Odeslání komentáře selhalo");
      }
      const { id: newId } = (await res.json().catch(() => ({}))) as {
        id?: string;
      };
      const now = new Date().toISOString();
      const newComment: CommentItemType = {
        id: newId || crypto.randomUUID(),
        author_id: user?.uid || "",
        body: text,
        created_at: now,
        parent_id: parentId,
        users: {
          nickname: user?.displayName || null,
          avatar_url: user?.photoURL || null,
        },
        replies: [],
      };

      if (parentId) {
        setComments((prev) => addReply(prev, parentId, newComment));
        setReplyBody("");
        setReplyingToId(null);
      } else {
        setComments((prev) => [...prev, newComment]);
        setBody("");
      }
      // Načíst komentáře ze serveru, aby se u nového komentáře zobrazily odznaky (bez refreshi)
      loadComments(false);
    } catch (e: any) {
      setError(e.message || "Odeslání komentáře selhalo");
    } finally {
      if (!parentId) setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const token = getAccessTokenFromStorage();
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Pro smazání komentáře se prosím přihlaste.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Smazání komentáře selhalo");
      }
      setComments((prev) => removeComment(prev, id));
    } catch (e: any) {
      setError(e.message || "Smazání komentáře selhalo");
    } finally {
      setDeletingId(null);
    }
  }

  function updateCommentLikes(
    prev: CommentItemType[],
    commentId: string,
    payload: { liked?: boolean; disliked?: boolean; likesDelta?: number; dislikesDelta?: number }
  ): CommentItemType[] {
    return prev.map((c) => {
      if (c.id === commentId) {
        const likes = (c.likes_count ?? 0) + (payload.likesDelta ?? 0);
        const dislikes = (c.dislikes_count ?? 0) + (payload.dislikesDelta ?? 0);
        return {
          ...c,
          likes_count: Math.max(0, likes),
          dislikes_count: Math.max(0, dislikes),
          my_liked: payload.liked ?? c.my_liked,
          my_disliked: payload.disliked ?? c.my_disliked,
        };
      }
      if (c.replies?.length) {
        return { ...c, replies: updateCommentLikes(c.replies, commentId, payload) };
      }
      return c;
    });
  }

  async function handleLike(commentId: string) {
    if (!user) return;
    const token = getAccessTokenFromStorage();
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const json = (await res.json()) as { liked: boolean };
      setComments((prev) => {
        const comment = findComment(prev, commentId);
        if (!comment) return prev;
        if (json.liked) {
          return updateCommentLikes(prev, commentId, {
            liked: true,
            disliked: false,
            likesDelta: 1,
            dislikesDelta: comment.my_disliked ? -1 : 0,
          });
        }
        return updateCommentLikes(prev, commentId, {
          liked: false,
          likesDelta: -1,
        });
      });
    } catch {
      // ignore
    }
  }

  async function handleDislike(commentId: string) {
    if (!user) return;
    const token = getAccessTokenFromStorage();
    try {
      const res = await fetch(`/api/comments/${commentId}/dislike`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const json = (await res.json()) as { disliked: boolean };
      setComments((prev) => {
        const comment = findComment(prev, commentId);
        if (!comment) return prev;
        if (json.disliked) {
          return updateCommentLikes(prev, commentId, {
            disliked: true,
            liked: false,
            dislikesDelta: 1,
            likesDelta: comment.my_liked ? -1 : 0,
          });
        }
        return updateCommentLikes(prev, commentId, {
          disliked: false,
          dislikesDelta: -1,
        });
      });
    } catch {
      // ignore
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-2 text-gray-600">
        <p>Načítám komentáře…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Komentáře</h2>
          <p className="text-sm text-gray-600">
            {commentCount === 1 ? "1 komentář" : `${commentCount} komentářů`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {comments.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Řazení:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as CommentSort)}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="newest">Nejnovější</option>
                <option value="oldest">Nejstarší</option>
              </select>
            </label>
          )}
          {!authLoading && !user ? (
            <Link
              href={`/prihlaseni?redirect=/clanek/${articleSlug}`}
              className="text-sm text-green-700 font-medium hover:text-green-900"
            >
              Přihlásit se pro komentář
            </Link>
          ) : null}
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Přidat komentář
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            placeholder="Podělte se o svůj názor nebo zkušenost…"
            disabled={submitting}
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="cursor-pointer"
            >
              Odeslat
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-gray-600">Načítám komentáře…</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-600">Zatím žádné komentáře. Buďte první!</p>
      ) : (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={user?.uid}
              onLike={handleLike}
              onDislike={handleDislike}
              onReply={(id) => {
                setReplyingToId(id);
                setReplyBody("");
              }}
              onDelete={handleDelete}
              deletingId={deletingId}
              replyingTo={replyingToId}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              onSubmitReply={(e, targetId) => handleSubmit(e, targetId)}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  onDislike,
  deletingId,
  replyingTo,
  replyBody,
  setReplyBody,
  onSubmitReply,
  depth,
}: {
  comment: CommentItemType;
  currentUserId?: string | null;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  deletingId: string | null;
  replyingTo: string | null;
  replyBody: string;
  setReplyBody: (v: string) => void;
  onSubmitReply: (e: React.FormEvent, targetId: string) => void;
  depth: number;
}) {
  const canReply = depth < 2;
  const isChild = depth > 0;
  const wrapperCls = isChild
    ? "space-y-2"
    : "py-3 border-b border-gray-200 space-y-3";
  const repliesCount = comment.replies?.length ?? 0;
  return (
    <div className={wrapperCls}>
      <CommentItem comment={comment} />
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button
          type="button"
          onClick={() => currentUserId && onLike(comment.id)}
          disabled={!currentUserId}
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
            comment.my_liked
              ? "text-green-600 bg-green-50"
              : "text-gray-500 hover:text-green-600 hover:bg-gray-50"
          } ${!currentUserId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          title="Lajknout"
        >
          <FiThumbsUp className="w-4 h-4" />
          <span className="tabular-nums">{comment.likes_count ?? 0}</span>
        </button>
        <button
          type="button"
          onClick={() => currentUserId && onDislike(comment.id)}
          disabled={!currentUserId}
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
            comment.my_disliked
              ? "text-red-600 bg-red-50"
              : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
          } ${!currentUserId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          title="Dislajknout"
        >
          <FiThumbsDown className="w-4 h-4" />
          <span className="tabular-nums">{comment.dislikes_count ?? 0}</span>
        </button>
        <span className="inline-flex items-center gap-1 text-gray-500" title="Odpovědi">
          <FiMessageCircle className="w-4 h-4" />
          <span className="tabular-nums">{repliesCount}</span>
        </span>
        {currentUserId === comment.author_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(comment.id)}
            loading={deletingId === comment.id}
            disabled={deletingId === comment.id}
            className="cursor-pointer"
          >
            Smazat
          </Button>
        )}
        {canReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            className="cursor-pointer"
          >
            Odpovědět
          </Button>
        )}
      </div>

      {replyingTo === comment.id && canReply && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitReply(e, comment.id);
          }}
          className="mt-3 space-y-2"
        >
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            placeholder="Napište odpověď…"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyBody("");
                onReply(""); // reset
              }}
              className="cursor-pointer"
            >
              Zrušit
            </Button>
            <Button type="submit" size="sm" className="cursor-pointer">
              Odeslat odpověď
            </Button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              onDislike={onDislike}
              deletingId={deletingId}
              replyingTo={replyingTo}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              onSubmitReply={onSubmitReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findComment(list: CommentItemType[], id: string): CommentItemType | null {
  for (const c of list) {
    if (c.id === id) return c;
    if (c.replies?.length) {
      const found = findComment(c.replies, id);
      if (found) return found;
    }
  }
  return null;
}

function addReply(
  list: CommentItemType[],
  parentId: string,
  newComment: CommentItemType
): CommentItemType[] {
  return list.map((c) => {
    if (c.id === parentId) {
      const replies = c.replies ? [...c.replies, newComment] : [newComment];
      return { ...c, replies };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: addReply(c.replies, parentId, newComment) };
    }
    return c;
  });
}

function removeComment(
  list: CommentItemType[],
  targetId: string
): CommentItemType[] {
  const filtered = list
    .map((c) => {
      const replies = c.replies ? removeComment(c.replies, targetId) : [];
      return { ...c, replies };
    })
    .filter((c) => c.id !== targetId);
  return filtered;
}
