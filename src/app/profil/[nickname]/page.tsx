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
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ArticleList from "@/components/profile/ArticleList";
import Link from "next/link";
import Image from "next/image";
import { FiMap, FiFileText, FiAward } from "react-icons/fi";

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
  const [activeTab, setActiveTab] = useState<"map" | "articles" | "badges">(
    initialTab as "map" | "articles" | "badges",
  );

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [visitedCountries, setVisitedCountries] = useState<
    Array<{ iso2: string; name: string; id: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeoutError, setShowTimeoutError] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(
    null,
  );
  const [deleteModal, setDeleteModal] = useState<{
    articleId: string;
    articleTitle: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pro vlastní profil - editace
  const [unvisitReq, setUnvisitReq] = useState<
    { iso2: string; nonce: number } | undefined
  >(undefined);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isLoadingRef = useRef(false);

  const isOwnProfile = user?.uid === profile?.id;

  // Přesměrovat z UUID na slug, pokud je parametr UUID a máme načtený profil
  useEffect(() => {
    const decodedNickname = decodeURIComponent(nickname);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedNickname,
      );

    if (isUuid && profile) {
      // Pokud máme profil načtený a parametr je UUID, přesměrujeme na slug
      const slugged = slugifyNickname(profile.nickname);
      const tab = searchParams?.get("tab");
      const url = tab ? `/profil/${slugged}?tab=${tab}` : `/profil/${slugged}`;
      router.replace(url);
    }
  }, [nickname, profile, router, searchParams]);

  // Přesměrovat na slugifikovanou URL, pokud nickname obsahuje háčky/čárky
  useEffect(() => {
    const decodedNickname = decodeURIComponent(nickname);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedNickname,
      );

    // Přesměrovat jen pokud to není UUID (UUID se řeší v jiném useEffect)
    if (!isUuid) {
      const slugged = slugifyNickname(decodedNickname);
      if (slugged !== nickname) {
        const tab = searchParams?.get("tab");
        const url = tab
          ? `/profil/${slugged}?tab=${tab}`
          : `/profil/${slugged}`;
        router.replace(url);
      }
    }
  }, [nickname, router, searchParams]);

  const handleTabChange = useCallback(
    (tab: "map" | "articles" | "badges") => {
      const slugged = slugifyNickname(decodeURIComponent(nickname));
      router.push(`/profil/${slugged}?tab=${tab}`, { scroll: false });
    },
    [router, nickname],
  );

  // Sync tab with query param
  useEffect(() => {
    const qpTab = searchParams?.get("tab") || "map";
    if (allowedTabs.has(qpTab)) {
      const sanitized = qpTab as "map" | "articles" | "badges";
      if (sanitized !== activeTab) {
        setActiveTab(sanitized);
      }
    } else if (activeTab !== "map") {
      setActiveTab("map");
    }
  }, [searchParams]);

  // Při otevření záložky Odznaky znovu načíst odznaky (vlastní profil), aby se projevily nové záznamy
  useEffect(() => {
    if (activeTab !== "badges" || !isOwnProfile || !profile?.id) return;
    dbUtils
      .getBadges(profile.id)
      .then((badgesData) => setBadges(Array.isArray(badgesData) ? badgesData : []))
      .catch((err) => console.error("[ProfilePage] Chyba při načítání odznaků:", err));
  }, [activeTab, isOwnProfile, profile?.id]);

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

      // Timeout pro zajištění, že se loading vždy ukončí
      const timeoutId = setTimeout(() => {
        if (isLoadingRef.current) {
          console.warn("[ProfilePage] Timeout při načítání profilu");
          setLoading(false);
          isLoadingRef.current = false;
          if (!profile) {
            setError(
              "Načítání profilu trvalo příliš dlouho. Zkuste to prosím znovu.",
            );
          }
        }
      }, 15000); // 15 sekund timeout

      try {
        // Získat token pro autorizaci (aby API vědělo kdo se ptá)
        const accessToken = getAccessToken();
        const headers: HeadersInit = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};

        // Načíst profil s timeoutem
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 10000); // 10 sekund timeout pro fetch

        let profileRes: Response;
        try {
          profileRes = await fetch(`/api/users/${nickname}`, {
            headers,
            signal: controller.signal,
          });
          clearTimeout(fetchTimeout);
        } catch (fetchErr: any) {
          clearTimeout(fetchTimeout);
          if (fetchErr.name === "AbortError") {
            throw new Error("Načítání profilu trvalo příliš dlouho");
          }
          throw fetchErr;
        }

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
        // Zkontrolovat, jestli je to vlastní profil (i když user může být null)
        const isOwn = user?.uid === userId;

        // Načíst články - pro vlastní profil všechny, pro cizí jen approved (neblokující)
        const articlesUrl = isOwn
          ? `/api/articles?mine=true&userId=${userId}`
          : `/api/articles?authorId=${userId}&status=approved`;
        fetch(articlesUrl)
          .then((res) => (res.ok ? res.json() : null))
          .then((articlesData) => {
            if (articlesData?.items) {
              setArticles(articlesData.items);
            }
          })
          .catch((err) =>
            console.error("[ProfilePage] Chyba při načítání článků:", err),
          );

        // Načíst navštívené země (neblokující)
        fetch(`/api/visited?userId=${userId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((visitedData) => {
            if (visitedData?.data) {
              setVisitedCountries(
                visitedData.data.map((c: any) => ({
                  iso2: c.iso2,
                  name: c.name,
                  id: c.id || c.country_id,
                })),
              );
            }
          })
          .catch((err) =>
            console.error("[ProfilePage] Chyba při načítání zemí:", err),
          );

        // Načíst odznaky pro tento profil (vlastní i cizí – zobrazení na public profilu)
        dbUtils
          .getBadges(userId)
          .then((badgesData) => {
            setBadges(Array.isArray(badgesData) ? badgesData : []);
          })
          .catch((err) =>
            console.error("[ProfilePage] Chyba při načítání odznaků:", err),
          );
      } catch (err: any) {
        console.error("[ProfilePage] Chyba při načítání profilu:", err);
        setError(err.message || "Nastala chyba");
        setShowTimeoutError(false); // Reset timeout error při chybě
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        isLoadingRef.current = false;
        setShowTimeoutError(false); // Reset timeout error po dokončení
      }
    }

    // Načíst profil i když user není načtený (pro cizí profily)
    // Pouze počkat na user, pokud je to vlastní profil (pro správné zobrazení)
    if (!user && authLoading) {
      // Počkat max 3 sekundy na user, pak načíst profil i bez něj
      const userTimeout = setTimeout(() => {
        if (!user && authLoading) {
          console.log(
            "[ProfilePage] User se nenačetl, načítám profil bez user objektu",
          );
          loadProfile();
        }
      }, 3000);
      return () => clearTimeout(userTimeout);
    } else {
      loadProfile();
    }
  }, [nickname, user?.uid, authLoading]);

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
        },
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

  const handleDeleteArticle = async () => {
    if (!deleteModal || !user) return;
    setDeleting(true);
    setError(null);
    try {
      const accessToken = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const delRes = await fetch(
        `/api/articles/${encodeURIComponent(deleteModal.articleId)}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!delRes.ok) {
        const errorData = await delRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Smazání článku selhalo");
      }

      // Odstranit článek ze seznamu
      setArticles((prev) => prev.filter((a) => a.id !== deleteModal.articleId));
      setDeleteModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepodařilo se smazat článek");
    } finally {
      setDeleting(false);
    }
  };

  // Timeout pro loading - po 10 sekundách zobrazit error
  useEffect(() => {
    if (loading && !profile) {
      const timeout = setTimeout(() => {
        if (loading && !profile) {
          console.warn("[ProfilePage] Timeout - zobrazuji error");
          setShowTimeoutError(true);
          setLoading(false);
        }
      }, 10000);
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutError(false);
    }
  }, [loading, profile]);

  // Timeout pro authLoading - po 5 sekundách pokračovat i bez user objektu
  useEffect(() => {
    if (!profile && authLoading && !user) {
      const timeout = setTimeout(() => {
        if (!profile && authLoading && !user) {
          console.warn(
            "[ProfilePage] authLoading timeout - pokračuji bez user objektu",
          );
          // Nechat pokračovat - profil se může načíst i bez user objektu
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [profile, authLoading, user]);

  // Zobrazit loading pouze pokud nemáme profil a stále načítáme
  // Pokud už máme profil, zobrazit ho i když se ještě načítají další data
  if (showTimeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Chyba při načítání
          </h1>
          <p className="text-gray-600 mb-4">
            Načítání profilu trvalo příliš dlouho.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Obnovit stránku
          </button>
        </div>
      </div>
    );
  }

  // Zobrazit loading pouze pokud nemáme profil a stále načítáme
  // NENECHAT blokovat authLoading - pokud máme profil, zobrazit ho
  // Zobrazit loading pouze pokud opravdu načítáme profil (loading) a nemáme ho
  if (!profile && (loading || (authLoading && !user))) {
    return <LoadingSpinner text="Načítání profilu..." fullPage />;
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
              onClick={() => router.push("/komunita")}
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

  const avatarUrl = profile.avatarUrl;
  const initials = (profile.nickname || profile.displayName)
    .charAt(0)
    .toUpperCase();
  const isFriend = profile.isFollowedByMe && profile.isFollowingMe;

  // Helper pro získání českého názvu země
  const getCountryNameCz = (iso2: string, fallbackName: string) => {
    const czName = countries.getName(iso2.toUpperCase(), "cs");
    return czName || fallbackName;
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero sekce jako pozadí za celou stránkou */}
      <ProfileHero />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ErrorMessage error={error} />

        {/* Wrapper pro profilový header s overflow-hidden pro správné zaoblení rohů */}
        <div className="mt-6 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          {/* Profilový header */}
          <div className="p-6">
            <ProfileHeader
              profile={profile}
              avatarUrl={avatarUrl}
              initials={initials}
              isOwnProfile={isOwnProfile}
              isFriend={isFriend}
              onFollowToggle={handleFollowToggle}
              visitedCountriesCount={visitedCountries.length}
              articlesCount={articles.length}
              onFollowersClick={() => setModalType("followers")}
              onFollowingClick={() => setModalType("following")}
              user={user}
            />
          </div>

          {/* Tabs bar - pouze pro vlastní profil */}
          {isOwnProfile && (
            <div className="border-t border-slate-200 bg-slate-50/40">
              <ProfileTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          )}
        </div>

        {/* VLASTNÍ PROFIL - zobrazení podle tabu */}
        {isOwnProfile && (
          <>
            {activeTab === "map" && (
              <div className="mt-6 space-y-6 pb-8">
                <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                  <CardHeader className="px-6 pt-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FiMap
                          className="w-5 h-5 text-emerald-600"
                          aria-hidden="true"
                        />
                        Interaktivní mapa cest
                      </CardTitle>
                      <span className="text-sm text-slate-600 whitespace-nowrap">
                        Objeveno: {visitedCountries.length} / 195
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 flex-1 flex flex-col">
                    {/* Progress bar */}
                    {visitedCountries.length > 0 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{
                              width: `${Math.min((visitedCountries.length / 195) * 100, 100)}%`,
                            }}
                            role="progressbar"
                            aria-valuenow={visitedCountries.length}
                            aria-valuemin={0}
                            aria-valuemax={195}
                            aria-label={`Navštíveno ${visitedCountries.length} z 195 zemí`}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                          {Math.round((visitedCountries.length / 195) * 100)} %
                        </span>
                      </div>
                    )}
                    <div className="rounded-2xl overflow-hidden border border-slate-200 flex-1 min-h-0">
                      <div className="h-full min-h-80 sm:min-h-105">
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
                              const refreshed =
                                await dbUtils.getVisitedCountries(user!.uid);
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
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200 shadow-sm">
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
                      <p className="text-slate-500 text-center py-4">
                        Zatím jste nenavštívili žádnou zemi. Klikněte na mapu
                        pro přidání!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "articles" && (
              <div className="mt-6 pb-8">
                <ArticleList
                  articles={articles}
                  onDelete={(articleId, articleTitle) =>
                    setDeleteModal({ articleId, articleTitle })
                  }
                />
              </div>
            )}

            {activeTab === "badges" && (
              <div className="mt-6 pb-8">
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Odznaky ({badges.filter((b) => b.earnedAt).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <BadgesGrid badges={badges} compact />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* CIZÍ PROFIL - všechno najednou */}
        {!isOwnProfile && (
          <div className="mt-6 space-y-6">
            {/* Odznaky */}
            {badges.length > 0 && (
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Odznaky ({badges.filter((b) => b.earnedAt).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <BadgesGrid badges={badges} compact />
                </CardContent>
              </Card>
            )}

            {/* Navštívené země */}
            {visitedCountries.length > 0 && (
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
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
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Články ({articles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/clanek/${article.slug}`}
                        className="group cursor-pointer"
                      >
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:bg-white transition-all duration-200">
                          {article.main_image_url ? (
                            <div className="relative w-full h-40 bg-slate-200">
                              <Image
                                src={article.main_image_url}
                                alt={article.main_image_alt || article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                              <FiFileText className="w-12 h-12 text-slate-400" />
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
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-slate-500">
                  <span className="text-6xl mb-4 block">🌍</span>
                  <p>Tento uživatel zatím nemá žádný cestovatelský obsah.</p>
                </CardContent>
              </Card>
            )}
          </div>
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

      {/* Modal pro potvrzení smazání článku */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Smazat článek?
            </h2>
            <p className="text-slate-600 mb-6">
              Opravdu chcete smazat článek{" "}
              <strong>"{deleteModal.articleTitle}"</strong>? Tato akce je
              nevratná.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zrušit
              </button>
              <button
                onClick={handleDeleteArticle}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Mažu..." : "Smazat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
