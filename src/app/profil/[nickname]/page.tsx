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
  const [activeTab, setActiveTab] = useState<"map" | "articles" | "badges">(initialTab as "map" | "articles" | "badges");

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
  const [deleteModal, setDeleteModal] = useState<{ articleId: string; articleTitle: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Přesměrovat z UUID na slug, pokud je parametr UUID a máme načtený profil
  useEffect(() => {
    const decodedNickname = decodeURIComponent(nickname);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedNickname
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
        decodedNickname
      );
    
    // Přesměrovat jen pokud to není UUID (UUID se řeší v jiném useEffect)
    if (!isUuid) {
      const slugged = slugifyNickname(decodedNickname);
      if (slugged !== nickname) {
        const tab = searchParams?.get("tab");
        const url = tab ? `/profil/${slugged}?tab=${tab}` : `/profil/${slugged}`;
        router.replace(url);
      }
    }
  }, [nickname, router, searchParams]);

  const handleTabChange = useCallback(
    (tab: "map" | "articles" | "badges") => {
      const slugged = slugifyNickname(decodeURIComponent(nickname));
      router.push(`/profil/${slugged}?tab=${tab}`, { scroll: false });
    },
    [router, nickname]
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

      const delRes = await fetch(`/api/articles/${encodeURIComponent(deleteModal.articleId)}`, {
        method: "DELETE",
        headers,
      });

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
              avatarUploading={avatarUploading}
              onAvatarClick={() => {
                const input = document.getElementById(
                  "avatar-file-input"
                ) as HTMLInputElement | null;
                input?.click();
              }}
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
              <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          )}
        </div>

        <input
          id="avatar-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* VLASTNÍ PROFIL - zobrazení podle tabu */}
        {isOwnProfile && (
          <>
            {activeTab === "map" && (
              <div className="mt-6 space-y-6 pb-8">
                <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FiMap className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        Interaktivní mapa cest
                      </CardTitle>
                      <span className="text-sm text-slate-600 whitespace-nowrap">
                        Objeveno: {visitedCountries.length} / 195
                      </span>
                    </div>
                    {/* Progress bar */}
                    {visitedCountries.length > 0 && (
                      <div className="flex items-center gap-3">
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
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <div className="h-[320px] sm:h-[420px]">
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiAward className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                      Odznaky
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BadgesGrid badges={badges} />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* CIZÍ PROFIL - všechno najednou */}
        {!isOwnProfile && (
          <>
            {/* Navštívené země */}
            {visitedCountries.length > 0 && (
              <Card className="mb-6 rounded-2xl border border-slate-200 shadow-sm">
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
              <Card className="mb-8 rounded-2xl border border-slate-200 shadow-sm">
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
              <Card className="mb-8 rounded-2xl border border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-slate-500">
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

      {/* Modal pro potvrzení smazání článku */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Smazat článek?
            </h2>
            <p className="text-slate-600 mb-6">
              Opravdu chcete smazat článek <strong>"{deleteModal.articleTitle}"</strong>? Tato akce je nevratná.
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
