import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { FollowListItem } from "@/types/database";

// GET - Seznam uživatelů, které daný uživatel sleduje
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const admin = createAdminSupabaseClient();
    const currentUserId = await getUserIdFromRequest(req);

    // Získat seznam sledovaných (koho targetUserId sleduje)
    const { data: follows, error } = await admin
      .from("user_follows")
      .select(`
        following_id,
        following:users!user_follows_following_id_fkey (
          id,
          nickname,
          first_name,
          last_name,
          avatar_url,
          deleted_at
        )
      `)
      .eq("follower_id", targetUserId);

    if (error) {
      console.error("Get following error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Získat seznam, koho aktuální uživatel sleduje (pro isFollowedByMe)
    let myFollowingIds: Set<string> = new Set();
    if (currentUserId) {
      const { data: myFollowing } = await admin
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUserId);
      
      myFollowingIds = new Set((myFollowing || []).map((f: any) => f.following_id));
    }

    const items: FollowListItem[] = (follows || [])
      .filter((row: any) => row.following && !row.following.deleted_at) // Filtrovat smazané uživatele
      .map((row: any) => {
        const user = row.following;
        const displayName = [user?.first_name, user?.last_name]
          .filter(Boolean)
          .join(" ") || user?.nickname || "Neznámý";

        return {
          id: user?.id || row.following_id,
          nickname: user?.nickname || "",
          displayName,
          avatarUrl: user?.avatar_url || null,
          isFollowedByMe: myFollowingIds.has(user?.id || row.following_id),
        };
      });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (err: any) {
    console.error("GET /api/users/[id]/following error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

