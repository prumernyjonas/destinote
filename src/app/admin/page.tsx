"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import ClientAdminGate from "@/app/admin/ClientAdminGate";

type AdminArticle = {
  id: string;
  author_id: string;
  title: string;
  status: string;
  created_at: string;
  published_at?: string | null;
  main_image_url?: string | null;
};

type AdminUser = {
  id: string;
  email: string | null;
  nickname: string;
  role: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
};

type AdminComment = {
  id: string;
  article_id: string;
  author_id: string;
  body: string;
  parent_id?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

function AdminDashboard() {
  const [pendingArticles, setPendingArticles] = useState<AdminArticle[]>([]);
  const [approvedArticles, setApprovedArticles] = useState<AdminArticle[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");

  function getUserId(): string | null {
    try {
      const keys = Object.keys(localStorage);
      console.log(
        "[AdminDashboard] Searching localStorage, keys:",
        keys.length
      );
      for (const key of keys) {
        if (key.includes("supabase") || key.includes("auth")) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed?.user?.id) {
                console.log("[AdminDashboard] Found userId in key:", key);
                return parsed.user.id;
              }
            }
          } catch (e) {
            console.warn("[AdminDashboard] Error parsing key:", key, e);
          }
        }
      }
      console.warn("[AdminDashboard] No userId found in localStorage");
    } catch (e) {
      console.error("[AdminDashboard] Error accessing localStorage:", e);
    }
    return null;
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error("Uživatel není přihlášen");
      }

      // Sestavíme URL s userId jako query parametr
      const buildUrl = (base: string, params: Record<string, string> = {}) => {
        const url = new URL(base, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
        url.searchParams.set("userId", userId);
        return url.toString();
      };

      const urls = {
        pending: buildUrl("/api/admin/articles", { status: "pending" }),
        approved: buildUrl("/api/admin/articles", { status: "approved" }),
        users: buildUrl("/api/admin/users", { limit: "50" }),
        comments: buildUrl("/api/admin/comments", { limit: "50" }),
      };
      console.log("[AdminDashboard] Fetching with userId:", userId);
      console.log("[AdminDashboard] URLs:", urls);

      const [resPending, resApproved, resUsers, resComments] =
        await Promise.all([
          fetch(urls.pending),
          fetch(urls.approved),
          fetch(urls.users),
          fetch(urls.comments),
        ]);

      console.log("[AdminDashboard] Response statuses:", {
        pending: resPending.status,
        approved: resApproved.status,
        users: resUsers.status,
        comments: resComments.status,
      });

      if (
        !resPending.ok ||
        !resApproved.ok ||
        !resUsers.ok ||
        !resComments.ok
      ) {
        const errors = await Promise.all([
          resPending.ok ? null : resPending.text().catch(() => "Unknown error"),
          resApproved.ok
            ? null
            : resApproved.text().catch(() => "Unknown error"),
          resUsers.ok ? null : resUsers.text().catch(() => "Unknown error"),
          resComments.ok
            ? null
            : resComments.text().catch(() => "Unknown error"),
        ]);
        console.error("[AdminDashboard] API errors:", errors);
        throw new Error("Chyba načítání dat - zkontroluj konzoli");
      }

      const [dPending, dApproved, dUsers, dComments] = await Promise.all([
        resPending.json(),
        resApproved.json(),
        resUsers.json(),
        resComments.json(),
      ]);

      setPendingArticles(dPending.items || []);
      setApprovedArticles(dApproved.items || []);
      setUsers(dUsers.items || []);
      setComments(dComments.items || []);
    } catch (e: any) {
      setError(e.message || "Chyba načítání dat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approveArticle(id: string) {
    const userId = getUserId();
    const url = userId
      ? `/api/admin/articles/${id}/approve?userId=${encodeURIComponent(userId)}`
      : `/api/admin/articles/${id}/approve`;
    await fetch(url, { method: "POST" });
    loadAll();
  }

  async function rejectArticle(id: string) {
    const reason = prompt("Důvod zamítnutí (volitelné):") || "";
    const userId = getUserId();
    const url = userId
      ? `/api/admin/articles/${id}/reject?userId=${encodeURIComponent(userId)}`
      : `/api/admin/articles/${id}/reject`;
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    loadAll();
  }

  async function removeComment(id: string) {
    const userId = getUserId();
    const url = userId
      ? `/api/admin/comments/${id}?userId=${encodeURIComponent(userId)}`
      : `/api/admin/comments/${id}`;
    await fetch(url, { method: "DELETE" });
    loadAll();
  }

  async function searchUsers() {
    setLoading(true);
    setError(null);
    try {
      const userId = getUserId();
      const url = new URL("/api/admin/users", window.location.origin);
      if (userQuery.trim()) url.searchParams.set("q", userQuery.trim());
      if (userId) url.searchParams.set("userId", userId);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Chyba načítání uživatelů");
      }
      const d = await res.json();
      setUsers(d.items || []);
    } catch (e: any) {
      setError(e.message || "Chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Přehled všech sekcí administrace na jedné stránce
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Načítám data…</div>
        </div>
      ) : (
        <>
          {/* Články čekající ke schválení */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Články čekající ke schválení
              </h2>
              <div className="text-sm text-gray-600">
                {pendingArticles.length} článků
              </div>
            </div>
            {pendingArticles.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
                Žádné články ke schválení
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingArticles.map((a) => {
                  const isRejected = a.status === "rejected";
                  return (
                    <div
                      key={a.id}
                      className={`border rounded-lg bg-white shadow-sm overflow-hidden flex flex-col ${
                        isRejected ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        {a.main_image_url ? (
                          <img
                            src={a.main_image_url}
                            alt={a.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Bez obrázku
                          </span>
                        )}
                        {isRejected && (
                          <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                            Zamítnuto
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div>
                          <div className="text-xs text-gray-500">
                            {new Date(a.created_at).toLocaleDateString("cs-CZ")}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                            {a.title}
                          </h3>
                          <div className="text-xs text-gray-500 mt-1">
                            Autor: {a.author_id.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <Button
                            variant="outline"
                            onClick={() => rejectArticle(a.id)}
                            className="text-sm w-full cursor-pointer"
                            disabled={isRejected}
                          >
                            Zamítnout
                          </Button>
                          <Button
                            onClick={() => approveArticle(a.id)}
                            className="text-sm w-full cursor-pointer"
                            disabled={isRejected}
                          >
                            Schválit
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Schválené články */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Schválené články</h2>
              <div className="text-sm text-gray-600">
                {approvedArticles.length} článků
              </div>
            </div>
            {approvedArticles.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
                Žádné schválené články
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Název
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Autor ID
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Publikováno
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedArticles.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 border-b">
                          <td className="px-4 py-3">{a.title}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {a.author_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {new Date(
                              a.published_at || a.created_at
                            ).toLocaleDateString("cs-CZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Uživatelé */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Uživatelé</h2>
              <div className="text-sm text-gray-600">
                {users.length} uživatelů
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Hledat podle emailu nebo přezdívky…"
                className="border rounded-md px-3 py-2 flex-1 max-w-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchUsers();
                }}
              />
              <Button onClick={searchUsers} className="cursor-pointer">
                Hledat
              </Button>
              <Button
                variant="outline"
                onClick={loadAll}
                className="cursor-pointer"
              >
                Obnovit vše
              </Button>
            </div>
            {users.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
                Žádní uživatelé
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Uživatel
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Přezdívka
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 border-b font-medium">
                          Vytvořen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 border-b">
                          <td className="px-4 py-3">
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
                              <div className="text-sm text-gray-600 truncate max-w-[200px]">
                                {u.id.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{u.email || "—"}</td>
                          <td className="px-4 py-3">{u.nickname}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : u.role === "moderator"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {new Date(u.created_at).toLocaleDateString("cs-CZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Komentáře */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Komentáře</h2>
              <div className="text-sm text-gray-600">
                {comments.length} komentářů
              </div>
            </div>
            {comments.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
                Žádné komentáře
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border rounded-lg p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 mb-2">
                        Článek: {c.article_id.substring(0, 8)}... • Autor:{" "}
                        {c.author_id.substring(0, 8)}... •{" "}
                        {new Date(c.created_at).toLocaleString("cs-CZ")}
                      </div>
                      <div className="text-gray-900">{c.body}</div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => removeComment(c.id)}
                        className="text-sm cursor-pointer"
                      >
                        Smazat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ClientAdminGate>
      <AdminDashboard />
    </ClientAdminGate>
  );
}
