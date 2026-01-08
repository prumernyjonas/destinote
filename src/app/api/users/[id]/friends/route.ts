import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { FollowListItem } from "@/types/database";

// GET - Seznam přátel (obousměrné sledování)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const admin = createAdminSupabaseClient();
    const currentUserId = await getUserIdFromRequest(req);

    // Najít přátele = kde A sleduje B a B sleduje A
    // Použijeme SQL dotaz pro efektivitu
    const { data: friends, error } = await admin.rpc("get_mutual_follows", {
      target_user_id: targetUserId,
    });

    // Pokud RPC neexistuje, použijeme fallback s dvěma dotazy
    if (error && error.message.includes("function")) {
      // Fallback: načíst ručně
      const [followingRes, followersRes] = await Promise.all([
        admin
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", targetUserId),
        admin
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", targetUserId),
      ]);

      const followingIds = new Set(
        (followingRes.data || []).map((f: any) => f.following_id)
      );
      const followerIds = new Set(
        (followersRes.data || []).map((f: any) => f.follower_id)
      );

      // Přátelé = průnik obou množin
      const friendIds = [...followingIds].filter((id) => followerIds.has(id));

      if (friendIds.length === 0) {
        return NextResponse.json({ ok: true, items: [], total: 0 });
      }

      // Načíst detaily přátel
      const { data: friendUsers, error: usersError } = await admin
        .from("users")
        .select("id, nickname, first_name, last_name, avatar_url")
        .in("id", friendIds)
        .is("deleted_at", null);

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }

      // Získat seznam, koho aktuální uživatel sleduje
      let myFollowingIds: Set<string> = new Set();
      if (currentUserId) {
        const { data: myFollowing } = await admin
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", currentUserId);

        myFollowingIds = new Set(
          (myFollowing || []).map((f: any) => f.following_id)
        );
      }

      const items: FollowListItem[] = (friendUsers || []).map((user: any) => {
        const displayName =
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.nickname;

        return {
          id: user.id,
          nickname: user.nickname,
          displayName,
          avatarUrl: user.avatar_url,
          isFollowedByMe: myFollowingIds.has(user.id),
        };
      });

      return NextResponse.json({
        ok: true,
        items,
        total: items.length,
      });
    }

    if (error) {
      console.error("Get friends error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pokud RPC funguje, mapovat výsledky
    let myFollowingIds: Set<string> = new Set();
    if (currentUserId) {
      const { data: myFollowing } = await admin
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      myFollowingIds = new Set(
        (myFollowing || []).map((f: any) => f.following_id)
      );
    }

    const items: FollowListItem[] = (friends || []).map((user: any) => {
      const displayName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.nickname;

      return {
        id: user.id,
        nickname: user.nickname,
        displayName,
        avatarUrl: user.avatar_url,
        isFollowedByMe: myFollowingIds.has(user.id),
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (err: any) {
    console.error("GET /api/users/[id]/friends error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

