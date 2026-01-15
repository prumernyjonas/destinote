import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugifyNickname } from "@/utils/slugify";

/**
 * API endpoint pro kontrolu, zda nickname už existuje
 * Kontroluje podle slugifikované verze (bez diakritiky, malá písmena)
 * GET /api/users/check-nickname?nickname=Šmejd02
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const nickname = searchParams.get("nickname");

    if (!nickname || !nickname.trim()) {
      return NextResponse.json(
        { available: false, error: "Nickname je povinný" },
        { status: 400 }
      );
    }

    const trimmedNickname = nickname.trim();
    const nicknameSlug = slugifyNickname(trimmedNickname);

    if (!nicknameSlug) {
      return NextResponse.json(
        { available: false, error: "Neplatný nickname" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Načíst všechny uživatele a zkontrolovat, zda už existuje nickname se stejným slugem
    const { data: allUsers, error } = await admin
      .from("users")
      .select("nickname")
      .is("deleted_at", null);

    if (error) {
      console.error("Chyba při kontrole nicknamu:", error);
      return NextResponse.json(
        { available: false, error: "Chyba při kontrole nicknamu" },
        { status: 500 }
      );
    }

    // Zkontrolovat, zda už existuje nickname se stejným slugem
    const exists = allUsers?.some(
      (user) => slugifyNickname(user.nickname) === nicknameSlug
    );

    return NextResponse.json({
      available: !exists,
      slug: nicknameSlug,
      message: exists
        ? `Přezdívka "${trimmedNickname}" je již obsazena. Zkuste jinou přezdívku.`
        : `Přezdívka "${trimmedNickname}" je dostupná.`,
    });
  } catch (err: any) {
    console.error("Chyba při kontrole nicknamu:", err);
    return NextResponse.json(
      { available: false, error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
