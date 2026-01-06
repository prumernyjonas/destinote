"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type AdminComment = {
  id: string;
  article_id: string;
  author_id: string;
  body: string;
  parent_id?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

export default function AdminCommentsPage() {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getUserId(): string | null {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes("supabase") || key.includes("auth")) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed?.user?.id) {
                return parsed.user.id;
              }
            }
          } catch {}
        }
      }
    } catch {}
    return null;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userId = getUserId();
      const url = userId
        ? `/api/admin/comments?limit=100&userId=${encodeURIComponent(userId)}`
        : "/api/admin/comments?limit=100";
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Chyba načítání");
      }
      const d = await res.json();
      setItems(d.items || []);
    } catch (e: any) {
      setError(e.message || "Chyba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function removeComment(id: string) {
    const userId = getUserId();
    const url = userId
      ? `/api/admin/comments/${id}?userId=${encodeURIComponent(userId)}`
      : `/api/admin/comments/${id}`;
    await fetch(url, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Moderace komentářů</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Načítám…</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p>Žádné komentáře.</p>
          ) : (
            items.map((c) => (
              <div key={c.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-gray-600">
                    Článek: {c.article_id} • Autor: {c.author_id} • {new Date(c.created_at).toLocaleString("cs-CZ")}
                  </div>
                  <div className="truncate">{c.body}</div>
                </div>
                <div className="shrink-0">
                  <Button variant="outline" onClick={() => removeComment(c.id)}>
                    Smazat
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


