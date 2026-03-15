"use client";

import { useEffect, useState } from "react";
import { PageLoading } from "@/components/ui/PageLoading";
import { supabase } from "@/lib/supabase/client";

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

  async function getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: await getAuthHeaders(),
      });
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

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Uživatelé</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat podle emailu nebo přezdívky…"
          className="border rounded-md px-3 py-2 w-full sm:max-w-md min-w-0"
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800 shrink-0 w-full sm:w-auto"
        >
          Hledat
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[640px] w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 sm:px-4 py-2 border-b text-sm sm:text-base">Uživatel</th>
              <th className="text-left px-3 sm:px-4 py-2 border-b text-sm sm:text-base">Email</th>
              <th className="text-left px-3 sm:px-4 py-2 border-b text-sm sm:text-base">Přezdívka</th>
              <th className="text-left px-3 sm:px-4 py-2 border-b text-sm sm:text-base">Role</th>
              <th className="text-left px-3 sm:px-4 py-2 border-b text-sm sm:text-base">Vytvořen</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-4 py-2 border-b text-sm sm:text-base">
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
                <td className="px-3 sm:px-4 py-2 border-b text-sm sm:text-base">{u.email || "—"}</td>
                <td className="px-3 sm:px-4 py-2 border-b text-sm sm:text-base">{u.nickname}</td>
                <td className="px-3 sm:px-4 py-2 border-b text-sm sm:text-base">{u.role}</td>
                <td className="px-3 sm:px-4 py-2 border-b text-sm sm:text-base">
                  {new Date(u.created_at).toLocaleDateString("cs-CZ")}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 sm:px-4 py-6 text-center text-gray-500 text-sm sm:text-base">
                  Nic nenalezeno.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
