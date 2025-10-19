import { supabase } from "@/lib/supabase/client";
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
    let query = supabase
      .from("articles")
      .select(
        "id, title, content, countryId, countryName, authorId, authorName, createdAt, updatedAt, likes, comments, tags, images"
      )
      .order("createdAt", { ascending: false })
      .limit(50);

    if (countryId) query = query.eq("countryId", countryId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
    }));
  },

  async getBadges(uid: string): Promise<Badge[]> {
    // Dočasně vypnuto: chybějící tabulky v Supabase způsobovaly 400 Bad Request.
    // Vracíme prázdný seznam, UI zobrazí žádné odznaky bez chyb.
    return [];
  },

  async saveVisit(uid: string, countryId: string) {
    const { error } = await supabase.from("visits").upsert(
      {
        id: `${uid}_${countryId}`,
        userId: uid,
        countryId,
        visitedAt: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(error.message);
  },
};
