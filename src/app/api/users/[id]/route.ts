import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { PublicProfile } from "@/types/database";

// Slugifikace - odstranění diakritiky a převod na malá písmena
function slugifyNickname(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // odstranit diakritiku
    .toLowerCase()
    .replace(/\s+/g, "-"); // mezery na pomlčky
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminSupabaseClient();
    const currentUserId = await getUserIdFromRequest(req);

    // Dekódovat URL encoded znaky (např. %C5%A0 -> Š)
    const decodedId = decodeURIComponent(id);

    // Pokud id vypadá jako UUID, hledáme přímo podle id
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedId
      );

    let user: {
      id: string;
      nickname: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    } | null = null;
    let userError: { message: string } | null = null;

    if (isUuid) {
      // Přímé hledání podle UUID
      const result = await admin
        .from("users")
        .select("id, nickname, first_name, last_name, avatar_url, bio")
        .eq("id", decodedId)
        .is("deleted_at", null)
        .maybeSingle();
      user = result.data;
      userError = result.error;
    } else {
      // Hledání podle slugifikovaného nicknamu
      const slugToFind = slugifyNickname(decodedId);

      // Načíst všechny uživatele a najít shodu podle slugifikovaného nicknamu
      const { data: allUsers, error } = await admin
        .from("users")
        .select("id, nickname, first_name, last_name, avatar_url, bio")
        .is("deleted_at", null);

      if (error) {
        userError = error;
      } else {
        // Najít uživatele se shodným slugem
        user =
          allUsers?.find((u) => slugifyNickname(u.nickname) === slugToFind) ||
          null;
      }
    }

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Paralelní načtení statistik
    const [
      followersCountRes,
      followingCountRes,
      countriesCountRes,
      articlesCountRes,
      isFollowedByMeRes,
      isFollowingMeRes,
    ] = await Promise.all([
      // Počet sledujících
      admin
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      // Počet sledovaných
      admin
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
      // Počet navštívených zemí
      admin
        .from("user_visited_countries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      // Počet schválených článků
      admin
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("status", "approved"),
      // Sleduji já tohoto uživatele?
      currentUserId
        ? admin
            .from("user_follows")
            .select("follower_id")
            .eq("follower_id", currentUserId)
            .eq("following_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Sleduje tento uživatel mě?
      currentUserId
        ? admin
            .from("user_follows")
            .select("follower_id")
            .eq("follower_id", userId)
            .eq("following_id", currentUserId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.nickname;

    const profile: PublicProfile = {
      id: userId,
      nickname: user.nickname,
      displayName,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      countriesVisited: countriesCountRes.count ?? 0,
      articlesWritten: articlesCountRes.count ?? 0,
      followersCount: followersCountRes.count ?? 0,
      followingCount: followingCountRes.count ?? 0,
      isFollowedByMe: !!isFollowedByMeRes.data,
      isFollowingMe: !!isFollowingMeRes.data,
    };

    return NextResponse.json({ ok: true, data: profile });
  } catch (err: any) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
