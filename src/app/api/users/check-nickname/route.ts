import { NextRequest, NextResponse } from "next/server";
import { slugifyNickname } from "@/utils/slugify";
import { checkNicknameExists } from "@/app/api/_utils/users";

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

    // Použít optimalizovanou funkci místo načítání všech uživatelů
    const exists = await checkNicknameExists(trimmedNickname);

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
