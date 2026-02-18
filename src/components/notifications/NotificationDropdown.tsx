"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import type { Notification } from "@/types/database";
import { getNotificationAuthHeaders } from "@/lib/notification-auth";

const PREVIEW_LIMIT = 5;

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

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "právě teď";
  if (mins < 60) return `před ${mins} min`;
  if (hours < 24) return `před ${hours} h`;
  if (days < 7) return `před ${days} dny`;
  return date.toLocaleDateString("cs-CZ");
}

async function fetchNotifications(limit: number, offset: number) {
  const headers = await getNotificationAuthHeaders();
  const res = await fetch(
    `/api/notifications?limit=${limit}&offset=${offset}`,
    { credentials: "include", headers }
  );
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchUnreadCount() {
  const headers = await getNotificationAuthHeaders();
  const res = await fetch("/api/notifications/unread-count", {
    credentials: "include",
    headers,
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

async function markAsRead(id: string) {
  const headers = await getNotificationAuthHeaders();
  await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
    headers,
  });
}

async function markAllAsRead() {
  const headers = await getNotificationAuthHeaders();
  await fetch("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
    headers,
  });
}

async function deleteNotification(id: string) {
  const headers = await getNotificationAuthHeaders();
  const res = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return res.ok;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  unreadCount: number;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
  unreadCount,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications(PREVIEW_LIMIT, 0)
        .then((data) => setItems(data.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));

      fetchUnreadCount().then((c) => onUnreadCountChange?.(c));
    }
  }, [isOpen, onUnreadCountChange]);

  const handleItemClick = async (n: Notification) => {
    if (!n.readAt) {
      try {
        await markAsRead(n.id);
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      } catch {}
    }
    if (n.link) {
      router.push(n.link);
    }
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, n: Notification) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await deleteNotification(n.id);
    if (ok) {
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      if (!n.readAt) onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      onUnreadCountChange?.(0);
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() }))
      );
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Oznámení</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
          >
            {markingAll ? "Označuji…" : "Označit vše jako přečtené"}
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            Načítám…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            Zatím nemáte žádná oznámení
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const Icon = getIconForType(n.type);
              return (
                <li key={n.id} className="flex items-stretch">
                  <button
                    onClick={() => handleItemClick(n)}
                    className={`flex-1 flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition min-w-0 ${
                      !n.readAt ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        !n.readAt ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-sm text-slate-600 truncate mt-0.5">
                          {n.body}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        {formatTime(new Date(n.createdAt))}
                      </div>
                    </div>
                    {!n.readAt && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, n)}
                    className="shrink-0 px-2 flex items-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Smazat"
                    aria-label="Smazat oznámení"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 p-2">
        <Link
          href="/nastaveni/oznameni"
          onClick={onClose}
          className="block w-full text-center py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Zobrazit vše
        </Link>
      </div>
    </div>
  );
}

export { fetchUnreadCount };
