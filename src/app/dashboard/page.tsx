"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { dbUtils } from "@/utils/supabase-db";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Skeleton } from "@/components/ui/Skeleton";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user.uid) return;

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

  useEffect(() => {
    // Sync tab with query param when it changes
    const qpTab = (searchParams?.get("tab") as string) || "map";
    const sanitized = allowedTabs.has(qpTab) ? qpTab : "map";
    if (sanitized !== activeTab) setActiveTab(sanitized);

    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/auth/login");
      return;
    }

    loadDashboardData();
  }, [user, authLoading, router, loadDashboardData, searchParams, activeTab]);

  // Odhlášení bude řešit dropdown v Navbaru, lokálně nepotřebné

  if (authLoading) {
    return <LoadingSpinner text="Načítání přihlášení..." />;
  }

  if (!user) {
    return <LoadingSpinner text="Přesměrování na přihlášení..." />;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="mt-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

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
