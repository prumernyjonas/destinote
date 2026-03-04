"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBell,
  FiCheckCircle,
  FiFileText,
  FiHeart,
  FiMessageCircle,
  FiThumbsUp,
  FiUser,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { getNotificationAuthHeaders } from "@/lib/notification-auth";
import type { Notification } from "@/types/database";

const PAGE_SIZE = 20;

function getIconForType(type: Notification["type"]) {
  switch (type) {
    case "article_approved":
    case "article_rejected":
      return FiCheckCircle;
    case "article_submitted":
      return FiFileText;
    case "comment_new":
      return FiMessageCircle;
    case "comment_like":
      return FiThumbsUp;
    case "article_like":
      return FiHeart;
    case "new_follower":
      return FiUser;
    default:
      return FiBell;
  }
}

function formatDateTime(date: Date) {
  return date.toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      unreadOnly: filter === "unread" ? "true" : "false",
    });
    getNotificationAuthHeaders()
      .then((headers) => fetch(`/api/notifications?${params}`, { credentials: "include", headers }))
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [user, page, filter]);

  const markAsRead = async (id: string) => {
    try {
      const headers = await getNotificationAuthHeaders();
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers,
      });
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: n.readAt ?? new Date() } : n
        )
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const headers = await getNotificationAuthHeaders();
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
        headers,
      });
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() }))
      );
      setTotal((t) => Math.max(0, t - items.filter((n) => !n.readAt).length));
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string) => {
    const headers = await getNotificationAuthHeaders();
    const res = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    return res.ok;
  };

  const handleDelete = async (e: React.MouseEvent, n: Notification) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await deleteNotification(n.id);
    if (ok) {
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  const handleCleanupOld = async () => {
    setCleaningUp(true);
    try {
      const headers = await getNotificationAuthHeaders();
      const res = await fetch("/api/notifications/cleanup?days=30", {
        method: "POST",
        credentials: "include",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) window.location.reload();
    } finally {
      setCleaningUp(false);
    }
  };

  const handleItemClick = (n: Notification) => {
    if (!n.readAt) markAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  if (!mounted) {
    return (
      <>
        <h1 className="text-2xl font-semibold mb-6">Oznámení</h1>
        <div className="py-12 text-center text-slate-500">Načítám…</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <h1 className="text-2xl font-semibold mb-6">Oznámení</h1>
        <p className="text-slate-600">
          Pro zobrazení oznámení se prosím přihlaste.
        </p>
      </>
    );
  }

  const unreadCount = items.filter((n) => !n.readAt).length;
  const hasMore = (page + 1) * PAGE_SIZE < total;

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Oznámení</h1>
      <p className="text-slate-700 text-base leading-relaxed mb-6">
        Historie oznámení – schválení článků, nové komentáře, lajky a sledující.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium transition cursor-pointer ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Vše
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium transition cursor-pointer ${
              filter === "unread"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Nepřečtené
          </button>
        </div>
        {(filter === "all" || unreadCount > 0) && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {markingAll ? "Označuji…" : "Označit vše jako přečtené"}
          </button>
        )}
        <button
          onClick={handleCleanupOld}
          disabled={cleaningUp}
          className="text-sm text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Smaže přečtená oznámení starší než 30 dní"
        >
          {cleaningUp ? "Mažu…" : "Smazat stará přečtená"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Načítám…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-slate-500 rounded-lg border border-dashed border-slate-200">
          Zatím nemáte žádná oznámení
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {items.map((n) => {
              const Icon = getIconForType(n.type);
              return (
                <li key={n.id} className="flex items-stretch">
                  <button
                    onClick={() => handleItemClick(n)}
                    className={`flex-1 flex items-start gap-4 px-4 py-3 text-left hover:bg-slate-50 transition min-w-0 cursor-pointer ${
                      !n.readAt ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        !n.readAt
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">{n.title}</div>
                      {n.body && (
                        <div className="text-sm text-slate-600 mt-0.5">
                          {n.body}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDateTime(new Date(n.createdAt))}
                      </div>
                    </div>
                    {!n.readAt && (
                      <span className="shrink-0 text-xs text-emerald-600 font-medium">
                        Nové
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, n)}
                    className="shrink-0 px-3 flex items-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Smazat"
                    aria-label="Smazat oznámení"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          {(page > 0 || hasMore) && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Předchozí
              </button>
              <span className="py-2 text-sm text-slate-600">
                Strana {page + 1} (celkem {total})
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Další →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
