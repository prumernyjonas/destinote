import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";

// POST - Začít sledovat uživatele
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const currentUserId = await getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    // Validace: nemůže sledovat sám sebe
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Nemůžete sledovat sami sebe" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Ověřit, že cílový uživatel existuje
    const { data: targetUser, error: targetError } = await admin
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    // Upsert - vložit nebo ignorovat pokud už existuje
    const { error } = await admin.from("user_follows").upsert(
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "follower_id,following_id" }
    );

    if (error) {
      console.error("Follow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/users/[id]/follow error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

// DELETE - Přestat sledovat uživatele
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const currentUserId = await getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    const { error } = await admin
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("Unfollow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/users/[id]/follow error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
