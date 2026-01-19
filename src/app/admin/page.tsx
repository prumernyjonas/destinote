"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import ClientAdminGate from "@/app/admin/ClientAdminGate";
import PendingArticleCard from "@/components/admin/PendingArticleCard";
import ArticleReviewDrawer from "@/components/admin/ArticleReviewDrawer";
import UserDetailPanel from "@/components/admin/UserDetailPanel";

type AdminArticle = {
  id: string;
  author_id: string;
  title: string;
  status: string;
  created_at: string;
  published_at?: string | null;
  main_image_url?: string | null;
  summary?: string | null;
  content?: string | null;
  destination?: string | null;
  approved_by?: string | null;
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

function AdminDashboard() {
  const [pendingArticles, setPendingArticles] = useState<AdminArticle[]>([]);
  const [approvedArticles, setApprovedArticles] = useState<AdminArticle[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<(AdminArticle & { authorNickname?: string; approvedByNickname?: string }) | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Map userId -> nickname
  const userNicknameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.nickname);
    });
    return map;
  }, [users]);

  // Enrich articles with nicknames
  const enrichedPendingArticles = useMemo(() => {
    return pendingArticles.map((a) => ({
      ...a,
      authorNickname: userNicknameMap.get(a.author_id),
    }));
  }, [pendingArticles, userNicknameMap]);

  const enrichedApprovedArticles = useMemo(() => {
    return approvedArticles.map((a) => ({
      ...a,
      authorNickname: userNicknameMap.get(a.author_id),
      approvedByNickname: a.approved_by ? userNicknameMap.get(a.approved_by) : undefined,
    }));
  }, [approvedArticles, userNicknameMap]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (userQuery.trim()) {
      const q = userQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nickname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    return filtered;
  }, [users, userQuery, roleFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    // Dnes schváleno podle Europe/Prague timezone
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Prague" }));
    const todayStart = new Date(pragueTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayApproved = approvedArticles.filter((a) => {
      if (!a.published_at) return false;
      const pubDate = new Date(a.published_at);
      // Převést na Prague timezone pro porovnání
      const pubPragueTime = new Date(pubDate.toLocaleString("en-US", { timeZone: "Europe/Prague" }));
      return pubPragueTime >= todayStart && pubPragueTime <= todayEnd;
    }).length;
    
    return {
      pending: pendingArticles.length,
      approved: approvedArticles.length,
      users: users.length,
      todayApproved,
    };
  }, [pendingArticles, approvedArticles, users]);

  // Filtered approved articles
  const filteredApprovedArticles = useMemo(() => {
    if (!articleSearchQuery.trim()) return enrichedApprovedArticles;
    const q = articleSearchQuery.toLowerCase();
    return enrichedApprovedArticles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.authorNickname?.toLowerCase().includes(q) ||
        a.destination?.toLowerCase().includes(q)
    );
  }, [enrichedApprovedArticles, articleSearchQuery]);

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
          } catch (e) {
            // Ignore
          }
        }
      }
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
        users: buildUrl("/api/admin/users", { limit: "100" }),
      };

      const [resPending, resApproved, resUsers] = await Promise.all([
        fetch(urls.pending),
        fetch(urls.approved),
        fetch(urls.users),
      ]);

      if (!resPending.ok || !resApproved.ok || !resUsers.ok) {
        throw new Error("Chyba načítání dat");
      }

      const [dPending, dApproved, dUsers] = await Promise.all([
        resPending.json(),
        resApproved.json(),
        resUsers.json(),
      ]);

      setPendingArticles(dPending.items || []);
      setApprovedArticles(dApproved.items || []);
      setUsers(dUsers.items || []);
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
    setIsProcessing(true);
    try {
      const userId = getUserId();
      const url = userId
        ? `/api/admin/articles/${id}/approve?userId=${encodeURIComponent(userId)}`
        : `/api/admin/articles/${id}/approve`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Chyba při schvalování");
      }
      await loadAll();
    } catch (e: any) {
      setError(e.message || "Chyba při schvalování");
    } finally {
      setIsProcessing(false);
    }
  }

  async function rejectArticle(id: string, reason?: string) {
    setIsProcessing(true);
    try {
      const userId = getUserId();
      const url = userId
        ? `/api/admin/articles/${id}/reject?userId=${encodeURIComponent(userId)}`
        : `/api/admin/articles/${id}/reject`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Chyba při zamítání");
      }
      await loadAll();
    } catch (e: any) {
      setError(e.message || "Chyba při zamítání");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleArticleClick = (article: AdminArticle & { authorNickname?: string; approvedByNickname?: string }, readOnly = false) => {
    setSelectedArticle({
      ...article,
      authorNickname: userNicknameMap.get(article.author_id),
      approvedByNickname: article.approved_by ? userNicknameMap.get(article.approved_by) : undefined,
    });
    setIsReadOnly(readOnly);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedArticle(null);
    setIsReadOnly(false);
  };

  const handleUserClick = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserPanelOpen(true);
  };

  const handleUserPanelClose = () => {
    setIsUserPanelOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen relative">
      {/* Dark blue background gradient */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, rgb(15, 30, 75) 0%, rgb(28, 57, 142) 50%, rgb(20, 40, 100) 100%)',
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-base text-white/80">
            Správa článků a uživatelů platformy
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-2xl p-4 text-red-200 text-sm backdrop-blur">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white/80">Načítám data…</div>
          </div>
        ) : (
          <>
            {/* KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-6">
                <div className="text-sm text-slate-600 mb-1">Čekající články</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {kpis.pending}
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-6">
                <div className="text-sm text-slate-600 mb-1">Schválené články</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {kpis.approved}
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-6">
                <div className="text-sm text-slate-600 mb-1">Uživatelé</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {kpis.users}
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-6">
                <div className="text-sm text-slate-600 mb-1">Dnes schváleno</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {kpis.todayApproved}
                </div>
              </div>
            </div>

            {/* Pending Articles Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Články čekající na schválení
                </h2>
                <span className="text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full">
                  {pendingArticles.length} článků
                </span>
              </div>
              {pendingArticles.length === 0 ? (
                <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-8 text-center text-slate-500">
                  Žádné články ke schválení
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrichedPendingArticles.map((article) => (
                    <PendingArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleClick(article, false)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Approved Articles + Users - 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Approved Articles - 7/12 */}
              <section className="lg:col-span-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Schválené články
                  </h2>
                  <span className="text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full">
                    {filteredApprovedArticles.length} z {approvedArticles.length} článků
                  </span>
                </div>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={articleSearchQuery}
                    onChange={(e) => setArticleSearchQuery(e.target.value)}
                    placeholder="Hledat podle názvu, autora nebo destinace..."
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/95 backdrop-blur text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-sm"
                  />
                </div>

                {filteredApprovedArticles.length === 0 ? (
                  <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-8 text-center text-slate-500">
                    {articleSearchQuery ? "Žádné články neodpovídají vyhledávání" : "Žádné schválené články"}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/15 overflow-hidden bg-white/95 backdrop-blur shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Název
                            </th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Autor
                            </th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Schválil
                            </th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Publikováno
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50">
                          {filteredApprovedArticles.map((a) => (
                            <tr
                              key={a.id}
                              onClick={() => handleArticleClick(a, true)}
                              className="hover:bg-black/5 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-slate-900 truncate max-w-xs font-medium">
                                {a.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 truncate">
                                {a.authorNickname || a.author_id.substring(0, 8) + "..."}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 truncate">
                                {a.approvedByNickname || (a.approved_by ? a.approved_by.substring(0, 8) + "..." : "—")}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
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

              {/* Users - 5/12 */}
              <section className="lg:col-span-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Uživatelé</h2>
                  <span className="text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full">
                    {filteredUsers.length} z {users.length} uživatelů
                  </span>
                </div>

                {/* Search and filters */}
                <div className="mb-4 space-y-3">
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Hledat podle nickname nebo emailu…"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/95 backdrop-blur text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-sm"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 bg-white/95 backdrop-blur text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 shadow-sm"
                    >
                      <option value="all">Všechny role</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={loadAll}
                      className="cursor-pointer"
                      title="Obnovit"
                    >
                      ↻
                    </Button>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-xl p-8 text-center text-slate-500">
                    Žádní uživatelé
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/15 overflow-hidden bg-white/95 backdrop-blur shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Nickname
                            </th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Role
                            </th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 font-medium">
                              Vytvořen
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50">
                          {filteredUsers.map((u) => (
                            <tr
                              key={u.id}
                              onClick={() => handleUserClick(u)}
                              className="hover:bg-black/5 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-slate-900">
                                  {u.nickname}
                                </div>
                                {u.email && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {u.email}
                                  </div>
                                )}
                              </td>
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
                              <td className="px-4 py-3 text-sm text-slate-600">
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
            </div>
          </>
        )}
      </main>

      {/* Article Review Drawer */}
      <ArticleReviewDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        article={selectedArticle}
        onApprove={approveArticle}
        onReject={rejectArticle}
        isProcessing={isProcessing}
        readOnly={isReadOnly}
      />

      {/* User Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          isOpen={isUserPanelOpen}
          onClose={handleUserPanelClose}
          user={selectedUser}
        />
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
