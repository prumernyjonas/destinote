"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { authUtils } from "@/utils/supabase";
import { dbUtils } from "@/utils/supabase-db";
import { slugifyNickname } from "@/utils/slugify";
import { PublicProfile, Badge } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import countries from "i18n-iso-countries";
import csLocale from "i18n-iso-countries/langs/cs.json";

// Registrace českého jazyka pro i18n-iso-countries
countries.registerLocale(csLocale);
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { FollowButton } from "@/components/profile/FollowButton";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { BadgesGrid } from "@/components/dashboard/BadgesGrid";
import DashboardPublicWorldMap from "@/components/DashboardPublicWorldMap";
import Link from "next/link";
import Image from "next/image";

type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = use(params);
  const searchParams = useSearchParams();

  // Taby - jen pro vlastní profil
  const allowedTabs = new Set(["map", "articles", "badges"]);
  const qpTab = searchParams?.get("tab") || "map";
  const initialTab = allowedTabs.has(qpTab) ? qpTab : "map";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [visitedCountries, setVisitedCountries] = useState<
    Array<{ iso2: string; name: string; id: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(
    null
  );

  // Pro vlastní profil - editace
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [unvisitReq, setUnvisitReq] = useState<
    { iso2: string; nonce: number } | undefined
  >(undefined);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isLoadingRef = useRef(false);

  const isOwnProfile = user?.uid === profile?.id;

  // Přesměrovat na slugifikovanou URL, pokud nickname obsahuje háčky/čárky
  useEffect(() => {
    const slugged = slugifyNickname(decodeURIComponent(nickname));
    if (slugged !== nickname) {
      const tab = searchParams?.get("tab");
      const url = tab ? `/profil/${slugged}?tab=${tab}` : `/profil/${slugged}`;
      router.replace(url);
    }
  }, [nickname, router, searchParams]);

  const handleTabChange = useCallback(
    (tab: "map" | "articles" | "badges") => {
      setActiveTab(tab);
      const slugged = slugifyNickname(decodeURIComponent(nickname));
      router.push(`/profil/${slugged}?tab=${tab}`);
    },
    [router, nickname]
  );

  // Sync tab with query param
  useEffect(() => {
    const qpTab = searchParams?.get("tab") || "map";
    const sanitized = allowedTabs.has(qpTab) ? qpTab : "map";
    if (sanitized !== activeTab) setActiveTab(sanitized);
  }, [searchParams]);

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

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // Získat token pro autorizaci (aby API vědělo kdo se ptá)
        const accessToken = getAccessToken();
        const headers: HeadersInit = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};

        // Načíst profil
        const profileRes = await fetch(`/api/users/${nickname}`, { headers });
        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            throw new Error("Uživatel nenalezen");
          }
          const data = await profileRes.json();
          throw new Error(data.error || "Nepodařilo se načíst profil");
        }
        const profileData = await profileRes.json();
        setProfile(profileData.data);

        const userId = profileData.data.id;
        const isOwn = user?.uid === userId;

        // Načíst články - pro vlastní profil všechny, pro cizí jen approved
        const articlesUrl = isOwn
          ? `/api/articles?mine=true&userId=${userId}`
          : `/api/articles?authorId=${userId}&status=approved`;
        const articlesRes = await fetch(articlesUrl);
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData.items || []);
        }

        // Načíst navštívené země
        const visitedRes = await fetch(`/api/visited?userId=${userId}`);
        if (visitedRes.ok) {
          const visitedData = await visitedRes.json();
          setVisitedCountries(
            (visitedData.data || []).map((c: any) => ({
              iso2: c.iso2,
              name: c.name,
              id: c.id || c.country_id,
            }))
          );
        }

        // Pro vlastní profil načíst i odznaky
        if (isOwn) {
          const badgesData = await dbUtils.getBadges(userId);
          setBadges(Array.isArray(badgesData) ? badgesData : []);
        }
      } catch (err: any) {
        setError(err.message || "Nastala chyba");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }

    loadProfile();
  }, [nickname, user?.uid]);

  // Callback pro hlavní FollowButton (na cizím profilu)
  const handleFollowToggle = (newState: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowedByMe: newState,
        followersCount: newState
          ? profile.followersCount + 1
          : profile.followersCount - 1,
      });
    }
  };

  // Callback pro FollowersModal - aktualizuje počet "Sleduji"
  const handleModalFollowChange = (targetUserId: string, newState: boolean) => {
    if (profile) {
      // Pokud jsme na vlastním profilu a měníme sledování někoho v modalu
      if (isOwnProfile) {
        setProfile({
          ...profile,
          followingCount: newState
            ? profile.followingCount + 1
            : profile.followingCount - 1,
        });
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarUploading(true);
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Maximální velikost souboru je 5 MB");
      }
      setError(null);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.uid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || "";
      if (!publicUrl) throw new Error("Nepodařilo se získat URL obrázku");
      const { error: updErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, picture: publicUrl },
      });
      if (updErr) throw new Error(updErr.message);
      setAvatarOverride(publicUrl);
      if (profile) {
        setProfile({ ...profile, avatarUrl: publicUrl });
      }
      try {
        await authUtils.getCurrentUser();
      } catch {}
    } catch (err: any) {
      setError(err?.message || "Nahrání profilové fotky selhalo");
    } finally {
      setAvatarUploading(false);
      const input = document.getElementById(
        "avatar-file-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    }
  };

  const handleRemoveCountry = async (iso2: string) => {
    if (!user) return;
    try {
      // Použít API endpoint místo dbUtils pro konzistenci
      const delRes = await fetch(
        `/api/visited?iso2=${iso2}&userId=${encodeURIComponent(user.uid)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
        }
      );
      if (!delRes.ok) {
        let message = `DELETE /api/visited ${delRes.status}`;
        try {
          const j = await delRes.json();
          if (j?.error) message = j.error;
        } catch {}
        throw new Error(message);
      }
      const newVisited = visitedCountries.filter((v) => v.iso2 !== iso2);
      setVisitedCountries(newVisited);
      setUnvisitReq({ iso2, nonce: Date.now() });
      if (profile) {
        setProfile({ ...profile, countriesVisited: newVisited.length });
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se odebrat zemi");
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner text="Načítání profilu..." />;
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-8 text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h2>
            <p className="text-gray-600 mb-6">
              Profil neexistuje nebo byl odstraněn.
            </p>
            <button
              onClick={() => router.push("/community")}
              className="text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
            >
              ← Zpět na komunitu
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = avatarOverride ?? profile.avatarUrl;
  const initials = profile.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isFriend = profile.isFollowedByMe && profile.isFollowingMe;

  // Helper pro získání českého názvu země
  const getCountryNameCz = (iso2: string, fallbackName: string) => {
    const czName = countries.getName(iso2.toUpperCase(), "cs");
    return czName || fallbackName;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab navigace - jen pro vlastní profil */}
      {isOwnProfile && (
        <nav className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => handleTabChange("map")}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                  activeTab === "map"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🗺️ Mapa cest
              </button>
              <button
                onClick={() => handleTabChange("articles")}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                  activeTab === "articles"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📝 Moje články
              </button>
              <button
                onClick={() => handleTabChange("badges")}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                  activeTab === "badges"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🏆 Odznaky
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage error={error} />

        {/* Profilový header */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-start gap-6 py-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {isOwnProfile ? (
                  <button
                    type="button"
                    className="relative group cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                    title="Změnit profilovou fotku"
                    onClick={() => {
                      const input = document.getElementById(
                        "avatar-file-input"
                      ) as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile.displayName}
                        className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg transition-shadow duration-200 group-hover:shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-24 w-24 md:h-32 md:w-32 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-3xl border-4 border-white shadow-lg transition-shadow duration-200 group-hover:shadow-xl">
                        {initials || "?"}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium drop-shadow-lg">
                        Změnit
                      </span>
                    </div>
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center text-xs font-medium">
                        Nahrávám…
                      </div>
                    )}
                  </button>
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.displayName}
                    className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-3xl border-4 border-white shadow-lg">
                    {initials || "?"}
                  </div>
                )}
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {profile.displayName}
                    </h1>
                    <p className="text-gray-500">@{profile.nickname}</p>
                    {isFriend && (
                      <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Přátelé
                      </span>
                    )}
                  </div>

                  {!isOwnProfile && user && (
                    <FollowButton
                      userId={profile.id}
                      isFollowing={profile.isFollowedByMe}
                      onToggle={handleFollowToggle}
                    />
                  )}

                  {isOwnProfile && (
                    <Link
                      href="/nastaveni"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Nastavení
                    </Link>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-4 text-gray-600">{profile.bio}</p>
                )}

                {/* Statistiky */}
                <div className="flex flex-wrap gap-6 mt-6">
                  <button
                    onClick={() => setModalType("followers")}
                    className="text-center px-3 py-2 rounded-lg cursor-pointer group"
                  >
                    <div className="text-xl font-bold text-gray-900 transition-colors duration-150 group-hover:text-gray-700">
                      {profile.followersCount}
                    </div>
                    <div className="text-sm text-gray-500 transition-colors duration-150 group-hover:text-gray-700">
                      Sledujících
                    </div>
                  </button>
                  <button
                    onClick={() => setModalType("following")}
                    className="text-center px-3 py-2 rounded-lg cursor-pointer group"
                  >
                    <div className="text-xl font-bold text-gray-900 transition-colors duration-150 group-hover:text-gray-700">
                      {profile.followingCount}
                    </div>
                    <div className="text-sm text-gray-500 transition-colors duration-150 group-hover:text-gray-700">
                      Sleduji
                    </div>
                  </button>
                  <div className="text-center px-3 py-2">
                    <div className="text-xl font-bold text-emerald-600">
                      {isOwnProfile
                        ? visitedCountries.length
                        : profile.countriesVisited}
                    </div>
                    <div className="text-sm text-gray-500">Zemí</div>
                  </div>
                  <div className="text-center px-3 py-2">
                    <div className="text-xl font-bold text-gray-900">
                      {isOwnProfile ? articles.length : profile.articlesWritten}
                    </div>
                    <div className="text-sm text-gray-500">Článků</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VLASTNÍ PROFIL - zobrazení podle tabu */}
        {isOwnProfile && (
          <>
            {activeTab === "map" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Interaktivní mapa cest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardPublicWorldMap
                      userId={user!.uid}
                      unvisitRequest={unvisitReq}
                      onVisitedPreload={(list) => {
                        setVisitedCountries(list);
                        if (profile) {
                          setProfile({
                            ...profile,
                            countriesVisited: list.length,
                          });
                        }
                      }}
                      onVisitSaved={async () => {
                        try {
                          const refreshed = await dbUtils.getVisitedCountries(
                            user!.uid
                          );
                          setVisitedCountries(refreshed);
                          if (profile) {
                            setProfile({
                              ...profile,
                              countriesVisited: refreshed.length,
                            });
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Navštívené země ({visitedCountries.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitedCountries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {visitedCountries.map((country) => (
                          <span
                            key={country.iso2}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium transition-all duration-200 hover:bg-emerald-100 hover:shadow-sm"
                          >
                            <span
                              className={`fi fi-${country.iso2.toLowerCase()}`}
                            />
                            {getCountryNameCz(country.iso2, country.name)}
                            <button
                              onClick={() => handleRemoveCountry(country.iso2)}
                              className="ml-1 opacity-0 group-hover:opacity-100 text-emerald-500 hover:text-red-500 transition-all duration-200 cursor-pointer hover:scale-125 active:scale-90"
                              title="Odebrat"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Zatím jste nenavštívili žádnou zemi. Klikněte na mapu
                        pro přidání!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "articles" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>📝 Moje články ({articles.length})</CardTitle>
                    <Link
                      href="/clanek/novy"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      + Nový článek
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {articles.length > 0 ? (
                    <div className="space-y-3">
                      {articles.map((article) => (
                        <Link
                          key={article.id}
                          href={
                            article.status === "draft"
                              ? `/clanek/${article.slug}/upravit`
                              : `/clanek/${article.slug}`
                          }
                          className="flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {article.main_image_url ? (
                            <Image
                              src={article.main_image_url}
                              alt={article.main_image_alt || article.title}
                              width={80}
                              height={60}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-2xl">📝</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  article.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : article.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : article.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {article.status === "approved"
                                  ? "Schváleno"
                                  : article.status === "pending"
                                  ? "Čeká na schválení"
                                  : article.status === "rejected"
                                  ? "Zamítnuto"
                                  : "Koncept"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">Zatím nemáte žádné články.</p>
                      <Link
                        href="/clanek/novy"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Napsat první článek →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "badges" && (
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Odznaky</CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgesGrid badges={badges} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* CIZÍ PROFIL - všechno najednou */}
        {!isOwnProfile && (
          <>
            {/* Navštívené země */}
            {visitedCountries.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Navštívené země ({visitedCountries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {visitedCountries.map((country) => (
                      <span
                        key={country.iso2}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
                      >
                        <span
                          className={`fi fi-${country.iso2.toLowerCase()}`}
                        />
                        {getCountryNameCz(country.iso2, country.name)}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Články */}
            {articles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Články ({articles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/clanek/${article.slug}`}
                        className="group"
                      >
                        <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {article.main_image_url ? (
                            <div className="relative w-full h-40 bg-gray-200">
                              <Image
                                src={article.main_image_url}
                                alt={article.main_image_alt || article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-4xl">📝</span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                              {article.title}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {articles.length === 0 && visitedCountries.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <span className="text-6xl mb-4 block">🌍</span>
                  <p>Tento uživatel zatím nemá žádný cestovatelský obsah.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Modal pro seznam sledujících/sledovaných */}
      <FollowersModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        userId={profile.id}
        type={modalType || "followers"}
        title={modalType === "followers" ? "Sledující" : "Sleduji"}
        currentUserId={user?.uid}
        onFollowChange={handleModalFollowChange}
      />
    </div>
  );
}
