"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  isOwnProfile?: boolean;
  onToggle?: (newState: boolean) => void;
  size?: "sm" | "default";
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  isOwnProfile = false,
  onToggle,
  size = "default",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (isOwnProfile) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      // Získat access token přímo z localStorage (Supabase ukládá session tam)
      let accessToken: string | null = null;

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
            if (token) {
              accessToken = token;
              break;
            }
          } catch {}
        }
      }

      if (!accessToken) {
        throw new Error("Musíte být přihlášeni");
      }

      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se změnit sledování");
      }

      const newState = !isFollowing;
      setIsFollowing(newState);
      onToggle?.(newState);
    } catch (err: any) {
      console.error("Follow toggle error:", err);
      alert(err.message || "Nastala chyba");
    } finally {
      setLoading(false);
    }
  };

  const buttonText = isFollowing
    ? isHovered
      ? "Přestat sledovat"
      : "Sleduji"
    : "Sledovat";

  const variant = isFollowing
    ? isHovered
      ? "danger"
      : "secondary"
    : "primary";

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size === "default" ? "md" : size}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`min-w-[120px] cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
        isFollowing && isHovered
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
          : isFollowing
          ? "hover:shadow-md"
          : "hover:shadow-md hover:brightness-105"
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Načítání...
        </span>
      ) : (
        buttonText
      )}
    </Button>
  );
}
