"use client";

import { useState, useEffect } from "react";
import { FollowListItem } from "@/types/database";
import { FollowButton } from "./FollowButton";
import { slugifyNickname } from "@/utils/slugify";
import Link from "next/link";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  title: string;
  currentUserId?: string | null;
  onFollowChange?: (targetUserId: string, newState: boolean) => void;
}

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  type,
  title,
  currentUserId,
  onFollowChange,
}: FollowersModalProps) {
  const [items, setItems] = useState<FollowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper pro získání access tokenu z localStorage
  const getAccessToken = (): string | null => {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const value = JSON.parse(raw);
          const token =
            value?.access_token ||
            value?.currentSession?.access_token ||
            value?.session?.access_token;
          if (token) return token;
        } catch {}
      }
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const accessToken = getAccessToken();
        const headers: HeadersInit = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};

        const res = await fetch(`/api/users/${userId}/${type}`, { headers });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Nepodařilo se načíst seznam");
        }
        const data = await res.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || "Nastala chyba");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  const handleFollowToggle = (itemId: string, newState: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isFollowedByMe: newState } : item
      )
    );
    // Informovat rodiče o změně
    onFollowChange?.(itemId, newState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer hover:rotate-90 active:scale-90"
          >
            <svg
              className="w-5 h-5 text-gray-500 transition-colors duration-200 hover:text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {type === "followers"
                ? "Zatím žádní sledující"
                : "Zatím nikoho nesleduje"}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all duration-200"
                >
                  <Link
                    href={`/profil/${slugifyNickname(item.nickname)}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                  >
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.avatarUrl}
                        alt={item.displayName}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-medium text-sm border border-gray-200">
                        {item.displayName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate transition-colors duration-200 group-hover:text-emerald-600">
                        {item.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate transition-colors duration-200 group-hover:text-gray-600">
                        @{item.nickname}
                      </p>
                    </div>
                  </Link>

                  {currentUserId && currentUserId !== item.id && (
                    <FollowButton
                      userId={item.id}
                      isFollowing={item.isFollowedByMe}
                      size="sm"
                      onToggle={(newState) =>
                        handleFollowToggle(item.id, newState)
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
