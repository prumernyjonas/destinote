import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 200);

    // Načíst top uživatele podle počtu navštívených zemí z agregované tabulky
    const { data: countryCounts, error: countsError } = await admin
      .from("user_country_counts")
      .select("user_id, countries_count, updated_at")
      .order("countries_count", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (countsError) {
      console.error("[leaderboard] Database error:", countsError);
      return NextResponse.json(
        { ok: false, error: countsError.message },
        { status: 500 }
      );
    }

    if (!countryCounts || countryCounts.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // Načíst informace o uživatelích
    const userIds = countryCounts.map((cc: any) => cc.user_id);
    const { data: users, error: usersError } = await admin
      .from("users")
      .select("id, nickname, first_name, last_name, avatar_url")
      .in("id", userIds)
      .is("deleted_at", null);

    if (usersError) {
      console.error("[leaderboard] Users error:", usersError);
      return NextResponse.json(
        { ok: false, error: usersError.message },
        { status: 500 }
      );
    }

    // Vytvořit mapu uživatelů pro rychlé vyhledávání
    const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Helper funkce pro získání správné URL avatara
    const getAvatarUrl = (
      avatarUrl: string | null,
      displayName: string
    ): string => {
      if (!avatarUrl) {
        // Fallback na generovaný avatar
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=random`;
      }

      // Pokud už je to plná URL (začíná s http:// nebo https://), použij ji přímo
      if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
        return avatarUrl;
      }

      // Pokud je to relativní cesta v Supabase Storage, převeď na plnou URL
      // Předpokládáme, že cesta je ve formátu "userId/timestamp.ext" nebo podobně
      const { data: pub } = admin.storage
        .from("avatars")
        .getPublicUrl(avatarUrl);
      return pub?.publicUrl || avatarUrl;
    };

    // Transformace dat do formátu pro frontend
    const leaderboard = countryCounts
      .map((cc: any, index: number) => {
        const user = usersMap.get(cc.user_id);
        if (!user) return null; // Přeskočit, pokud uživatel neexistuje nebo je smazaný

        // Vytvoření display name z first_name + last_name, nebo fallback na nickname
        const displayName =
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.nickname;

        return {
          id: user.id,
          rank: index + 1,
          displayName,
          avatarUrl: getAvatarUrl(user.avatar_url, displayName),
          score: 0, // Prozatím 0, může se přidat později
          countryCount: cc.countries_count || 0,
          badges: [], // Prozatím prázdné, může se přidat později
          updatedAt: cc.updated_at || new Date().toISOString(),
        };
      })
      .filter((entry: any) => entry !== null);

    return NextResponse.json({ ok: true, data: leaderboard });
  } catch (err: any) {
    console.error("[leaderboard] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
