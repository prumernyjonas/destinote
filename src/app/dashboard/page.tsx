"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { dbUtils } from "@/utils/supabase-db";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import VectorWorldMap from "@/components/VectorWorldMap";
import { UserStats, Article, Badge } from "@/types/database";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ArticlesList } from "@/components/dashboard/ArticlesList";
import { BadgesGrid } from "@/components/dashboard/BadgesGrid";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const allowedTabs = new Set(["map", "articles", "badges"]);
  const qp = (searchParams?.get("tab") as string) || "map";
  const initialTab = allowedTabs.has(qp) ? qp : "map";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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

      const [userStats, userArticles, userBadges] = await Promise.all([
        dbUtils.getUserStats(user.uid),
        dbUtils.getArticles(),
        dbUtils.getBadges(user.uid),
      ]);

      setStats(userStats);
      setArticles(
        userArticles.filter((article) => article.authorId === user.uid)
      );
      setBadges(userBadges);
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
  if (!mounted || authLoading) {
    return <LoadingSpinner text="Načítání přihlášení..." />;
  }

  if (!user) {
    return <LoadingSpinner text="Přesměrování na přihlášení..." />;
  }

  // UI se rendruje i během načítání dat; jednotlivé sekce pracují s prázdnými hodnotami

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
              <StatsCards stats={stats} />
              <Card>
                <CardHeader>
                  <CardTitle>Interaktivní mapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <VectorWorldMap userId={user.uid} />
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
