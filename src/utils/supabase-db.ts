import { supabase } from "@/lib/supabase/client";
import countriesLib from "i18n-iso-countries";
import { UserStats, Article, Badge } from "@/types/database";

export const dbUtils = {
  async getUserStats(uid: string): Promise<UserStats> {
    const { data, error } = await supabase
      .from("user_stats")
      .select(
        "countriesVisited, continentsVisited, articlesWritten, badgesEarned, level, followers, following"
      )
      .eq("id", uid)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        countriesVisited: 0,
        continentsVisited: 0,
        articlesWritten: 0,
        badgesEarned: 0,
        level: 1,
        followers: 0,
        following: 0,
      };
    }
    return data as unknown as UserStats;
  },

  async getArticles(countryId?: string): Promise<Article[]> {
    // Přizpůsobeno skutečnému schématu v Supabase (snake_case sloupce).
    // Volitelné sloupce, které v našem UI nemáme, doplníme rozumnými defaulty.
    let query = supabase
      .from("articles")
      .select(
        "id, title, content, destination_id, author_id, created_at, updated_at, likes_count, comments_count"
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

  // Uložení návštěvy dle ISO2 kódu do tabulky user_visited_countries
  async saveVisitIso(userId: string, iso2: string) {
    console.log("[DB] saveVisitIso start", { userId, iso2 });
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
      console.warn(
        "[DB] countries lookup: not found for iso2:",
        wantedIso,
        lastErr || ""
      );
      throw new Error("Země s daným ISO kódem nebyla nalezena");
    }
    console.log("[DB] countries lookup OK:", { iso2: wantedIso, countryId });

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
      console.warn("[DB] upsert user_visited_countries error:", error.message);
      throw new Error(error.message);
    }
    console.log("[DB] upsert user_visited_countries OK");
  },

  // Načtení navštívených zemí uživatele jako seznam ISO2 + názvů
  async getVisitedCountries(
    userId: string
  ): Promise<Array<{ iso2: string; name: string; id: string }>> {
    // pokus o vnořený select s FK relací
    const { data, error } = await supabase
      .from("user_visited_countries")
      .select("country_id, countries ( id, iso_code, name )")
      .eq("user_id", userId);
    if (error) {
      console.warn("[DB] getVisitedCountries error:", error.message);
      throw new Error(error.message);
    }
    const result: Array<{ iso2: string; name: string; id: string }> = [];
    for (const row of (data as any[]) || []) {
      const c = row.countries;
      if (c?.iso_code) {
        result.push({ iso2: c.iso_code, name: c.name ?? c.iso_code, id: c.id });
      }
    }
    console.log("[DB] getVisitedCountries count:", result.length);
    return result;
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
};
