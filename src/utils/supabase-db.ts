import { supabase } from "@/lib/supabase/client";
import countriesLib from "i18n-iso-countries";
import { UserStats, Article, Badge } from "@/types/database";

export const dbUtils = {
  async getUserStats(uid: string): Promise<UserStats> {
    // Načíst reálné počty sledujících a sledovaných z user_follows
    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", uid),
      supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", uid),
    ]);

    const followersCount = followersRes.count ?? 0;
    const followingCount = followingRes.count ?? 0;

    // Zkusit načíst ostatní statistiky z user_stats view (pokud existuje)
    const { data } = await supabase
      .from("user_stats")
      .select(
        "countriesVisited, continentsVisited, articlesWritten, badgesEarned, level"
      )
      .eq("id", uid)
      .maybeSingle();

    return {
      countriesVisited: (data as any)?.countriesVisited ?? 0,
      continentsVisited: (data as any)?.continentsVisited ?? 0,
      articlesWritten: (data as any)?.articlesWritten ?? 0,
      badgesEarned: (data as any)?.badgesEarned ?? 0,
      level: (data as any)?.level ?? 1,
      followers: followersCount,
      following: followingCount,
    };
  },

  async getArticles(countryId?: string): Promise<Article[]> {
    // Přizpůsobeno skutečnému schématu v Supabase (snake_case sloupce).
    // Volitelné sloupce, které v našem UI nemáme, doplníme rozumnými defaulty.
    let query = supabase
      .from("articles")
      .select(
        "id, title, content, destination_id, author_id, status, created_at, updated_at, likes_count, comments_count"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (countryId) query = query.eq("destination_id", countryId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content || "",
      countryId: row.destination_id || "",
      countryName: "Neznámá země",
      authorId: row.author_id || "",
      authorName: "",
      status: row.status || "draft",
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      likes: typeof row.likes_count === "number" ? row.likes_count : 0,
      comments: typeof row.comments_count === "number" ? row.comments_count : 0,
      tags: [],
      images: [],
    }));
  },

  async getBadges(uid: string): Promise<Badge[]> {
    // Dočasně vypnuto: chybějící tabulky v Supabase způsobovaly 400 Bad Request.
    // Vracíme prázdný seznam, UI zobrazí žádné odznaky bez chyb.
    return [];
  },

  // Agregovaný počet navštívených zemí z tabulky user_country_counts (fallback na COUNT)
  async getVisitedCount(userId: string): Promise<number> {
    // Nejprve zkus agregovanou tabulku (pokud existuje a je plněna)
    const { data, error } = await supabase
      .from("user_country_counts")
      .select("countries_count")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data && typeof (data as any).countries_count === "number") {
      return (data as any).countries_count as number;
    }
    // Fallback: přesný COUNT z relace
    const { count, error: countErr } = await supabase
      .from("user_visited_countries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (countErr) throw new Error(countErr.message);
    return typeof count === "number" ? count : 0;
  },

  // Uložení návštěvy dle ISO2 kódu do tabulky user_visited_countries
  async saveVisitIso(userId: string, iso2: string) {
    const wantedIso = iso2.toUpperCase();
    const altIsoCandidates: Record<string, string[]> = {
      FR: ["FX"], // Metropolitan France fallback
      NO: [], // Norway – no alt ISO, fallback by name
    };
    const nameFallback: Record<string, string> = {
      FR: "France",
      NO: "Norway",
    };

    // 1) Najít id země podle iso_code (včetně alternativ)
    const tryIsoCodes = [wantedIso, ...(altIsoCandidates[wantedIso] || [])];
    let countryId: string | null = null;
    let lastErr: string | null = null;
    for (const code of tryIsoCodes) {
      const { data, error } = await supabase
        .from("countries")
        .select("id")
        .eq("iso_code", code)
        .maybeSingle();
      if (error) {
        lastErr = error.message;
        continue;
      }
      if (data?.id) {
        countryId = data.id as string;
        break;
      }
    }
    // 1b) Fallback podle názvu (jen pro FR/NO)
    if (!countryId && nameFallback[wantedIso]) {
      const name = nameFallback[wantedIso];
      const { data, error } = await supabase
        .from("countries")
        .select("id, name")
        .ilike("name", name + "%")
        .maybeSingle();
      if (!error && data?.id) {
        countryId = data.id as string;
      }
    }
    // 1c) Poslední fallback – vytvořit záznam, pokud chybí (jen FR/NO)
    if (!countryId && (wantedIso === "FR" || wantedIso === "NO")) {
      const englishName =
        countriesLib.getName(wantedIso, "en") ||
        nameFallback[wantedIso] ||
        wantedIso;
      const insertPayload = {
        iso_code: wantedIso,
        name: englishName,
        continent: "Europe",
      };
      const { data: ins, error: insErr } = await supabase
        .from("countries")
        .insert(insertPayload)
        .select("id")
        .maybeSingle();
      if (!insErr && ins?.id) {
        countryId = ins.id as string;
      } else if (insErr && (insErr as any).code === "23505") {
        // unikátní konflikt – zkusit znovu vyhledat
        const retry = await supabase
          .from("countries")
          .select("id")
          .eq("iso_code", wantedIso)
          .maybeSingle();
        if (!retry.error && retry.data?.id) {
          countryId = retry.data.id as string;
        }
      }
    }
    if (!countryId) {
      throw new Error("Země s daným ISO kódem nebyla nalezena");
    }

    // 2) Upsert do user_visited_countries podle složeného klíče
    const { error } = await supabase.from("user_visited_countries").upsert(
      {
        user_id: userId,
        country_id: countryId,
        visited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,country_id" }
    );
    if (error) {
      throw new Error(error.message);
    }
  },

  // Načtení navštívených zemí uživatele jako seznam ISO2 + názvů
  async getVisitedCountries(
    userId: string
  ): Promise<Array<{ iso2: string; name: string; id: string }>> {
    // Preferuj serverové API (admin klient) kvůli možným RLS omezením
    try {
      const res = await fetch(
        `/api/visited?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        let message = `GET /api/visited ${res.status}`;
        try {
          const j = await res.json();
          if (j?.error) message = j.error;
        } catch {}
        throw new Error(message);
      }
      const j = (await res.json()) as {
        ok: boolean;
        data?: Array<{ iso2: string; name: string; id: string }>;
      };
      const result = Array.isArray(j?.data) ? j.data : [];
      return result;
    } catch (apiErr) {
      // Fallback: přímý select přes client (může selhat na RLS)
      const { data, error } = await supabase
        .from("user_visited_countries")
        .select("country_id, countries ( id, iso_code, name )")
        .eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
      const result: Array<{ iso2: string; name: string; id: string }> = [];
      for (const row of (data as any[]) || []) {
        const c = (row as any).countries;
        if (c?.iso_code) {
          result.push({
            iso2: c.iso_code,
            name: c.name ?? c.iso_code,
            id: c.id,
          });
        }
      }
      return result;
    }
  },

  async removeVisitIso(userId: string, iso2: string) {
    const wantedIso = iso2.toUpperCase();
    const altIsoCandidates: Record<string, string[]> = {
      FR: ["FX"],
      NO: [],
    };
    const nameFallback: Record<string, string> = {
      FR: "France",
      NO: "Norway",
    };
    const tryIsoCodes = [wantedIso, ...(altIsoCandidates[wantedIso] || [])];
    let countryId: string | null = null;
    for (const code of tryIsoCodes) {
      const { data, error } = await supabase
        .from("countries")
        .select("id")
        .eq("iso_code", code)
        .maybeSingle();
      if (!error && data?.id) {
        countryId = data.id as string;
        break;
      }
    }
    if (!countryId && nameFallback[wantedIso]) {
      const { data, error } = await supabase
        .from("countries")
        .select("id")
        .ilike("name", nameFallback[wantedIso] + "%")
        .maybeSingle();
      if (!error && data?.id) {
        countryId = data.id as string;
      }
    }
    if (!countryId) return;
    const { error } = await supabase
      .from("user_visited_countries")
      .delete()
      .eq("user_id", userId)
      .eq("country_id", countryId);
    if (error) throw new Error(error.message);
  },

  // === Sledování uživatelů ===

  async getFollowCounts(
    userId: string
  ): Promise<{ followers: number; following: number }> {
    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    };
  },

  async isFollowing(
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    const { data } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();
    return !!data;
  },

  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new Error("Nemůžete sledovat sami sebe");
    }
    const { error } = await supabase.from("user_follows").upsert(
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "follower_id,following_id" }
    );
    if (error) throw new Error(error.message);
  },

  async unfollowUser(
    currentUserId: string,
    targetUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);
    if (error) throw new Error(error.message);
  },
};
