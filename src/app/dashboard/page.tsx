"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { authUtils } from "@/utils/supabase";
import { dbUtils } from "@/utils/supabase-db";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import DashboardPublicWorldMap from "@/components/DashboardPublicWorldMap";
import { UserStats, Article, Badge } from "@/types/database";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ArticlesList } from "@/components/dashboard/ArticlesList";
import { BadgesGrid } from "@/components/dashboard/BadgesGrid";
import { VisitedCountriesList } from "@/components/dashboard/VisitedCountriesList";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const allowedTabs = new Set(["map", "articles", "badges"]);
  const qp = (searchParams?.get("tab") as string) || "map";
  const initialTab = allowedTabs.has(qp) ? qp : "map";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [visited, setVisited] = useState<
    Array<{ iso2: string; name: string; id: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [unvisitReq, setUnvisitReq] = useState<
    { iso2: string; nonce: number } | undefined
  >(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);

  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      if (!user || !user.uid) return;
      setLoading(true);

      const [userStats, userArticles, userBadges, visitedCountries] =
        await Promise.all([
          dbUtils.getUserStats(user.uid),
          dbUtils.getArticles(),
          dbUtils.getBadges(user.uid),
          dbUtils.getVisitedCountries(user.uid),
        ]);

      setStats(userStats);
      setArticles(
        userArticles.filter((article) => article.authorId === user.uid)
      );
      setBadges(userBadges);
      setVisited(visitedCountries);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 1) Sync tab with query param when it changes
  useEffect(() => {
    const qpTab = (searchParams?.get("tab") as string) || "map";
    const sanitized = allowedTabs.has(qpTab) ? qpTab : "map";
    if (sanitized !== activeTab) setActiveTab(sanitized);
  }, [searchParams, activeTab]);

  // 2) Načtení dat po mountu a jakmile je k dispozici uživatel
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    loadDashboardData();
  }, [mounted, user, activeTab, loadDashboardData, router]);

  // Odhlášení bude řešit dropdown v Navbaru, lokálně nepotřebné

  // Stabilizace hydratace: před mountem vrať stejný obsah jako SSR (loader)
  if (!mounted) return null;

  if (!user) {
    return <LoadingSpinner text="Přesměrování na přihlášení..." />;
  }

  // UI se rendruje i během načítání dat; jednotlivé sekce pracují s prázdnými hodnotami
  const displayName = user.displayName || user.email || "Uživatel";
  const avatarUrl = (avatarOverride ?? user.photoURL) || "";
  const followers = stats?.followers ?? 0;
  const following = stats?.following ?? 0;
  const visitedCount = visited.length;
  const initials = displayName
    .split(" ")
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("map")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "map"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Mapa cest
              </button>
              <button
                onClick={() => setActiveTab("articles")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "articles"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Moje články
              </button>
              <button
                onClick={() => setActiveTab("badges")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "badges"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Odznaky
              </button>
              {/* Sociální síť tab odstraněn – existuje samostatná stránka /community */}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage error={error} />

          {activeTab === "map" && (
            <div className="space-y-6">
              {/* Profilový header */}
              <Card>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="relative group"
                        title="Změnit profilovou fotku"
                        onClick={() => {
                          const input = document.getElementById(
                            "avatar-file-input"
                          ) as HTMLInputElement | null;
                          input?.click();
                        }}
                      >
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-16 w-16 rounded-full object-cover border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold border border-gray-200">
                            {initials || "U"}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        {avatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center text-xs font-medium">
                            Nahrávám…
                          </div>
                        )}
                      </button>
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          try {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setAvatarUploading(true);
                            if (file.size > 5 * 1024 * 1024) {
                              throw new Error(
                                "Maximální velikost souboru je 5 MB"
                              );
                            }
                            setError(null);
                            const ext = (
                              file.name.split(".").pop() || "jpg"
                            ).toLowerCase();
                            const path = `${user.uid}/${Date.now()}.${ext}`;
                            const { error: upErr } = await supabase.storage
                              .from("avatars")
                              .upload(path, file, {
                                upsert: true,
                                cacheControl: "3600",
                              });
                            if (upErr) throw new Error(upErr.message);
                            const { data: pub } = supabase.storage
                              .from("avatars")
                              .getPublicUrl(path);
                            const publicUrl = pub?.publicUrl || "";
                            if (!publicUrl)
                              throw new Error(
                                "Nepodařilo se získat URL obrázku"
                              );
                            const { error: updErr } =
                              await supabase.auth.updateUser({
                                data: {
                                  avatar_url: publicUrl,
                                  picture: publicUrl,
                                },
                              });
                            if (updErr) throw new Error(updErr.message);
                            setAvatarOverride(publicUrl);
                            try {
                              await authUtils.getCurrentUser();
                            } catch {}
                          } catch (err: any) {
                            setError(
                              err?.message || "Nahrání profilové fotky selhalo"
                            );
                          } finally {
                            setAvatarUploading(false);
                            const input = document.getElementById(
                              "avatar-file-input"
                            ) as HTMLInputElement | null;
                            if (input) input.value = "";
                          }
                        }}
                      />
                      <div>
                        <div className="text-lg md:text-xl font-semibold text-gray-900">
                          {displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Objeveno zemí:{" "}
                          <span className="font-medium text-emerald-600">
                            {visitedCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-base font-semibold text-gray-900">
                          {followers}
                        </div>
                        <div className="text-xs text-gray-500">Sledující</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-semibold text-gray-900">
                          {following}
                        </div>
                        <div className="text-xs text-gray-500">Sleduje</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <StatsCards stats={stats} />
              <Card>
                <CardHeader>
                  <CardTitle>{displayName} – Interaktivní mapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardPublicWorldMap
                    userId={user.uid}
                    unvisitRequest={unvisitReq}
                    onVisitSaved={async () => {
                      try {
                        const refreshed = await dbUtils.getVisitedCountries(
                          user.uid
                        );
                        setVisited(refreshed);
                      } catch (e) {
                        console.error(e);
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Nepodařilo se načíst navštívené země"
                        );
                      }
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Navštívené země{" "}
                    {visited.length > 0 ? `(${visited.length})` : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VisitedCountriesList
                    countries={visited.map(({ iso2, name }) => ({
                      iso2,
                      name,
                    }))}
                    onRemove={async (iso2) => {
                      try {
                        await dbUtils.removeVisitIso(user.uid, iso2);
                        setVisited((prev) =>
                          prev.filter((v) => v.iso2 !== iso2)
                        );
                        setUnvisitReq({ iso2, nonce: Date.now() });
                      } catch (e) {
                        console.error(e);
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Nepodařilo se odebrat zemi"
                        );
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "articles" && (
            <div className="space-y-6">
              <ArticlesList articles={articles} />
            </div>
          )}

          {activeTab === "badges" && (
            <div className="space-y-6">
              <BadgesGrid badges={badges} />
            </div>
          )}

          {/* Sociální obsah odstraněn */}
        </main>
      </div>
    </Suspense>
  );
}
