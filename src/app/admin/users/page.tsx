"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string | null;
  nickname: string;
  role: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
      const url = new URL("/api/admin/users", window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      const userId = getUserId();
      if (userId) url.searchParams.set("userId", userId);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Chyba načítání uživatelů");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Uživatelé</h1>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat podle emailu nebo přezdívky…"
          className="border rounded-md px-3 py-2 w-full max-w-md"
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800"
        >
          Hledat
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Načítám…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 border-b">Uživatel</th>
                <th className="text-left px-4 py-2 border-b">Email</th>
                <th className="text-left px-4 py-2 border-b">Přezdívka</th>
                <th className="text-left px-4 py-2 border-b">Role</th>
                <th className="text-left px-4 py-2 border-b">Vytvořen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          alt={u.nickname || u.email || u.id}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                          {u.nickname?.charAt(0)?.toUpperCase() ||
                            u.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </div>
                      )}
                      <div className="truncate max-w-[220px]">{u.id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">{u.email || "—"}</td>
                  <td className="px-4 py-2 border-b">{u.nickname}</td>
                  <td className="px-4 py-2 border-b">{u.role}</td>
                  <td className="px-4 py-2 border-b">
                    {new Date(u.created_at).toLocaleDateString("cs-CZ")}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nic nenalezeno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


